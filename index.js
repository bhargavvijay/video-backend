const express = require('express');
const connectDB = require('./db');
const path = require('path');
const cors = require('cors');
const uploadAudioRoute = require('./routes/uploadAudioRoute');
const Meeting = require('./models/Meeting');
const Audio = require('./models/Audio');
const { AssemblyAI } = require('assemblyai');
const axios = require('axios');
const {spawn} = require('child_process');
const { constrainedMemory } = require('process');
require('dotenv').config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware to parse JSON and enable CORS
app.use(express.json());
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST'],
  })
);

// Serve uploaded audio files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add audio upload route
app.use(uploadAudioRoute);

// AssemblyAI Client Initialization
const assemblyClient = new AssemblyAI({
  apiKey: process.env.ASSEMBLY_AI_KEY,
});

// Function to start transcription and summarization

// index.js (or any other JS file in your Node.js app)


const startTranscripting = async (meetingId) => {
  try {
    console.log(meetingId);
    const audios = await Audio.find({ meetingId });
    if (!audios) {
      console.error('No audio file found for this meeting.');
      return;
    }

    let transcripts={}
    const roles = {
      "user1": "attendee",
      "user2": "moderator"
  };
    for(let i=0; i < audios.length; i++){
      const audio = audios[i];
      console.log(`Starting transcription for audio: ${audio.audioUrl}`);
      const transcriptConfig = { audio_url: audio.audioUrl };
      const transcript = await assemblyClient.transcripts.transcribe(transcriptConfig);
      console.log('Transcription complete:', transcript.text);
      audio.transcriptText = transcript.text;
      await audio.save();
      transcripts["user"+(i+1)] = transcript.text;
    }

    const pythonScriptPath =  './app.py' // Adjust the path accordingly
    
    // Spawn the Python process
    const pythonProcess = spawn('python', [pythonScriptPath]);
    
    // Send the JSON data via stdin
    const inputData = JSON.stringify({ transcripts, roles });
    pythonProcess.stdin.write(inputData);
    pythonProcess.stdin.end();
    
    // Capture and display Python script output
    pythonProcess.stdout.on('data', (data) => {
        console.log(`Output from Python script:\n${data}`);
    });
    
    // Handle errors
    pythonProcess.stderr.on('data', (data) => {
        console.error(`Error from Python script: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
        console.log(`Python script finished with exit code ${code}`);
    });

    
    // // Send transcript text to the external summarization API
    // console.log("Sending text for summarization...");
    // const summaryResponse = await axios.post('https://s1-x34r.onrender.com/summarize', {
    //   text: transcript.text
    // });

    
    // const summary = summaryResponse.data.summary || "Summary not available";
    // console.log("Summary:", summary);
    // // Update Meeting document with summary
    // await Meeting.updateOne({ _id: meetingId }, { $set: { summary, transcript: transcript.text } });

  } catch (error) {
    console.error('Error during transcription/summarization:', error);
  }
};

startTranscripting("67eaae50f9ae52947a58ae94"); // Example meetingId, replace with actual

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
      roomId: newMeeting._id,
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

    // Start transcription and summarization
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

// Route to fetch transcript & summary for a meeting
app.get('/meeting-summary/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const meeting = await Meeting.findOne({ _id: id });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.status(200).json({
      transcript: meeting.transcript || "No transcript available",
      summary: meeting.summary || "No summary available",
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

app.get('/meeting-transcript/:id', async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const audio = await Audio
      .findOne({ meetingId: id });

      res.status(200).json({
        transcript: audio.transcriptText || "No transcript available",
      });
    }
    catch (error) {
      console.error('Error fetching transcript:', error);
      res.status(500).json({ error: 'Server Error' });
    }});

// Fallback route for undefined endpoints
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
