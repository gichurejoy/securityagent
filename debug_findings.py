from backend.database import SessionLocal
from backend import models, schemas
from pydantic import TypeAdapter
from typing import List

def debug_findings():
    db = SessionLocal()
    try:
        findings = db.query(models.Finding).all()
        print(f"Retrieved {len(findings)} findings from DB.")
        
        # Test Pydantic serialization
        adapter = TypeAdapter(List[schemas.FindingRead])
        try:
            # We need to convert SQLAlchemy models to dicts or ensure from_attributes works
            json_data = adapter.validate_python(findings, from_attributes=True)
            print("Successfully serialized findings!")
        except Exception as e:
            print(f"Serialization failed: {e}")
            
    except Exception as e:
        print(f"Query failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_findings()
