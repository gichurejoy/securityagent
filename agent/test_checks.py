import sys
import json
from checks.windows import run_all_checks

if __name__ == "__main__":
    print("Executing all 43 agent checks locally...")
    results = run_all_checks()
    print(f"Total checks executed: {len(results)}")
    
    passed = len([r for r in results if r.get("status") == "pass"])
    warned = len([r for r in results if r.get("status") == "warn"])
    failed = len([r for r in results if r.get("status") == "fail"])
    
    print(f"\nSummary: {passed} PASS / {warned} WARN / {failed} FAIL")
    
    print("\nDetailed Failures & Warnings:")
    for r in results:
        if r.get("status") != "pass":
            print(f"- [{r.get('status').upper()}] {r.get('check_key')}: {r.get('detail')}")
