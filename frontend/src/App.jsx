import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Button } from "./components/ui/button";
const queryMCP = async (agent, action, input = {}) => {
  const res = await fetch("http://localhost:5050/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent, action, input }),
  });
  const data = await res.json();
  return data.result;
};

export default function CalendarApp() {
  const [events, setEvents] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState(getEmptyForm());
  const [isEdit, setIsEdit] = useState(false);
  const [tagFilter, setTagFilter] = useState("all");

  function getEmptyForm() {
    return {
      _id: "",
      title: "",
      description: "",
      location: "",
      startTime: "",
      endTime: "",
      status: "confirmed",
      isAllDay: false,
      tag: "common",
    };
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const result = await queryMCP("calendar", "listEvents");
      setEvents(result);
    } catch (err) {
      console.error("Failed to load events from MCP", err);
    }
  };

  const formatDateTimeLocal = (date) => {
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  };

  const handleDateClick = ({ dateStr }) => {
    const start = new Date(dateStr);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setForm({
      _id: "",
      title: "",
      description: "",
      location: "",
      startTime: formatDateTimeLocal(start),
      endTime: formatDateTimeLocal(end),
      status: "confirmed",
      isAllDay: false,
      tag: "common",
    });
    setIsEdit(false);
    setOpenDialog(true);
  };

  const handleEventClick = ({ event }) => {
    setForm({
      _id: event.id,
      title: event.title,
      description: event.extendedProps.description || "",
      location: event.extendedProps.location || "",
      startTime: formatDateTimeLocal(event.start),
      endTime: formatDateTimeLocal(event.end || event.start),
      status: event.extendedProps.status || "confirmed",
      isAllDay: event.allDay || false,
      tag: event.extendedProps.tag || "common",
    });
    setIsEdit(true);
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      title: form.title,
      description: form.description,
      location: form.location,
      startTime: new Date(form.startTime),
      endTime: new Date(form.endTime),
      status: form.status,
      isAllDay: form.isAllDay,
      tag: form.tag,
    };

    try {
      if (isEdit && form._id) {
        await queryMCP("calendar", "updateEvent", { ...data, _id: form._id });
      } else {
        await queryMCP("calendar", "createEvent", data);
      }
      setOpenDialog(false);
      fetchEvents();
    } catch (err) {
      console.error("Error saving event:", err);
    }
  };

  const handleDelete = async () => {
    if (!form._id || !window.confirm("Delete this event?")) return;

    try {
      await queryMCP("calendar", "deleteEvent", { _id: form._id });
      setOpenDialog(false);
      fetchEvents();
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  const handleEventDropOrResize = async ({ event, revert }) => {
    try {
      await queryMCP("calendar", "updateEvent", {
        _id: event.id,
        startTime: event.start,
        endTime: event.end || event.start,
        isAllDay: event.allDay,
      });
      fetchEvents();
    } catch (err) {
      console.error("Error updating event", err);
      revert();
    }
  };

  const handlePrompt = async (prompt) => {
  try {
    const res = await fetch("http://localhost:5050/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();

    console.log("✅ Gemini result:", data.result);

    // Refetch events after Gemini performs an action
    fetchEvents();
  } catch (err) {
    console.error("❌ Gemini prompt failed:", err);
  }
};

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Calendar</h1>

      <div className="mb-4 flex justify-end">
        <select
          className="border p-2"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
        >
          <option value="all">All Tags</option>
          <option value="common">Common</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="school">School</option>
        </select>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const prompt = e.target.prompt.value;
          if (!prompt) return;
          handlePrompt(prompt);
          e.target.reset();
        }}
        className="mb-4"
      >
        <input
          name="prompt"
          placeholder="Ask Gemini (e.g. Add a meeting on Friday at 10am)"
          className="border p-2 w-full mb-2"
        />
        <Button type="submit">Submit Prompt</Button>
      </form>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        editable
        selectable
        events={events
          .filter((e) => tagFilter === "all" || e.tag === tagFilter)
          .map((e) => ({
            id: e._id,
            title: e.title,
            start: e.startTime,
            end: e.endTime,
            allDay: e.isAllDay,
            extendedProps: {
              description: e.description,
              location: e.location,
              status: e.status,
              tag: e.tag,
            },
          }))}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDrop={handleEventDropOrResize}
        eventResize={handleEventDropOrResize}
      />

{openDialog && (
  <div
    style={{
      position: "fixed",
      top: "10%",
      left: "50%",
      transform: "translateX(-50%)",
      background: "white",
      border: "1px solid #ccc",
      padding: "20px",
      zIndex: 1000,
      width: "400px",
    }}
  >
    <h2>{isEdit ? "Edit Event" : "Create Event"}</h2>
    <form onSubmit={handleSubmit}>
      <input
        className="border p-2 mb-2 w-full"
        placeholder="Title"
        required
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <textarea
        className="border p-2 mb-2 w-full"
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <input
        className="border p-2 mb-2 w-full"
        placeholder="Location"
        value={form.location}
        onChange={(e) => setForm({ ...form, location: e.target.value })}
      />
      <input
        className="border p-2 mb-2 w-full"
        type="datetime-local"
        required
        value={form.startTime}
        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
      />
      <input
        className="border p-2 mb-2 w-full"
        type="datetime-local"
        required
        value={form.endTime}
        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
      />
<select
  className="border p-2 mb-2 w-full"
  value={form.status}
  onChange={(e) => setForm({ ...form, status: e.target.value })}
>
  <option value="confirmed">Confirmed</option>
  <option value="tentative">Tentative</option>
  <option value="cancelled">Cancelled</option>
  </select>

  <select
    className="border p-2 mb-2 w-full"
    value={form.tag}
    onChange={(e) => setForm({ ...form, tag: e.target.value })}
  >
    <option value="common">Common</option>
    <option value="work">Work</option>
    <option value="personal">Personal</option>
    <option value="school">School</option>
  </select>

  <label className="flex items-center gap-2 mb-4">
    <input
      type="checkbox"
      checked={form.isAllDay}
      onChange={(e) => setForm({ ...form, isAllDay: e.target.checked })}
    />
    All Day Event
  </label>
      <div className="flex gap-2">
        <Button type="submit" className="w-full">
          Save
        </Button>
        {isEdit && (
          <Button
            type="button"
            className="w-full bg-red-500 hover:bg-red-600 text-white"
            onClick={handleDelete}
          >
            Delete
          </Button>
        )}
        <Button
          type="button"
          className="w-full bg-gray-300"
          onClick={() => setOpenDialog(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  </div>
)}
    </div>
  );
}
