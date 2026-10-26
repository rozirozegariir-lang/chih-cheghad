export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ingredients } = req.body;
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API Key is not configured' });

  try {
    const response = await fetch('https://1xai.ir/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "شما یک سرآشپز حرفه‌ای هستید. بر اساس موادی که کاربر می‌دهد، یک دستور پخت خوشمزه پیشنهاد بدهید. پاسخ شما باید کاملاً به زبان فارسی باشد. خروجی شما باید دقیقاً فرمت JSON با کلیدهای زیر باشد: food_name (اسم غذا به فارسی)، ingredients_list (مواد لازم به فارسی)، instructions (دستور پخت به فارسی)، image_prompt (یک توضیح انگلیسی بسیار کوتاه برای تولید عکس غذا)." 
          },
          { role: "user", content: `مواد اولیه من: ${ingredients}` }
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
