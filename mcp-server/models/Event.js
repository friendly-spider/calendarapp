const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  title: String,
  description: String,
  location: String,
  startTime: Date,
  endTime: Date,
  status: String,
  isAllDay: Boolean,
  tag: String,
});

module.exports = mongoose.model("Event", EventSchema);
