from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List

import models, schemas
from database import get_db, get_eat_time

router = APIRouter(prefix="/api/v1/portal", tags=["portal"])

@router.get("/stats/{email}", response_model=schemas.PortalStats)
def get_portal_stats(email: str, db: Session = Depends(get_db)):
    # Find the latest device for this email
    device = db.query(models.Device).filter(
        models.Device.employee_email == email,
        models.Device.is_active == True
    ).order_by(models.Device.last_seen_at.desc()).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="No device record found for this email.")
    
    active_findings = db.query(models.Finding).filter(
        models.Finding.device_id == device.id,
        models.Finding.status.in_([schemas.FindingStatus.OPEN, schemas.FindingStatus.IN_PROGRESS])
    ).all()
    
    status_summary = "Secure"
    if len(active_findings) > 5:
        status_summary = "Action Required"
    elif len(active_findings) > 0:
        status_summary = "Low Risk"
        
    return schemas.PortalStats(
        hostname=device.hostname,
        last_scan=device.last_seen_at,
        risk_score=device.risk_score,
        active_findings=len(active_findings),
        status_summary=status_summary,
        findings=active_findings
    )

@router.get("/history/{email}", response_model=schemas.PortalHistory)
def get_portal_history(email: str, db: Session = Depends(get_db)):
    device = db.query(models.Device).filter(
        models.Device.employee_email == email
    ).order_by(models.Device.last_seen_at.desc()).first()
    
    if not device:
        return schemas.PortalHistory(history=[])
        
    # Get scan history for the last 30 days
    thirty_days_ago = get_eat_time() - timedelta(days=30)
    scans = db.query(models.Scan).filter(
        models.Scan.device_id == device.id,
        models.Scan.scanned_at >= thirty_days_ago
    ).order_by(models.Scan.scanned_at.asc()).all()
    
    history = [
        schemas.PortalHistoryItem(date=s.scanned_at, score=s.risk_score)
        for s in scans
    ]
    
    return schemas.PortalHistory(history=history)
