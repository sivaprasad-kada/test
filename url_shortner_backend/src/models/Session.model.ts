import mongoose, { Document, Schema } from "mongoose";

export interface ISession extends Document {
  sessionId: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    createdAt: { type: Date, default: Date.now },
  }
);

export const SessionModel = mongoose.model<ISession>("Session", sessionSchema);
