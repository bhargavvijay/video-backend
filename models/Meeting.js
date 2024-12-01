const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  hostName: {
    type: String,
    required: true, // The host name is mandatory
    trim: true,
  },  
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set the creation date
  },
  ended: {
    type: Boolean,
    default: false, // Default to `false` (active meeting)
  },
});

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;
