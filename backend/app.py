# backend/app.py
from flask import Flask, request, jsonify
import pickle
import pandas as pd

MODEL_FILE = "../models/saved_models/linear_regression_model.pkl"

app = Flask(__name__)

with open(MODEL_FILE, "rb") as file:
    model = pickle.load(file)

# BAREBONES flask app that just serves model predictions
@app.route("/predict", methods=["GET"])
def predict():
    timestamp = int(request.args.get("timestamp"))
    prediction = model.predict([[timestamp]])
    return jsonify({"timestamp": timestamp, "predicted_price": prediction[0]})

if __name__ == "__main__":
    app.run(debug=True)