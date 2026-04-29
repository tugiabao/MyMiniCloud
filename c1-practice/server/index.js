import express from 'express';
import pg from 'pg';
import * as Minio from 'minio';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Serve static files from the build directory
app.use(express.static(path.join(__dirname, '../dist')));

// DB Config
const db = new Client({
  host: process.env.DB_HOST || 'c3',
  port: 5432,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'mysecretpassword',
  database: process.env.DB_NAME || 'myminicloud_db',
});

// Storage Config
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'c5',
  port: 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

const upload = multer({ storage: multer.memoryStorage() });

// Connect DB & Create Table
async function init() {
  try {
    await db.connect();
    console.log('Connected to PostgreSQL');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS practice_history (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        text TEXT NOT NULL,
        ipa TEXT,
        analysis JSONB,
        feedback JSONB,
        audio_key TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create bucket if not exists
    const bucketName = 'practice-audio';
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log('Created bucket: practice-audio');
    }
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

init();

// APIs
app.get('/api/history', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  
  try {
    const result = await db.query(
      'SELECT * FROM practice_history WHERE user_id = $1 ORDER BY timestamp DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/history', upload.single('audio'), async (req, res) => {
  const { userId, text, ipa, analysis, feedback } = req.body;
  let audioKey = null;

  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    if (req.file) {
      audioKey = `${userId}-${Date.now()}.webm`;
      await minioClient.putObject('practice-audio', audioKey, req.file.buffer);
    }

    const result = await db.query(
      'INSERT INTO practice_history (user_id, text, ipa, analysis, feedback, audio_key) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, text, ipa, analysis, feedback, audioKey]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/history/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  try {
    // 1. Lấy thông tin bản ghi để có audio_key
    const recordResult = await db.query('SELECT audio_key FROM practice_history WHERE id = $1 AND user_id = $2', [id, userId]);
    const audioKey = recordResult.rows[0]?.audio_key;

    // 2. Xóa khỏi Postgres
    await db.query('DELETE FROM practice_history WHERE id = $1 AND user_id = $2', [id, userId]);
    
    // 3. Nếu có file âm thanh, xóa khỏi MinIO
    if (audioKey) {
      try {
        await minioClient.removeObject('practice-audio', audioKey);
        console.log(`Deleted MinIO object: ${audioKey}`);
      } catch (minioErr) {
        console.error('Error deleting from MinIO:', minioErr);
        // Không chặn luồng response nếu chỉ lỗi xóa file
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete history error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/audio/:key', async (req, res) => {
  try {
    const dataStream = await minioClient.getObject('practice-audio', req.params.key);
    res.setHeader('Content-Type', 'audio/webm');
    dataStream.pipe(res);
  } catch (err) {
    console.error('Error streaming audio:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fallback to React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
