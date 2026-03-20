import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  provider: "local" | "google" | "github";
  providerId?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    provider: { type: String, enum: ["local", "google", "github"], default: "local" },
    providerId: { type: String },
    avatar: { type: String },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", userSchema);
