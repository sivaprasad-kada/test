import mongoose, { Document, Schema } from "mongoose";

/**
 * Analytics Model
 * ───────────────
 * Stores aggregated analytics per shortId per date.
 * Data is synced periodically from Redis counters.
 *
 * Compound index on { shortId, date } ensures efficient
 * upserts and queries for a specific URL on a specific day.
 */

export interface IAnalytics extends Document {
  shortId: string;
  urlId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format

  totalClicks: number;
  uniqueVisitors: number;

  countries: Record<string, number>;
  browsers: Record<string, number>;
  devices: Record<string, number>;
}

const analyticsSchema = new Schema<IAnalytics>(
  {
    shortId: {
      type: String,
      required: true,
    },
    urlId: {
      type: Schema.Types.ObjectId,
      ref: "Url",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
    },
    totalClicks: {
      type: Number,
      default: 0,
    },
    uniqueVisitors: {
      type: Number,
      default: 0,
    },
    countries: {
      type: Schema.Types.Mixed,
      default: {},
    },
    browsers: {
      type: Schema.Types.Mixed,
      default: {},
    },
    devices: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient upserts: one document per shortId per day
analyticsSchema.index({ shortId: 1, date: 1 }, { unique: true });
// Index on userId for user-specific queries
analyticsSchema.index({ userId: 1 });

export const AnalyticsModel = mongoose.model<IAnalytics>(
  "Analytics",
  analyticsSchema
);