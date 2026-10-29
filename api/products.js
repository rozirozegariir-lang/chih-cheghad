const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const client = await pool.connect();

  try {
    if (req.method === 'GET') {
      const result = await client.query('SELECT * FROM products ORDER BY created_at DESC');
      return res.status(200).json(result.rows);
    }
    
    if (req.method === 'POST') {
      const { title, price, image_url, video_url } = req.body;
      const result = await client.query(
        'INSERT INTO products (title, price, image_url, video_url) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, price, image_url, video_url || null]
      );
      return res.status(200).json(result.rows[0]);
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await client.query('DELETE FROM products WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}
