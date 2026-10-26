// api/admin-users.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async function handler(req, res) {
  const client = await pool.connect();

  try {
    if (req.method === 'GET') {
      // دریافت لیست همه کاربران
      const result = await client.query('SELECT * FROM users ORDER BY created_at DESC');
      return res.status(200).json(result.rows);
    } 
    else if (req.method === 'POST') {
      // تغییر وضعیت اشتراک کاربر
      const { phone, status } = req.body;
      if (!phone) return res.status(400).json({ error: 'شماره موبایل الزامی است' });

      await client.query('UPDATE users SET is_subscribed = $1 WHERE phone = $2', [status, phone]);
      return res.status(200).json({ success: true, message: 'وضعیت با موفقیت تغییر کرد' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admin API Error:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
