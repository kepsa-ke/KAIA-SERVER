const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add an event title"],
      trim: true,
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Please add an event description"],
    },
    image: {
      type: String,
      required: [true, "Please add an event image"],
    },
    eventType: {
      type: String,
      required: [true, "Please specify event type"],
      enum: ["online", "in-person", "hybrid"],
      default: "in-person",
    },

    // Event Dates
    startDate: {
      type: Date,
      required: [true, "Please add event start date"],
    },
    endDate: {
      type: Date,
      required: [true, "Please add event end date"],
    },

    // Location details
    location: {
      venue: { type: String, default: "" }, // For in-person events
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      country: { type: String, default: "" },
    },

    // Online event link
    meetingLink: {
      type: String,
      default: "",
      validate: {
        validator: function (v) {
          // Only validate if it's an online or hybrid event
          if (this.eventType === "online" || this.eventType === "hybrid") {
            return v && v.length > 0;
          }
          return true;
        },
        message: "Meeting link is required for online/hybrid events",
      },
    },

    // Contact information
    contactEmail: {
      type: String,
      default: "",
    },
    contactPhone: {
      type: String,
      default: "",
    },

    // Event website/registration link
    eventLink: {
      type: String,
      default: "", // External link for more details or registration
    },

    // Hashtags for search
    hashtags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Analytics
    clicks: {
      type: Number,
      default: 0, // Number of times "See More" was clicked
    },

    // Status
    published: {
      type: Boolean,
      default: true, // Auto-published when created
    },

    // Creator
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },

    // For filtering by event status
    eventStatus: {
      type: String,
      enum: ["upcoming", "ongoing", "past", "cancelled"],
      default: "upcoming",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for checking if event is happening now
eventSchema.virtual("isOngoing").get(function () {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
});

// Virtual for days until event starts
eventSchema.virtual("daysUntilStart").get(function () {
  const now = new Date();
  const diffTime = this.startDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update event status
eventSchema.pre("save", function (next) {
  const now = new Date();

  if (this.endDate < now) {
    this.eventStatus = "past";
  } else if (this.startDate <= now && this.endDate >= now) {
    this.eventStatus = "ongoing";
  } else if (this.startDate > now) {
    this.eventStatus = "upcoming";
  }

  next();
});

// Create indexes for better search performance
eventSchema.index({ title: "text", description: "text", hashtags: "text" });
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ eventStatus: 1 });
eventSchema.index({ published: 1 });
eventSchema.index({ "location.city": 1, "location.country": 1 });

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
