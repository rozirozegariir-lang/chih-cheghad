export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, description } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'عکسی ارسال نشده!' });
    }

    const apiKey = process.env.GROQ_API_KEY; 

    const prompt = `
تو یه تعمیرکار ماهر و دلسوز هستی که می‌خوای به یه نفر که درآمد کمی داره کمک کنی وسیله‌اش رو خودش تعمیر کنه.
کاربر یه عکس از وسیله خرابش فرستاده و توضیح داده که چه مشکلی داره: "${description || 'توضیحی نداده'}"

با لحن خودمونی و ساده اینا رو بگو:
۱. «ایراد چیه؟» → تشخیصت از مشکل چیه.
۲. «چطور تعمیرش کنم؟» → مرحله به مرحله و خیلی ساده توضیح بده چطور درستش کنه (چی لازم داره).
۳. «هزینه تقریبی» → هزینه تقریبی قطعه یا تعمیرکار چقدره.
۴. «هشدار» → نکات ایمنی مهم (مثلاً حتما دوشاخه رو بکش).

قوانین مهم: لحن خودمونی و امیدبخش باشه. از اصطلاحات پیچیده استفاده نکن. اگه عکس یا وسیله خطرناکه (مثل وسایل برقی فشار قوی) حتما هشدار بده.
خروجی رو دقیقا به صورت JSON بده:
{
  "problem": "تشخیص ایراد",
  "steps": "مراحل تعمیر",
  "cost": "هزینه تقریبی",
  "warning": "هشدار ایمنی"
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
