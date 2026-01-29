import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_analyses():
    user_id = "1"
    print(f"Fetching analyses for user {user_id}...")
    
    list_url = f"{BASE_URL}/analyses?user_id={user_id}"
    
    try:
        with urllib.request.urlopen(list_url) as response:
            if response.getcode() != 200:
                print(f"Failed to fetch analyses: {response.getcode()}")
                return

            data = response.read()
            analyses = json.loads(data)
            print(f"Found {len(analyses)} analyses.")
            
            if not analyses:
                print("No analyses found to test detail view.")
                return

            first_analysis = analyses[0]
            analysis_id = first_analysis['id']
            print(f"Testing detail view for Analysis ID: {analysis_id}")

            detail_url = f"{BASE_URL}/analyses/{analysis_id}?user_id={user_id}"
            
            try:
                with urllib.request.urlopen(detail_url) as detail_response:
                    if detail_response.getcode() == 200:
                        print("Success! Analysis detail fetched.")
                        # detail_data = json.loads(detail_response.read())
                        # print(json.dumps(detail_data, indent=2))
                    else:
                        print(f"Failed to fetch analysis detail: {detail_response.getcode()}")
            except urllib.error.HTTPError as e:
                print(f"HTTP Error fetching detail: {e.code} {e.reason}")
                print(e.read().decode())

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_analyses()
