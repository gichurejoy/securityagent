from backend.database import SessionLocal
from backend import models, schemas
from pydantic import TypeAdapter
from typing import List

def debug_serialization():
    db = SessionLocal()
    try:
        finding = db.query(models.Finding).first()
        if not finding:
            print("No findings found in DB!")
            return
            
        print(f"Finding ID: {finding.id}")
        print(f"Finding Status Type: {type(finding.status)}")
        print(f"Finding Status Value: {finding.status}")
        
        # Test serialization manually
        try:
            # Try to map it to the schema
            schema_data = schemas.FindingRead.model_validate(finding, from_attributes=True)
            print("Successfully validated single finding!")
        except Exception as e:
            print(f"Single finding validation FAILED: {e}")
            
    except Exception as e:
        print(f"Query failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_serialization()
