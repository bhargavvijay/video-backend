const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Audio = require('../models/Audio'); // Import the Audio model

// Ensure the uploads directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); // Create directory if it doesn't exist
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: uploadDir, // Save files to the uploads directory
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Append a timestamp to the file name
  },
});

const upload = multer({ storage });
const router = express.Router();

/**
 * Route: POST /upload-audio
 * Description: Upload an audio file and save metadata
 */
router.post('/upload-audio', upload.single('audio'), async (req, res) => {
  console.log('Request Body:', req.body); // Debug: Log request body
  console.log('Uploaded File:', req.file); // Debug: Log uploaded file details

  // Normalize and validate input
  const userId = req.body.userId || null;
  const meetingId = req.body.meetingId || null;

  if (!req.file) {
    console.error('No audio file uploaded');
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  if (!userId || !meetingId) {
    console.error('Missing userId or meetingId:', { userId, meetingId });
    return res.status(400).json({ error: 'userId and meetingId are required' });
  }

  try {
    // Save audio metadata to the database
    const newAudio = new Audio({
      userId,
      meetingId,
      audioUrl: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`, // Generate absolute URL
    });

    const savedAudio = await newAudio.save(); // Save the document to MongoDB
    console.log('Audio metadata saved:', savedAudio); // Debug: Log saved metadata

    res.status(201).json({
      message: 'Audio uploaded and saved successfully',
      data: savedAudio,
    });
  } catch (err) {
    console.error('Error saving audio metadata:', err.message); // Debug: Log error
    res.status(500).json({
      error: 'Failed to save audio metadata',
      details: err.message,
    });
  }
});

module.exports = router;
