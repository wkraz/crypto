import React, { useState, useEffect } from 'react';
import Autosuggest from 'react-autosuggest';
import { Line } from 'react-chartjs-2';
import { fetchWithRetry } from '../utils/apiUtils';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CryptoGraph = () => {
  const [coins, setCoins] = useState([]);
  const [crypto, setCrypto] = useState('bitcoin');
  const [timeframe, setTimeframe] = useState('7'); // Default to 1 week
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);

  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // Fetch all coins with their data
  const fetchCoinsList = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250'
      );
      const data = await response.json();
      setCoins(
        data.map((coin) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          price: coin.current_price,
          image: coin.image,
        }))
      );
    } catch (err) {
      console.error('Failed to fetch coins list:', err);
    }
  };

  // Fetch chart data for the selected coin and timeframe
  const fetchCryptoData = async (cryptoId, days) => {
    try {
      const url = `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=${days}`;
      const data = await fetchWithRetry(url, 3, 1000);
  
      const prices = data.prices.map(([timestamp, price]) => ({
        x: new Date(timestamp),
        y: price,
      }));
  
      setChartData({
        labels: prices.map((point) => point.x),
        datasets: [
          {
            label: `${cryptoId.toUpperCase()} Price (${days === 'max' ? 'All Time' : `Last ${days} Days`})`,
            data: prices.map((point) => point.y),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
          },
        ],
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch crypto data. Please try again.');
    }
  };

  // Fetch coin details
  /* const fetchCoinDetails = async (cryptoId) => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${cryptoId}`
      );
      const data = await response.json();
      console.log(data);
    } catch (err) {
      console.error('Failed to fetch coin details:', err);
    }
  };
  */

  useEffect(() => {
    fetchCoinsList();
    fetchCryptoData(crypto, timeframe);
  }, [crypto, timeframe]);

  // Autocomplete handlers
  const onSuggestionsFetchRequested = ({ value }) => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    const filteredSuggestions =
      inputLength === 0
        ? []
        : coins
            .filter(
              (coin) =>
                coin.name.toLowerCase().includes(inputValue) ||
                coin.symbol.toLowerCase().includes(inputValue)
            )
            .sort((a, b) => b.price - a.price);

    setSuggestions(filteredSuggestions.slice(0, 10));
  };

  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const getSuggestionValue = (suggestion) => suggestion.name;

  const renderSuggestion = (suggestion) => (
    <div className="flex justify-between items-center">
      <span>
        {suggestion.name} ({suggestion.symbol.toUpperCase()})
      </span>
      <span className="text-gray-500">${suggestion.price.toFixed(2)}</span>
    </div>
  );

  const onChange = (event, { newValue }) => {
    setValue(newValue);
  };

  const onSuggestionSelected = (event, { suggestion }) => {
    setCrypto(suggestion.id);
  };

  const renderFavorites = () => (
    <div className="bg-white shadow-lg rounded px-4 pt-4 pb-4 w-full max-w-2xl">
      <h2 className="text-xl font-bold mb-4 text-gray-700">Favorite Coins</h2>
      <div className="grid grid-cols-2 gap-4">
        {coins.slice(0, 10).map((coin) => (
          <button
            key={coin.id}
            onClick={() => setCrypto(coin.id)}
            className="flex justify-between items-center bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded"
          >
            <span>
              {coin.name} ({coin.symbol.toUpperCase()})
            </span>
            <span className="text-blue-600 font-bold">${coin.price.toFixed(2)}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const formatXAxis = (value) => {
    const date = new Date(value);
    switch (timeframe) {
      case '1': // 1D
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '7': // 1W
      case '30': // 1M
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case '365': // 1Y
      case 'max': // All time
        return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
      default:
        return date.toLocaleDateString();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-6">
      <h1 className="text-4xl font-bold mb-6 text-blue-600">Crypto Graph</h1>
      <div className="bg-white shadow-lg rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Search Cryptocurrency:
          <Autosuggest
            suggestions={suggestions}
            onSuggestionsFetchRequested={onSuggestionsFetchRequested}
            onSuggestionsClearRequested={onSuggestionsClearRequested}
            getSuggestionValue={getSuggestionValue}
            renderSuggestion={renderSuggestion}
            inputProps={{
              placeholder: 'Search for a cryptocurrency',
              value,
              onChange,
              className:
                'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline',
            }}
            onSuggestionSelected={onSuggestionSelected}
          />
        </label>
      </div>
      {renderFavorites()}
      <div className="flex space-x-4 mb-6">
        {[
          { label: '1D', value: '1' },
          { label: '1W', value: '7' },
          { label: '1M', value: '30' },
          { label: '1Y', value: '365' },
          { label: 'All', value: 'max' },
        ].map((timeframeOption) => (
          <button
            key={timeframeOption.value}
            onClick={() => setTimeframe(timeframeOption.value)}
            className={`py-2 px-4 rounded ${
              timeframe === timeframeOption.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {timeframeOption.label}
          </button>
        ))}
      </div>
      {chartData ? (
        <div className="bg-white shadow-lg rounded px-8 pt-6 pb-8 w-full max-w-2xl">
          <Line
            data={chartData}
            options={{
              scales: {
                x: {
                  ticks: {
                    callback: (value, index, values) =>
                      formatXAxis(chartData.labels[index]),
                  },
                },
              },
            }}
          />
        </div>
      ) : error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : (
        <p className="text-gray-600">Loading chart...</p>
      )}
    </div>
  );
};

export default CryptoGraph;