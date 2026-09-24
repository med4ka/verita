/**
 * File: src/index.js
 * Description: Backend entry point — sets up Express (CORS, body limit, health, /api), initializes DB, listens on PORT, graceful shutdown.
 * Part of: API routes / app bootstrap
 * Main dependencies: express, cors, dotenv, pg (via ./db)
 */
require('dotenv').config();

const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { initDb, closeDb } = require('./db');
const apiRouter = require('./routes');
const { notFound, errorHandler } = require('./middleware');

const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const MAX_UPLOAD_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB || 5);

fs.mkdirSync('uploads', { recursive: true });

const app = express();

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: `${MAX_UPLOAD_SIZE_MB}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${MAX_UPLOAD_SIZE_MB}mb` }));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api', apiRouter);

app.use(notFound);
app.use(errorHandler);

/**
 * Initialize DB then start HTTP server. Exits with code 1 if DB init fails.
 *
 * @returns {Promise<void>}
 *
 * Notes:
 * - SIGTERM/SIGINT call closeDb for graceful shutdown.
 */
async function main() {
  try {
    await initDb();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
  });
}

process.on('SIGTERM', closeDb);
process.on('SIGINT', closeDb);

main();
