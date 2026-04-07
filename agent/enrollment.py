import platform
import subprocess
import os
import uuid

def get_machine_guid():
    """Gathers a stable, unique hardware ID for various OSs."""
    system = platform.system()
    
    try:
        if system == "Windows":
            cmd = 'reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid'
            output = subprocess.check_output(cmd, shell=True).decode().strip()
            return output.split()[-1]
        elif system == "Darwin": # macOS
            cmd = "ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID"
            output = subprocess.check_output(cmd, shell=True).decode().strip()
            return output.split()[-1].strip('"')
        elif system == "Linux":
            if os.path.exists("/etc/machine-id"):
                with open("/etc/machine-id", "r") as f:
                    return f.read().strip()
    except Exception:
        pass
    
    # Fallback to MAC address based UUID if hardware ID fails
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, platform.node()))

def get_system_info():
    """Gathers basic OS metadata."""
    username = os.getlogin() if hasattr(os, "getlogin") else os.environ.get("USERNAME", "unknown")
    email = f"{username}@company.com" # Fallback email
    
    try:
        # Attempt to get actual UPN (User Principal Name) which often matches email on domain joined machines
        upn = subprocess.check_output("whoami /upn", shell=True, stderr=subprocess.STDOUT).decode().strip()
        if "@" in upn:
            email = upn
    except Exception:
        pass

    return {
        "hostname": platform.node(),
        "username": username,
        "email": email,
        "os_name": f"{platform.system()} {platform.release()}",
        "os_version": platform.version()
    }
