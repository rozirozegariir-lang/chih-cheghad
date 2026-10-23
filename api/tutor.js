export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question, imageBase64 } = req.body;
  const apiKey = process.env.HF_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API Key missing' });

  try {
    let content = [];
    if (question) content.push({ type: "text", text: question });
    if (imageBase64) content.push({ type: "image_url", image_url: { url: imageBase64 } });

    if (content.length === 0) return res.status(400).json({ error: 'سوالی پرسیده نشده است' });

    const response = await fetch('https://api-inference.huggingface.co/models/Qwen/Qwen2-VL-7B-Instruct/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2-VL-7B-Instruct",
        messages: [
          { 
            role: "system", 
            content: "تو یک معلم خصوصی دلسوز و بسیار باهوش هستی. وظیفه تو حل مسائل درسی است. اگر عکسی فرستاده شد، متن و اعداد داخل عکس را بخوان و مسئله را قدم به قدم حل کن." 
          },
          { role: "user", content: content }
        ],
        max_tokens: 1000
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'خطا در ارتباط با Hugging Face');
    }

    return res.status(200).json({ text: data.choices[0].message.content });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
