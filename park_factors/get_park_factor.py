import requests
import json
import re
import pandas as pd


for year in range(2020,2026):
    

    url = f"https://baseballsavant.mlb.com/leaderboard/statcast-park-factors?type=year&year={year}&batSide=&stat=index_wOBA&condition=All&rolling=3&parks=mlb"

    # 1. Fetch the page
    response = requests.get(url)

    # 2. Use Regex to find the 'var data = [...];' block
    # This looks for the start of the data array and captures everything until the end of the line.
    data_pattern = re.compile(r"var data = (\[.*?\]);", re.DOTALL)
    match = data_pattern.search(response.text)

    if match:
        # 3. Parse the string into a Python list/dictionary
        json_data = json.loads(match.group(1))
        
        # 4. Load into a Pandas DataFrame for easy cleaning/viewing
        df = pd.DataFrame(json_data)
        
        # Example: Selecting key columns
        df_clean = df[['venue_name', 'main_team_id', 'name_display_club', 'index_runs', 'index_hr', 'index_hits', 'index_bb', 'index_so', 'index_bacon', 'index_hardhit']]
        df_clean["year"] = year
        print(df_clean.head())
        
        # Optional: Save to CSV
        df_clean.to_csv(f'park_factors_{year}.csv', index=False)
    else:
        print("Could not find the data variable in the script.")