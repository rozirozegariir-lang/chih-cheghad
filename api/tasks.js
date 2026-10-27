const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async function handler(req, res) {
  const client = await pool.connect();

  try {
    // ۱. گرفتن لیست کارها
    if (req.method === 'GET') {
      const result = await client.query('SELECT * FROM tasks ORDER BY created_at DESC');
      return res.status(200).json(result.rows);
    } 
    
    // ۲. ثبت کار جدید
    else if (req.method === 'POST') {
      const { title, description, price, contact } = req.body;
      if (!title || !contact) {
        return res.status(400).json({ error: 'عنوان و شماره تماس الزامی است' });
      }
      await client.query(
        'INSERT INTO tasks (title, description, price, contact) VALUES ($1, $2, $3, $4)',
        [title, description, price, contact]
      );
      return res.status(200).json({ success: true, message: 'کار ثبت شد' });
    } 
    
    // ۳. حذف کار (بر اساس عنوان و شماره تماس)
    else if (req.method === 'DELETE') {
      const { title, contact } = req.query;
      if (!title || !contact) {
        return res.status(400).json({ error: 'عنوان و شماره تماس برای حذف الزامی است' });
      }
      await client.query('DELETE FROM tasks WHERE title = $1 AND contact = $2', [title, contact]);
      return res.status(200).json({ success: true, message: 'کار حذف شد' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Tasks API Error:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
