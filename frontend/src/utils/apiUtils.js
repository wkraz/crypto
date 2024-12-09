// /frontend/src/utils/apiUtils.js

const cache = new Map();

export const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error(`Retry ${i + 1} failed`);
    }
    await new Promise((resolve) => setTimeout(resolve, delay)); // Delay between retries
  }
  throw new Error('Failed to fetch data after retries');
};

export const fetchWithCache = async (url, retries = 3, delay = 1000) => {
  if (cache.has(url)) {
    return cache.get(url);
  }
  const data = await fetchWithRetry(url, retries, delay);
  cache.set(url, data);
  return data;
};