const cache = new Map();

export const fetchWithCache = async (url, retries = 3, delay = 1000) => {
  const proxyUrl = `/api/coingecko?endpoint=${encodeURIComponent(url)}`; // Ensure URL is properly encoded
  console.log("Fetching via proxy:", proxyUrl); // Add log for debugging

  if (cache.has(proxyUrl)) {
    return cache.get(proxyUrl);
  }

  const data = await fetchWithRetry(proxyUrl, retries, delay);
  cache.set(proxyUrl, data);
  return data;
};

export const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`Fetch failed for ${url}:`, err.message); // Add log for debugging
    if (retries > 0) {
      await new Promise((res) => setTimeout(res, delay));
      return fetchWithRetry(url, retries - 1, delay);
    } else {
      throw err;
    }
  }
};