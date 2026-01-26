import pandas as pd


#we need to prep the data so that the model can notice patterns to train off

#team to long name
team_name_id = {
    #AL EAST
    "NYY": 147,
    "TOR": 141,
    "BAL": 110,
    "TBR": 139,
    "BOS": 111,

    #AL CENTRAL
    "DET": 116,
    "CHW": 145,
    "KCR": 118,
    "MIN": 142, 
    "CLE": 114,


    #AL WEST
    "HOU": 117,
    "SEA": 136,
    "LAA": 108,
    "OAK": 133,
    "TEX": 140,

    #NL EAST
    "NYM": 121,
    "MIA": 146,
    "WSN": 120,
    "PHI": 143,
    "ATL": 144,

    #NL CENTRAL
    "CIN": 113,
    "PIT": 134,
    "CHC": 112,
    "MIL": 158,
    "STL": 138,

    #NL WEST
    "LAD": 119,
    "SDP": 135,
    "COL": 115,
    "ARI": 109,
    "SFG": 137,

}

# def get_park_factor(team):
#     team_id = team_name_id(team)

#     #get list of park factors for team home stadium

def get_input_metrics(stat):
    if stat == "ERA":
        return [
            "Age",
            "K%",
            "K-BB%",
            "SwStr%",

            "HardHit%",
            "Barrel%",
            "EV",
            "GB%"
        ]
    else:
        return None


def prep_data(dataset, inputs):

    
    #current year (input metrics) -> following year (output metric)
    
    #step 1: sort by player name and season so we can locate the next year quickly
    dataset = dataset.sort_values(['Name', "Season"])
    #print(dataset)

    machine_learning_dataset = []

    for player, player_data in dataset.groupby("Name"):
        player_data = player_data = player_data.sort_values("Season")


        #Conservative approach: we must only get players who have consecutive years played to account for facotrs like injury recover
        
        #get pairs consecutive seasons for each player (2021->2022, 2022->2025, etc)
        if (len(player_data) >= 2):
            for i in range(len(player_data)-1):
                curr_season = player_data.iloc[i]
                following_season = player_data.iloc[i+1]

                #only include if seasons were back-to-back
                if following_season["Season"] == curr_season["Season"] + 1: 


                    # Handle MULTI-team seasons
                    if curr_season["Team"] == "MULTI":
                       
                       pass


                    row = {
                        "Name": player,
                        "Current_Season": curr_season["Season"],
                        "Next_Season": following_season["Season"],
                        "Current_Team": curr_season["Team"], 
                        "Next_Team": following_season["Team"],
                    }

                    #add input metrics to row
                    for metric in inputs:
                        row[f"Current_{metric}"] = curr_season[metric]
                        row[f"Target_{metric}"] = following_season[metric]

                    machine_learning_dataset.append(row)
    new_df = pd.DataFrame(machine_learning_dataset)
    return new_df

print("PREP P RUNNING")



# data = pd.read_csv("../data_collection/batting.csv")

# target_stat = "AVG"

# #get input metrics
# input_data = get_input_metrics(target_stat)

# if input_data:
#     ml_dataset = prep_data_hr(data, input_data)
#     print(f"ML Dataset shape: {ml_dataset.shape}")
#     print(f"Number of player-season pairs: {len(ml_dataset)}")

#     # Save
#     ml_dataset.to_csv('prepared_data.csv', index=False)
#     print("\n✓ ML data saved to prepared_data.csv")

#     # Preview
#     print("\nSample ML data:")
#     print(ml_dataset.head())

def run(stat):
    data = pd.read_csv("data_collection/pitching.csv")

    target_stat = stat

    #get input metrics
    input_data = get_input_metrics(target_stat)

    if input_data:
        ml_dataset = prep_data(data, input_data)
        print(f"ML Dataset shape: {ml_dataset.shape}")
        print(f"Number of player-season pairs: {len(ml_dataset)}")

        # Save
        ml_dataset.to_csv('data_prep/prepared_p_data.csv', index=False)
        print("\n✓ ML data saved to prepared_data.csv")

        # Preview
        print("\nSample ML data:")
        print(ml_dataset.head())

    return ml_dataset
        
