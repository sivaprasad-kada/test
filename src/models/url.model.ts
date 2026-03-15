import mongoose, { Document, Schema } from "mongoose";

/**
 * URL Model
 * ─────────
 * Stores the mapping between short codes and original URLs.
 * The `shortId` field is indexed for fast lookups during redirect.
 */

export interface IUrl extends Document {
  shortId: string;
  longUrl: string;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const urlSchema = new Schema<IUrl>(
  {
    shortId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    longUrl: {
      type: String,
      required: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

export const UrlModel = mongoose.model<IUrl>("Url", urlSchema);
