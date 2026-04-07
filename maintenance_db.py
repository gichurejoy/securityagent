import sqlite3
import os

db_path = "security_agent.db"

def standardize():
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found!")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        print("Standardizing findings...")
        cursor.execute("UPDATE findings SET status = 'OPEN' WHERE LOWER(status) = 'open'")
        cursor.execute("UPDATE findings SET status = 'IN_PROGRESS' WHERE LOWER(status) = 'in_progress'")
        cursor.execute("UPDATE findings SET status = 'RESOLVED' WHERE LOWER(status) = 'resolved'")
        cursor.execute("UPDATE findings SET status = 'ACCEPTED_RISK' WHERE LOWER(status) = 'accepted_risk'")
        cursor.execute("UPDATE findings SET status = 'FALSE_POSITIVE' WHERE LOWER(status) = 'false_positive'")
        
        print("Standardizing check_results...")
        cursor.execute("UPDATE check_results SET status = 'PASS' WHERE LOWER(status) = 'pass'")
        cursor.execute("UPDATE check_results SET status = 'WARN' WHERE LOWER(status) = 'warn'")
        cursor.execute("UPDATE check_results SET status = 'FAIL' WHERE LOWER(status) = 'fail'")
        
        print("Standardizing commands...")
        cursor.execute("UPDATE commands SET status = 'PENDING' WHERE LOWER(status) = 'pending'")
        cursor.execute("UPDATE commands SET status = 'SENT' WHERE LOWER(status) = 'sent'")
        cursor.execute("UPDATE commands SET status = 'COMPLETED' WHERE LOWER(status) = 'completed'")
        cursor.execute("UPDATE commands SET status = 'FAILED' WHERE LOWER(status) = 'failed'")
        
        conn.commit()
        print("Database standardization complete.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    standardize()
