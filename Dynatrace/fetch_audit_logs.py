import csv
from datetime import datetime, timedelta, timezone

from app.core.dt_client import get_audit_logs


def main():
    now = datetime.now(timezone.utc)
    start = int((now - timedelta(days=1)).timestamp() * 1000)
    end = int(now.timestamp() * 1000)

    logs = get_audit_logs(start, end)
    if not logs:
        print("No audit logs found")
        return

    keys = list(logs[0].keys())

    for log in logs:
        print(" | ".join(f"{k}={log.get(k)}" for k in keys))

    with open("audit_logs.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(logs)
    print("Saved audit_logs.csv")


if __name__ == "__main__":
    main()
