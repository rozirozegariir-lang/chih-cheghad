export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ingredients } = req.body;
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API Key is not configured' });

  try {
    // ۱. گرفتن دستور پخت از هوش مصنوعی (متن)
    const textResponse = await fetch('https://1xai.ir/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "شما یک سرآشپز حرفه‌ای هستید. بر اساس موادی که کاربر می‌دهد، یک دستور پخت خوشمزه به زبان فارسی پیشنهاد بدهید. خروجی دقیقاً فرمت JSON با کلیدهای زیر باشد: food_name (اسم غذا)، ingredients_list (مواد لازم)، instructions (دستور پخت)، image_prompt (یک توضیح انگلیسی دقیق و کوتاه برای تولید عکس غذا)." },
          { role: "user", content: `مواد اولیه من: ${ingredients}` }
        ],
        response_format: { type: "json_object" }
      })
    });
    
    const textData = await textResponse.json();
    if (!textResponse.ok) throw new Error(textData.error?.message || 'Error in recipe');
    const recipe = JSON.parse(textData.choices[0].message.content);

    // ۲. ساخت عکس با DALL-E 3 از طریق 1xAi
    let image_url = "";
    if (recipe.image_prompt) {
      const imgResponse = await fetch('https://1xai.ir/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: recipe.image_prompt + ", professional food photography, highly detailed, appetizing",
          n: 1,
          size: "1024x1024"
        })
      });
      
      const imgData = await imgResponse.json();
      if (imgResponse.ok && imgData.data && imgData.data.length > 0) {
        image_url = imgData.data[0].url; // لینک عکس تولید شده
      }
    }

    // برگرداندن همه اطلاعات (به همراه لینک عکس) به سایت
    return res.status(200).json({ ...recipe, image_url: image_url });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
