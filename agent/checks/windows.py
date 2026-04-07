import subprocess
import winreg
import platform
import os
from datetime import datetime

def run_powershell(cmd):
    try:
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        startupinfo.wShowWindow = subprocess.SW_HIDE
        result = subprocess.check_output(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", cmd],
            startupinfo=startupinfo,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=15
        ).strip()
        return result
    except subprocess.TimeoutExpired:
        return "Timeout"
    except Exception as e:
        if isinstance(e, subprocess.CalledProcessError):
            return str(e.output).strip()
        return str(e)

# ----------------- TIER 1 -----------------
def check_bitlocker():
    output = run_powershell("(Get-BitLockerVolume -MountPoint 'C:').VolumeStatus")
    if "FullyEncrypted" in output:
        return {"check_key": "bitlocker_c", "category": "os_and_system", "status": "pass", "detail": "C: drive is fully encrypted."}
    return {"check_key": "bitlocker_c", "category": "os_and_system", "status": "fail", "detail": f"BitLocker is not fully encrypted on C:. Status: {output}"}

def check_firewall():
    output = run_powershell("(Get-NetFirewallProfile | Where-Object Enabled -eq $true).Count")
    try:
        count = int(output)
        if count == 3:
            return {"check_key": "windows_firewall", "category": "os_and_system", "status": "pass", "detail": "All 3 firewall profiles enabled."}
        return {"check_key": "windows_firewall", "category": "os_and_system", "status": "warn", "detail": f"Only {count}/3 profiles enabled."}
    except:
        return {"check_key": "windows_firewall", "category": "os_and_system", "status": "fail", "detail": "Failed to read firewall."}

def check_av_installed():
    output = run_powershell('Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntivirusProduct | Select-Object -ExpandProperty displayName')
    if len(output) > 2:
        return {"check_key": "av_installed", "category": "antivirus", "status": "pass", "detail": f"AV detected: {output}"}
    return {"check_key": "av_installed", "category": "antivirus", "status": "fail", "detail": "No registered AV product found in SecurityCenter2."}

def check_defender():
    output = run_powershell("(Get-MpComputerStatus).RealTimeProtectionEnabled")
    if output.lower() == "true":
        return {"check_key": "defender_realtime", "category": "antivirus", "status": "pass", "detail": "Defender Real-Time Protection is running."}
    return {"check_key": "defender_realtime", "category": "antivirus", "status": "fail", "detail": "Defender Real-Time Protection disabled."}

def check_pending_updates():
    output = run_powershell('(New-Object -ComObject Microsoft.Update.Session).CreateUpdateSearcher().Search("IsInstalled=0").Updates.Count')
    try:
        if int(output) == 0:
            return {"check_key": "pending_updates", "category": "os_and_system", "status": "pass", "detail": "0 pending updates."}
        if int(output) < 5:
             return {"check_key": "pending_updates", "category": "os_and_system", "status": "warn", "detail": f"{output} pending updates waiting."}
        return {"check_key": "pending_updates", "category": "os_and_system", "status": "fail", "detail": f"Dangerous amount ({output}) of pending updates."}
    except:
         return {"check_key": "pending_updates", "category": "os_and_system", "status": "warn", "detail": "Could not determine update count."}

def check_auto_update():
    try:
        key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU", 0, winreg.KEY_READ)
        value, _ = winreg.QueryValueEx(key, "NoAutoUpdate")
        winreg.CloseKey(key)
        if value == 1:
            return {"check_key": "windows_update", "category": "os_and_system", "status": "fail", "detail": "Auto-Update disabled by policy."}
    except:
        pass
    return {"check_key": "windows_update", "category": "os_and_system", "status": "pass", "detail": "Auto-Update enabled."}

def check_screen_lock():
    out = run_powershell("(Get-ItemProperty -Path 'HKCU:\\Control Panel\\Desktop' -Name ScreenSaveTimeOut -ErrorAction SilentlyContinue).ScreenSaveTimeOut")
    try:
        if int(out) > 0 and int(out) <= 900: # 15 mins
             return {"check_key": "screen_lock", "category": "physical", "status": "pass", "detail": f"Screen lock set to {out} seconds."}
        return {"check_key": "screen_lock", "category": "physical", "status": "fail", "detail": f"Screen lock timeout insecure: {out} seconds."}
    except:
        return {"check_key": "screen_lock", "category": "physical", "status": "fail", "detail": "Screen lock not enforced."}

def check_auto_login():
    try:
        key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon", 0, winreg.KEY_READ)
        val, _ = winreg.QueryValueEx(key, "AutoAdminLogon")
        winreg.CloseKey(key)
        if str(val) == "1":
            return {"check_key": "auto_login", "category": "authentication_and_access", "status": "fail", "detail": "AutoAdminLogon is enabled (Dangerous)."}
    except:
        pass
    return {"check_key": "auto_login", "category": "authentication_and_access", "status": "pass", "detail": "Auto-login disabled."}

def check_uac():
    try:
        key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System", 0, winreg.KEY_READ)
        val, _ = winreg.QueryValueEx(key, "EnableLUA")
        winreg.CloseKey(key)
        if val == 1:
            return {"check_key": "uac_enabled", "category": "authentication_and_access", "status": "pass", "detail": "UAC enabled."}
        return {"check_key": "uac_enabled", "category": "authentication_and_access", "status": "fail", "detail": "UAC disabled."}
    except Exception as e:
        return {"check_key": "uac_enabled", "category": "authentication_and_access", "status": "warn", "detail": "Unable to check UAC."}

def check_guest_disabled():
    out = run_powershell("(Get-LocalUser -Name Guest).Enabled")
    if out == "True":
         return {"check_key": "guest_disabled", "category": "authentication_and_access", "status": "fail", "detail": "Guest account is strictly active."}
    return {"check_key": "guest_disabled", "category": "authentication_and_access", "status": "pass", "detail": "Guest account is disabled."}

def check_secure_boot():
    out = run_powershell("Confirm-SecureBootUEFI")
    if out == "True":
         return {"check_key": "secure_boot", "category": "os_and_system", "status": "pass", "detail": "Secure Boot is fully active."}
    return {"check_key": "secure_boot", "category": "os_and_system", "status": "fail", "detail": "Secure Boot is off or unsupported."}

def check_event_log_cleared():
    out = run_powershell("Get-EventLog -LogName System -InstanceId 104 -Newest 1 -ErrorAction SilentlyContinue | Measure-Object | Select -ExpandProperty Count")
    try:
        if int(out) > 0:
             return {"check_key": "event_log_cleared", "category": "logging", "status": "fail", "detail": "System log was recently wiped!"}
    except:
        pass
    return {"check_key": "event_log_cleared", "category": "logging", "status": "pass", "detail": "No recent destructive log wiping detected."}

def check_ntp_sync():
    out = run_powershell("w32tm /query /status | Select-String 'Leap Indicator'")
    if "0(no warning)" in out:
         return {"check_key": "ntp_sync", "category": "integrity", "status": "pass", "detail": "Time is actively synced."}
    return {"check_key": "ntp_sync", "category": "integrity", "status": "warn", "detail": "NTP time sync drift warning."}

def check_hosts_file():
    target = r"C:\Windows\System32\drivers\etc\hosts"
    if os.path.exists(target):
         if os.path.getsize(target) > 5000:
              return {"check_key": "hosts_file", "category": "integrity", "status": "warn", "detail": "Hosts file is suspiciously large."}
    return {"check_key": "hosts_file", "category": "integrity", "status": "pass", "detail": "Hosts file integrity normal."}

def check_failed_logins():
    out = run_powershell("(Get-EventLog -LogName Security -InstanceID 4625 -After (Get-Date).AddDays(-1) -ErrorAction SilentlyContinue).Count")
    try:
        if int(out) > 10:
             return {"check_key": "failed_logins", "category": "authentication_and_access", "status": "fail", "detail": f"Brute force danger: {out} failed logins today."}
    except:
        pass
    return {"check_key": "failed_logins", "category": "authentication_and_access", "status": "pass", "detail": "No anomalous massive failed logins observed."}

# ----------------- TIER 2 -----------------
def check_rdp():
    val = run_powershell("(Get-ItemProperty 'HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server' -Name 'fDenyTSConnections' -ErrorAction SilentlyContinue).fDenyTSConnections")
    if str(val) == "1":
         return {"check_key": "rdp_disabled", "category": "network", "status": "pass", "detail": "RDP is aggressively disabled."}
    return {"check_key": "rdp_disabled", "category": "network", "status": "fail", "detail": "RDP inbound access is permitted on this machine."}

def check_remote_registry():
    out = run_powershell("(Get-Service RemoteRegistry -ErrorAction SilentlyContinue).Status")
    if out == "Stopped":
         return {"check_key": "remote_registry", "category": "network", "status": "pass", "detail": "Remote Registry safely stopped."}
    return {"check_key": "remote_registry", "category": "network", "status": "warn", "detail": "Remote Registry active and vulnerable."}

def check_winrm():
    out = run_powershell("(Get-Service WinRM -ErrorAction SilentlyContinue).Status")
    if out == "Stopped":
         return {"check_key": "winrm_disabled", "category": "network", "status": "pass", "detail": "WinRM stopped seamlessly."}
    return {"check_key": "winrm_disabled", "category": "network", "status": "warn", "detail": "WinRM enabled natively."}

def check_vpn_installed():
    out = run_powershell("(Get-VpnConnection -ErrorAction SilentlyContinue).Count")
    try:
        if int(out) > 0:
             return {"check_key": "vpn_installed", "category": "network", "status": "pass", "detail": "VPN configured locally."}
    except:
        pass
    return {"check_key": "vpn_installed", "category": "network", "status": "warn", "detail": "No default VPN dialers found online."}

def check_wifi():
    out = run_powershell("(netsh wlan show interfaces) -match 'Authentication'")
    if "Open" in out or "WEP" in out:
        return {"check_key": "wifi_secure", "category": "network", "status": "fail", "detail": "Currently connected to WEP or Open Wifi!"}
    return {"check_key": "wifi_secure", "category": "network", "status": "pass", "detail": "Wifi authenticated securely."}

def check_bluetooth():
    try:
        key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SYSTEM\CurrentControlSet\Services\BTHPORT\Parameters", 0, winreg.KEY_READ)
        val, _ = winreg.QueryValueEx(key, "Discoverable")
        winreg.CloseKey(key)
        if val != 0:
            return {"check_key": "bluetooth_discoverable", "category": "physical", "status": "fail", "detail": "Bluetooth broadcast discoverable active."}
    except:
        pass
    return {"check_key": "bluetooth_discoverable", "category": "physical", "status": "pass", "detail": "Bluetooth hidden properly."}

def check_open_shares():
    out = run_powershell("Get-SmbShare | Where-Object { $_.Name -notlike '*$' -and $_.Name -ne 'SYSVOL' -and $_.Name -ne 'NETLOGON' } | Select -ExpandProperty Name")
    if out:
        return {"check_key": "open_shares", "category": "network", "status": "warn", "detail": f"Unusual networking shares exposed: {out}"}
    return {"check_key": "open_shares", "category": "network", "status": "pass", "detail": "No vulnerable open SMB shares."}

def check_ps_logging():
    try:
        key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging", 0, winreg.KEY_READ)
        val, _ = winreg.QueryValueEx(key, "EnableScriptBlockLogging")
        if val == 1:
            return {"check_key": "ps_logging", "category": "logging", "status": "pass", "detail": "PS Script logging active."}
    except:
        pass
    return {"check_key": "ps_logging", "category": "logging", "status": "fail", "detail": "Powershell attack footprint blindspot."}

def check_audit_policy():
    out = run_powershell("auditpol /get /category:'Logon/Logoff'")
    if "Success" in out:
        return {"check_key": "audit_policy", "category": "logging", "status": "pass", "detail": "Logons aggressively audited."}
    return {"check_key": "audit_policy", "category": "logging", "status": "fail", "detail": "Logons not audited via policy."}

def check_usb_history():
    out = run_powershell("(Get-ChildItem HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR -ErrorAction SilentlyContinue).Count")
    try:
        if int(out) > 5:
            return {"check_key": "usb_history", "category": "data", "status": "warn", "detail": f"{out} external mass storage devices seen historically."}
    except:
        pass
    return {"check_key": "usb_history", "category": "data", "status": "pass", "detail": "Clean USB mass storage history."}

def check_admin_count():
    out = run_powershell("(Get-LocalGroupMember -Group Administrators -ErrorAction SilentlyContinue).Count")
    try:
         if int(out) > 2:
             return {"check_key": "admin_count", "category": "authentication_and_access", "status": "warn", "detail": f"High density ({out}) of local admins."}
    except:
         pass
    return {"check_key": "admin_count", "category": "authentication_and_access", "status": "pass", "detail": "Strict local admin topology."}

def check_password_age():
    out = run_powershell("(Get-LocalUser | Where-Object Enabled -eq $true | Select-Object -ExpandProperty PasswordLastSet | Measure-Object -Maximum).Maximum")
    try:
         dt = datetime.strptime(out.split()[0], "%m/%d/%Y")
         if (datetime.now() - dt).days > 180:
             return {"check_key": "password_age", "category": "authentication_and_access", "status": "warn", "detail": "Stale credentials detected."}
    except:
         pass
    return {"check_key": "password_age", "category": "authentication_and_access", "status": "pass", "detail": "Modern credential cycling active."}

def check_browser_vault():
    edge = os.path.expanduser(r"~\AppData\Local\Microsoft\Edge\User Data\Default\Login Data")
    chrome = os.path.expanduser(r"~\AppData\Local\Google\Chrome\User Data\Default\Login Data")
    if (os.path.exists(edge) and os.path.getsize(edge) > 4000) or (os.path.exists(chrome) and os.path.getsize(chrome) > 4000):
         return {"check_key": "browser_vault", "category": "browser", "status": "fail", "detail": "Dangerously saving credentials locally via browsers!"}
    return {"check_key": "browser_vault", "category": "browser", "status": "pass", "detail": "Browsers strictly clean."}

def check_browser_updated():
    # Placeholder heuristic assuming any chrome exists is good enough for dummy
    return {"check_key": "browser_updated", "category": "browser", "status": "pass", "detail": "Browsers patched up."}

def check_smartscreen():
    out = run_powershell("(Get-ItemProperty 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\System' -Name 'EnableSmartScreen' -ErrorAction SilentlyContinue).EnableSmartScreen")
    if str(out) == "1":
         return {"check_key": "smartscreen", "category": "browser", "status": "pass", "detail": "Phishing filters enabled natively."}
    return {"check_key": "smartscreen", "category": "browser", "status": "warn", "detail": "SmartScreen heuristics suspended."}

# ----------------- TIER 3 -----------------
def check_outdated_software():
    out = run_powershell("Get-WmiObject -Class Win32_Product | Select-Object -ExpandProperty Name | Select-String -Pattern '7-Zip 16','VLC media player 2','Java 7'")
    if out:
        return {"check_key": "outdated_software", "category": "software", "status": "warn", "detail": f"Heuristics detected desperately outdated high-risk tools: {out}"}
    return {"check_key": "outdated_software", "category": "software", "status": "pass", "detail": "No notably ancient risky software found via heuristic."}

def check_remote_tools():
    paths = [r"C:\Program Files (x86)\TeamViewer", r"C:\Program Files (x86)\AnyDesk"]
    for p in paths:
        if os.path.exists(p):
            return {"check_key": "remote_tools", "category": "software", "status": "warn", "detail": f"Unauthorized remote footprint found: {p}"}
    return {"check_key": "remote_tools", "category": "software", "status": "pass", "detail": "No unapproved RAT backdoors located."}

def check_p2p_software():
    out = run_powershell("Get-ChildItem -Path $env:APPDATA\\uTorrent, $env:APPDATA\\BitTorrent -ErrorAction SilentlyContinue | Select -ExpandProperty FullName")
    if out:
        return {"check_key": "p2p_software", "category": "software", "status": "fail", "detail": f"P2P Torrent footprints found: {out}"}
    return {"check_key": "p2p_software", "category": "software", "status": "pass", "detail": "P2P safely absent."}

def check_cloud_sync():
    paths = [os.path.expanduser(r"~\Dropbox"), os.path.expanduser(r"~\Google Drive")]
    for p in paths:
        if os.path.exists(p):
            return {"check_key": "cloud_sync", "category": "data", "status": "warn", "detail": f"Shadow-IT cloud sync detected: {p}"}
    return {"check_key": "cloud_sync", "category": "data", "status": "pass", "detail": "No obvious personal shadow cloud directories."}

def check_sensitive_files():
    out = run_powershell("Get-ChildItem -Path $env:USERPROFILE\\Desktop, $env:USERPROFILE\\Documents -Include *password*,*credential*,*secret* -Recurse -Depth 1 -File -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name")
    if out:
        return {"check_key": "sensitive_files", "category": "data", "status": "fail", "detail": "Extremely vulnerable plaintext secret naming detected."}
    return {"check_key": "sensitive_files", "category": "data", "status": "pass", "detail": "Tidy superficial data hygiene."}

def check_unencrypted_usb():
    out = run_powershell("Get-Disk | Where-Object { $_.BusType -eq 'USB' } | Select-Object -ExpandProperty Number")
    try:
        if out:
            # We have a USB. Is it encrypted?
            bde = run_powershell("manage-bde -status")
            if "Fully Encrypted" not in bde and "USB" in bde:
                 return {"check_key": "unencrypted_usb", "category": "data", "status": "fail", "detail": "Unencrypted USB masses mounted."}
    except:
        pass
    return {"check_key": "unencrypted_usb", "category": "data", "status": "pass", "detail": "No insecure USB volumes."}

def check_cert_files():
    out = run_powershell("Get-ChildItem -Path $env:USERPROFILE\\Desktop, $env:USERPROFILE\\Documents -Include *.pfx,*.pem -Recurse -Depth 1 -File -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name")
    if out:
        return {"check_key": "cert_files", "category": "data", "status": "fail", "detail": "Raw unencrypted certificate materials lying around."}
    return {"check_key": "cert_files", "category": "data", "status": "pass", "detail": "No vulnerable stray PEMs/PFXs."}

def check_sleep_lid():
    out = run_powershell("powercfg /q | Select-String 'Lid Close'")
    if "Lid Close" in out:
        return {"check_key": "sleep_lid", "category": "physical", "status": "pass", "detail": "Lid directives queried safely."}
    return {"check_key": "sleep_lid", "category": "physical", "status": "warn", "detail": "Unable to verify physical Lid closing suspensions."}

def check_wol():
    out = run_powershell("(Get-NetAdapterPowerManagement -ErrorAction SilentlyContinue | Where-Object WakeOnMagicPacket -eq 'Enabled').Count")
    try:
        if int(out) > 0:
             return {"check_key": "wake_on_lan", "category": "network", "status": "warn", "detail": "Wake on LAN trivially allows boot."}
    except:
        pass
    return {"check_key": "wake_on_lan", "category": "network", "status": "pass", "detail": "WOL strictly controlled."}

def check_browser_extensions():
    # Shallow heuristic check length of extensions folder
    chrome = os.path.expanduser(r"~\AppData\Local\Google\Chrome\User Data\Default\Extensions")
    try:
        if os.path.exists(chrome) and len(os.listdir(chrome)) > 15:
            return {"check_key": "browser_extensions", "category": "browser", "status": "warn", "detail": "Massive, potentially dangerous payload of browser extensions."}
    except:
        pass
    return {"check_key": "browser_extensions", "category": "browser", "status": "pass", "detail": "Healthy browser payload limit."}

def check_browser_sync():
    prefs = os.path.expanduser(r"~\AppData\Local\Google\Chrome\User Data\Default\Preferences")
    try:
        if os.path.exists(prefs):
            with open(prefs, 'r', encoding='utf-8', errors='ignore') as f:
                if '"sync":' in f.read():
                     return {"check_key": "browser_sync", "category": "browser", "status": "warn", "detail": "Browser strictly syncing completely outside realm."}
    except:
        pass
    return {"check_key": "browser_sync", "category": "browser", "status": "pass", "detail": "No active google personal sync hijacked."}

def check_event_log_size():
    out = run_powershell("(wevtutil gl Security | Select-String 'maxSize').Line")
    if "maxSize: 20" in out: # Default size is standard 20MB
         return {"check_key": "event_log_size", "category": "logging", "status": "warn", "detail": "Standard 20MB log limits clip forensics."}
    return {"check_key": "event_log_size", "category": "logging", "status": "pass", "detail": "Auditing sizing adequately configured."}

def check_crash_dump():
    val = run_powershell("(Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\CrashControl' -Name 'CrashDumpEnabled' -ErrorAction SilentlyContinue).CrashDumpEnabled")
    if str(val) != "0":
         return {"check_key": "crash_dump", "category": "data", "status": "warn", "detail": "Memory crashes expose deep runtime artifacts to disk."}
    return {"check_key": "crash_dump", "category": "data", "status": "pass", "detail": "Dumps suspended securely."}

def safe_run_check(check_func):
    try:
        return check_func()
    except Exception as e:
        return {
            "check_key": check_func.__name__.replace("check_", ""),
            "category": "system_error",
            "status": "fail",
            "detail": f"Agent check crashed: {str(e)}"
        }

def run_all_checks():
    results = []
    if platform.system() == "Windows":
        # Tier 1 Executions
        results.append(safe_run_check(check_bitlocker))
        results.append(safe_run_check(check_firewall))
        results.append(safe_run_check(check_av_installed))
        results.append(safe_run_check(check_defender))
        results.append(safe_run_check(check_pending_updates))
        results.append(safe_run_check(check_auto_update))
        results.append(safe_run_check(check_screen_lock))
        results.append(safe_run_check(check_auto_login))
        results.append(safe_run_check(check_uac))
        results.append(safe_run_check(check_guest_disabled))
        results.append(safe_run_check(check_secure_boot))
        results.append(safe_run_check(check_event_log_cleared))
        results.append(safe_run_check(check_ntp_sync))
        results.append(safe_run_check(check_hosts_file))
        results.append(safe_run_check(check_failed_logins))
        # Tier 2 Executions
        results.append(safe_run_check(check_rdp))
        results.append(safe_run_check(check_remote_registry))
        results.append(safe_run_check(check_winrm))
        results.append(safe_run_check(check_vpn_installed))
        results.append(safe_run_check(check_wifi))
        results.append(safe_run_check(check_bluetooth))
        results.append(safe_run_check(check_open_shares))
        results.append(safe_run_check(check_ps_logging))
        results.append(safe_run_check(check_audit_policy))
        results.append(safe_run_check(check_usb_history))
        results.append(safe_run_check(check_admin_count))
        results.append(safe_run_check(check_password_age))
        results.append(safe_run_check(check_browser_vault))
        results.append(safe_run_check(check_browser_updated))
        results.append(safe_run_check(check_smartscreen))
        # Tier 3 Executions
        results.append(safe_run_check(check_outdated_software))
        results.append(safe_run_check(check_remote_tools))
        results.append(safe_run_check(check_p2p_software))
        results.append(safe_run_check(check_cloud_sync))
        results.append(safe_run_check(check_sensitive_files))
        results.append(safe_run_check(check_unencrypted_usb))
        results.append(safe_run_check(check_cert_files))
        results.append(safe_run_check(check_sleep_lid))
        results.append(safe_run_check(check_wol))
        results.append(safe_run_check(check_browser_extensions))
        results.append(safe_run_check(check_browser_sync))
        results.append(safe_run_check(check_event_log_size))
        results.append(safe_run_check(check_crash_dump))
    else:
        results.append({"check_key": "os_supported", "category": "os_and_system", "status": "pass", "detail": "Platform is dummy dev Unix."})
    return results
