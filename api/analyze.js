export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const apiKey = process.env.XAI_API_KEY; 
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key is not configured in Vercel' });
  }

  try {
    const response = await fetch('https://1xai.ir/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // مدل اقتصادی و سریع
        messages: [
          {
            role: "system",
            content: "شما یک کارشناس خبره عتیقه‌جات، آثار باستانی و اشیای قدیمی هستید. بر اساس عکسی که کاربر می‌فرستد، شیء را شناسایی کرده و اطلاعات دقیقی به زبان فارسی بدهید. خروجی شما باید دقیقاً یک فرمت JSON معتبر باشد که شامل کلیدهای زیر است: name (نام شیء)، period (دوره تاریخی)، price_range (محدوده قیمت به تومان)، authenticity (اصالت)، story (توضیح و داستان شیء)، disclaimer (سلب مسئولیت)."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "لطفا این شیء را تحلیل کن و اطلاعاتش را بده." },
              { type: "image_url", image_url: { url: imageBase64 } }
            ]
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Error from 1xAI API');
    }

    // استخراج پاسخ JSON
    const aiContent = JSON.parse(data.choices[0].message.content);
    
    // برگرداندن نتیجه به فرانت‌اند
    return res.status(200).json(aiContent);

  } catch (error) {
    console.error('AI Error:', error);
    return res.status(500).json({ error: error.message || 'خطا در ارتباط با سرور هوش مصنوعی' });
  }
}
