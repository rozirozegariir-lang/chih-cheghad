export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question, imageBase64 } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API Key missing' });

  // لیست جدید مدل‌های رایگان و پایدار (به ترتیب اولویت)
  const models = [
    "meta-llama/llama-3.2-11b-vision-instruct:free",
    "qwen/qwen2.5-vl-72b-instruct:free",
    "nvidia/nemotron-nano-12b-v2-vl:free",
    "google/gemma-4-26b-a4b-it:free"
  ];

  let lastError = null;

  for (const model of models) {
    try {
      let content = [];
      if (question) content.push({ type: "text", text: question });
      if (imageBase64) content.push({ type: "image_url", image_url: { url: imageBase64 } });

      if (content.length === 0) return res.status(400).json({ error: 'سوالی پرسیده نشده است' });

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
          model: model,
          messages: [
            { 
              role: "system", 
              content: "تو یک معلم خصوصی دلسوز و بسیار باهوش هستی. وظیفه تو حل مسائل درسی است. اگر عکسی فرستاده شد، متن و اعداد داخل عکس را بخوان و مسئله را قدم به قدم حل کن." 
            },
            { role: "user", content: userMessage }
          ]
        })
      });

      const data = await response.json();

      if (response.ok) {
        return res.status(200).json({ text: data.choices[0].message.content });
      }

      lastError = data.error?.message || `مدل ${model} در دسترس نیست`;
      console.warn(`Model ${model} failed:`, lastError);

    } catch (error) {
      lastError = error.message;
      console.warn(`Model ${model} error:`, lastError);
    }
  }

  return res.status(500).json({ error: `همه مدل‌ها با خطا مواجه شدند. آخرین خطا: ${lastError}` });
}
