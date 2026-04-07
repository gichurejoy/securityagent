from backend.database import SessionLocal
from backend.models import Device

db = SessionLocal()
try:
    count = db.query(Device).count()
    print(f"Total devices: {count}")
    for d in db.query(Device).all():
        print(f"- {d.id}: {d.hostname} ({d.device_id})")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
