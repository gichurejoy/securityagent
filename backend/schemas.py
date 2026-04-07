from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

from .models import CommandStatus, Status, FindingStatus, ITUserRole

class DeviceBase(BaseModel):
    device_id: str
    hostname: str
    employee_name: str 
    employee_email: Optional[str] = None 
    os_platform: str 
    os_version: str
    device_token: Optional[str] = None

class DeviceEnroll(DeviceBase):
    pass

class DeviceRead(DeviceBase):
    id: int
    last_seen_at: datetime
    risk_score: int
    
    class Config:
        from_attributes = True

class CheckResultItem(BaseModel):
    check_key: str
    category: str
    status: Status
    detail: str

class ScanCreate(BaseModel):
    device_id: str
    device_token: Optional[str] = None
    results: List[CheckResultItem]

class ScanRead(BaseModel):
    id: int
    scanned_at: datetime
    risk_score: int
    risk_tier: str
    trigger_type: str
    
    class Config:
        from_attributes = True

class CommandCreate(BaseModel):
    device_id: int
    command_type: str
    payload_json: Optional[Dict[str, Any]] = None

class CommandRead(BaseModel):
    id: int
    command_type: str
    status: CommandStatus
    payload_json: Optional[Dict[str, Any]]
    
    class Config:
        from_attributes = True

class FindingRead(BaseModel):
    id: int
    device_id: int
    check_key: str
    first_seen_at: datetime
    last_seen_at: datetime
    status: FindingStatus
    notes: Optional[str]
    
    class Config:
        from_attributes = True

class DashboardOverview(BaseModel):
    total_devices: int
    scanned_24h: int
    offline_devices: int
    org_score: int
    risk_distribution: Dict[str, int]
    active_critical_alerts: int

class AlertRuleRead(BaseModel):
    id: int
    name: str
    trigger_check: Optional[str]
    trigger_condition: str
    trigger_value: Optional[str]
    severity: str
    notify_via: str
    frequency: str
    notify_emails: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True

class NotificationRead(BaseModel):
    id: int
    alert_rule_id: int
    device_id: Optional[int]
    fired_at: datetime
    channel: str
    message: str
    finding_id: Optional[int]
    
    class Config:
        from_attributes = True
