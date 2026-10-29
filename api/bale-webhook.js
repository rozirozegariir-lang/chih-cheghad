// api/bale-webhook.js
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { message } = req.body;

  // 1. پردازش پیام‌های پرداخت موفق
  if (message && message.successful_payment) {
    const payment = message.successful_payment;
    const chatId = message.chat.id;
    const invoicePayload = payment.invoice_payload;
    const phone = invoicePayload;

    try {
      const client = await pool.connect();
      await client.query('UPDATE users SET is_subscribed = true WHERE phone = $1', [phone]);
      client.release();
      console.log(`✅ اشتراک کاربر ${phone} با موفقیت فعال شد.`);
    } catch (error) {
      console.error('خطا در فعال‌سازی اشتراک:', error);
    }
  }

  // 2. پردازش پیام‌های متنی (مخصوصاً /start برای دریافت chat_id)
  if (message && message.text) {
    const chatId = message.chat.id;
    const text = message.text.trim();
    const token = process.env.BALE_BOT_TOKEN;

    // اگر کاربر دستور /start را زد
    if (text.startsWith('/start')) {
      // استخراج شماره موبایل از لینک استارت (اگر وجود داشته باشد)
      const parts = text.split(' ');
      let phone = null;
      
      if (parts.length > 1) {
        // فرض می‌کنیم لینک استارت به این شکل است: /start 09123456789
        phone = parts[1].trim();
      }

      try {
        const client = await pool.connect();
        
        if (phone) {
          // اگر شماره موبایل همراه لینک بود، chat_id رو برای آن کاربر ذخیره کن
          await client.query('UPDATE users SET chat_id = $1 WHERE phone = $2', [chatId, phone]);
        } else {
          // اگر شماره نبود، فقط chat_id رو برای کاربری که قبلاً ثبت‌نام کرده ذخیره کن (اگر پیدا شد)
          // این حالت برای وقتی است که کاربر قبلاً در سایت ثبت‌نام کرده و حالا ربات را استارت می‌زند
          await client.query('UPDATE users SET chat_id = $1 WHERE chat_id IS NULL AND phone = (SELECT phone FROM users WHERE chat_id IS NULL LIMIT 1)', [chatId]); 
          // (این کوئری موقت است و بهتر است شماره از طریق لینک ارسال شود)
        }
        
        client.release();

        // ارسال پیام خوش‌آمدگویی به کاربر
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
  }

  // باید به بله پاسخ 200 بدهیم تا پیام را دوباره نفرستد
  return res.status(200).send('OK');
};
