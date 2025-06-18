const Event = require("../models/Event");

async function handleMCP(agent, action, input) {
  if (agent !== "calendar") throw new Error("Unknown agent");

  if ((action === "updateEvent" || action === "deleteEvent") && !input._id && input.title) {
    const existing = await Event.findOne({ title: input.title });

    if (!existing) {
      throw new Error(`No event found with title "${input.title}"`);
    }

    input._id = existing._id;
  }

  switch (action) {
    case "listEvents":
      return await Event.find();
    case "createEvent":
      return await new Event(input).save();
    case "updateEvent":
      return await Event.findByIdAndUpdate(input._id, input, { new: true });
    case "deleteEvent":
      const deleted = await Event.findByIdAndDelete(input._id);
      if (!deleted) {
        throw new Error(`No event found with _id "${input._id}" to delete`);
      }
      return { success: true };
    default:
      throw new Error("Unknown action");
  }
}

module.exports = { handleMCP };