import React, { useState, useEffect } from 'react';
import Autosuggest from 'react-autosuggest';
import { Line } from 'react-chartjs-2';
import { fetchWithRetry } from '../utils/apiUtils';
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
  const [coinDetails, setCoinDetails] = useState({});
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCoinsList();
    fetchCryptoData(crypto, timeframe);
    fetchCoinDetails(crypto);
  }, [crypto, timeframe]);

  const fetchCoinsList = async () => {
    try {
      const response = await fetchWithRetry(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250',
        3,
        1000
      );
      setCoins(
        response.map((coin) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          price: coin.current_price,
          marketCap: coin.market_cap,
          image: coin.image,
        }))
      );
    } catch (err) {
      console.error('Failed to fetch coins list:', err);
    }
  };

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
    } catch (err) {
      setError('Failed to fetch crypto data. Please try again.');
    }
  };

  const fetchCoinDetails = async (cryptoId) => {
    try {
      const url = `https://api.coingecko.com/api/v3/coins/${cryptoId}`;
      const data = await fetchWithRetry(url, 3, 1000);
      const { market_data } = data;
      setCoinDetails({
        currentPrice: market_data.current_price.usd,
        volume24h: market_data.total_volume.usd,
        marketCap: market_data.market_cap.usd,
        circulatingSupply: market_data.circulating_supply,
        totalSupply: market_data.total_supply,
        priceChange7d: market_data.price_change_percentage_7d_in_currency.usd,
      });
    } catch (err) {
      console.error('Failed to fetch coin details:', err);
    }
  };

  const renderSuggestion = (suggestion) => (
    <div className="flex justify-between items-center">
      <span>
        {suggestion.name} ({suggestion.symbol.toUpperCase()})
      </span>
      <span className="text-gray-500">${suggestion.price.toFixed(2)}</span>
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
      case 'max': // All Time
        return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
      default:
        return date.toLocaleDateString();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-6">
      <div className="w-full max-w-4xl mb-6 text-center">
        <h1 className="text-4xl font-bold mb-4 text-blue-600">Crypto Dashboard</h1>
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={({ value }) => {
            const filteredSuggestions = coins
              .filter((coin) =>
                coin.name.toLowerCase().includes(value.toLowerCase())
              )
              .sort((a, b) => b.marketCap - a.marketCap)
              .slice(0, 10);
            setSuggestions(filteredSuggestions);
          }}
          onSuggestionsClearRequested={() => setSuggestions([])}
          getSuggestionValue={(suggestion) => suggestion.name}
          renderSuggestion={renderSuggestion}
          inputProps={{
            placeholder: 'Search for a cryptocurrency',
            value,
            onChange: (e, { newValue }) => setValue(newValue),
            className: 'shadow border rounded w-full py-2 px-3',
          }}
          onSuggestionSelected={(e, { suggestion }) => setCrypto(suggestion.id)}
        />
      </div>
      <div className="w-full max-w-6xl grid grid-cols-4 gap-6">
        <div className="col-span-1 bg-white shadow-lg rounded p-4">
          <h2 className="text-xl font-bold mb-4">Key Metrics</h2>
          <ul>
            <li>
              <strong>Current Price:</strong> ${coinDetails.currentPrice?.toFixed(2)}
            </li>
            <li>
              <strong>24H Volume:</strong> ${coinDetails.volume24h?.toLocaleString()}
            </li>
            <li>
              <strong>Market Cap:</strong> ${coinDetails.marketCap?.toLocaleString()}
            </li>
            <li>
              <strong>Circulating Supply:</strong> {coinDetails.circulatingSupply?.toLocaleString()}
            </li>
            <li>
              <strong>Total Supply:</strong> {coinDetails.totalSupply?.toLocaleString() || 'N/A'}
            </li>
            <li>
              <strong>7-Day Change:</strong> {coinDetails.priceChange7d?.toFixed(2)}%
            </li>
          </ul>
        </div>
        <div
          className="col-span-3 bg-white shadow-lg rounded p-4 flex justify-center items-center"
          style={{ height: '50vh', width: '50vw' }} // Constrain graph size
        >
          <div>
            <div className="flex space-x-4 mb-4">
              {[
                { label: '1D', value: '1' },
                { label: '1W', value: '7' },
                { label: '1M', value: '30' },
                { label: '1Y', value: '365' },
                { label: 'All', value: 'max' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeframe(option.value)}
                  className={`py-2 px-4 rounded ${
                    timeframe === option.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {chartData ? (
              <Line
                data={chartData}
                options={{
                  maintainAspectRatio: true,
                  responsive: true,
                  scales: {
                    x: {
                      ticks: {
                        callback: (value, index) => formatXAxis(chartData.labels[index]),
                      },
                    },
                  },
                }}
              />
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <p className="text-gray-500">Loading chart...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoGraph;