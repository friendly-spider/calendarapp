const Event = require("../models/Event");

async function handleMCP(agent, action, input) {
  if (agent !== "calendar") throw new Error("Unknown agent");

  switch (action) {
    case "listEvents":
      return await Event.find();
    case "createEvent":
      return await new Event(input).save();
    case "updateEvent":
      return await Event.findByIdAndUpdate(input._id, input, { new: true });
    case "deleteEvent":
      await Event.findByIdAndDelete(input._id);
      return { success: true };
    default:
      throw new Error("Unknown action");
  }
}

module.exports = { handleMCP };