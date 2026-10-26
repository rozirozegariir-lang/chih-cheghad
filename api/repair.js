export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API Key is not configured' });

  try {
    // حالت اول: کاربر داره چت می‌کنه (تاریخچه پیام‌ها فرستاده شده)
    if (req.body.messages) {
      const response = await fetch('https://1xai.ir/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "شما یک تعمیرکار ماهر و باتجربه هستید. به کاربر برای تعمیر وسایلش کمک کنید. پاسخ‌ها کوتاه و مفید باشند." },
            ...req.body.messages
          ]
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Error from AI');
      return res.status(200).json({ text: data.choices[0].message.content });
    }

    // حالت دوم: کاربر عکس فرستاده برای تشخیص اولیه
    const { imageBase64, description } = req.body;
    const response = await fetch('https://1xai.ir/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "شما یک تعمیرکار حرفه‌ای هستید. عکس و توضیحات کاربر را بررسی کنید. خروجی باید دقیقاً فرمت JSON با کلیدهای زیر باشد: problem (تشخیص مشکل)، initial_step (اقدام اولیه)، ask_user (سوالی که باید از کاربر بپرسید)، cost (هزینه تقریبی)، warning (هشدار ایمنی)." },
          { 
            role: "user", 
            content: [
              { type: "text", text: `وسیله: ${description || 'نامشخص'}` },
              { type: "image_url", image_url: { url: imageBase64 } }
            ] 
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Error from AI');

    return res.status(200).json(JSON.parse(data.choices[0].message.content));

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
