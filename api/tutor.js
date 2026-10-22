export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question, imageBase64 } = req.body;

  try {
    let content = [];
    if (question) content.push({ type: "text", text: question });
    if (imageBase64) content.push({ type: "image_url", image_url: { url: imageBase64 } });

    if (content.length === 0) return res.status(400).json({ error: 'سوالی پرسیده نشده است' });

    let userMessage = content.length === 1 && content[0].type === 'text' ? content[0].text : content;

    // اتصال به سرویس پایدار Pollinations (بدون نیاز به API Key)
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "openai", // این مدل هم متن و هم عکس رو عالی می‌فهمه
        messages: [
          { 
            role: "system", 
            content: "تو یک معلم خصوصی دلسوز، صبور و بسیار باهوش هستی. به سوالات درسی پاسخ کامل، ساده و قدم به قدم بده. اگر عکسی فرستاده شد، مسئله داخل آن را حل کن." 
          },
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'خطا در ارتباط با سرور');
    }

    return res.status(200).json({ text: data.choices[0].message.content });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
