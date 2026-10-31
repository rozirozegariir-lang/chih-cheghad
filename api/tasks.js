const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    const client = await pool.connect();
    try {
        if (req.method === 'GET') {
            const result = await client.query('SELECT * FROM tasks ORDER BY created_at DESC');
            return res.status(200).json(result.rows);
        }
        
        if (req.method === 'POST') {
            const { title, description, price, contact } = req.body;
            if (!title || !contact) {
                return res.status(400).json({ error: 'عنوان و شماره تماس الزامی هستند.' });
            }
            await client.query(
                'INSERT INTO tasks (title, description, price, contact) VALUES ($1, $2, $3, $4)',
                [title, description || null, price || null, contact]
            );
            return res.status(200).json({ success: true });
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ error: 'شناسه کار الزامی است.' });
            }
            await client.query('DELETE FROM tasks WHERE id = $1', [id]);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method Not Allowed' });
    } catch (err) {
        console.error('Tasks API Error:', err);
        return res.status(500).json({ error: 'خطای داخلی سرور: ' + err.message });
    } finally {
        client.release();
    }
};
