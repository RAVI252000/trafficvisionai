import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

def train_model():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    processed_data_path = os.path.join(project_root, "ai_models", "data", "processed_traffic.csv")
    saved_models_dir = os.path.join(project_root, "ai_models", "saved_models")
    
    print(f"Loading processed data from: {processed_data_path} ...")
    if not os.path.exists(processed_data_path):
        raise FileNotFoundError(f"Processed data not found at {processed_data_path}")

    df = pd.read_csv(processed_data_path)

    # Features and target
    features = [
        "hour",
        "day_of_week",
        "month",
        "is_weekend",
        "latitude",
        "longitude",
        "road_type_code",
        "direction_code"
    ]
    target = "all_motor_vehicles"

    X = df[features]
    y = df[target]

    print("Splitting data into train and test sets...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training XGBoost Regressor model...")
    # Using robust parameters for high accuracy tabular modeling
    model = XGBRegressor(
        n_estimators=150,
        max_depth=7,
        learning_rate=0.08,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    print("Evaluating model...")
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    # Note: squared=False in mean_squared_error is deprecated in scikit-learn 1.4+, 
    # but we compute root manually or standard rmse to be compatible with all versions.
    mse = mean_squared_error(y_test, y_pred)
    rmse = mse ** 0.5
    r2 = r2_score(y_test, y_pred)

    print(f"Test MAE: {mae:.2f}")
    print(f"Test RMSE: {rmse:.2f}")
    print(f"Test R^2: {r2:.4f}")

    model_path = os.path.join(saved_models_dir, "traffic_model.joblib")
    print(f"Saving model to: {model_path}")
    joblib.dump(model, model_path)
    print("Training completed successfully!")

if __name__ == "__main__":
    train_model()
