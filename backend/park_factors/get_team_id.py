import requests

def get_team_ids(year):
    """Queries the MLB Stats API for current team IDs and names."""
    params = {'sportId': '1', 'season': year} # Modify season as needed
    r = requests.get(url="https://statsapi.mlb.com/api/v1/teams", params=params)
    data = r.json()
    team_ids = {}
    for team in data['teams']:
        team_ids[team['name']] = team['id']
    return team_ids

team_list = get_team_ids(2025)
print(team_list)