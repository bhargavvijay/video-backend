const express = require('express');
const connectDB = require('./db');
const path = require('path'); // Import the path module
const uploadAudioRoute = require('./routes/uploadAudioRoute');
require('dotenv').config();

connectDB();

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Serve uploaded audio files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add your routes
app.use(uploadAudioRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
