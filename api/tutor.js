export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question, imageBase64 } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API Key missing' });

  try {
    let content = [];
    
    // اضافه کردن متن سوال
    if (question) {
      content.push({ type: "text", text: question });
    }
    
    // اضافه کردن عکس در صورت وجود
    if (imageBase64) {
      content.push({ type: "image_url", image_url: { url: imageBase64 } });
    }

    if (content.length === 0) {
      return res.status(400).json({ error: 'سوالی پرسیده نشده است' });
    }

    // اگر فقط متن بود، به صورت رشته ساده ارسال میکنیم
    let userMessage = content.length === 1 && content[0].type === 'text' ? content[0].text : content;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chih-cheghad.vercel.app',
        'X-Title': 'Chih Cheghad Tutor'
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
        messages: [
          { 
            role: "system", 
            content: "تو یک معلم خصوصی دلسوز، صبور و بسیار باهوش هستی. به سوالات درسی دانش‌آموزان پاسخ کامل، ساده و قدم به قدم بده. اگر عکسی فرستاده شد، متن یا مسئله داخل عکس را با دقت بخوان و حل کن." 
          },
          { 
            role: "user", 
            content: userMessage 
          }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'خطا در ارتباط با OpenRouter');
    }

    return res.status(200).json({ text: data.choices[0].message.content });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
