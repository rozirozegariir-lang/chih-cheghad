export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question, imageBase64 } = req.body;
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API Key is not configured' });

  try {
    let userContent = [];
    if (question) userContent.push({ type: "text", text: question });
    if (imageBase64) userContent.push({ type: "image_url", image_url: { url: imageBase64 } });

    const response = await fetch('https://1xai.ir/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "شما یک معلم خصوصی، بسیار صبور و دقیق هستید. به سوالات درسی دانش‌آموزان به زبان فارسی پاسخ دهید. اگر عکسی فرستادند، مسئله را حل کنید." },
          { role: "user", content: userContent }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Error from AI');

    return res.status(200).json({ text: data.choices[0].message.content });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
