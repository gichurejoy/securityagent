import os
import json
from pathlib import Path

CONFIG_DIR = Path(os.environ.get("PROGRAMDATA", ".")) / "MedServDiagnostic"
CONFIG_FILE = CONFIG_DIR / "config.json"

DEFAULT_SERVER_URL = "http://127.0.0.1:8000"
DEFAULT_COMPANY_TOKEN = "TEST_COMPANY_TOKEN_123"

def save_config(config_data):
    if not CONFIG_DIR.exists():
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    
    with open(CONFIG_FILE, "w") as f:
        json.dump(config_data, f, indent=4)

def load_config():
    if not CONFIG_FILE.exists():
        return {
            "server_url": DEFAULT_SERVER_URL, 
            "device_id": None,
            "company_token": DEFAULT_COMPANY_TOKEN
        }
    
    with open(CONFIG_FILE, "r") as f:
        return json.load(f)

def get_server_url():
    config = load_config()
    return config.get("server_url", DEFAULT_SERVER_URL)

def get_device_id():
    config = load_config()
    return config.get("device_id")

def get_company_token():
    config = load_config()
    return config.get("company_token", DEFAULT_COMPANY_TOKEN)
