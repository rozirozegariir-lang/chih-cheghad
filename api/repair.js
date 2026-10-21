export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, description, messages } = req.body;
    const apiKey = process.env.GROQ_API_KEY; 

    let apiMessages = [];
    let isFollowUp = false;

    if (messages && messages.length > 0) {
      apiMessages = messages;
      isFollowUp = true;
    } else {
      if (!imageBase64) return res.status(400).json({ error: 'عکسی ارسال نشده!' });
      
      const prompt = `
تو یه تعمیرکار ماهر، صبور و دلسوز هستی که قدم به قدم به کاربر کمک می‌کنی.
کاربر یه عکس فرستاده و گفته: "${description || 'توضیحی نداده'}"
چون یه عکس کافی نیست، تو باید مثل یه تعمیرکار واقعی ازش بخوای مراحل رو با تو انجام بده.

در این مرحله اول فقط اینا رو بگو:
۱. «تشخیص اولیه» → به نظرت مشکل چیه؟
۲. «اقدام اولیه» → برای اینکه خطری نباشه، همین الان چیکار کنه.
۳. «درخواست بعدی» → ازش بخواه یه عکس دیگه از قسمت خاصی بگیره یا یه تست کوچیک انجام بده (مثلاً بگو: "می‌خوای تعمیرش کنی؟ عکس پشت دستگاه رو برام بفرست تا دقیق‌تر راهنماییت کنم").
۴. «هزینه تقریبی» → یه بازه قیمتی کلی.
۵. «هشدار ایمنی» → نکات مهم.

مهم‌ترین قانون: مقادیر تمام کلیدها باید حتما یک رشته متن (String) ساده باشند.
خروجی رو دقیقا به صورت JSON بده:
{
  "problem": "تشخیص اولیه",
  "initial_step": "اقدام اولیه",
  "ask_user": "درخواست بعدی و سوال از کاربر",
  "cost": "بازه قیمتی",
  "warning": "هشدار ایمنی"
}
`;
      apiMessages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageBase64 } }
          ]
        }
      ];
    }

    const body = {
      model: 'pixtral-12b-2409',
      messages: apiMessages,
      temperature: 0.5
    };

    if (!isFollowUp) {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (data.error) {
       return res.status(500).json({ error: data.error.message });
    }

    const result = data.choices[0].message.content;
    return res.status(200).json(isFollowUp ? { text: result } : JSON.parse(result));

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'مشکلی پیش اومد، دوباره تلاش کن.' });
  }
}
