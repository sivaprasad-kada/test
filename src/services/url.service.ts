import { generateShortCode } from '../utils/generateShortCode.js';
import { UrlModel } from "../models/url.model.js";

export async function shortenUrl(longUrl: string) {
  const shortCode = await generateShortCode();
  const shortUrl = `http://localhost:3000/${shortCode}`;

  // Save the mapping to the database
  await UrlModel.create({
    shortUrl: shortCode,
    longUrl: longUrl,
  });

  return shortUrl;
}

export async function getLongUrl(shortId: string): Promise<string | null> {

  const urlDoc = await UrlModel.findOneAndUpdate(
    { shortUrl: shortId },
    { $inc: { clicks: 1 } },
    { returnDocument: 'after' }
  ).select("longUrl");

  if (!urlDoc) {
    return null;
  }

  return urlDoc.longUrl ?? null;
}