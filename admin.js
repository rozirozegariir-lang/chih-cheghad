const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

module.exports = async function handler(req, res) {
  const { action } = req.query;
  const client = await pool.connect();

  try {
    // ۱. لاگین ادمین
    if (action === 'login') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { password } = req.body;
      const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
      if (password === adminPass) return res.status(200).json({ success: true });
      return res.status(401).json({ error: 'رمز اشتباه است' });
    }

    // ۲. لیست کاربران
    if (action === 'list-users') {
      const result = await client.query('SELECT * FROM users ORDER BY created_at DESC');
      return res.status(200).json(result.rows);
    }

    // ۳. تغییر وضعیت اشتراک کاربر
    if (action === 'toggle-subscription') {
      const { phone, status } = req.body;
      await client.query('UPDATE users SET is_subscribed = $1 WHERE phone = $2', [status, phone]);
      return res.status(200).json({ success: true });
    }

    // ۴. دریافت تنظیمات آشپز
    if (action === 'get-settings') {
      const result = await client.query('SELECT value_text FROM app_settings WHERE key_name = $1', ['chef_prompt']);
      return res.status(200).json({ chef_prompt: result.rows[0]?.value_text || '' });
    }

    // ۵. ذخیره تنظیمات آشپز
    if (action === 'update-settings') {
      const { chef_prompt } = req.body;
      await client.query('UPDATE app_settings SET value_text = $1 WHERE key_name = $2', [chef_prompt, 'chef_prompt']);
      return res.status(200).json({ success: true });
    }

    // ۶. ارسال اعلان به بله
    if (action === 'notify') {
      const { message } = req.body;
      const token = process.env.BALE_BOT_TOKEN;
      const chatId = process.env.BALE_ADMIN_CHAT_ID;
      if (token && chatId) {
        try {
          await fetch(`https://tapi.bale.ai/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: message })
          });
        } catch (e) { console.log('Notify error', e); }
      }
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Action not found' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
