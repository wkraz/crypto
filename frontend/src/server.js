import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = 5001; // Server now runs on 5001

const cache = new Map();
const CACHE_TTL = 60 * 1000; // Cache for 1 minute

// Helper function to retry API requests
async function fetchWithRetries(url, retries = 3, delay = 1000) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After");
            const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay;
            console.log(`Rate limited. Retrying after ${waitTime}ms`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          } else {
            throw new Error(`Failed to fetch: ${response.statusText}`);
          }
        } else {
          return await response.json();
        }
      } catch (error) {
        console.log(`Attempt ${attempt + 1}/${retries} failed: ${error.message}`);
        if (attempt < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * (attempt + 1)));
        } else {
          throw error;
        }
      }
    }
}

app.get('/api/coingecko', async (req, res) => {
  const { endpoint } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: 'Missing "endpoint" query parameter' });
  }

  console.log('Received request for endpoint:', endpoint);

  const cacheKey = endpoint;
  if (cache.has(cacheKey) && Date.now() - cache.get(cacheKey).timestamp < CACHE_TTL) {
    console.log('Serving from cache:', cacheKey);
    return res.json(cache.get(cacheKey).data);
  }

  try {
    const sanitizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const apiUrl = `https://api.coingecko.com/api/v3${decodeURIComponent(endpoint)}`;
    console.log('Fetching from CoinGecko API:', apiUrl);

    const data = await fetchWithRetries(apiUrl);
    cache.set(cacheKey, { data, timestamp: Date.now() });
    res.json(data);
  } catch (error) {
    console.error('Proxy Error:', error.message);

    res.status(500).json({
      error: error.message,
      details: error.response?.data || {},
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});