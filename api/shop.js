const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async function handler(req, res) {
  const client = await pool.connect();

  try {
    // ۱. دریافت لیست محصولات فروشگاه
    if (req.method === 'GET') {
      const result = await client.query('SELECT * FROM shop_products ORDER BY created_at DESC');
      return res.status(200).json(result.rows);
    } 
    
    // ۲. ثبت محصول جدید در فروشگاه
    else if (req.method === 'POST') {
      const { title, price, image_url, description, bale_link } = req.body;
      
      if (!title || !price || !image_url) {
        return res.status(400).json({ error: 'عنوان، قیمت و عکس محصول الزامی است' });
      }

      await client.query(
        'INSERT INTO shop_products (title, price, image_url, description, bale_link) VALUES ($1, $2, $3, $4, $5)',
        [title, price, image_url, description || '', bale_link || 'https://ble.ir/diirinbot']
      );
      
      return res.status(200).json({ success: true, message: 'محصول با موفقیت ثبت شد' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Shop API Error:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
