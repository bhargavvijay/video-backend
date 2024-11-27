const express = require('express');
const connectDB = require('./db');
const path = require('path');
const cors = require('cors'); // Import CORS middleware
const uploadAudioRoute = require('./routes/uploadAudioRoute'); // Import the upload route

require('dotenv').config(); // Load environment variables

// Connect to MongoDB
connectDB();

const app = express();

// Middleware to parse JSON and enable CORS
app.use(express.json());
app.use(cors({
  origin: 'https://bhargavvijay.github.io', // Replace with your frontend's domain
  methods: ['GET', 'POST'],
}));

// Serve uploaded audio files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add audio upload route
app.use(uploadAudioRoute);

// Fallback route for undefined endpoints
app.use((req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
