import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8081/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const aiService = {
  /**
   * Get portfolio health score and analysis
   */
  async getPortfolioHealth() {
    try {
      const response = await apiClient.get('/ai/portfolio-health');
      return response.data;
    } catch (error) {
      console.error('Error fetching portfolio health:', error);
      throw error;
    }
  },

  /**
   * Get portfolio metrics summary
   */
  async getPortfolioMetrics() {
    try {
      const response = await apiClient.get('/ai/portfolio-metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching portfolio metrics:', error);
      throw error;
    }
  },

  /**
   * Compare two cryptocurrencies with AI analysis
   */
  async compareCryptos(coinA, coinB) {
    try {
      const response = await apiClient.post('/ai/compare', {
        coinA,
        coinB,
      });
      return response.data;
    } catch (error) {
      console.error('Error comparing cryptocurrencies:', error);
      throw error;
    }
  },

  /**
   * Get quick comparison metrics without AI
   */
  async quickCompareCryptos(coinA, coinB) {
    try {
      const response = await apiClient.post('/ai/quick-compare', {
        coinA,
        coinB,
      });
      return response.data;
    } catch (error) {
      console.error('Error in quick comparison:', error);
      throw error;
    }
  },
};

export default aiService;
