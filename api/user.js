// api/user.js
import { Pool } from 'pg';

// ساخت یک اتصال Pool برای مدیریت بهتر درخواست‌ها در محیط Serverless
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // برای اتصال امن به دیتابیس Neon در Vercel
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, referred_by } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'شماره موبایل الزامی است' });
  }

  const client = await pool.connect();

  try {
    // شروع یک تراکنش (Transaction) برای اینکه اگر خطایی پیش اومد، هیچ تغییری در دیتابیس ثبت نشه
    await client.query('BEGIN');

    // ۱. چک کردن اینکه آیا کاربر قبلاً ثبت‌نام کرده یا نه
    const userCheck = await client.query('SELECT * FROM users WHERE phone = $1', [phone]);
    
    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(200).json({ success: true, message: 'کاربر از قبل وجود دارد', user: userCheck.rows[0] });
    }

    // ۲. ثبت‌نام کاربر جدید
    await client.query(
      'INSERT INTO users (phone, referred_by) VALUES ($1, $2)',
      [phone, referred_by || null]
    );

    let referrerStatus = null;

    // ۳. اگر با لینک دعوت اومده، تعداد دعوت‌های معرف رو زیاد کن
    if (referred_by) {
      const referrerCheck = await client.query('SELECT * FROM users WHERE phone = $1', [referred_by]);
      
      if (referrerCheck.rows.length > 0) {
        const referrer = referrerCheck.rows[0];
        const newInviteCount = referrer.invite_count + 1;
        const shouldSubscribe = newInviteCount >= 15; // شرط ۱۵ نفر برای اشتراک رایگان

        await client.query(
          'UPDATE users SET invite_count = $1, is_subscribed = $2 WHERE phone = $3',
          [newInviteCount, shouldSubscribe, referred_by]
        );

        referrerStatus = {
          phone: referred_by,
          invite_count: newInviteCount,
          is_subscribed: shouldSubscribe
        };
      }
    }

    // پایان تراکنش و ذخیره تغییرات
    await client.query('COMMIT');

    return res.status(200).json({ 
      success: true, 
      message: 'ثبت‌نام با موفقیت انجام شد',
      referrer: referrerStatus 
    });

  } catch (error) {
    // در صورت بروز خطا، تمام تغییرات نیمه‌کاره لغو میشه
    await client.query('ROLLBACK');
    console.error('Database error:', error);
    return res.status(500).json({ error: 'خطای دیتابیس', detail: error.message });
  } finally {
    // آزادسازی اتصال
    client.release();
  }
}
