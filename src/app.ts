import express from 'express';
import urlRoutes from './routes/url.routes.js';
import urlRedirect from "./routes/url.redirect.js"

import { connectDB } from './config/db.js';

const app = express();
connectDB()
app.use(express.json());

app.use('/api/url', urlRoutes);
app.use("/", urlRedirect);


export default app;