# data/scripts/preprocess_data.py
import json
import pandas as pd
import os

# takes the raw data and creates a csv that's filtered
#   extracts "relevant" features - timestamps & prices are all we really care about
RAW_FILE = "../raw/bitcoin_prices.json"
PROCESSED_FILE = "../processed/bitcoin_prices.csv"

def preprocess_data():
    with open(RAW_FILE, "r") as file:
        data = json.load(file)
    prices = data["prices"]  # Extract timestamps and prices
    df = pd.DataFrame(prices, columns=["timestamp", "price"])
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")  # Convert to datetime
    os.makedirs("../processed", exist_ok=True)
    df.to_csv(PROCESSED_FILE, index=False)
    print(f"Preprocessed data saved to {PROCESSED_FILE}")

if __name__ == "__main__":
    preprocess_data()