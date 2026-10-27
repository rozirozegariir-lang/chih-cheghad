const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

module.exports = async function handler(req, res) {
  const { action } = req.query;
  const client = await pool.connect();

  try {
    // بررسی سهمیه عکس
    if (action === 'check-image') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { phone } = req.body;
      if (!phone) return res.status(400).json({ error: 'شماره الزامی است' });

      const userRes = await client.query('SELECT is_subscribed, image_uses FROM users WHERE phone = $1', [phone]);
      if (userRes.rows.length === 0) return res.status(404).json({ error: 'کاربر یافت نشد' });

      const user = userRes.rows[0];
      if (user.is_subscribed) return res.status(200).json({ allowed: true });

      const currentUses = user.image_uses || 0;
      if (currentUses >= 3) return res.status(200).json({ allowed: false, message: 'سهمیه ۳ بار شما تمام شده است.' });

      await client.query('UPDATE users SET image_uses = COALESCE(image_uses, 0) + 1 WHERE phone = $1', [phone]);
      return res.status(200).json({ allowed: true, remaining: 3 - (currentUses + 1) });
    }

    // ثبت نام کاربر
    if (req.method === 'POST') {
      const { phone, referred_by } = req.body;
      if (!phone) return res.status(400).json({ error: 'شماره الزامی است' });

      const userCheck = await client.query('SELECT * FROM users WHERE phone = $1', [phone]);
      if (userCheck.rows.length > 0) return res.status(200).json({ success: true, message: 'کاربر وجود دارد' });

      await client.query('INSERT INTO users (phone, referred_by) VALUES ($1, $2)', [phone, referred_by || null]);

      if (referred_by) {
        await client.query('UPDATE users SET invite_count = invite_count + 1 WHERE phone = $1', [referred_by]);
        const refCheck = await client.query('SELECT invite_count FROM users WHERE phone = $1', [referred_by]);
        if (refCheck.rows[0].invite_count >= 15) {
          await client.query('UPDATE users SET is_subscribed = true WHERE phone = $1', [referred_by]);
        }
      }

      // ارسال اعلان مستقیم به بله (بدون واسطه)
      const token = process.env.BALE_BOT_TOKEN;
      const chatId = process.env.BALE_ADMIN_CHAT_ID;
      
      if (token && chatId) {
        try {
          const baleRes = await fetch(`https://tapi.bale.ai/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: `🔔 کاربر جدید!\nشماره: ${phone}\nمعرف: ${referred_by || 'ندارد'}` })
          });
          const baleData = await baleRes.json();
          console.log('Bale Notify Response:', baleData); // برای دیباگ در Vercel
        } catch (e) {
          console.error('Bale Notify Error:', e);
        }
      } else {
        console.log('Bale token or chat ID is missing in Env vars');
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
