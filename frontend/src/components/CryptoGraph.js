import React, { useState, useEffect } from 'react';
import Autosuggest from 'react-autosuggest';
import { Line } from 'react-chartjs-2';
import { calculateSafetyScore } from '../utils/safetyMetrics.js';
import { fetchWithCache, fetchWithRetry } from '../utils/apiUtils.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(Filler, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CryptoGraph = () => {
  const [coins, setCoins] = useState([]);
  const [crypto, setCrypto] = useState('bitcoin');
  const [timeframe, setTimeframe] = useState('7');
  const [chartData, setChartData] = useState(null);
  const [coinDetails, setCoinDetails] = useState({});
  const [safetyScore, setSafetyScore] = useState(null);
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [error] = useState(null);

  const timeframes = [
    { label: '1D', value: '1' },
    { label: '1W', value: '7' },
    { label: '1M', value: '30' },
    { label: '1Y', value: '365' },
    { label: 'All', value: 'max' },
  ];

  useEffect(() => {
    const fetchCoinsList = async () => {
      try {
        const response = await fetchWithCache(
          '/api/coingecko?endpoint=/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250'
        );
        setCoins(
          response.map((coin) => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            price: coin.current_price,
            marketCap: coin.market_cap,
            image: coin.image,
            contractAddress: coin.contract_address || '',
            repoUrl: coin.links?.repos_url?.github[0] || '',
          }))
        );
      } catch (err) {
        console.error('Failed to fetch coins list:', err);
      }
    };

    fetchCoinsList();
  }, []);

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const endpoint = `/coins/${crypto}/market_chart?vs_currency=usd&days=${timeframe}`;
        const data = await fetchWithCache(endpoint);

        if (!data?.prices?.length) {
          console.warn(`No data found for ${crypto} within timeframe: ${timeframe}`);
          setChartData(null);
          return;
        }

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
        console.error('Failed to fetch crypto data:', err);
        setChartData(null);
      }
    };

    fetchCryptoData();
  }, [crypto, timeframe]);

  useEffect(() => {
    const fetchCoinDetails = async () => {
      try {
        const endpoint = `/api/coingecko?endpoint=/coins/${crypto}`;
        const data = await fetchWithRetry(endpoint, 3, 1000);
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

    fetchCoinDetails();
  }, [crypto]);

  useEffect(() => {
    const fetchSafetyScore = async () => {
      try {
        const tokenAddress = coins.find((coin) => coin.id === crypto)?.contractAddress || '';
        const repoUrl = coins.find((coin) => coin.id === crypto)?.repoUrl || '';

        if (!tokenAddress && !repoUrl) {
          setSafetyScore({
            score: 0,
            breakdown: { vestingScore: 0, liquidityScore: 0, volumeScore: 0, devScore: 0 },
          });
          return;
        }

        const score = await calculateSafetyScore(crypto, tokenAddress, repoUrl);
        setSafetyScore(score);
      } catch (err) {
        console.error('Failed to fetch safety score:', err);
        setSafetyScore({
          score: 0,
          breakdown: { vestingScore: 0, liquidityScore: 0, volumeScore: 0, devScore: 0 },
        });
      }
    };

    if (coins.length > 0) {
      fetchSafetyScore();
    }
  }, [crypto, coins]);

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
      <div className="text-center mb-4">
        <h1 className="display-4 text-primary">Crypto Dashboard</h1>
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={({ value }) => {
            const filteredSuggestions = coins
              .filter((coin) => coin.name.toLowerCase().includes(value.toLowerCase()))
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
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Key Metrics</h5>
              {coinDetails ? (
                <table className="table">
                  <tbody>
                    <tr><th>Price:</th><td>${coinDetails.currentPrice?.toFixed(2)}</td></tr>
                    <tr><th>Volume:</th><td>${coinDetails.volume24h?.toLocaleString()}</td></tr>
                    <tr><th>Market Cap:</th><td>${coinDetails.marketCap?.toLocaleString()}</td></tr>
                    <tr><th>Circulating Supply:</th><td>{coinDetails.circulatingSupply?.toLocaleString()}</td></tr>
                    <tr><th>Total Supply:</th><td>{coinDetails.totalSupply?.toLocaleString() || 'N/A'}</td></tr>
                    <tr><th>7-Day Change:</th><td>{coinDetails.priceChange7d?.toFixed(2)}%</td></tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-muted">Loading metrics...</p>
              )}
              {safetyScore && (
                <div className="alert alert-info mt-4">
                  <h5>Safety Score: {safetyScore.score}/100</h5>
                  <ul>
                    <li>Token Vesting: {safetyScore.breakdown.vestingScore.toFixed(2)}/100</li>
                    <li>Liquidity: {safetyScore.breakdown.liquidityScore.toFixed(2)}/100</li>
                    <li>Volume: {safetyScore.breakdown.volumeScore.toFixed(2)}/100</li>
                    <li>Developer Activity: {safetyScore.breakdown.devScore.toFixed(2)}/100</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <div className="btn-toolbar mb-3 justify-content-center">
                <div className="btn-group">
                  {timeframes.map(({ label, value }) => (
                    <button
                      key={label}
                      className={`btn ${timeframe === value ? 'btn-primary' : 'btn-outline-primary'}`}
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
                    responsive: true,
                    scales: { x: { ticks: { callback: (value, index) => formatXAxis(chartData.labels[index], timeframe) } } },
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