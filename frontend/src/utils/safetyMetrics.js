// src/utils/safetyMetrics.js

import { fetchWithCache } from './apiUtils.js';

export const fetchTokenVesting = async (cryptoId) => {
  const url = `https://api.coingecko.com/api/v3/coins/${cryptoId}`;
  try {
    const data = await fetchWithCache(url);
    const tokenVesting = data.tokenomics?.vesting || null;
    return tokenVesting ? { locked: tokenVesting.locked, schedule: tokenVesting.schedule } : null;
  } catch (err) {
    console.error('Failed to fetch token vesting data:', err);
    return null;
  }
};

export const fetchLiquidityMetrics = async (tokenAddress) => {
  const query = `
    {
      pools(where: { token0: "${tokenAddress}" }) {
        id
        liquidity
        volumeUSD
      }
    }
  `;
  try {
    const response = await fetch('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const { data } = await response.json();
    return data.pools || [];
  } catch (err) {
    console.error('Failed to fetch liquidity metrics:', err);
    return [];
  }
};

export const fetchVolumeTrends = async (cryptoId) => {
  const url = `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=30`;
  try {
    const data = await fetchWithCache(url);
    return data.total_volumes || [];
  } catch (err) {
    console.error('Failed to fetch volume trends:', err);
    return [];
  }
};

export const fetchDeveloperActivity = async (repoUrl) => {
  const repoPath = new URL(repoUrl).pathname.slice(1);
  const url = `https://api.github.com/repos/${repoPath}/commits`;
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
    });
    const commits = await response.json();
    return commits.length || 0;
  } catch (err) {
    console.error('Failed to fetch developer activity:', err);
    return 0;
  }
};

export const calculateSafetyScore = async (cryptoId, tokenAddress, repoUrl) => {
  const vesting = await fetchTokenVesting(cryptoId);
  const liquidity = await fetchLiquidityMetrics(tokenAddress);
  const volume = await fetchVolumeTrends(cryptoId);
  const developerActivity = await fetchDeveloperActivity(repoUrl);

  // Normalize and weigh metrics
  const vestingScore = vesting ? (vesting.locked / (vesting.locked + vesting.schedule)) * 100 : 0;
  const liquidityScore = liquidity.length ? liquidity.reduce((sum, pool) => sum + parseFloat(pool.liquidity), 0) / 1e6 : 0;
  const volumeScore = volume.length ? Math.max(...volume.map(([_, vol]) => vol)) / 1e6 : 0;
  const devScore = Math.min(developerActivity, 100); // Cap activity at 100 commits

  // Weighted sum
  const safetyScore = vestingScore * 0.4 + liquidityScore * 0.3 + volumeScore * 0.2 + devScore * 0.1;
  return {
    score: Math.round(safetyScore),
    breakdown: {
      vestingScore,
      liquidityScore,
      volumeScore,
      devScore,
    },
  };
};