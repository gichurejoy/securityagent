from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Enum, Boolean
from sqlalchemy.orm import relationship, validates
from datetime import datetime
import enum
from database import Base, get_eat_time

class CommandStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    COMPLETED = "completed"
    FAILED = "failed"

class Status(str, enum.Enum):
    PASS = "pass"
    WARN = "warn"
    FAIL = "fail"

class FindingStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    ACCEPTED_RISK = "accepted_risk"
    FALSE_POSITIVE = "false_positive"

class ITUserRole(str, enum.Enum):
    ADMIN = "admin"
    VIEWER = "viewer"

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True)
    policy_profile_id = Column(String(255), nullable=True) # E.g., stricter profile vs relaxed
    
    devices = relationship("Device", back_populates="department")

class ITUser(Base):
    __tablename__ = "it_users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    name = Column(String(255))
    role = Column(Enum(ITUserRole), default=ITUserRole.VIEWER)
    hashed_password = Column(String(255))
    last_login_at = Column(DateTime, nullable=True)

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(255), unique=True, index=True) # Unique hardware ID
    hostname = Column(String(255))
    employee_email = Column(String(255), nullable=True)
    employee_name = Column(String(255), nullable=True)
    os_platform = Column(String(255)) # Windows, Darwin, Linux
    os_version = Column(String(255))
    agent_version = Column(String(255), nullable=True)
    device_token = Column(String(255), nullable=True)
    enrolled_at = Column(DateTime, default=get_eat_time)
    last_seen_at = Column(DateTime, default=get_eat_time)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    risk_score = Column(Integer, default=100)
    
    department = relationship("Department", back_populates="devices")
    scans = relationship("Scan", back_populates="device")
    commands = relationship("Command", back_populates="device")
    findings = relationship("Finding", back_populates="device")
    notifications = relationship("Notification", back_populates="device")

class Scan(Base):
    __tablename__ = "scan_results"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    scanned_at = Column(DateTime, default=get_eat_time)
    risk_score = Column(Integer)
    risk_tier = Column(String(50)) # Secure, Low Risk, Medium Risk, High Risk, Critical
    trigger_type = Column(String(50), default="scheduled") # scheduled/manual/boot/network
    raw_json = Column(JSON)
    
    device = relationship("Device", back_populates="scans")
    check_results = relationship("CheckResult", back_populates="scan")

class CheckResult(Base):
    __tablename__ = "check_results"
    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scan_results.id"))
    check_key = Column(String(255), index=True)
    category = Column(String(255))
    status = Column(Enum(Status))
    detail = Column(String(1000))
    weight = Column(Integer, default=0)
    score_impact = Column(Integer, default=0)
    
    scan = relationship("Scan", back_populates="check_results")

    @validates("status")
    def validate_status(self, key, value):
        if isinstance(value, str):
            return value.upper()
        return value

class Finding(Base):
    __tablename__ = "findings"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    check_key = Column(String(255), index=True)
    first_seen_at = Column(DateTime, default=get_eat_time)
    last_seen_at = Column(DateTime, default=get_eat_time)
    status = Column(Enum(FindingStatus), default=FindingStatus.OPEN)
    assignee = Column(String(50), default="IT") # IT or EMPLOYEE
    due_date = Column(DateTime, nullable=True)
    notes = Column(String(1000), nullable=True)
    auto_closed_at = Column(DateTime, nullable=True)
    
    device = relationship("Device", back_populates="findings")

    @validates("status")
    def validate_status(self, key, value):
        if isinstance(value, str):
            return value.upper()
        return value

class Command(Base):
    __tablename__ = "commands"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    command_type = Column(String(255))
    payload_json = Column(JSON, nullable=True)
    status = Column(Enum(CommandStatus), default=CommandStatus.PENDING)
    created_at = Column(DateTime, default=get_eat_time)
    picked_up_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("it_users.id"), nullable=True)
    
    device = relationship("Device", back_populates="commands")

class AlertRule(Base):
    __tablename__ = "alert_rules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    trigger_check = Column(String(255), nullable=True) # e.g., 'bitlocker_c'
    trigger_condition = Column(String(255)) # e.g., 'fail' or 'score < 50'
    trigger_value = Column(String(255), nullable=True)
    severity = Column(String(50)) # low, medium, high, critical
    notify_via = Column(String(255)) # e.g. 'slack,email'
    frequency = Column(String(50)) # immediately, daily_digest
    notify_emails = Column(String(1000), nullable=True)
    is_active = Column(Boolean, default=True)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    alert_rule_id = Column(Integer, ForeignKey("alert_rules.id"))
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    fired_at = Column(DateTime, default=get_eat_time)
    channel = Column(String(50))
    message = Column(String(1000))
    finding_id = Column(Integer, ForeignKey("findings.id"), nullable=True)
    
    rule = relationship("AlertRule")
    device = relationship("Device", back_populates="notifications")
    finding = relationship("Finding")
