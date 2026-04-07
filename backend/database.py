import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv()

# Use SQLite for local development, switch to PostgreSQL for VPS
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./security_agent.db")

def get_eat_time():
    """Returns the current time in Eastern Africa Time (UTC+3)."""
    return datetime.now(timezone(timedelta(hours=3)))

# Check if we are using MySQL or SQLite to apply the correct engine arguments
engine_args = {}
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    engine_args["connect_args"] = {"check_same_thread": False}
else:
    # MySQL/PostgreSQL optimizations for long-running VPS processes
    engine_args["pool_recycle"] = 3600
    engine_args["pool_pre_ping"] = True

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
