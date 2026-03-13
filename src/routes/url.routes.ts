import { Router } from 'express';
import { createShortUrl } from '../controllers/url.short.controller.js';

const router = Router();

router.post('/shorten', createShortUrl);
export default router;