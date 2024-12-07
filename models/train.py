# models/train.py
import pandas as pd
from sklearn.linear_model import LinearRegression
import pickle
import os

PROCESSED_FILE = os.path.join(os.path.dirname(__file__), "../data/processed/bitcoin_prices.csv")
MODEL_FILE = "./saved_models/linear_regression_model.pkl"

# just using simple linear regression model for now
def train_model():
    df = pd.read_csv(PROCESSED_FILE)
    X = df.index.values.reshape(-1, 1)  # Time as feature
    y = df["price"].values
    model = LinearRegression()
    model.fit(X, y)
    os.makedirs("./saved_models", exist_ok=True)
    with open(MODEL_FILE, "wb") as file:
        pickle.dump(model, file)
    print(f"Model trained and saved to {MODEL_FILE}")

if __name__ == "__main__":
    train_model()