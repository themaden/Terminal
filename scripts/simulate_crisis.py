import argparse
import requests

def simulate_crisis(flight_number, crisis_type, reason, severity):
    url = "http://localhost:8000/api/v1/crisis/trigger"
    params = {
        "flight_number": flight_number,
        "crisis_type": crisis_type,
        "reason": reason,
        "severity": severity
    }
    
    print(f"[*] Ingesting crisis event for flight {flight_number}...")
    print(f"    Type: {crisis_type} | Severity: {severity} | Reason: {reason}")
    print("    Sending request to Decision Engine API...")

    try:
        response = requests.post(url, params=params, timeout=30)
        if response.status_code == 201:
            data = response.json()
            print("\n[SUCCESS] CRISIS ACTION TRIGGERED SUCCESSFULLY!")
            print(f"    Crisis ID: {data['id']}")
            print(f"    Affected Passenger Count: {data['affected_passenger_count']}")
            print(f"    Severity level: {data['severity']}")
            print(f"    Status: {data['status']}")
            print("\n[INFO] Decision Engine MILP Optimizer & Multi-Agent completed.")
            print("    Human-in-the-Loop action pending. View the dashboard at http://localhost:3000 to approve.")
        else:
            print(f"[ERROR] Error from server ({response.status_code}): {response.text}")
    except requests.exceptions.ConnectionError:
        print("[ERROR] Could not connect to Decision Engine. Is it running on http://localhost:8000?")
        print("    Use backend locally by starting uvicorn.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Aero-Agent Crisis Simulation Tool")
    parser.add_argument("--flight", type=str, default="TK1981", help="Flight number to trigger (e.g. TK1981)")
    parser.add_argument("--type", type=str, default="CANCELLATION", choices=["CANCELLATION", "DELAY", "DIVERSION"])
    parser.add_argument("--reason", type=str, default="Heathrow Airport extreme winter snow storm and high runway ice layer.")
    parser.add_argument("--severity", type=str, default="CRITICAL", choices=["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    
    args = parser.parse_args()
    simulate_crisis(args.flight, args.type, args.reason, args.severity)
