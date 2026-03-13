import { CountModel } from "../models/Count.model.js";
import baseX from "base-x";

const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const base62 = baseX(BASE62);

export async function generateShortCode(length: number = 6): Promise<string> {

  const counterDoc = await CountModel.findOneAndUpdate(
    { name: "urlCounter" },
    { $inc: { count: 1 } },
    { new: true, upsert: true }
  );

  if (!counterDoc) {
    throw new Error("Counter document not found");
  }

  const count = counterDoc.count;

  // direct base62 encoding
  const shortCode = base62.encode(Buffer.from(count.toString()));

  return shortCode.slice(0, length).padStart(length, "0");
}