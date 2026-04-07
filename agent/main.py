import time
import requests
import json
import logging
import os
import sys
import subprocess
from config import load_config, save_config, get_server_url, get_device_id, get_company_token, CONFIG_DIR
from enrollment import get_machine_guid, get_system_info
from checks.windows import run_all_checks

# Set up logging for agent
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Queue logic
OFFLINE_QUEUE_FILE = CONFIG_DIR / "queue.json"

def enroll_if_needed():
    """Initial phase of the agent execution."""
    current_device_id = get_device_id()
    server_url = get_server_url()
    company_token = get_company_token()
    
    if current_device_id:
        logger.info(f"Device already enrolled with ID: {current_device_id}")
        return current_device_id
    
    # Otherwise, enroll now
    guid = get_machine_guid()
    info = get_system_info()
    
    payload = {
        "device_id": guid,
        "hostname": info["hostname"],
        "employee_name": info["username"],
        "employee_email": info["email"],
        "os_platform": info["os_name"],
        "os_version": info["os_version"],
        "device_token": company_token
    }
    
    try:
        response = requests.post(f"{server_url}/api/v1/enroll", json=payload, timeout=10)
        response.raise_for_status()
        
        # Save the enrolled ID to config for future runs
        data = response.json()
        save_config({
            "server_url": server_url, 
            "device_id": guid,
            "company_token": company_token
        })
        logger.info(f"Successfully enrolled as {guid}")
        return guid
    except Exception as e:
        logger.error(f"Enrollment failed: {e}")
        return None

def save_to_queue(payload):
    queue = []
    if OFFLINE_QUEUE_FILE.exists():
        with open(OFFLINE_QUEUE_FILE, "r") as f:
            queue = json.load(f)
    queue.append(payload)
    with open(OFFLINE_QUEUE_FILE, "w") as f:
        json.dump(queue, f, indent=4)

def load_queue():
    if OFFLINE_QUEUE_FILE.exists():
        with open(OFFLINE_QUEUE_FILE, "r") as f:
            return json.load(f)
    return []

def clear_queue():
    if OFFLINE_QUEUE_FILE.exists():
        OFFLINE_QUEUE_FILE.unlink()

def process_queue(server_url):
    queue = load_queue()
    if not queue:
        return
        
    logger.info(f"Attempting to flush {len(queue)} offline items.")
    successful = []
    for item in queue:
        try:
            requests.post(f"{server_url}/api/v1/scan/results", json=item, timeout=10)
            successful.append(item)
        except Exception as e:
            logger.error(f"Failed to send queued item: {e}")
            break # Stop processing if server is still unreachable
            
    if len(successful) == len(queue):
        clear_queue()
    else:
        # Save remaining ones
        remaining = [item for item in queue if item not in successful]
        with open(OFFLINE_QUEUE_FILE, "w") as f:
            json.dump(remaining, f, indent=4)

def run_scan():
    device_id = get_device_id()
    server_url = get_server_url()
    company_token = get_company_token()
    
    if not device_id:
        logger.warning("Agent not enrolled. Skipping scan.")
        return
        
    logger.info("Executing local security scan...")
    # Gather actual results
    check_results = run_all_checks()
    
    payload = {
        "device_id": device_id,
        "device_token": company_token,
        "results": check_results
    }
    
    try:
        response = requests.post(f"{server_url}/api/v1/scan/results", json=payload, timeout=10)
        response.raise_for_status()
        logger.info("Scan results submitted successfully.")
        
        # If we reached here, server is online, flush the queue
        process_queue(server_url)
    except Exception as e:
        logger.error(f"Failed to submit scan: {e}. Queueing for offline delivery.")
        save_to_queue(payload)

def perform_self_update(download_url):
    import urllib.request
    try:
        logger.info(f"Downloading update from {download_url}")
        tmp_exe = os.path.join(os.environ.get("TEMP", "C:\\Temp"), "medserv_update.exe")
        urllib.request.urlretrieve(download_url, tmp_exe)
        
        current_exe = sys.executable
        if not current_exe.lower().endswith(".exe"):
            logger.info("Running as script in dev mode, skipping physical exe replace.")
            return

        bat_path = os.path.join(os.environ.get("TEMP", "C:\\Temp"), "medserv_updater.bat")
        with open(bat_path, "w") as f:
            f.write(f'''@echo off
timeout /t 5 /nobreak >nul
copy /Y "{tmp_exe}" "{current_exe}"
del "{tmp_exe}"
start "" "{current_exe}"
del "%~f0"
''')
        
        # Detach and run updater
        subprocess.Popen(bat_path, creationflags=subprocess.CREATE_NO_WINDOW, shell=True)
        logger.info("Restarting to apply update.")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Self-update failed: {e}")

def poll_commands():
    device_id = get_device_id()
    server_url = get_server_url()
    company_token = get_company_token()
    
    try:
        response = requests.get(f"{server_url}/api/v1/commands/{device_id}", headers={"X-Company-Token": company_token}, timeout=5)
        response.raise_for_status()
        commands = response.json()
        for cmd in commands:
            logger.info(f"Received command: {cmd}")
            # Placeholder for handling scan_now, update_config, etc.
            if cmd.get("command_type") == "update_agent" and "payload_json" in cmd:
                url = cmd["payload_json"].get("url")
                if url:
                   perform_self_update(url)
    except Exception as e:
        pass

if __name__ == "__main__":
    logger.info("Security Agent initializing...")
    if enroll_if_needed():
        while True:
            run_scan()
            poll_commands()
            # Every 5 minutes as per spec
            time.sleep(300)
