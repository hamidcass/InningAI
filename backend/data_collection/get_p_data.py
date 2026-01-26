import pandas as pd




from pybaseball import pitching_stats

def fetch_data(min_year, max_year, min_pa=200):
    data = []

    for year in range(min_year, max_year+1):
        print(f"Fetching {year} data...")
        try:
            year_data = pitching_stats(year)
            year_data['Season'] = year #add year
            data.append(year_data)

            

            print(f"  ✓ Found {len(year_data)} players")
        except Exception as e:
            print(f"  ✗ Error fetching {year}: {e}")

        ##make one big dataframe from all rows
    all_years_data = pd.concat(data, ignore_index=True)
    all_years_data['Team'] = all_years_data['Team'].replace("- - -", "MULTI")
    return all_years_data

print("Fetching Data from the 2020-2024 season...")
pitching_data = fetch_data(2020, 2025, 200)

print(f"\nTotal records: {len(pitching_data)}")
print(f"Total players: {pitching_data['Name'].nunique()}")

#we dont want rookies or 1 szn players
player_count = pitching_data['Name'].value_counts()
multi_year_players = player_count[player_count > 1]
print(f"Players with 2+ seasons: {len(multi_year_players)}")

only_multi_year_players = pitching_data[pitching_data['Name'].isin(multi_year_players.index)]
print(f"Total records after filtering: {len(only_multi_year_players)}")
print(f"Total unique players after filtering: {only_multi_year_players['Name'].nunique()}")

only_multi_year_players.to_csv("pitching.csv", index=False)


# def run():

#     print("Enter Minimum Player Plate Appearances (Default: 200)")
#     choice = input(">>>Enter Min PA:    ")
#     #TODO: error check

#     print("Fetching Data from the 2020-2024 season...")
#     pitching_data = fetch_data(2020, 2025, int(choice))
#     print(f"\nTotal records: {len(pitching_data)}")
#     print(f"Total players: {pitching_data['Name'].nunique()}")

#     #we dont want rookies or 1 szn players
#     player_count = pitching_data['Name'].value_counts()
#     multi_year_players = player_count[player_count > 1]
#     print(f"Players with 2+ seasons: {len(multi_year_players)}")

#     only_multi_year_players = pitching_data[pitching_data['Name'].isin(multi_year_players.index)]
#     print(f"Total records after filtering: {len(only_multi_year_players)}")
#     print(f"Total unique players after filtering: {only_multi_year_players['Name'].nunique()}")

#     only_multi_year_players.to_csv("data_collection/pitching.csv", index=False)

#     #TODO: change to not be hardcoded lol
#     file_path = "../data_collection_pitching.csv"
#     return file_path

        