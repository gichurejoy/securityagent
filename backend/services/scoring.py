from typing import List, Dict, Any

# Weights mapped to check_keys
CHECKS_WEIGHTS = {
    # Tier 1
    "bitlocker_c": 5, "windows_firewall": 5, "av_installed": 4, "defender_realtime": 4,
    "pending_updates": 4, "windows_update": 4, "screen_lock": 4, "auto_login": 4,
    "uac_enabled": 4, "guest_disabled": 4, "secure_boot": 4, "event_log_cleared": 4,
    "ntp_sync": 3, "hosts_file": 3, "failed_logins": 4,
    # Tier 2
    "rdp_disabled": 2, "remote_registry": 2, "winrm_disabled": 2, "vpn_installed": 2,
    "wifi_secure": 2, "bluetooth_discoverable": 2, "open_shares": 2, "ps_logging": 2,
    "audit_policy": 2, "usb_history": 2, "admin_count": 2, "password_age": 2,
    "browser_vault": 2, "browser_updated": 2, "smartscreen": 2,
    # Tier 3
    "outdated_software": 1, "remote_tools": 1, "p2p_software": 1, "cloud_sync": 1,
    "sensitive_files": 1, "unencrypted_usb": 1, "cert_files": 1, "sleep_lid": 1,
    "wake_on_lan": 1, "browser_extensions": 1, "browser_sync": 1, "event_log_size": 1,
    "crash_dump": 1
}

def calculate_risk_score(results: List[Dict[str, Any]]) -> int:
    """
    Calculates a security score from 0-100.
    """
    lost_points = 0
    
    for r in results:
        check_key = r.get("check_key")
        status = r.get("status")
        
        weight = CHECKS_WEIGHTS.get(check_key, 0)
        
        if status == "fail":
            lost_points += weight
        elif status == "warn":
            lost_points += weight // 2
            
    score = max(0, 100 - lost_points)
    return score

def get_tier(score: int) -> str:
    """Returns the human-readable tier based on the score."""
    if score >= 90: return "Secure"
    if score >= 70: return "Low Risk"
    if score >= 50: return "Medium Risk"
    if score >= 30: return "High Risk"
    return "Critical"
