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
      console.error('Failed to fetch crypto data.');
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
      console.error('Failed to fetch coin details.');
    }
  };

  const formatXAxis = (value, timeframe) => {
    const date = new Date(value);
    switch (timeframe) {
      case '1':
        return date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
      case '7':
      case '30':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case '365':
      case 'max':
        return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
      default:
        return date.toLocaleDateString();
    }
  };

  return (
    <div className="container mt-5">
      {/* Search Bar */}
      <div className="text-center mb-4">
        <h1 className="display-4 text-primary">Crypto Dashboard</h1>
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={({ value }) => {
            const filteredSuggestions = coins
              .filter((coin) =>
                coin.name.toLowerCase().includes(value.toLowerCase())
              )
              .slice(0, 10);
            setSuggestions(filteredSuggestions);
          }}
          onSuggestionsClearRequested={() => setSuggestions([])}
          getSuggestionValue={(suggestion) => suggestion.name}
          renderSuggestion={(suggestion) => (
            <div>
              {suggestion.name} ({suggestion.symbol.toUpperCase()})
            </div>
          )}
          inputProps={{
            placeholder: 'Search Cryptocurrency',
            value,
            onChange: (e, { newValue }) => setValue(newValue),
            className: 'form-control',
          }}
          onSuggestionSelected={(e, { suggestion }) => setCrypto(suggestion.id)}
        />
      </div>

      {/* Key Metrics */}
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Key Metrics</h5>
              <ul className="list-group">
                <li className="list-group-item">
                  <strong>Price:</strong> ${coinDetails.currentPrice?.toFixed(2)}
                </li>
                <li className="list-group-item">
                  <strong>Volume:</strong> ${coinDetails.volume24h?.toLocaleString()}
                </li>
                <li className="list-group-item">
                  <strong>Market Cap:</strong> ${coinDetails.marketCap?.toLocaleString()}
                </li>
                <li className="list-group-item">
                  <strong>Circulating Supply:</strong> {coinDetails.circulatingSupply?.toLocaleString()}
                </li>
                <li className="list-group-item">
                  <strong>Total Supply:</strong> {coinDetails.totalSupply?.toLocaleString() || 'N/A'}
                </li>
                <li className="list-group-item">
                  <strong>7-Day Change:</strong> {coinDetails.priceChange7d?.toFixed(2)}%
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Graph */}
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <div className="btn-group mb-3" role="group">
                {['1D', '1W', '1M', '1Y', 'All'].map((label, index) => (
                  <button
                    key={label}
                    className={`btn ${
                      timeframe === index.toString()
                        ? 'btn-primary'
                        : 'btn-outline-primary'
                    }`}
                    onClick={() => setTimeframe(index.toString())}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {chartData && (
                <Line
                  data={chartData}
                  options={{
                    maintainAspectRatio: true,
                    responsive: true,
                    scales: {
                      x: {
                        ticks: {
                          callback: (value, index) =>
                            formatXAxis(chartData.labels[index], timeframe),
                        },
                      },
                    },
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoGraph;