export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // حداکثر حجم مجاز
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fileName, fileType, base64Data } = req.body;
  if (!base64Data) return res.status(400).json({ error: 'No file data' });

  // تبدیل دیتای بیس۶۴ به فایل باینری
  const buffer = Buffer.from(base64Data.replace(/^data:.*;base64,/, ""), 'base64');
  
  const SUPABASE_URL = "https://grfeyftvktknbrphphafqf.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmV5ZnR2a3RuYnJwaHBoYWZxZiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzkyNTI3MDM4LCJleHAiOjIxMDgxMDMwMzh9.Pl7iuL3kJFNPGoW2NMPIm88jGBRYHiaJQuROjGdPZ-M";

  try {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/products/${fileName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': fileType
      },
      body: buffer
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/products/${fileName}`;
    res.status(200).json({ url: publicUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
