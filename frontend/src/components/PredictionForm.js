/*
Form that gets user input and displays the backend's response
*/

import React, { useState } from 'react';
import { getPrediction } from '../utils/api';

const PredictionForm = () => {
  const [timestamp, setTimestamp] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await getPrediction(timestamp);
      setPrediction(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch prediction. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-6">
      <h1 className="text-4xl font-bold mb-6 text-blue-600">Crypto Price Prediction</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded px-8 pt-6 pb-8 mb-4 w-full max-w-sm"
      >
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Timestamp:
          <input
            type="number"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            placeholder="Enter timestamp"
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </label>
        <button
          type="submit"
          className="mt-4 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Get Prediction
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      {prediction && (
        <div className="mt-6 bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-sm">
          <h3 className="text-lg font-bold mb-2 text-gray-700">Prediction Results:</h3>
          <p className="text-gray-600">
            <strong>Timestamp:</strong> {prediction.timestamp}
          </p>
          <p className="text-gray-600">
            <strong>Predicted Price:</strong> ${prediction.predicted_price.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
};

export default PredictionForm;