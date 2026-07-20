import os
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def evaluate_model():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    processed_data_path = os.path.join(project_root, "ai_models", "data", "processed_traffic.csv")
    model_path = os.path.join(project_root, "ai_models", "saved_models", "traffic_model.joblib")
    reports_dir = os.path.join(project_root, "ai_models", "reports")
    
    os.makedirs(reports_dir, exist_ok=True)

    print(f"Loading model from: {model_path} ...")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Trained model not found at {model_path}")
    model = joblib.load(model_path)

    print(f"Loading processed data from: {processed_data_path} ...")
    df = pd.read_csv(processed_data_path)

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

    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Running evaluation predictions...")
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = mse ** 0.5
    r2 = r2_score(y_test, y_pred)

    print("\n--- MODEL PERFORMANCE ---")
    print(f"Mean Absolute Error (MAE): {mae:.2f} vehicles/hour")
    print(f"Root Mean Squared Error (RMSE): {rmse:.2f} vehicles/hour")
    print(f"R-squared Score (R^2): {r2:.4f}")
    print("-------------------------\n")

    # Generate plots
    print("Generating performance plots...")
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

    # Plot 1: Actual vs Predicted
    # Sample a random subset of 1000 test points for readability
    np.random.seed(42)
    sample_idx = np.random.choice(len(y_test), min(len(y_test), 1000), replace=False)
    ax1.scatter(y_test.iloc[sample_idx], y_pred[sample_idx], alpha=0.4, color='#3B82F6')
    max_val = max(y_test.iloc[sample_idx].max(), y_pred[sample_idx].max())
    ax1.plot([0, max_val], [0, max_val], 'r--', lw=2)
    ax1.set_title("Actual vs Predicted Traffic Volume", fontsize=12)
    ax1.set_xlabel("Actual Volume (vehicles/hour)", fontsize=10)
    ax1.set_ylabel("Predicted Volume (vehicles/hour)", fontsize=10)
    ax1.grid(True, linestyle=':', alpha=0.6)

    # Plot 2: Feature Importance
    importances = model.feature_importances_
    indices = np.argsort(importances)
    
    ax2.barh(range(len(indices)), importances[indices], color='#10B981', align='center')
    ax2.set_yticks(range(len(indices)))
    ax2.set_yticklabels([features[i] for i in indices])
    ax2.set_title("Feature Importance Analysis", fontsize=12)
    ax2.set_xlabel("Importance Score", fontsize=10)
    ax2.grid(True, linestyle=':', alpha=0.6)

    plt.tight_layout()
    plot_path = os.path.join(reports_dir, "evaluation_report.png")
    plt.savefig(plot_path, dpi=150)
    plt.close()

    print(f"Saved evaluation report plot to: {plot_path}")
    print("Evaluation completed successfully!")

if __name__ == "__main__":
    evaluate_model()
