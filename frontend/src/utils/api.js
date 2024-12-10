import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5001';

// using axios to make API calls
export const getPrediction = async (timestamp) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/predict`, {
      params: { timestamp },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching prediction:", error);
    throw error;
  }
};