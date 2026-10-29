if (action === 'create-invoice') {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { phone, amount, planName } = req.body;
  const token = process.env.BALE_BOT_TOKEN;
  const providerToken = process.env.BALE_PAYMENT_TOKEN;
  
  if (!token || !providerToken) {
    console.error('Missing tokens:', { token: !!token, providerToken: !!providerToken });
    return res.status(500).json({ error: 'توکن‌های پرداخت تنظیم نشده‌اند' });
  }

  // 1. دریافت chat_id کاربر از دیتابیس
  const userRes = await client.query('SELECT chat_id FROM users WHERE phone = $1', [phone]);
  if (userRes.rows.length === 0) {
    return res.status(404).json({ error: 'کاربر یافت نشد. لطفاً ابتدا در ربات بله استارت بزنید.' });
  }
  
  const chatId = userRes.rows[0].chat_id;
  if (!chatId) {
    return res.status(400).json({ error: 'شما هنوز در ربات بله استارت نزده‌اید. لطفاً ابتدا به ربات ما در بله بروید و استارت بزنید.' });
  }

  const payload = {
    chat_id: chatId,
    title: `اشتراک ${planName} همیار زندگی`,
    description: `پرداخت برای فعال‌سازی اشتراک ${planName}`,
    payload: phone,
    provider_token: providerToken,
    currency: 'IRR',
    prices: [{ label: planName, amount: parseInt(amount) * 10 }]
  };

  try {
    const baleRes = await fetch(`https://tapi.bale.ai/bot${token}/sendInvoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const baleData = await baleRes.json();
    if (baleData.ok) {
      return res.status(200).json({ success: true, message: 'فاکتور به ربات بله شما ارسال شد.' });
    } else {
      return res.status(400).json({ error: baleData.description || 'خطا در ارسال فاکتور' });
    }
  } catch (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return res.status(500).json({ error: 'خطا در ارتباط با سرور بله' });
  }
}
