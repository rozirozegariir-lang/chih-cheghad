const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

module.exports = async function handler(req, res) {
  const client = await pool.connect();
  try {
    if (req.method === 'POST') {
      const { phone, referred_by } = req.body;
      if (!phone) return res.status(400).json({ error: 'شماره الزامی است' });

      const userCheck = await client.query('SELECT * FROM users WHERE phone = $1', [phone]);
      if (userCheck.rows.length > 0) {
        return res.status(200).json({ success: true, message: 'کاربر وجود دارد', user: userCheck.rows[0] });
      }

      await client.query('INSERT INTO users (phone, referred_by) VALUES ($1, $2)', [phone, referred_by || null]);

      if (referred_by) {
        await client.query('UPDATE users SET invite_count = invite_count + 1 WHERE phone = $1', [referred_by]);
        const refCheck = await client.query('SELECT invite_count FROM users WHERE phone = $1', [referred_by]);
        if (refCheck.rows[0].invite_count >= 15) {
          await client.query('UPDATE users SET is_subscribed = true WHERE phone = $1', [referred_by]);
        }
      }

      // ارسال اعلان ثبت نام به بله
      const token = process.env.BALE_BOT_TOKEN;
      const chatId = process.env.BALE_ADMIN_CHAT_ID;
      if (token && chatId) {
        try {
          await fetch(`https://tapi.bale.ai/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: `🔔 کاربر جدید ثبت نام کرد!\nشماره: ${phone}\nمعرف: ${referred_by || 'ندارد'}` })
          });
        } catch (e) { console.log('Notify error', e); }
      }

      return res.status(200).json({ success: true, message: 'ثبت‌نام موفق' });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
