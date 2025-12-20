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

#these will be the ml models that our pipeline interates through
#we can add more to the list or tune our hyperparameters here
models = {
    "Linear Regression": LinearRegression(),
    "Ridge Regression": Ridge(alpha=0.1),
    "Random Forest": RandomForestRegressor(
        n_estimators=500,
        max_depth=20,
        random_state=42
    ),
    "XGBoost": XGBRegressor(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=8,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42
    )
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
            'HR',            # Last year's HR total
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
            'AVG',           # Last year's AVG 
            'K%',            # Strikeout rate (less strikeouts = probably better hitter = higher avg)
            'Contact%',      # if more contact, less whiff and probably more base hits
            'BABIP',         # luck factor
            'LD%',           # Line drive rate (more line drives = probably more hits)
            'Hard%',        
            'Soft%',         # Soft contact = easier to get out
            'xBA',           # Expected batting average (Statcast)
        ]
    elif stat == "OPS":
        return [
                'Age',              
                'PA',            
                'OPS',           # Last year's OPS
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
            'wRC+',          # Last year's wRC+
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
        ["Current_Team", "Next_Team"]
    )
    x = training_data[x_cols]


    y = training_data[f"Target_{target_stat}"]
    return x, y

#take any rows from 2024->2025 because we dont want 2025 stats in our training data (it will be our test data instead)
def get_target_data(training_data):

    target_data = training_data[training_data["Next_Season"] == 2025].copy()
    training_data = training_data[training_data["Next_Season"] != 2025].copy() # !!!not having this line is cheating, gives 2025 stats to training data

    # print(f"Test data: {len(target_data)} rows")
    # print(f"Training data: {len(training_data)} rows (2025 removed)")
    return target_data, training_data

training_data = pd.read_csv("../data_prep/prepared_data.csv") 

#extract 2025 season to be used as comparison
target_data, training_data = get_target_data(training_data)
print(f"Test data: {len(target_data)} rows")
print(f"Training data: {len(training_data)} rows (2025 removed)")


target_stat = "OPS"
#separate into input and output
stats = get_stats(target_stat)
print(stats)

numeric_features = [f"Current_{stat}" for stat in stats]
categorial_features = ["Current_Team", "Next_Team"]

x_train, y_train = get_features(training_data, stats, target_stat)
x_test, y_test = get_features(target_data, stats, target_stat)

print("\nTest data Next_Team sample:")
print(x_test[['Current_Team', 'Next_Team']].head(10))




#handle non-number values (Team)
preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), numeric_features),
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorial_features)
    ]
)



#iterate through models
for name, model in models.items():
    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("model", model)
    ])

    pipeline.fit(x_train, y_train)
    
    # Get feature names after fitting
    feature_names = (
        numeric_features + 
        list(pipeline.named_steps['preprocessor']
            .named_transformers_['cat']
            .get_feature_names_out(categorial_features))
    )

    # Get feature importances for tree-based models
    if name == "Random Forest" or name == "XGBoost":
        importances = pipeline.named_steps['model'].feature_importances_
        
        # Create importance dataframe
        importance_df = pd.DataFrame({
            'Feature': feature_names,
            'Importance': importances
        }).sort_values('Importance', ascending=False)
        
        print(f"\n{name} - Top 10 Feature Importances:")
        print(importance_df.head(10))
        print()  # Extra line for readability

    predictions = pipeline.predict(x_test)
    y_test_values = y_test.values.flatten()

    #TODO: add more metrics
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)

    results[name] = {
        "predictions": predictions,
        "mae": mae,
        "R²": r2
    }
    print(f"{name} MAE: {mae:.4f}")
    print(f"{name} R²: {r2:.4f}")


plt.figure(figsize=(8,8))

colors = {
    "Linear Regression": "blue",
    "Ridge Regression": "green",
    "Random Forest": "orange",
    "XGBoost": "purple"
}

# y = x reference
min_val = min(y_test.min(), min(r["predictions"].min() for r in results.values()))
max_val = max(y_test.max(), max(r["predictions"].max() for r in results.values()))

plt.plot(
    [min_val, max_val],
    [min_val, max_val],
    'r--',
    label="Perfect Prediction (y = x)"
)

# Plot each model
for name, res in results.items():
    preds = res["predictions"]

    # Scatter
    plt.scatter(
        y_test,
        preds,
        alpha=0.4,
        color=colors[name],
        label=f"{name}"
    )

    # Trend line
    coef = np.polyfit(y_test, preds, 1)
    trend_fn = np.poly1d(coef)

    x_line = np.linspace(min_val, max_val, 100)
    plt.plot(
        x_line,
        trend_fn(x_line),
        color=colors[name],
        linestyle='-',
        linewidth=2
    )

plt.xlabel("Actual OPS")
plt.ylabel("Predicted OPS")
plt.title("Predicted vs Actual OPS: Model Comparison")
plt.legend()
plt.grid(alpha=0.3)
plt.show()