// /frontend/src/components/CoinDetails.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchWithCache } from '../utils/apiUtils.js'; // Import the caching function

const CoinDetails = () => {
  const { id } = useParams(); // Get the coin ID from the URL
  const [coinDetails, setCoinDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCoinDetails = async () => {
      try {
        const data = await fetchWithCache(`https://api.coingecko.com/api/v3/coins/${id}`);
        setCoinDetails(data);
      } catch (err) {
        setError('Failed to fetch coin details. Please try again.');
      }
    };

    fetchCoinDetails();
  }, [id]);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!coinDetails) {
    return <p className="text-gray-500">Loading...</p>;
  }

  const { name, market_data: marketData } = coinDetails;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-6">
      <div className="bg-white shadow-lg rounded px-8 pt-6 pb-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-4 text-blue-600">{name}</h1>
        <ul>
          <li>
            <strong>Current Price:</strong> ${marketData.current_price.usd.toFixed(2)}
          </li>
          <li>
            <strong>24H Volume:</strong> ${marketData.total_volume.usd.toLocaleString()}
          </li>
          <li>
            <strong>Market Cap:</strong> ${marketData.market_cap.usd.toLocaleString()}
          </li>
          <li>
            <strong>Circulating Supply:</strong> {marketData.circulating_supply?.toLocaleString()}
          </li>
          <li>
            <strong>Total Supply:</strong> {marketData.total_supply?.toLocaleString() || 'N/A'}
          </li>
          <li>
            <strong>7-Day Change:</strong> {marketData.price_change_percentage_7d_in_currency.usd?.toFixed(2)}%
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CoinDetails;