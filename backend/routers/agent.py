from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
from pathlib import Path
from datetime import datetime
from typing import List

import models, schemas
from database import get_db, get_eat_time
from services import scoring

router = APIRouter(prefix="/v1", tags=["agent"])

@router.get("/agent/download")
def download_agent():
    """Serves the latest compiled security agent executable."""
    # Production path for the executable
    exe_path = Path(__file__).parent.parent.parent / "dist" / "MedServAgentInstaller.exe"
    
    if not exe_path.exists():
        # Fallback to current working directory during dev if not found
        exe_path = Path("dist/MedServAgentInstaller.exe")
        
    if not exe_path.exists():
        raise HTTPException(status_code=404, detail="Agent installer not found on server. Please contact IT.")
        
    return FileResponse(
        path=exe_path,
        filename="MedServ_Security_Agent_Setup.exe",
        media_type="application/octet-stream"
    )

@router.post("/enroll", response_model=schemas.DeviceRead)
def enroll_device(device: schemas.DeviceEnroll, db: Session = Depends(get_db)):
    db_device = db.query(models.Device).filter(models.Device.device_id == device.device_id).first()
    
    if db_device:
        db_device.hostname = device.hostname
        db_device.employee_name = device.employee_name
        db_device.employee_email = device.employee_email
        db_device.os_platform = device.os_platform
        db_device.os_version = device.os_version
        db_device.device_token = device.device_token
        db_device.last_seen_at = get_eat_time()
        db_device.is_active = True
        db.commit()
        db.refresh(db_device)
        return db_device
        
    new_device = models.Device(
        device_id=device.device_id,
        hostname=device.hostname,
        employee_name=device.employee_name,
        employee_email=device.employee_email,
        os_platform=device.os_platform,
        os_version=device.os_version,
        device_token=device.device_token,
        last_seen_at=get_eat_time(),
        risk_score=100
    )
    db.add(new_device)
    db.commit()
    db.refresh(new_device)
    return new_device

@router.post("/scan/results", status_code=status.HTTP_201_CREATED)
def submit_scan(scan: schemas.ScanCreate, db: Session = Depends(get_db)):
    db_device = db.query(models.Device).filter(models.Device.device_id == scan.device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not enrolled")
    
    # Calculate score
    results_as_dicts = [item.dict() for item in scan.results]
    final_score = scoring.calculate_risk_score(results_as_dicts)
    tier = scoring.get_tier(final_score)
    
    # Create scan record
    new_scan = models.Scan(
        device_id=db_device.id,
        risk_score=final_score,
        risk_tier=tier,
        raw_json=results_as_dicts,
        scanned_at=get_eat_time()
    )
    db.add(new_scan)
    db.flush() # get scan ID
    
    # Process findings and check results
    for r in results_as_dicts:
        # Safe truncation for 1000-char database columns
        safe_detail = r["detail"][:999] if isinstance(r["detail"], str) else str(r["detail"])[:999]
        
        cr = models.CheckResult(
            scan_id=new_scan.id,
            check_key=r["check_key"],
            category=r["category"],
            status=r["status"],
            detail=safe_detail
        )
        db.add(cr)
        
        # If warn/fail, generate a Finding
        if r["status"] in [schemas.Status.FAIL, schemas.Status.WARN]:
            existing_finding = db.query(models.Finding).filter(
                models.Finding.device_id == db_device.id,
                models.Finding.check_key == r["check_key"],
                models.Finding.status.in_([schemas.FindingStatus.OPEN, schemas.FindingStatus.IN_PROGRESS])
            ).first()
            if not existing_finding:
                finding = models.Finding(
                    device_id=db_device.id,
                    check_key=r["check_key"],
                    first_seen_at=get_eat_time(),
                    last_seen_at=get_eat_time(),
                    status=schemas.FindingStatus.OPEN,
                    notes=safe_detail
                )
                db.add(finding)
            else:
                existing_finding.last_seen_at = get_eat_time()
                existing_finding.notes = safe_detail
        else:
             # Auto-close resolved finding
             existing_finding = db.query(models.Finding).filter(
                models.Finding.device_id == db_device.id,
                models.Finding.check_key == r["check_key"],
                models.Finding.status.in_([schemas.FindingStatus.OPEN, schemas.FindingStatus.IN_PROGRESS])
             ).first()
             if existing_finding:
                 existing_finding.status = schemas.FindingStatus.RESOLVED
                 existing_finding.auto_closed_at = get_eat_time()

    db_device.risk_score = final_score
    db_device.last_seen_at = get_eat_time()
    
    db.commit()
    return {"status": "success", "scan_id": new_scan.id, "score": final_score}

@router.get("/commands/{device_id}", response_model=List[schemas.CommandRead])
def get_pending_commands(device_id: str, db: Session = Depends(get_db)):
    db_device = db.query(models.Device).filter(models.Device.device_id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not enrolled")
        
    pending = db.query(models.Command).filter(
        models.Command.device_id == db_device.id,
        models.Command.status == schemas.CommandStatus.PENDING
    ).all()
    
    for cmd in pending:
        cmd.status = schemas.CommandStatus.SENT
        cmd.picked_up_at = datetime.utcnow()
    db.commit()
    
    return pending
