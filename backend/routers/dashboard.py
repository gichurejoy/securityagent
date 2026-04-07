from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Dict, Any

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"], dependencies=[Depends(get_current_user)])

@router.get("/overview", response_model=schemas.DashboardOverview)
def get_overview(db: Session = Depends(get_db)):
    total = db.query(models.Device).filter(models.Device.is_active == True).count()
    
    day_ago = datetime.utcnow() - timedelta(days=1)
    scanned_24h = db.query(models.Device).filter(
        models.Device.is_active == True,
        models.Device.last_seen_at >= day_ago
    ).count()
    
    offline_devices = total - scanned_24h
    
    avg_score = db.query(func.avg(models.Device.risk_score)).filter(models.Device.is_active == True).scalar()
    avg_score = int(avg_score) if avg_score else 100
    
    # Risk distribution
    tiers = {"Secure": 0, "Low Risk": 0, "Medium Risk": 0, "High Risk": 0, "Critical": 0}
    devices = db.query(models.Device).filter(models.Device.is_active == True).all()
    for d in devices:
        from ..services.scoring import get_tier
        tier = get_tier(d.risk_score)
        tiers[tier] += 1
        
    active_alerts = db.query(models.Notification).count() # simplistic for now
    
    return {
        "total_devices": total,
        "scanned_24h": scanned_24h,
        "offline_devices": offline_devices,
        "org_score": avg_score,
        "risk_distribution": tiers,
        "active_critical_alerts": active_alerts
    }

@router.get("/devices", response_model=List[schemas.DeviceRead])
def get_devices(db: Session = Depends(get_db)):
    return db.query(models.Device).filter(models.Device.is_active == True).all()

@router.get("/devices/{device_id}")
def get_device_detail(device_id: int, db: Session = Depends(get_db)):
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
        
    # Get latest scan
    latest_scan = db.query(models.Scan).filter(models.Scan.device_id == device_id).order_by(models.Scan.scanned_at.desc()).first()
    
    return {
        "device": device,
        "latest_scan": latest_scan
    }

@router.get("/findings", response_model=List[schemas.FindingRead])
def get_findings(db: Session = Depends(get_db)):
    return db.query(models.Finding).all()

@router.patch("/findings/{finding_id}")
def update_finding(finding_id: int, status_update: Dict[str, str], db: Session = Depends(get_db)):
    finding = db.query(models.Finding).filter(models.Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
        
    if "status" in status_update:
        finding.status = status_update["status"]
        if finding.status == schemas.FindingStatus.RESOLVED:
             finding.auto_closed_at = datetime.utcnow()
             
    db.commit()
    return {"status": "success", "finding": finding}

@router.get("/checks/analysis")
def get_checks_analysis(db: Session = Depends(get_db)):
    # Group by check_key and count failures inside findings
    result = db.query(
        models.Finding.check_key,
        func.count(models.Finding.id).label('failure_count')
    ).filter(models.Finding.status == schemas.FindingStatus.OPEN).group_by(models.Finding.check_key).all()
    
    return [{"check_key": row.check_key, "failure_count": row.failure_count} for row in result]

@router.post("/commands", response_model=schemas.CommandRead)
def create_command(command: schemas.CommandCreate, db: Session = Depends(get_db)):
    db_command = models.Command(
        device_id=command.device_id,
        command_type=command.command_type,
        payload_json=command.payload_json,
        status=schemas.CommandStatus.PENDING,
        created_at=datetime.utcnow()
    )
    db.add(db_command)
    db.commit()
    db.refresh(db_command)
    return db_command

@router.get("/devices/{device_id}/history")
def get_device_history(device_id: int, db: Session = Depends(get_db)):
    scans = db.query(models.Scan).filter(models.Scan.device_id == device_id).order_by(models.Scan.scanned_at.desc()).all()
    history = [{"scanned_at": scan.scanned_at.isoformat(), "score": scan.risk_score} for scan in scans]
    return history

@router.get("/trends")
def get_trends(db: Session = Depends(get_db)):
    # Returns a simulated 30-day org trend for MVP
    base_date = datetime.utcnow()
    trend_data = []
    for i in range(30, -1, -1):
        day = base_date - timedelta(days=i)
        trend_data.append({
            "date": day.strftime("%Y-%m-%d"),
            "average_score": 85 + (i % 10) - 5,
            "compliance_rate": 90 + (i % 5)
        })
    return trend_data

@router.get("/alerts/rules", response_model=List[schemas.AlertRuleRead])
def get_alert_rules(db: Session = Depends(get_db)):
    rules = db.query(models.AlertRule).all()
    if not rules:
        # Provide prepopulated default rules if empty
        defaults = [
            models.AlertRule(name="Critical Score Drop", trigger_condition="score < 50", severity="critical", notify_via="slack", frequency="immediately"),
            models.AlertRule(name="BitLocker Disabled", trigger_check="bitlocker_c", trigger_condition="fail", severity="high", notify_via="email", frequency="daily_digest"),
            models.AlertRule(name="Device Offline 7 Days", trigger_condition="offline_days > 7", severity="medium", notify_via="email", frequency="weekly")
        ]
        db.add_all(defaults)
        db.commit()
        rules = db.query(models.AlertRule).all()
    return rules

@router.get("/alerts/history", response_model=List[schemas.NotificationRead])
def get_alert_history(db: Session = Depends(get_db)):
    return db.query(models.Notification).order_by(models.Notification.fired_at.desc()).limit(50).all()

@router.post("/reports/generate")
def generate_report(db: Session = Depends(get_db)):
    return {
        "status": "success", 
        "downloadUrl": "data:application/json;charset=utf-8," + "%7B%22status%22%3A%22generated%22%2C%22org_score%22%3A85%7D"
    }
