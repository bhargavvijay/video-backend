// models/Audio.js
const mongoose = require('mongoose');

// Define the Audio schema
const AudioSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true, // The user who uploaded the audio
  },
  meetingId: {
    type: String,
    required: true, // The meeting associated with the audio
  },
  audioUrl: {
    type: String,
    required: true, // The URL/path to the stored audio file
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set to the current date and time
  },
  transcriptText: {
    type: String,
    required: false, // The text of the audio transcript
  }
});

// Create the Audio model
module.exports = mongoose.model('Audio', AudioSchema);
