const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

module.exports = async function handler(req, res) {
    const client = await pool.connect();
    try {
        // 1. دریافت لیست محصولات فروشگاه
        if (req.method === 'GET') {
            const result = await client.query('SELECT * FROM shop_products ORDER BY created_at DESC');
            return res.status(200).json(result.rows);
        }
        
        // 2. ثبت محصول جدید در فروشگاه
        if (req.method === 'POST') {
            const { title, price, image_url, description } = req.body;
            if (!title || !price || !image_url) {
                return res.status(400).json({ error: 'عنوان، قیمت و عکس الزامی هستند.' });
            }
            await client.query(
                'INSERT INTO shop_products (title, price, image_url, description) VALUES ($1, $2, $3, $4)',
                [title, price, image_url, description]
            );
            return res.status(200).json({ success: true });
        }

        // 3. حذف محصول از فروشگاه
        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: 'شناسه محصول الزامی است.' });
            await client.query('DELETE FROM shop_products WHERE id = $1', [id]);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method Not Allowed' });
    } catch (err) {
        console.error('Shop API Error:', err);
        return res.status(500).json({ error: 'خطای داخلی سرور' });
    } finally {
        client.release();
    }
};
