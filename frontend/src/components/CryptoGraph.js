import React, { useState, useEffect } from 'react';
import Autosuggest from 'react-autosuggest';
import { Line } from 'react-chartjs-2';
import { fetchWithRetry, fetchWithCache } from '../utils/apiUtils';
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

  // Fetch coins list once on mount
  useEffect(() => {
    const fetchCoinsList = async () => {
      try {
        const response = await fetchWithCache(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250',
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

    fetchCoinsList();
  }, []); // Empty dependency array ensures this runs only once

  // Fetch chart data whenever `crypto` or `timeframe` changes
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const url = `https://api.coingecko.com/api/v3/coins/${crypto}/market_chart?vs_currency=usd&days=${timeframe}`;
        const data = await fetchWithCache(url);
        const prices = data.prices.map(([timestamp, price]) => ({
          x: new Date(timestamp),
          y: price,
        }));

        setChartData({
          labels: prices.map((point) => point.x),
          datasets: [
            {
              label: `${crypto.toUpperCase()} Price (${timeframe === 'max' ? 'All Time' : `Last ${timeframe} Days`})`,
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

    fetchCryptoData();
  }, [crypto, timeframe]); // Dependencies: re-fetch when these change

  // Fetch coin details whenever `crypto` changes
  useEffect(() => {
    const fetchCoinDetails = async () => {
      try {
        const url = `https://api.coingecko.com/api/v3/coins/${crypto}`;
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

    fetchCoinDetails();
  }, [crypto]); // Dependencies: re-fetch when `crypto` changes

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
            <div className="dropdown-item">
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
              {Object.keys(coinDetails).length ? (
                <table className="table">
                  <tbody>
                    <tr>
                      <th scope="row">Price:</th>
                      <td>${coinDetails.currentPrice?.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <th scope="row">Volume:</th>
                      <td>${coinDetails.volume24h?.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th scope="row">Market Cap:</th>
                      <td>${coinDetails.marketCap?.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th scope="row">Circulating Supply:</th>
                      <td>{coinDetails.circulatingSupply?.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th scope="row">Total Supply:</th>
                      <td>{coinDetails.totalSupply?.toLocaleString() || 'N/A'}</td>
                    </tr>
                    <tr>
                      <th scope="row">7-Day Change:</th>
                      <td>{coinDetails.priceChange7d?.toFixed(2)}%</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-muted">Loading metrics...</p>
              )}
            </div>
          </div>
        </div>

        {/* Graph */}
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <div className="btn-toolbar mb-3 justify-content-center" role="toolbar">
                <div className="btn-group" role="group">
                  {[
                    { label: '1D', value: '1' },
                    { label: '1W', value: '7' },
                    { label: '1M', value: '30' },
                    { label: '1Y', value: '365' },
                    { label: 'All', value: 'max' },
                  ].map(({ label, value }) => (
                    <button
                      key={label}
                      className={`btn ${
                        timeframe === value ? 'btn-primary' : 'btn-outline-primary'
                      }`}
                      onClick={() => setTimeframe(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
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
                          callback: (value, index) =>
                            formatXAxis(chartData.labels[index], timeframe),
                        },
                      },
                    },
                  }}
                />
              ) : error ? (
                <div className="alert alert-danger">Failed to load chart data.</div>
              ) : (
                <p className="text-muted text-center">Loading graph...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoGraph;