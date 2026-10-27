const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

module.exports = async function handler(req, res) {
  const client = await pool.connect();
  try {
    if (req.method === 'POST') {
      const { phone } = req.body;
      if (!phone) return res.status(400).json({ error: 'شماره الزامی است' });

      // ۱. چک کردن وضعیت اشتراک و تعداد عکس
      const userRes = await client.query('SELECT is_subscribed, image_uses FROM users WHERE phone = $1', [phone]);
      if (userRes.rows.length === 0) return res.status(404).json({ error: 'کاربر یافت نشد' });

      const user = userRes.rows[0];
      
      // اگر اشتراک داره، بدون محدودیت اجازه بده
      if (user.is_subscribed) {
        return res.status(200).json({ allowed: true });
      }

      // اگر نداشت، چک کن چند بار عکس فرستاده
      if (user.image_uses >= 3) {
        return res.status(200).json({ allowed: false, message: 'سهمیه ۳ بار شما تمام شده است.' });
      }

      // اگر هنوز به ۳ نرسیده، یکی بهش اضافه کن
      await client.query('UPDATE users SET image_uses = image_uses + 1 WHERE phone = $1', [phone]);
      return res.status(200).json({ allowed: true, remaining: 3 - (user.image_uses + 1) });

    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
