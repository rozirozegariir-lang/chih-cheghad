import { put } from '@vercel/blob';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { filename, contentType } = req.query;
        
        if (!filename) {
            return res.status(400).json({ error: 'نام فایل الزامی است.' });
        }

        // دریافت فایل به صورت استریم و آپلود مستقیم به Vercel Blob
        const blob = await put(filename, req, {
            access: 'public',
            contentType: contentType || 'application/octet-stream',
            addRandomSuffix: true,
        });

        return res.status(200).json({ url: blob.url });

    } catch (error) {
        console.error('Upload Error:', error);
        return res.status(500).json({ error: 'خطا در آپلود فایل: ' + error.message });
    }
}
