const express = require('express');
const connectDB = require('./db');
const path = require('path'); // Import the path module
const uploadAudioRoute = require('./routes/uploadAudioRoute');
const cors = require('cors'); // Import cors
require('dotenv').config();

connectDB();

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Enable CORS
app.use(cors({
    origin: 'https://bhargavvijay.github.io', // Replace with your frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
}));

// Serve uploaded audio files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add your routes
app.use(uploadAudioRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
