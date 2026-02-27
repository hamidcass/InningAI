
import pandas as pd
import numpy as np
import shap
from sklearn import metrics
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from xgboost import XGBRegressor
import joblib #save models


from storage.io import load_dataframe, save_dataframe
from storage.model_io import upload_model
from storage.db import write_df_to_db
from preprocessing.build_features import run_build_features, get_input_metrics

#our models we will train and their args
MODELS = {
    "LinearRegression": LinearRegression(),
    "Ridge": Ridge(alpha=10.0),
    "RandomForest": RandomForestRegressor(n_estimators=300, max_depth=10, random_state=42),
    "XGBoost": XGBRegressor(n_estimators=500, learning_rate=0.05, max_depth=6, subsample=0.8, colsample_bytree=0.8, random_state=42)
    #can add more later
}

#holds park factors for last year in range (year that we are predicting next year from)
PARK_FACTORS_2024 = {
    'ARI': 101, 'ATL': 100, 'BAL': 99, 'BOS': 107, 'CHC': 97,
    'CHW': 99, 'CIN': 105, 'CLE': 97, 'COL': 112, 'DET': 98,
    'HOU': 100, 'KC': 104, 'KCR': 104, 'LAA': 100, 'LAD': 100, 'MIA': 101,
    'MIL': 97, 'MIN': 102, 'NYM': 97, 'NYY': 100, 'OAK': 97, 'ATH': 97,
    'PHI': 101, 'PIT': 101, 'SD': 96, 'SDP': 96, 'SEA': 91, 'SF': 97, 'SFG':97,
    'STL': 100, 'TB': 96, 'TBR': 96, 'TEX': 101, 'TOR': 100, 'WSH': 101, 'WSN': 101,
    'MULTI': 100  # For players on multiple teams
}

def prep_features(df, feature_stats, target_stat):

    df['Current_Park_Factor'] = df['Current_Team'].map(PARK_FACTORS_2024)
    df['Next_Park_Factor'] = df['Next_Team'].map(PARK_FACTORS_2024)

    x_cols = [f"Current_{stat}" for stat in feature_stats] + ["Current_Park_Factor", "Next_Park_Factor"]
    y_col = f"Target_{target_stat}"

    X = df[x_cols]
    y = df[y_col]

    return X, y


def train_model(input_uri, target_stat, chosen_model, model_uri, metrics_uri):
    """
    Method to train a model on prepared data via cloud
    
    - load features
    - split training and target season
    - train pipeline
    -saves model and metrics

    """

    df = load_dataframe(input_uri)

    #split 2025 season (testing data)
    train_df = df[df["Next_Season"] != 2025].copy()
    test_df = df[df["Next_Season"] == 2025].copy()

    feature_stats = [c.replace("Current_", "") for c in train_df.columns if c.startswith("Current_") and c not in ['Current_Park_Factor', 'Current_Team', 'Next_Team']]

    #get X and y
    X_train, y_train = prep_features(train_df, feature_stats, target_stat)
    X_test, y_test = prep_features(test_df, feature_stats, target_stat)

    #preprocess (make all rows numerical)
    numerical_features = X_train.columns.tolist()
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features)
        ]
    )

    #time to build the pipeline!
    pipeline = Pipeline(
        steps=[
            ('preprocessor', preprocessor),
            ('model', MODELS[chosen_model])
        ]
    )

    #train the model now (fit with our training data)
    pipeline.fit(X_train, y_train)

    #predict test data based off of training data
    predictions = pipeline.predict(X_test)

    #get metrics
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)

    #save the model to cloud
    joblib.dump(pipeline, "temp_model.pkl")
    save_dataframe(pd.DataFrame({"dummy": [0]}), model_uri) #todo: replace with actual model saving to s3

    #save to json
    metrics = {
        "mae": mae, 
        "r2": r2
    }

    pd.DataFrame([metrics]).to_json(metrics_uri, orient='records', lines=True)

    print(f"Model trained and saved to {model_uri}")
    return mae, r2


def train_all_models(input_uri, target_stat, model_uris, metrics_uris, importance_uris):
    """
    Train all models, save predictions, metrics, and feature importance to S3.
    """

    df = load_dataframe(input_uri)

    #split 2025 season (testing data)
    train_df = df[df["Next_Season"] != 2025].copy()
    test_df = df[df["Next_Season"] == 2025].copy()

    all_metrics = get_input_metrics(target_stat)
    input_metrics = [m for m in all_metrics if m != target_stat]
    feature_cols = [f"Current_{m}" for m in input_metrics]

    results = {}

    for model_name, model in MODELS.items():
        print(f"Training model: {model_name}")

        X_train, y_train = train_df[feature_cols], train_df[f"Target_{target_stat}"]
        X_test, y_test = test_df[feature_cols], test_df[f"Target_{target_stat}"]

        preprocessor = ColumnTransformer([
            ('num', StandardScaler(), feature_cols)
        ])

        pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('model', model)
        ])

        # Train the model
        pipeline.fit(X_train, y_train)
        predictions = pipeline.predict(X_test)

        # Calculate metrics
        mae = mean_absolute_error(y_test, predictions)
        r2 = r2_score(y_test, predictions)

        feature_names = feature_cols
        if model_name in ["RandomForest", "XGBoost"]:
            explainer = shap.Explainer(pipeline.named_steps["model"])
            x_transformed = pipeline.named_steps["preprocessor"].transform(X_train)
            shap_values = explainer(x_transformed)
            shap_importance = np.abs(shap_values.values).mean(axis=0)

            shap_direction = np.array([
                np.corrcoef(X_train.iloc[:, i].values, shap_values.values[:, i])[0, 1]
                if X_train.iloc[:, i].std() > 0 else 0.0
                for i in range(len(feature_cols))
            ])
            shap_direction = np.nan_to_num(shap_direction, nan=0.0)

            importance_df = pd.DataFrame({
                "Feature": feature_names,
                "Importance": shap_importance,
                "Direction": shap_direction
            }).sort_values(by="Importance", ascending=False)

            importance_df["Effect"] = importance_df["Direction"].apply(
                lambda x: "Increases prediction" if x > 0 else "Decreases prediction")

        elif model_name in ["LinearRegression", "Ridge"]:
            coefficients = pipeline.named_steps['model'].coef_
            importance_df = pd.DataFrame({
                "Feature": feature_names,
                "Coefficient": coefficients
            }).sort_values("Coefficient", key=abs, ascending=False)

        # Save model artifact
        local_model_path = f"{model_name.replace(' ', '_')}.pkl"
        joblib.dump(pipeline, local_model_path)
        # save_dataframe(pd.DataFrame({"dummy": [0]}), model_uris[model_name])  # S3 placeholder
        local_model_path = f"{model_name}.pkl"
        joblib.dump(pipeline, local_model_path)

        upload_model(local_model_path, model_uris[model_name])

        # Save metrics
        metrics = {"mae": mae, "r2": r2}
       
        local_metrics_path = f"{model_name}_metrics.json"
        pd.DataFrame([metrics]).to_json(local_metrics_path, orient="records", lines=True)

        save_dataframe(
            pd.DataFrame([metrics]), 
            metrics_uris[model_name]
        )
    

        # Save feature importance to S3 and database
        save_dataframe(importance_df, importance_uris[model_name])
        importance_table = f"{target_stat.lower()}_{model_name.lower()}_importance"
        write_df_to_db(importance_df, importance_table)

        results[model_name] = {
            "mae": mae,
            "r2": r2,
            "predictions": predictions,
            "importance": importance_df
        }

        print(f"{model_name} done. MAE: {mae:.4f}, R²: {r2:.4f}")

    return results


