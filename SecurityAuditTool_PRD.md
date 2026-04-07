**INTERNAL SECURITY AUDIT TOOL**

Product Requirements & Technical Specification

Version 1.0 \| Confidential

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Purpose**                                                           |
|                                                                       |
| This document defines the full product specification for an internal  |
| endpoint security audit system. The tool runs silently on employee    |
| machines, collects real security data, scores each device, and        |
| reports findings to an IT/Security dashboard --- with zero technical  |
| involvement required from employees.                                  |
|                                                                       |
| *Audience: Engineering team, coding agents, technical leads.*         |
+-----------------------------------------------------------------------+

**Table of Contents**

**1. System Overview**

The Internal Security Audit Tool is a three-part system: a silent agent
that runs on every employee machine, a FastAPI backend hosted on the
company VPS, and a web-based dashboard for IT and Security teams.
Employees interact with nothing --- the agent installs once and operates
invisibly forever after.

**1.1 High-Level Architecture**

The system consists of three layers communicating over HTTPS:

-   Agent Layer --- Python agents running as background services on all
    26 employee machines (Windows, macOS, Linux). Installed once via a
    double-click installer. Runs silently on a schedule and on IT
    command.

-   Backend Layer --- FastAPI application on the HostAfrica VPS, backed
    by PostgreSQL. Receives scan results, stores history, serves the
    dashboard API, manages the command queue, and fires alerts.

-   Dashboard Layer --- React web application served from the same VPS.
    Two distinct portals: IT/Security Admin dashboard and Employee
    self-service portal.

**1.2 Technology Stack**

  ------------------ -------------------------- --------------------------
  **Layer**          **Technology**             **Rationale**

  **Agent**          Python + PyInstaller       Python-first team.
                                                PyInstaller bundles to
                                                .exe/.pkg with no runtime
                                                needed on employee
                                                machines.

  **Backend**        FastAPI + PostgreSQL       Async, Pydantic
                                                validation, auto Swagger
                                                docs. PostgreSQL for
                                                robust relational history.

  **Reverse Proxy**  Nginx + Let\'s Encrypt     SSL termination, static
                                                file serving, proxy to
                                                uvicorn.

  **Dashboard**      React (Vite)               Component-driven UI, fast
                                                iteration, rich charting
                                                libraries.

  **Hosting**        HostAfrica VPS (2GB RAM /  More than sufficient for
                     2 vCPU)                    26 devices. Full control,
                                                persistent processes.

  **Alerts**         Email (SMTP) + Slack       Zero additional
                     Webhook                    infrastructure. Configured
                                                in dashboard settings.
  ------------------ -------------------------- --------------------------

**1.3 Infrastructure Layout**

+-----------------------------------------------------------------------+
| **HostAfrica VPS**                                                    |
|                                                                       |
| Nginx (port 443, SSL via Let\'s Encrypt)                              |
|                                                                       |
| ↓                                                                     |
|                                                                       |
| FastAPI app (uvicorn, port 8000)                                      |
|                                                                       |
| ↓                                                                     |
|                                                                       |
| PostgreSQL (local, port 5432)                                         |
|                                                                       |
| Supervisor (keeps FastAPI alive)                                      |
|                                                                       |
| React build (served as static files via Nginx)                        |
+-----------------------------------------------------------------------+

**2. The Agent**

**2.1 Overview**

The agent is a Python application compiled to a standalone executable
via PyInstaller. It runs as a background system service with no UI, no
system tray icon, and no employee interaction after installation. It is
responsible for collecting security check data, scoring it locally,
encrypting the payload, and reporting to the backend.

**2.2 Deployment & Delivery**

-   Windows: .exe installer built with Inno Setup. Employee
    double-clicks, clicks Next → Install → Finish. No choices required.

-   macOS: .pkg installer built with pkgbuild/productbuild. Same
    double-click experience.

-   Linux: Shell script (.sh) or .deb package for Ubuntu/Debian
    machines.

-   Delivery method: IT shares a download link via Slack or email. Link
    hosted on the VPS download page.

-   Build automation: GitHub Actions builds all three installers
    automatically on every release tag.

**2.3 What the Installer Does (Silently)**

1.  Copies agent binary to correct system location (e.g. C:\\Program
    Files\\SecurityAgent\\)

2.  Writes config file: server URL, company ID, scan schedule

3.  Generates a unique device ID (UUID) for this machine

4.  Registers agent as Windows Service / launchd daemon / systemd unit

5.  Calls POST /api/v1/enroll --- machine appears on IT dashboard
    immediately

6.  Runs first scan immediately and sends results

7.  Installer closes. Employee sees: Installation complete.

**2.4 Agent Scan Cycle**

-   Wake up (scheduled trigger or server command)

-   Detect OS (Windows / macOS / Linux)

-   Run all checks for that OS platform

-   Score results using weighted risk model

-   Package results as structured JSON

-   Encrypt payload (AES + HTTPS transport)

-   Send to POST /api/v1/scan/results

-   Poll GET /api/v1/commands/{device_id} for any pending IT commands

-   Log result locally for debugging

-   Sleep until next scheduled trigger

**2.5 Trigger Modes**

  --------------------- -------------------------------------------------
  **Trigger**           **Description**

  **Scheduled           Daily at a configurable time (default 3:00 AM).
  (default)**           Configurable from IT dashboard.

  **On Login/Boot**     Agent scans every time the machine boots or user
                        logs in.

  **Network Change**    Agent detects new network connection and triggers
                        a scan (catches public WiFi joins).

  **IT Remote Trigger** IT clicks \'Scan Now\' on dashboard. Command
                        queued. Agent picks up on next poll (within 5
                        minutes).
  --------------------- -------------------------------------------------

**2.6 Security Checks --- Windows (Primary Platform)**

All checks are performed using Python standard library tools: winreg,
wmi, subprocess/PowerShell (non-interactive), psutil, and os/pathlib.
Most checks require no elevated privileges; those that do request
elevation once at install time.

**OS & System**

  ------------------------ --------------- -------------------------------------------------------------
  **Check**                **Weight**      **Method**

  BitLocker enabled on C:  20 --- Critical WMI Win32_EncryptableVolume
  drive                                    

  Windows Firewall (all 3  15 --- Critical netsh / PowerShell Get-NetFirewallProfile
  profiles)                                

  OS version & patch level 10 --- High     WMI Win32_OperatingSystem
  current                                  

  Pending critical Windows 10 --- High     PowerShell Get-WindowsUpdate
  updates                                  

  Auto-update enabled      8 --- High      Registry:
                                           HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate

  Screen lock timeout ≤    8 --- High      Registry: HKCU\\Control Panel\\Desktop
  policy threshold                         

  Secure Boot enabled      7 --- High      WMI Win32_UEFISecureBoot
  ------------------------ --------------- -------------------------------------------------------------

**Authentication & Access**

  ------------------------ --------------- --------------------------------------------------------------
  **Check**                **Weight**      **Method**

  Antivirus/EDR installed  15 --- Critical WMI AntiVirusProduct (SecurityCenter2)
  and active                               

  Windows Defender         10 --- Critical PowerShell Get-MpComputerStatus
  real-time protection                     

  UAC (User Account        7 --- Medium    Registry:
  Control) enabled                         HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies

  Guest account disabled   5 --- Medium    PowerShell Get-LocalUser

  Number of admin accounts 5 --- Medium    PowerShell Get-LocalGroupMember Administrators
  on machine                               

  Password last changed    5 --- Medium    PowerShell Get-LocalUser \| Select PasswordLastSet
  age                                      
  ------------------------ --------------- --------------------------------------------------------------

**Network**

  ------------------------ --------------- ------------------------------
  **Check**                **Weight**      **Method**

  VPN client installed     8 --- Medium    Installed software list +
                                           running process check

  Current network profile  6 --- Medium    PowerShell
  (Public/Private)                         Get-NetConnectionProfile

  DNS using company        5 --- Medium    PowerShell
  servers                                  Get-DnsClientServerAddress

  Unexpected open          5 --- Medium    netstat -ano /
  listening ports                          psutil.net_connections()
  ------------------------ --------------- ------------------------------

**Software & Applications**

  ------------------------ --------------- ------------------------------
  **Check**                **Weight**      **Method**

  Outdated software with   8 --- High      Installed software list
  known CVEs                               cross-referenced with CVE feed

  Blacklisted software     6 --- Medium    Registry uninstall keys vs
  installed                                configurable blacklist

  High-permission browser  4 --- Low       Read Chrome/Edge extension
  extensions                               folders in AppData
  ------------------------ --------------- ------------------------------

**Data Hygiene**

  ------------------------ --------------- ------------------------------
  **Check**                **Weight**      **Method**

  Sensitive file patterns  5 --- Medium    Scan Desktop/Downloads for
  in insecure locations                    \*.password\*, \*.key,
                                           credentials\*

  Unencrypted external USB 5 --- Medium    WMI Win32_DiskDrive +
  drives connected                         BitLocker status on removable
  ------------------------ --------------- ------------------------------

**2.7 Risk Scoring Model**

Score = 100 minus the sum of weights for all failed checks. WARN
findings deduct half the check\'s weight. PASS findings deduct nothing.

  --------------- ------------------ -------------------------------------
  **Score Range** **Risk Tier**      **Meaning**

  90 -- 100       Secure             Machine meets all or nearly all
                                     security policies.

  70 -- 89        Low Risk           Minor gaps. No critical checks
                                     failing.

  50 -- 69        Medium Risk        Several checks failing. Remediation
                                     recommended.

  30 -- 49        High Risk          Multiple high-weight checks failing.
                                     Prompt action needed.

  0 -- 29         Critical           Critical checks failing (e.g. no
                                     encryption, no antivirus). Immediate
                                     action.
  --------------- ------------------ -------------------------------------

**3. Backend (FastAPI)**

**3.1 API Endpoints**

All agent-facing endpoints require a device token (issued at
enrollment). All dashboard-facing endpoints require an IT admin JWT.

**Agent Endpoints**

  ------------ ------------------------------ ----------------------------------------------
  **Method**   **Path**                       **Purpose**

  POST         /api/v1/enroll                 New machine registers itself. Returns
                                              device_id and device_token.

  POST         /api/v1/scan/results           Agent submits full scan result JSON. Triggers
                                              scoring and alert evaluation.

  GET          /api/v1/commands/{device_id}   Agent polls for pending commands (scan
                                              trigger, config update, agent update).

  POST         /api/v1/heartbeat              Agent checks in every N minutes to confirm it
                                              is alive (even between scans).
  ------------ ------------------------------ ----------------------------------------------

**Dashboard Endpoints**

  ------------ ------------------------------ ----------------------------------------
  **Method**   **Path**                       **Purpose**

  GET          /api/v1/dashboard/overview     Org-level stats: risk distribution,
                                              overall score, active alerts.

  GET          /api/v1/devices                All enrolled devices with current score,
                                              status, last scan.

  GET          /api/v1/devices/{id}           Full detail for one device: all checks,
                                              scores, current findings.

  GET          /api/v1/devices/{id}/history   Historical scan results and score trend
                                              for one device.

  POST         /api/v1/commands               IT queues a command: scan_now,
                                              update_config, update_agent.

  GET          /api/v1/checks/analysis        Per-check failure rates across the org.
                                              Sorted by failure count.

  GET          /api/v1/trends                 Historical org score, risk distribution
                                              over time, compliance rate.

  GET/POST     /api/v1/findings               List and manage remediation findings.
                                              Filter by status, device, severity.

  PATCH        /api/v1/findings/{id}          Update finding status: open,
                                              in_progress, resolved, accepted_risk,
                                              false_positive.

  GET/POST     /api/v1/alerts/rules           List and create alert rules.

  GET          /api/v1/alerts/history         Log of all fired alerts.

  POST         /api/v1/reports/generate       Generate PDF/CSV report. Returns
                                              download URL.

  GET          /api/v1/employee/me            Employee portal: returns own device
                                              score and remediation list.
  ------------ ------------------------------ ----------------------------------------

**3.2 Database Schema**

PostgreSQL. All timestamps in UTC.

  ------------------- -----------------------------------------------------------
  **Table**           **Key Columns**

  **devices**         id, hostname, employee_email, employee_name, os_platform,
                      os_version, agent_version, device_token, enrolled_at,
                      last_seen_at, department_id, is_active

  **scan_results**    id, device_id, scanned_at, risk_score, risk_tier,
                      trigger_type (scheduled/manual/boot/network), raw_json

  **check_results**   id, scan_id, check_key, category, status (pass/warn/fail),
                      detail, weight, score_impact

  **findings**        id, device_id, check_key, first_seen_at, last_seen_at,
                      status
                      (open/in_progress/resolved/accepted_risk/false_positive),
                      assignee_id, due_date, notes, auto_closed_at

  **commands**        id, device_id, command_type, payload_json, created_at,
                      picked_up_at, completed_at, created_by

  **alert_rules**     id, name, trigger_check, trigger_condition, trigger_value,
                      severity, notify_via, frequency, notify_emails, is_active

  **notifications**   id, alert_rule_id, device_id, fired_at, channel
                      (slack/email), message, finding_id

  **departments**     id, name, policy_profile_id

  **it_users**        id, email, name, role (admin/viewer), hashed_password,
                      last_login_at
  ------------------- -----------------------------------------------------------

**3.3 MDM Command & Control Layer**

A lightweight command-and-control system giving IT remote management
without implementing the full Apple/Microsoft MDM protocol.

  --------------------- --------------- ---------------------------------------
  **Capability**        **Supported**   **Notes**

  Remote scan trigger   Yes             IT clicks Scan Now. Command queued.
                                        Agent picks up within 5 min.

  Agent auto-update     Yes             Server advertises latest version. Agent
                                        downloads and self-updates.

  Config push           Yes             Agent pulls latest config on every
  (schedule, policies)                  check-in. No reboot needed.

  Machine enrollment /  Yes             Enroll on install. Unenroll from
  unenrollment                          dashboard (deactivates token).

  Hardware/software     Yes             Collected on each scan. Stored in
  inventory                             scan_results.

  Remote agent          Yes             Server deactivates device token. Agent
  disable/kill                          stops on next check-in.

  Per-department policy Yes             Finance team can have stricter
  profiles                              thresholds than general staff.

  Remote wipe           Partial         Possible on Windows via PowerShell
                                        script. macOS needs Apple MDM cert.

  Full Apple MDM        No              Requires Apple vendor cert. Out of
  protocol                              scope for this build.
  --------------------- --------------- ---------------------------------------

**4. IT/Security Admin Dashboard**

The IT dashboard is a React single-page application served at
https://security.yourcompany.com. IT admins log in with email + password
(JWT auth). The dashboard has 8 primary pages.

**4.1 Navigation Structure**

-   Sidebar: Overview, Devices, Checks Analysis, Trends, Findings,
    Alerts, Reports, Settings

-   Top Bar (persistent): Org security score badge, active critical
    alerts count, \[Scan All Now\] button, admin profile/logout

**4.2 Page 1 --- Overview (Home)**

First page IT sees on login. Must answer \'How is the org doing right
now?\' in under 10 seconds.

  -----------------------------------------------------------------------
  **TOP METRICS BAR**

  -----------------------------------------------------------------------

-   Total devices enrolled (26)

-   Devices scanned in last 24 hours

-   Devices offline / not seen in 5+ days (flagged in red)

-   Last org-wide scan timestamp

  -----------------------------------------------------------------------
  **RISK DISTRIBUTION**

  -----------------------------------------------------------------------

-   Large visual breakdown: how many machines are Critical / High /
    Medium / Low / Secure

-   Overall org security score (weighted average across all active
    devices)

-   Trend indicator vs last week (arrow up/down + delta)

  -----------------------------------------------------------------------
  **CRITICAL ALERTS PANEL**

  -----------------------------------------------------------------------

-   Auto-generated list of conditions requiring immediate IT attention

-   Examples: \'3 machines have disk encryption OFF\', \'2 machines have
    no antivirus\', \'1 machine not seen in 8 days\'

-   Each alert links directly to affected device(s)

  -----------------------------------------------------------------------
  **RECENT ACTIVITY FEED**

  -----------------------------------------------------------------------

-   Latest scan completions, new device enrollments, IT-triggered scans,
    alerts fired

  -----------------------------------------------------------------------
  **QUICK ACTIONS**

  -----------------------------------------------------------------------

-   \[Scan All Machines Now\] --- queues scan command for all active
    devices

-   \[Download Org Report\] --- generates PDF executive summary

-   \[Enroll New Device\] --- shows download link and enrollment
    instructions

**4.3 Page 2 --- Devices**

Master list of all enrolled machines. Full picture of every endpoint.

  -----------------------------------------------------------------------
  **FILTERS & SEARCH**

  -----------------------------------------------------------------------

-   Search by hostname, employee name, employee email

-   Filter by: Risk tier, OS platform, Department, Last seen, Agent
    status

-   Sort by: Score (asc/desc), Last scan, Employee name, Risk tier

  -----------------------------------------------------------------------
  **DEVICES TABLE --- one row per machine**

  -----------------------------------------------------------------------

-   Device hostname

-   Assigned employee (name + email)

-   OS platform and version (e.g. Windows 11 22H2)

-   Risk score (0--100) with colour-coded tier badge

-   Top 2--3 failing checks shown as inline tags (e.g. \'No BitLocker\',
    \'Outdated OS\')

-   Last scan timestamp (flagged if stale)

-   Agent status: Active / Offline / Never Connected

-   Row actions: \[View Detail\], \[Scan Now\], \[View Findings\],
    \[Remove\]

  -----------------------------------------------------------------------
  **BULK ACTIONS**

  -----------------------------------------------------------------------

-   Select multiple devices → \[Trigger Scan on Selected\]

-   Select multiple → \[Export Selected as CSV\]

-   Select multiple → \[Send Remediation Email to Employees\]

**4.4 Page 3 --- Device Detail**

The deepest view. IT clicks into one machine and sees everything.

  -----------------------------------------------------------------------
  **DEVICE HEADER**

  -----------------------------------------------------------------------

-   Hostname, employee name and email, OS version, last boot time

-   Agent version installed

-   Overall risk score + tier badge (large, prominent)

-   Last scanned timestamp

-   Actions: \[Scan Now\], \[View Scan History\], \[Manage Findings\],
    \[Remove Device\]

  -----------------------------------------------------------------------
  **RISK SCORE BREAKDOWN**

  -----------------------------------------------------------------------

-   Radar / spider chart showing score across 6 categories: OS & System,
    Authentication, Network, Antivirus, Software, Data Hygiene

  -----------------------------------------------------------------------
  **CHECKS DETAIL --- full list by category**

  -----------------------------------------------------------------------

-   Each check shows: status icon (✅ PASS / ❌ FAIL / ⚠️ WARN), check
    name, detail message

-   Examples: \'❌ OS Updates --- 4 critical updates pending for 14
    days\', \'⚠️ Screen Lock --- set to 30min, policy requires 5min\'

-   Checks grouped by category with collapsible sections

  -----------------------------------------------------------------------
  **SCAN HISTORY**

  -----------------------------------------------------------------------

-   Line chart of score over time for this device

-   Table of past scans: date, score, tier, trigger type, number of
    failures

-   Click any past scan to see full check results from that point in
    time

**4.5 Page 4 --- Checks Analysis**

Org-wide view per check. Answers: which checks are failing the most
across all machines?

  -----------------------------------------------------------------------
  **CHECKS FAILURE LEADERBOARD**

  -----------------------------------------------------------------------

-   Ranked list of all checks by failure count across the org

-   Shows: check name, category, severity weight, number failing,
    percentage failing, trend vs last scan

-   Critical checks flagged even at low percentages (e.g. \'BitLocker
    Disabled --- 2/26 machines (8%) --- CRITICAL WEIGHT\')

  -----------------------------------------------------------------------
  **PER-CHECK DRILLDOWN**

  -----------------------------------------------------------------------

-   Click any check → see exactly which machines are failing it

-   Inline actions: \[Scan All Failing Machines\], \[Send Remediation
    Guide to Affected Employees\]

  -----------------------------------------------------------------------
  **CATEGORY OVERVIEW**

  -----------------------------------------------------------------------

-   Average score per category across the org

-   Highlights weakest categories with colour coding

**4.6 Page 5 --- Trends & History**

For security managers and executives. Shows progress over time.

  -----------------------------------------------------------------------
  **ORG SECURITY SCORE OVER TIME**

  -----------------------------------------------------------------------

-   Line chart --- weekly average score for selectable period (30 days /
    3 months / 6 months / 12 months)

  -----------------------------------------------------------------------
  **RISK DISTRIBUTION OVER TIME**

  -----------------------------------------------------------------------

-   Stacked bar chart --- count of Critical / High / Medium / Low /
    Secure devices per week

  -----------------------------------------------------------------------
  **CHECK COMPLIANCE TRENDS**

  -----------------------------------------------------------------------

-   Per-check compliance rate over time (e.g. \'BitLocker compliance
    went from 60% → 92% over 30 days\')

-   Filterable by category

  -----------------------------------------------------------------------
  **DEVICE COMPLIANCE RATE**

  -----------------------------------------------------------------------

-   Percentage of devices that have scanned within the last 7 days

-   Tracks agent health and employee machine uptime

  -----------------------------------------------------------------------
  **NOTABLE EVENTS TIMELINE**

  -----------------------------------------------------------------------

-   Log of significant events: remote scans triggered, agent updates
    pushed, new enrollments, config changes

**4.7 Page 6 --- Findings & Remediation**

The remediation workflow. Every failed check generates a finding. IT
tracks findings to resolution.

  -----------------------------------------------------------------------
  **FINDING LIFECYCLE**

  -----------------------------------------------------------------------

8.  Check fails on scan → Finding created automatically with status:
    OPEN

9.  IT assigns the finding to themselves or a colleague

10. IT updates status as work progresses

11. Next scan runs → if check now passes, finding auto-closes as
    RESOLVED

12. If still failing after marked RESOLVED → finding automatically
    reopens

  -----------------------------------------------------------------------
  **FINDING STATUS OPTIONS**

  -----------------------------------------------------------------------

  ---------------- ------------------------------------------------------
  **Status**       **Meaning**

  OPEN             Newly detected. No action taken yet.

  IN PROGRESS      IT is actively working on it or waiting on employee.

  RESOLVED         Fix applied. Auto-confirmed on next successful scan.

  ACCEPTED RISK    Known issue consciously tolerated. Requires a written
                   reason. Suppresses alerts.

  FALSE POSITIVE   Check flagged something incorrectly. Suppresses future
                   alerts for this check on this device.
  ---------------- ------------------------------------------------------

  -----------------------------------------------------------------------
  **FINDINGS TABLE**

  -----------------------------------------------------------------------

-   Columns: Device, Employee, Check, Category, Severity, First Seen,
    Last Seen, Status, Assignee, Due Date

-   Filter by: Status, Severity, Category, Assignee, Device, Department

-   Sort by: Severity, First Seen, Due Date

-   Inline actions: Change Status, Assign, Set Due Date, Add Note

  -----------------------------------------------------------------------
  **FINDING DETAIL VIEW**

  -----------------------------------------------------------------------

-   Full check details and failure message

-   Auto-generated remediation guide (step-by-step instructions)

-   Status history (audit trail of all status changes with timestamps
    and actor)

-   Notes thread (IT team can leave notes for each other)

-   Link to affected device detail page

-   Scan history showing when issue first appeared

**4.8 Page 7 --- Alerts & Notifications**

Configure what triggers an alert and how IT is notified.

  -----------------------------------------------------------------------
  **ALERT RULE CONFIGURATION**

  -----------------------------------------------------------------------

-   Trigger: \[Check Key\] \[Condition: is failing / score drops below /
    count exceeds\] \[Value\]

-   Severity: Critical / High / Medium / Low

-   Notify via: Slack / Email / Both

-   Frequency: Immediately / Daily digest / Weekly digest

-   Notify who: All IT admins / specific email addresses

  -----------------------------------------------------------------------
  **DEFAULT ALERT RULES (pre-configured)**

  -----------------------------------------------------------------------

-   Any machine score drops below 30 → Slack + Email immediately

-   Disk encryption disabled on any machine → Email IT immediately

-   No antivirus on any machine → Slack + Email immediately

-   Machine not seen for 5+ days → Email IT daily digest

-   More than 50% of machines have pending OS updates → Weekly Slack
    summary

  -----------------------------------------------------------------------
  **NOTIFICATION HISTORY**

  -----------------------------------------------------------------------

-   Log of every alert fired: timestamp, rule triggered, affected
    device, channel, message sent, current finding status

**4.9 Page 8 --- Reports**

Generate and schedule compliance and audit reports.

  -----------------------------------------------------------------------
  **REPORT TYPES**

  -----------------------------------------------------------------------

-   Full Org Security Report --- all devices, all checks, all findings

-   Executive Summary --- org score, risk distribution, top risks,
    trend. No per-machine technical detail

-   Single Device Report --- full detail for one employee\'s machine

-   Compliance Snapshot --- pass/fail per policy requirement across all
    devices

-   Custom --- select which sections to include

  -----------------------------------------------------------------------
  **REPORT OPTIONS**

  -----------------------------------------------------------------------

-   Date range selector

-   Output format: PDF / CSV / JSON

-   \[Generate & Download\] button

  -----------------------------------------------------------------------
  **SCHEDULED REPORTS**

  -----------------------------------------------------------------------

-   Auto-email a report to specified recipients on a recurring schedule
    (weekly / monthly / quarterly)

  -----------------------------------------------------------------------
  **REPORT HISTORY**

  -----------------------------------------------------------------------

-   List of all generated reports with download links and expiry

**4.10 Page 9 --- Settings**

  -----------------------------------------------------------------------
  **ORGANISATION**

  -----------------------------------------------------------------------

-   Company name, logo upload

-   Department list (used for grouping devices and applying policy
    profiles)

-   IT team member management: add/remove admins, set roles (Admin /
    Viewer)

  -----------------------------------------------------------------------
  **AGENT & SCANNING**

  -----------------------------------------------------------------------

-   Default scan schedule: Daily at \[time\] / Every N hours / On login

-   Per-department schedule override

-   Enable or disable individual checks

-   Current agent version + release notes + \[Push Update to All
    Devices\]

  -----------------------------------------------------------------------
  **SECURITY POLICIES (thresholds)**

  -----------------------------------------------------------------------

-   Screen lock max timeout: \[\_\_\] minutes

-   OS update max age before flagged: \[\_\_\] days

-   Password max age: \[\_\_\] days

-   Days before device flagged offline: \[\_\_\] days

-   Allowed DNS servers (comma-separated IPs)

-   Software blacklist (comma-separated package names)

These values are pushed to all agents via config sync. Changes take
effect on next agent check-in.

  -----------------------------------------------------------------------
  **INTEGRATIONS**

  -----------------------------------------------------------------------

-   Slack webhook URL (test button included)

-   Email SMTP settings (host, port, username, password, from address)

-   External SIEM webhook (optional, sends scan results as JSON)

-   API key management (for external access to dashboard data)

**5. Employee Self-Service Portal**

**5.1 Overview**

Employees get a separate, restricted portal --- same domain, different
login. They see only their own machine. No access to org-wide data, no
visibility into colleagues\' scores. Tone is supportive and
non-punitive: \'here is how to improve your security\' not \'you failed
6 checks\'.

**5.2 Access**

-   URL: https://security.yourcompany.com/me

-   Login: employee email + password (or SSO if configured)

-   Each employee only sees their own device\'s data

**5.3 Employee Portal Pages**

  -----------------------------------------------------------------------
  **MY SECURITY SCORE**

  -----------------------------------------------------------------------

-   Large, clear score display (e.g. 74/100) with tier badge and
    plain-English label (\'Your device is Low Risk\')

-   Last scan time and next scheduled scan time

-   Simple traffic-light breakdown by category (not raw technical
    detail): OS & System ✅ / Authentication ⚠️ / Antivirus ❌

-   Score trend: \'Your score improved by 8 points since last scan\'

  -----------------------------------------------------------------------
  **MY ACTION LIST (Remediation)**

  -----------------------------------------------------------------------

-   Prioritised, plain-English list of issues to fix

-   Each item shows: severity badge, issue title, simple explanation,
    step-by-step fix instructions

-   Example: \'🔴 Enable disk encryption --- Your files are not
    protected if your laptop is lost. Here is how to turn on BitLocker:
    \[step-by-step guide\]\'

-   Items marked ACCEPTED RISK or FALSE POSITIVE by IT do not appear

-   Completed items (resolved on last scan) shown in a separate
    \'Fixed\' section

  -----------------------------------------------------------------------
  **REQUEST IT HELP**

  -----------------------------------------------------------------------

-   Button to contact IT directly for any issue the employee cannot
    resolve themselves

-   Pre-fills a message with the device hostname and failing check for
    context

  -----------------------------------------------------------------------
  **MY SCAN HISTORY**

  -----------------------------------------------------------------------

-   Simple timeline of past scores: \'March 30 --- 74 points / March 23
    --- 66 points\'

-   Encourages employees to see improvement over time

**6. Project Structure**

+-----------------------------------------------------------------------+
| **security-audit/**                                                   |
|                                                                       |
| ├── agent/ \# Python agent (runs on employee machines)                |
|                                                                       |
| │ ├── main.py \# Entry point, scheduler                               |
|                                                                       |
| │ ├── config.py \# Server URL, device ID, scan schedule               |
|                                                                       |
| │ ├── enrollment.py \# First-run registration with backend            |
|                                                                       |
| │ ├── command_poller.py \# Polls server for IT commands every 5 min   |
|                                                                       |
| │ ├── scorer.py \# Turns check results into weighted risk score       |
|                                                                       |
| │ ├── reporter.py \# Packages and sends results to backend            |
|                                                                       |
| │ └── scanner/                                                        |
|                                                                       |
| │ ├── base.py \# Abstract base check class                            |
|                                                                       |
| │ ├── windows/ \# os_checks, network_checks, auth_checks,             |
| software_checks, data_checks                                          |
|                                                                       |
| │ ├── macos/ \# equivalent macOS checks                               |
|                                                                       |
| │ └── linux/ \# equivalent Linux checks                               |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── backend/ \# FastAPI backend (runs on VPS)                         |
|                                                                       |
| │ ├── main.py                                                         |
|                                                                       |
| │ ├── routers/ \# agent.py, dashboard.py, employee.py, reports.py     |
|                                                                       |
| │ ├── models/ \# SQLAlchemy: device, scan, check, finding, command,   |
| alert                                                                 |
|                                                                       |
| │ ├── schemas/ \# Pydantic request/response models                    |
|                                                                       |
| │ ├── services/ \# scoring.py, alerts.py, reports.py, commands.py     |
|                                                                       |
| │ └── database.py \# SQLAlchemy engine + session                      |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── dashboard/ \# React frontend (IT + Employee portals)              |
|                                                                       |
| │ ├── src/pages/ \# Overview, Devices, DeviceDetail, Checks, Trends,  |
| Findings, Alerts, Reports, Settings                                   |
|                                                                       |
| │ └── src/employee/ \# Employee portal pages                          |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── installer/                                                        |
|                                                                       |
| │ ├── windows/setup.iss \# Inno Setup script                          |
|                                                                       |
| │ ├── macos/build_pkg.sh \# macOS pkg builder                         |
|                                                                       |
| │ └── linux/install.sh \# Shell installer                             |
|                                                                       |
| │                                                                     |
|                                                                       |
| └── .github/workflows/build.yml \# Auto-builds all 3 installers on    |
| release tag                                                           |
+-----------------------------------------------------------------------+

**7. Build Phases**

  ---------------- ------------------ ----------------------------------------
  **Phase**        **Timeline**       **Deliverables**

  **Phase 1 ---    Weeks 1--3         Windows agent with 10--15 core checks.
  MVP**                               FastAPI backend (enroll + scan results
                                      endpoints). PostgreSQL schema. Basic IT
                                      dashboard (device list + scores).
                                      End-to-end test on one real machine.

  **Phase 2 ---    Weeks 4--5         Command queue (remote scan trigger).
  MDM Layer**                         Agent auto-update mechanism. Machine
                                      enrollment/unenrollment from dashboard.
                                      Config push (policy management). Inno
                                      Setup Windows installer.

  **Phase 3 ---    Weeks 6--8         Full risk scoring model. Findings &
  Intelligence**                      remediation workflow. Alerts engine
                                      (Slack + Email). Historical trends page.
                                      Department grouping. Compliance report
                                      export (PDF/CSV).

  **Phase 4 ---    Week 9             Employee self-service portal.
  Employee                            Plain-English remediation guides.
  Portal**                            \'Request IT Help\' flow. Score history
                                      view.

  **Phase 5 ---    Weeks 10--12       macOS agent + .pkg installer. Linux
  Expansion**                         agent + .sh installer. Per-department
                                      policy profiles. Optional: SIEM webhook
                                      integration.
  ---------------- ------------------ ----------------------------------------

**8. Security & Privacy Considerations**

-   All agent-to-server communication over HTTPS (TLS 1.2+). Certificate
    via Let\'s Encrypt.

-   Agent authenticates with a per-device token issued at enrollment.
    Tokens are revocable from the dashboard.

-   Scan payloads encrypted before transmission (AES-256). Server
    decrypts with a secret key stored in environment variables, never in
    code.

-   No employee personal files are read --- only file names and patterns
    are checked, never file contents.

-   IT admins authenticate with email + password + JWT. Passwords hashed
    with bcrypt.

-   Employee portal is strictly read-only and scoped to the
    authenticated employee\'s own device only.

-   All API endpoints require authentication. No public endpoints except
    the health check.

-   Database credentials stored in environment variables via .env file.
    Never committed to version control.

-   Device tokens are rotated on agent update. Deactivated device tokens
    are immediately rejected by the backend.

**9. VPS Deployment Checklist**

13. Provision VPS (HostAfrica, 2GB RAM / 2 vCPU / 20GB SSD minimum)

14. Install: Python 3.11+, PostgreSQL 15, Nginx, Supervisor, Node.js
    (for React build)

15. Clone repository, create .env with all secrets (DB credentials, JWT
    secret, Slack webhook, SMTP)

16. Run database migrations (Alembic). Create initial IT admin account.

17. Build React dashboard (npm run build). Configure Nginx to serve
    static files.

18. Configure Nginx reverse proxy to uvicorn on port 8000.

19. Issue SSL certificate via certbot (Let\'s Encrypt). Set up
    auto-renewal.

20. Configure Supervisor to keep FastAPI/uvicorn alive on crash and
    reboot.

21. Test full flow: enroll test machine → scan → verify results appear
    on dashboard.

22. Build Windows installer (Inno Setup). Test on a real Windows
    machine.

23. Share installer download link with all 26 employees via Slack.
