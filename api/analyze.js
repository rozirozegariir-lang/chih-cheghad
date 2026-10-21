export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'عکسی ارسال نشده!' });
    }

    const apiKey = process.env.GROQ_API_KEY; 

    const prompt = `
تو یه کارشناس اشیاء قدیمی و عتیقه‌ای، مثل یه دوست که سال‌هاست توی این کاره. کاربر یه عکس از شیء قدیمی فرستاده. با لحن خودمونی و صمیمی اینا رو بگو:
۱. «چیه این؟» → اسم و نوع شیء رو ساده بگو.
۲. «مال کِیه؟» → تخمین دوره تاریخی.
۳. «چقد می‌ارزه؟» → بازه قیمتی به تومان (بر اساس بازار ایران).
۴. «اصله یا تقلبی؟» → نشونه‌های اصالت یا تقلب.
۵. «یه داستان کوتاه» → ۲-۳ خط درباره تاریخچه یا یه نکته جالب.
قوانین مهم: لحن خودمونی، فارسی محاوره‌ای، کوتاه و خلاصه. اگه مطمئن نیستی صادق باش. آخر جواب بذار: «این نظر تقریبیه، برای فروش با کارشناس مشورت کن.»
خروجی رو دقیقا به صورت JSON بده:
{
  "name": "اسم شیء",
  "period": "دوره تاریخی",
  "price_range": "بازه قیمتی",
  "authenticity": "نظر درباره اصالت",
  "story": "داستان کوتاه",
  "disclaimer": "سلب مسئولیت"
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
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageBase64 } }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5
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
