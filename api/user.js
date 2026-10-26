export default async function handler(req, res) {
  // تنظیمات هدرها برای CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'تنظیمات سوپابیس یافت نشد.' });
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  // ۱. ثبت نام کاربر جدید و بررسی سیستم دعوت
  if (req.method === 'POST') {
    try {
      const { phone, referred_by } = req.body;

      if (!phone) return res.status(400).json({ error: 'شماره موبایل الزامی است' });

      // چک کردن اینکه آیا کاربر قبلا ثبت نام کرده یا نه
      const checkRes = await fetch(`${supabaseUrl}/rest/v1/users?phone=eq.${phone}`, { headers });
      const existingUsers = await checkRes.json();

      if (existingUsers.length > 0) {
        return res.status(200).json({ status: 'already_exists', message: 'کاربر قبلا ثبت نام کرده است', data: existingUsers[0] });
      }

      // ثبت نام کاربر جدید
      const insertData = {
        phone: phone,
        referred_by: referred_by || null
      };

      const insertRes = await fetch(`${supabaseUrl}/rest/v1/users`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(insertData)
      });

      if (!insertRes.ok) throw new Error('خطا در ثبت نام کاربر');

      // اگر با لینک دعوت اومده بود
      if (referred_by && referred_by !== phone) {
        // پیدا کردن معرف (کسی که لینکش رو داده)
        const referrerRes = await fetch(`${supabaseUrl}/rest/v1/users?phone=eq.${referred_by}`, { headers });
        const referrers = await referrerRes.json();

        if (referrers.length > 0) {
          const referrer = referrers[0];
          let newInviteCount = (referrer.invite_count || 0) + 1;
          let shouldSubscribe = referrer.is_subscribed;

          // اگر تعداد دعوت‌ها به ۱۵ رسید، اشتراکش رو فعال کن
          if (newInviteCount >= 15) {
            shouldSubscribe = true;
          }

          // آپدیت کردن اطلاعات معرف در دیتابیس
          await fetch(`${supabaseUrl}/rest/v1/users?phone=eq.${referred_by}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({
              invite_count: newInviteCount,
              is_subscribed: shouldSubscribe
            })
          });
        }
      }

      return res.status(200).json({ status: 'success', message: 'ثبت نام با موفقیت انجام شد' });

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } 
  
  // ۲. دریافت اطلاعات کاربر (برای چک کردن اشتراک)
  else if (req.method === 'GET') {
    try {
      const { phone } = req.query;
      if (!phone) return res.status(400).json({ error: 'شماره موبایل الزامی است' });

      const response = await fetch(`${supabaseUrl}/rest/v1/users?phone=eq.${phone}`, { headers });
      const users = await response.json();

      if (users.length > 0) {
        return res.status(200).json(users[0]);
      } else {
        return res.status(404).json({ error: 'کاربر یافت نشد' });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
