const express = require('express');
const connectDB = require('./db');
const path = require('path');
const cors = require('cors'); // Import CORS middleware
const uploadAudioRoute = require('./routes/uploadAudioRoute'); // Import the upload route
const Meeting = require('./models/Meeting');
const Audio = require('./models/Audio'); // Ensure Audio model is imported
const {AssemblyAI} = require('assemblyai');
require('dotenv').config(); // Load environment variables

// Connect to MongoDB
connectDB();

const app = express();

// Middleware to parse JSON and enable CORS
app.use(express.json());
app.use(
  cors({
    origin:'https://bhargavvijay.github.io/Video-Chat/', // Replace with your frontend's domain
    methods: ['GET', 'POST'],
  })
);

// Serve uploaded audio files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add audio upload route
app.use(uploadAudioRoute);

// AssemblyAI Client Initialization
const assemblyClient = new AssemblyAI({
  apiKey: process.env.ASSEMBLY_AI_KEY, // Use environment variable
});

// Function to start transcription
const startTranscripting = async (meetingId) => 
  {
  try {
    const audio = await Audio.findOne({ meetingId }).sort({ createdAt: -1 }); // Fetch the latest audio file
    if (!audio) {
      console.error('No audio file found for this meeting.');
      return;
    }

    console.log(audio);

    const audioUrl = audio.audioUrl;
    console.log(`Starting transcription for audio: ${audioUrl}`);

    const transcriptConfig = { audio_url: audioUrl };
    const transcript = await assemblyClient.transcripts.transcribe(transcriptConfig);

    console.log('Transcription complete:', transcript.text);
    // Save the transcription result if needed
  } catch (error) {
    console.error('Error during transcription:', error);
  }
};


// Route to create a meeting
app.post('/create-meeting', async (req, res) => {
  const { hostName } = req.body;

  if (!hostName) {
    return res.status(400).json({ error: 'Host name is required' });
  }

  try {
    const newMeeting = new Meeting({ hostName });
    await newMeeting.save();

    res.status(201).json({
      message: 'Meeting created successfully',
      roomId: newMeeting._id, // MongoDB _id
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to end a meeting
app.post('/end-meeting', async (req, res) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    const meeting = await Meeting.findOne({ _id: roomId });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    meeting.ended = true;
    await meeting.save();

    // Start transcription
    startTranscripting(roomId);

    res.status(200).json({ message: 'Meeting ended successfully', roomId: meeting._id });
  } catch (error) {
    console.error('Error ending meeting:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to check if a meeting exists
app.get('/meeting-exists/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const meeting = await Meeting.findOne({ _id: id });

    if (meeting) {
      if (meeting.ended === false) {
        res.status(200).json({ exists: true });
      } else {
        res.status(404).json({ exists: false, message: 'Meeting has ended' });
      }
    } else {
      res.status(404).json({ exists: false, message: 'Meeting does not exist' });
    }
  } catch (error) {
    console.error('Error checking meeting existence:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Fallback route for undefined endpoints
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
