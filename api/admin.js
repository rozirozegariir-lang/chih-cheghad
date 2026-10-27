const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

module.exports = async function handler(req, res) {
  const { action } = req.query;

  // ۱. لاگین ادمین
  if (action === 'login') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const inputPassword = (req.body.password || '').trim();
    const adminPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim();
    
    // این دو خط، دقیقاً چیزی که مرورگر فرستاده و چیزی که سرور انتظار دارد را در لاگ‌های Vercel چاپ می‌کنند
    console.log('--- LOGIN ATTEMPT ---');
    console.log('Password from Chrome:', JSON.stringify(inputPassword));
    console.log('Password from Vercel:', JSON.stringify(adminPassword));

    if (inputPassword === adminPassword) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ error: 'رمز عبور اشتباه است' });
    }
  }

  // بقیه بخش‌ها
  let client;
  try {
    client = await pool.connect();

    if (action === 'list-users') {
      const result = await client.query('SELECT * FROM users ORDER BY created_at DESC');
      return res.status(200).json(result.rows);
    }

    if (action === 'toggle-subscription') {
      const { phone, status } = req.body;
      await client.query('UPDATE users SET is_subscribed = $1 WHERE phone = $2', [status, phone]);
      return res.status(200).json({ success: true });
    }

    if (action === 'get-settings') {
      const result = await client.query('SELECT value_text FROM app_settings WHERE key_name = $1', ['chef_prompt']);
      return res.status(200).json({ chef_prompt: result.rows[0]?.value_text || '' });
    }

    if (action === 'update-settings') {
      const { chef_prompt } = req.body;
      await client.query('UPDATE app_settings SET value_text = $1 WHERE key_name = $2', [chef_prompt, 'chef_prompt']);
      return res.status(200).json({ success: true });
    }

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
    console.error('Admin API Error:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
};
