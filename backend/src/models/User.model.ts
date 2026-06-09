import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  provider: "local" | "google" | "github";
  providerId?: string;
  avatar?: string;
  plan: "FREE" | "PRO";
  subscriptionStatus?: string;
  subscriptionId?: string;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  monthlyRedirectCount: number;
  redirectQuotaResetDate?: Date;
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
    plan: { type: String, enum: ["FREE", "PRO"], default: "FREE" },
    subscriptionStatus: { type: String },
    subscriptionId: { type: String, index: true },
    subscriptionStartDate: { type: Date },
    subscriptionEndDate: { type: Date },
    monthlyRedirectCount: { type: Number, default: 0 },
    redirectQuotaResetDate: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", userSchema);

