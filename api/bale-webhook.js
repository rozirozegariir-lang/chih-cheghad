const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { message } = req.body;
  const token = process.env.BALE_BOT_TOKEN;

  // 1. پردازش پیام‌های پرداخت موفق
  if (message && message.successful_payment) {
    const payment = message.successful_payment;
    const phone = payment.invoice_payload;

    try {
      const client = await pool.connect();
      await client.query('UPDATE users SET is_subscribed = true WHERE phone = $1', [phone]);
      client.release();
      console.log(`✅ اشتراک کاربر ${phone} فعال شد.`);
    } catch (error) {
      console.error('خطا در فعال‌سازی اشتراک:', error);
    }
  }

  // 2. پردازش دستور /start برای ذخیره chat_id
  if (message && message.text && message.text.startsWith('/start')) {
    const chatId = message.chat.id;
    const parts = message.text.split(' ');
    const phone = parts.length > 1 ? parts[1].trim() : null;

    try {
      const client = await pool.connect();
      
      if (phone) {
        // اگر شماره موبایل همراه لینک بود، chat_id رو برای آن کاربر ذخیره کن
        const userCheck = await client.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (userCheck.rows.length > 0) {
          await client.query('UPDATE users SET chat_id = $1 WHERE phone = $2', [chatId, phone]);
        } else {
          // اگر کاربر قبلاً ثبت‌نام نکرده بود، با شماره و chat_id ثبت‌نام کن
          await client.query('INSERT INTO users (phone, chat_id) VALUES ($1, $2)', [phone, chatId]);
        }
      }
      
      client.release();

      // ارسال پیام خوش‌آمدگویی
      if (token) {
        await fetch(`https://tapi.bale.ai/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: 'سلام! به ربات همیار زندگی خوش آمدید. ✅\nحساب شما با موفقیت به سایت متصل شد. اکنون می‌توانید از طریق سایت، اشتراک خود را خریداری کنید.'
          })
        });
      }
    } catch (error) {
      console.error('خطا در ذخیره chat_id:', error);
    }
  }

  return res.status(200).send('OK');
};
