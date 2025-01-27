require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5001;
const FDA_API_KEY = process.env.FDA_API_KEY;

// Verify FDA API key is available
if (!FDA_API_KEY) {
  console.error('FDA_API_KEY is not set in environment variables');
  process.exit(1);
}

// Detailed CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://dermodel.app',
    'https://www.dermodel.app',
    'https://dermodel.netlify.app'
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: false, // Don't need credentials for this case
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'Accept'],
};

// Apply CORS with options
app.use(cors(corsOptions));
app.use(express.json());

// Add OPTIONS handling for preflight requests
app.options('*', cors(corsOptions));

app.get('/api/ingredients', async (req, res) => {
  try {
    console.log('Fetching ingredients from FDA API...');
    const url = `https://api.fda.gov/drug/label.json?api_key=${FDA_API_KEY}&search=active_ingredient:"skin"&limit=5`;
    console.log('FDA API URL:', url);

    const response = await axios.get(url);
    
    if (!response.data || !response.data.results) {
      console.error('Invalid FDA API response:', response.data);
      throw new Error('Invalid response format from FDA API');
    }

    console.log('Successfully fetched ingredients');
    res.json(response.data);
  } catch (error) {
    console.error('FDA API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    if (error.response?.status === 401) {
      res.status(401).json({ error: 'Invalid FDA API key' });
    } else if (error.response?.status === 404) {
      res.status(404).json({ error: 'No ingredients found' });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch ingredients',
        details: error.message
      });
    }
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'healthy',
    environment: process.env.NODE_ENV 
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// Add test endpoint for API key verification
app.get('/api/test-fda', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.fda.gov/drug/label.json?api_key=${FDA_API_KEY}&limit=1`
    );
    res.json({ status: 'FDA API connection successful' });
  } catch (error) {
    res.status(500).json({ 
      error: 'FDA API connection failed',
      details: error.message
    });
  }
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});