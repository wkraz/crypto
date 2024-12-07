# data/scripts/fetch_data.py
import requests
import json
import os

# CoinGecko API (chosen over Binance)
# sends the json file of data to the raw folder
API_URL = "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart"
PARAMETERS = {"vs_currency": "usd", "days": "30"}  # Past 30 days

# simple data fetch
def fetch_data():
    response = requests.get(API_URL, params=PARAMETERS)
    if response.status_code == 200:
        data = response.json()
        os.makedirs("../raw", exist_ok=True)
        with open("../raw/bitcoin_prices.json", "w") as file:
            json.dump(data, file)
        print("Data fetched and stored in raw/bitcoin_prices.json")
    else:
        print(f"Failed to fetch data. Status Code: {response.status_code}")

if __name__ == "__main__":
    fetch_data()