const express = require('express');
const multer = require('multer');
const path = require('path');
const Audio = require('../models/Audio'); // Import the Audio model
const { Console } = require('console');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads', // Directory to save audio files
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Append a timestamp to the file name
  },
});

const upload = multer({ storage });

const router = express.Router();

/**
 * Route: POST /upload-audio
 * Description: Upload audio file and save metadata
 */
router.post('/upload-audio', upload.single('audio'), async (req, res) => {
  const { userId, meetingId } = req.body;

  console.log(req.body);
  // Validate input
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  if (!userId || !meetingId) {
    return res.status(400).json({ error: 'userId and meetingId are required' });
  }

  // Save audio metadata to the database
  try {
    const newAudio = new Audio({
      userId,
      meetingId,
      audioUrl: `/uploads/${req.file.filename}`, // Relative path to the file
    });

    const savedAudio = await newAudio.save(); // Save the document to MongoDB
    res.status(201).json({
      message: 'Audio uploaded and saved successfully',
      data: savedAudio,
    });
  } catch (err) {
    console.error('Error saving audio metadata:', err.message);
    res.status(500).json({ error: 'Failed to save audio metadata', details: err.message });
  }
});

module.exports = router;
