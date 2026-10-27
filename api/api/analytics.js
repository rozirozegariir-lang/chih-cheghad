const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async function handler(req, res) {
  const client = await pool.connect();

  try {
    // ۱. دریافت آمار (برای پنل ادمین)
    if (req.method === 'GET') {
      const result = await client.query('SELECT * FROM page_views');
      return res.status(200).json(result.rows);
    } 
    
    // ۲. ثبت بازدید جدید (وقتی کاربر روی تب کلیک می‌کند)
    else if (req.method === 'POST') {
      const { tab } = req.body;
      if (!tab) {
        return res.status(400).json({ error: 'نام تب الزامی است' });
      }
      await client.query('UPDATE page_views SET view_count = view_count + 1 WHERE tab_name = $1', [tab]);
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Analytics API Error:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
