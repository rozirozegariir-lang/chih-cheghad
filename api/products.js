export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'تنظیمات سوپابیس در ورکل یافت نشد.' });
    }

    const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    if (req.method === 'GET') {
        try {
            const response = await fetch(`${supabaseUrl}/rest/v1/products?select=*&order=created_at.desc`, { headers });
            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: 'خطا در دریافت محصولات' });
        }
    } else if (req.method === 'POST') {
        try {
            const { title, price, image_url, video_url } = req.body;
            
            const response = await fetch(`${supabaseUrl}/rest/v1/products`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    title: title,
                    price: price,
                    image_url: image_url,
                    video_url: video_url || "",
                    category: "gallery"
                })
            });
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'خطا در ثبت');
            }

            const data = await response.json();
            return res.status(200).json({ status: 'success', data: data });
        } catch (error) {
            return res.status(500).json({ error: 'خطا در ثبت محصول' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
