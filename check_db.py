from backend.database import SessionLocal
from backend import models

def check_db():
    db = SessionLocal()
    try:
        findings = db.query(models.Finding).all()
        print(f"Total findings: {len(findings)}")
        for f in findings:
            print(f"ID: {f.id}, Check: {f.check_key}, Status: {f.status}")
        
        devices = db.query(models.Device).all()
        print(f"Total devices: {len(devices)}")
    finally:
        db.close()

if __name__ == "__main__":
    check_db()
