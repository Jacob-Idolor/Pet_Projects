import requests
from datetime import datetime, timezone

from app.core.config import settings

def convert_epoch(epoch_ms: int) -> str:
    return datetime.fromtimestamp(epoch_ms / 1000, timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def dynalink(problem_id):
    return f"{settings.dynatrace_api_url}/ui/problems/{problem_id}"

    

def get_problems():
    try:
        headers = {
            "Authorization": f"Api-Token {settings.dynatrace_api_token}"
        }
        params = {
            "pageSize": 100
        }
        response = requests.get(f"{settings.dynatrace_api_url}/api/v2/problems", headers=headers, params=params)
        response.raise_for_status()  # raises HTTPError for 4xx/5xx

        data = response.json()
        problems = data.get("problems", [])
        return problems

    except requests.exceptions.HTTPError as e:
        print("HTTP error occurred:", e)
        raise
    except requests.exceptions.RequestException as e:
        print("Request exception:", e)
        raise
    except Exception as e:
        print("Unknown error in get_problems:", e)
        raise


def get_audit_logs(start_ts: int, end_ts: int):
    """Fetch audit logs from Dynatrace between the given timestamps.

    Parameters are epoch milliseconds.
    Returns a list of logs on success.
    """
    try:
        headers = {
            "Authorization": f"Api-Token {settings.dynatrace_api_token}"
        }
        params = {
            "from": start_ts,
            "to": end_ts,
            "pageSize": 1000,
        }
        response = requests.get(
            f"{settings.dynatrace_api_url}/api/v2/auditlogs",
            headers=headers,
            params=params,
        )
        response.raise_for_status()

        data = response.json()
        # Dynatrace API wraps logs in a key such as 'auditLogs'
        logs = data.get("auditLogs") or data.get("logs") or data
        return logs
    except requests.exceptions.HTTPError as e:
        print("HTTP error occurred:", e)
        raise
    except requests.exceptions.RequestException as e:
        print("Request exception:", e)
        raise
    except Exception as e:
        print("Unknown error in get_audit_logs:", e)
        raise


if __name__ == "__main__":
    # Quick smoke-test for get_problems()
    print("Dynatrace API URL:", settings.dynatrace_api_url)
    try:
        probs = get_problems()
        print(f"✅  Fetched {len(probs)} problems")
        for p in probs[:3]:
            print(p)
    except Exception as e:
        print("❌  Error calling get_problems():", e)
