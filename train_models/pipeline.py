import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.compose import ColumnTransformer 
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from scipy.stats import zscore
from xgboost import XGBRegressor
import shap



#these will be the ml models that our pipeline interates through
#we can add more to the list or tune our hyperparameters here
models = {
    "Linear Regression": LinearRegression(),
    "Ridge Regression": Ridge(alpha=10.0),
    "Random Forest": RandomForestRegressor(
        n_estimators=300,
        max_depth=10,
        random_state=42
    ),
    "XGBoost": XGBRegressor(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42
    )
}

#holds park factors for last year in range (year that we are predicting next year from)
park_factors_2024 = {
    'ARI': 101, 'ATL': 100, 'BAL': 99, 'BOS': 107, 'CHC': 97,
    'CHW': 99, 'CIN': 105, 'CLE': 97, 'COL': 112, 'DET': 98,
    'HOU': 100, 'KC': 104, 'KCR': 104, 'LAA': 100, 'LAD': 100, 'MIA': 101,
    'MIL': 97, 'MIN': 102, 'NYM': 97, 'NYY': 100, 'OAK': 97, 'ATH': 97,
    'PHI': 101, 'PIT': 101, 'SD': 96, 'SDP': 96, 'SEA': 91, 'SF': 97, 'SFG':97,
    'STL': 100, 'TB': 96, 'TBR': 96, 'TEX': 101, 'TOR': 100, 'WSH': 101, 'WSN': 101,
    'MULTI': 100  # For players on multiple teams
}


#this will hold the the predictions and mean absolute error 
#TODO: add other metrics to this dict
results = {}





#returns the appropriate input features based on what the target stat is 
def get_stats(stat):
    if stat == "HR":
        return [
            'Age',           #can potentially show a common decline in production after a certain age
            'PA',            # Plate appearances (more PAs = more HR opportunities)
            # 'HR',            # Last year's HR total
            'ISO',           # Isolated power (SLG - AVG)
            'FB%',           # Flyball rate (more potential for hr if player gets ball in air more often)
            'HR/FB',         # distinguish a hr from a pop fly
            'Barrel%',       # Statcast: % of barrels (ideal contact)
            'HardHit%',      # Statcast: hard-hit ball rate
            'EV',            # Exit velocity (harder hit = more HR)
            'Pull%',         # Pull hitters tend to hit more HR
        ]
    elif stat == "AVG":
        return [
            'Age',           
            'PA',            
            # 'AVG',           # Last year's AVG 
            'K%',            # Strikeout rate (less strikeouts = probably better hitter = higher avg)
            'Contact%',      # if more contact, less whiff and probably more base hits
            'BABIP',         # luck factor
            'LD%',           # Line drive rate (more line drives = probably more hits)
            'Hard%',        
            'Soft%',         # Soft contact = easier to get out
            # 'xBA',           # Expected batting average (Statcast)
        ]
    elif stat == "OPS":
        return [
                'Age',              
                'PA',            
                # 'OPS',           # Last year's OPS
                'wRC+',          # Weighted runs created (top tier offensive stat in general)
                'BB%',           # Walk rate = higher obp = higher ops 
                'K%',            # Strikeout rate = the more the worse
                'ISO',           
                'BABIP',         
                'HardHit%',      
                'Barrel%',       
                'xwOBA',         # Expected wOBA (similar to OPS)
        ]
    elif stat == "wRC+":
        return [
            'Age',           
            'PA',            
            # 'wRC+',          # Last year's wRC+
            'wOBA',          # Foundation of wRC+
            'BB%',           # Walks = good
            'K%',            # Strikeouts = bad
            'ISO',           
            'AVG',           
            'BABIP',         # Luck factor
            'Barrel%',       
            'HardHit%',     
        ]
    #TODO: add more target stats
    else:
        return None

#looks in df and extracts the feature column data and the target stat data
#returns: x (2d list: first season features), y (1d list: nect season output stat)
def get_features(training_data, stats, target_stat):

    x_cols = (
        [f"Current_{stat}" for stat in stats] +
        ["Current_Park_Factor", "Next_Park_Factor"]
    )
    x = training_data[x_cols]


    y = training_data[f"Target_{target_stat}"]
    return x, y

#take any rows from 2024->2025 because we dont want 2025 stats in our training data (it will be our test data instead)
def get_target_data(training_data):

    target_data = training_data[training_data["Next_Season"] == 2025].copy()
    training_data = training_data[training_data["Next_Season"] != 2025].copy() # !!!not having this line is cheating, it would give 2025 stats to training data

    # print(f"Test data: {len(target_data)} rows")
    # print(f"Training data: {len(training_data)} rows (2025 removed)")
    return target_data, training_data

#TODO: update to take in year range
def run(df, target_stat, chosen_model, year_range):

    df['Current_Park_Factor'] = df['Current_Team'].map(park_factors_2024)
    df['Next_Park_Factor'] = df['Next_Team'].map(park_factors_2024)

    print("Teams missing from park_factors_2024:")
    print("Current teams:", df[df['Current_Park_Factor'].isna()]['Current_Team'].unique())
    print("Next teams:", df[df['Next_Park_Factor'].isna()]['Next_Team'].unique())

    #get park factor data
    #TODO: get park factor dynamically using scraper file instead of hardcoding 2024


    #extract the 2025 season to be used as a comparison
    target_data, training_data = get_target_data(df)

    #get appropriate features
    feature_stats = get_stats(target_stat)

    #separate into numerical and non numerical values
    numerical_features = [f"Current_{stat}" for stat in feature_stats]
    categorial_features = ["Current_Team", "Next_Team"]

    x_train, y_train = get_features(training_data, feature_stats, target_stat)
    x_test, y_test = get_features(target_data, feature_stats, target_stat)

    #pipeline process:

    #handle non-numerical data (Team)
    preprocessor = ColumnTransformer(
        transformers=[
            
            ("num", StandardScaler(), numerical_features), #linear regression and ridge need values to be standardized to work properly
            #('cat', OneHotEncoder(handle_unknown='ignore'), categorial_features)
        ]
    )

    #use model that user selected
    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", models.get(chosen_model))
        ]
    )

    df.to_csv('df.csv', index=False)
    print("Checking for NaN values in training data:")
    print(x_train.isnull().sum())
    print("\nRows with NaN:")
    print(x_train[x_train.isnull().any(axis=1)])

    #train model using training dataset
    pipeline.fit(x_train, y_train)

    # Get feature names after fitting
    # feature_names = (
    #     numerical_features + 
    #     list(pipeline.named_steps['preprocessor']
    #         .named_transformers_['cat']
    #         .get_feature_names_out(categorial_features))
    # )
    feature_names = numerical_features

    #rank which features were most important to each model (Only for RF and XB)
    # Get SHAP data for tree based models
    if chosen_model in ["Random Forest", "XGBoost"]:

        model = pipeline.named_steps['model']
        preprocessor = pipeline.named_steps['preprocessor']

        x_transformed = preprocessor.transform(x_train)

        #get shap values
        explainer = shap.Explainer(model)
        shap_values = explainer.shap_values(x_transformed)

        #convert to importance
        shap_importance = np.abs(shap_values).mean(axis=0)

        #get directionality
        shap_direction = shap_values.mean(axis=0)

        importance_df = pd.DataFrame({
            'Feature': feature_names,
            'Importance': shap_importance,
            'Direction': shap_direction
        }).sort_values('Importance', ascending=False) 

        importance_df["Effect"] = importance_df["Direction"].apply(
            lambda x: "Increases Prediction" if x > 0 else "Decreases Prediction"
        )

        print(f"\n{chosen_model} - Top 10 Feature Importances:")
        print(importance_df.head(10))

    #get coeffs for linear based models   
    elif chosen_model in ["Linear Regression", "Ridge Regression"]:
        coefficients = pipeline.named_steps['model'].coef_
        
        # Create coefficient dataframe
        importance_df = pd.DataFrame({
            'Feature': feature_names,
            'Coefficient': coefficients
        }).sort_values('Coefficient', ascending=False, key=abs)  # Sort by absolute value
        
        print(f"\n{chosen_model} - Top 10 Feature Coefficients:")
        print(importance_df)

    #final step of pipeline - predict target stat 
    predictions = pipeline.predict(x_test)
    y_test_values = y_test.values.flatten()

    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)

    #get_number of unique players
    num_players = len(target_data)

    results_df = pd.DataFrame({
        'Player': target_data['Name'].values,
        f'{year_range[1]} Team': target_data['Current_Team'].values,
        f'{year_range[1]+1} Team': target_data['Next_Team'].values,
        'Actual': y_test_values,
        'Predicted': predictions,
        'Error': predictions - y_test_values,
        'Abs_Error': np.abs(predictions - y_test_values),
        'Age': target_data['Current_Age'].values if 'Current_Age' in target_data.columns else None,
        'PA': target_data['Current_PA'].values if 'Current_PA' in target_data.columns else None,
    })
    # Add percentage error
    results_df['Pct_Error'] = (results_df['Error'] / results_df['Actual'] * 100).round(2)

    results[chosen_model] = {
        "predictions": predictions,
        "importance": importance_df if chosen_model in ["Random Forest", "XGBoost", "Linear Regression", "Ridge Regression"] else None,
        "mae": mae,
        "R²": r2,
        "num_players": num_players,
    }
    print(f"{chosen_model} MAE: {mae:.4f}")
    print(f"{chosen_model} R²: {r2:.4f}")


    return mae, r2, num_players, results_df, importance_df



    
