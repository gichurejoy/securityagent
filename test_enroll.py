import requests
payload = {
    "device_id": "test-host-v2",
    "hostname": "test-host",
    "employee_name": "Antigravity",
    "employee_email": "anti@gravity.com",
    "os_platform": "Windows",
    "os_version": "10.0.19041",
    "device_token": "TEST_TOKEN"
}
try:
    r = requests.post("http://127.0.0.1:8000/api/v1/enroll", json=payload, timeout=10)
    print(f"Status: {r.status_code}")
    print(f"Body: {r.json()}")
except Exception as e:
    print(f"Error: {e}")
