import { Request, Response } from 'express';
import { shortenUrl } from "../services/url.service.js";

export async function createShortUrl(req: Request, res: Response) {
  const { url } = req.body;
  console.log(url)
  if (!url) {
    return res.status(400).json({ message: 'URL is required' });
  }
  const shortUrl = await shortenUrl(url);
  return res.json({
    shortUrl,
  });
}