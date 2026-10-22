export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ingredients } = req.body;

    if (!ingredients) {
      return res.status(400).json({ error: 'موادی رو وارد نکردی!' });
    }

    const apiKey = process.env.GROQ_API_KEY; 

    const prompt = `
تو یه آشپز ماهر و خوش‌اخلاق هستی که می‌خوای با مواد اولیه‌ای که کاربر توی خونه داره، یه غذای خوشمزه پیشنهاد بدی.
کاربر این مواد رو داره: "${ingredients}"

با لحن خودمونی و صمیمی اینا رو بگو:
۱. «اسم غذا» → یه اسم جذاب فارسی.
۲. «مواد لازم» → لیست موادی که لازمه.
۳. «دستور پخت» → مرحله به مرحله و خیلی ساده.
۴. «توضیح عکس» → یک توضیح خیلی کوتاه به زبان انگلیسی برای تولید عکس غذا (مثلاً: A delicious Persian omelette with tomatoes on a white plate, food photography).

مهم‌ترین قانون: مقادیر تمام کلیدها باید حتما یک رشته متن (String) ساده باشند.
خروجی رو دقیقا به صورت JSON بده:
{
  "food_name": "اسم غذا",
  "ingredients_list": "لیست مواد لازم",
  "instructions": "دستور پخت مرحله به مرحله",
  "image_prompt": "English description for image generation"
}
`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'pixtral-12b-2409',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (data.error) {
       return res.status(500).json({ error: data.error.message });
    }

    const result = JSON.parse(data.choices[0].message.content);
    return res.status(200).json(result);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'مشکلی پیش اومد، دوباره تلاش کن.' });
  }
}
