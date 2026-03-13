import mongoose, { Document, Schema } from "mongoose";

export interface IAnalytics extends Document {
  shortUrl: string;
  date: Date;
  totalClicks: number;
  countryStats: Record<string, number>;
  deviceStats: Record<string, number>;
}

const analyticsSchema = new Schema<IAnalytics>({
  shortUrl: {
    type: String,
    required: true,
    index: true
  },

  date: {
    type: Date,
    required: true,
    index: true
  },

  totalClicks: {
    type: Number,
    default: 0
  },

  countryStats: {
    type: Map,
    of: Number,
    default: {}
  },

  deviceStats: {
    type: Map,
    of: Number,
    default: {}
  }
});

export const Analytics = mongoose.model<IAnalytics>(
  "Analytics",
  analyticsSchema
);