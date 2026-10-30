const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { message, pre_checkout_query } = req.body;
  const token = process.env.BALE_BOT_TOKEN;

  // 1. پاسخ به pre_checkout_query
  if (pre_checkout_query) {
    try {
      await fetch(`https://tapi.bale.ai/bot${token}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pre_checkout_query_id: pre_checkout_query.id, ok: true })
      });
    } catch (e) { console.error('PreCheckout error:', e); }
    return res.status(200).send('OK');
  }

  // 2. پردازش پیام‌های پرداخت موفق
  if (message && message.successful_payment) {
    const payment = message.successful_payment;
    const parts = payment.invoice_payload.split('_');
    const phone = parts[0];
    const planName = parts[2] || '۱ ماهه';
    
    let months = 1;
    if (planName.includes('سال')) months = 12;
    else if (planName.includes('۶')) months = 6;
    else if (planName.includes('۳')) months = 3;
    else months = 1;

    try {
      const client = await pool.connect();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months);
      
      await client.query('UPDATE users SET is_subscribed = true, subscription_end_date = $1 WHERE phone = $2', [endDate, phone]);
      client.release();
      console.log(`✅ اشتراک ${months} ماهه کاربر ${phone} فعال شد.`);

      // ارسال پیام تایید با دکمه بازگشت به سایت
      if (token) {
        await fetch(`https://tapi.bale.ai/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: message.chat.id,
            text: `✅ پرداخت شما با موفقیت انجام شد!\nاشتراک ${months} ماهه شما فعال گردید.\nحالا می‌توانید به سایت برگردید و از تمام امکانات استفاده کنید.`,
            reply_markup: {
              inline_keyboard: [[
                { text: '🚀 بازگشت به سایت همیار زندگی', url: 'https://chih-cheghad.vercel.app' }
              ]]
            }
          })
        });
      }
    } catch (error) {
      console.error('خطا در فعال‌سازی اشتراک:', error);
    }
  }

  // 3. پردازش دستور /start
  if (message && message.text && message.text.startsWith('/start')) {
    const chatId = message.chat.id;
    const parts = message.text.split(' ');
    const phone = parts.length > 1 ? parts[1].trim() : null;

    try {
      const client = await pool.connect();
      
      if (phone) {
        const userCheck = await client.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (userCheck.rows.length > 0) {
          await client.query('UPDATE users SET chat_id = $1 WHERE phone = $2', [chatId, phone]);
        } else {
          await client.query('INSERT INTO users (phone, chat_id) VALUES ($1, $2)', [phone, chatId]);
        }
      }
      
      client.release();

      if (token) {
        await fetch(`https://tapi.bale.ai/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: 'سلام! به ربات همیار زندگی خوش آمدید. ✅\nحساب شما با موفقیت به سایت متصل شد. اکنون می‌توانید از طریق سایت، اشتراک خود را خریداری کنید.',
            reply_markup: {
              inline_keyboard: [[
                { text: '🚀 بازگشت به سایت همیار زندگی', url: 'https://chih-cheghad.vercel.app' }
              ]]
            }
          })
        });
      }
    } catch (error) {
      console.error('خطا در ذخیره chat_id:', error);
    }
  }

  return res.status(200).send('OK');
};
