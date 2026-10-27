// api/bale-webhook.js
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { message } = req.body;

  // بررسی اینکه پیام مربوط به پرداخت موفق هست یا نه
  if (message && message.successful_payment) {
    const payment = message.successful_payment;
    const chatId = message.chat.id;
    const invoicePayload = payment.invoice_payload; // این همون شماره موبایل یا شناسه سفارشه
    
    // استخراج شماره موبایل از payload (بسته به ساختار دلخواه شما)
    const phone = invoicePayload; 

    try {
      const client = await pool.connect();
      // فعال‌سازی خودکار اشتراک کاربر
      await client.query('UPDATE users SET is_subscribed = true WHERE phone = $1', [phone]);
      client.release();
      console.log(`اشتراک برای شماره ${phone} با موفقیت فعال شد.`);
    } catch (error) {
      console.error('خطا در فعال‌سازی اشتراک:', error);
    }
  }

  // همیشه باید به بله پاسخ 200 بدید تا پیام رو دوباره نفرسته
  return res.status(200).send('OK');
};
