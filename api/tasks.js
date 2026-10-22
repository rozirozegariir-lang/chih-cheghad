export default async function handler(req, res) {
  const supabaseUrl = 'https://grfeyftvtknbrphpafqf.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmV5ZnR2dGtuYnJwaHBhZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjcwMzgsImV4cCI6MjEwODEwMzAzOH0.Pl7iuL3kJFNPGoW2NMPIm88jGBRYHiaJQuROjGdPZ-M';

  try {
    if (req.method === 'GET') {
      const response = await fetch(`${supabaseUrl}/rest/v1/tasks?select=*&order=created_at.desc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { title, description, price, contact } = req.body;
      
      const response = await fetch(`${supabaseUrl}/rest/v1/tasks`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ title, description, price, contact })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json({ error: 'خطا در ثبت کار', details: data });
      }
      
      return res.status(201).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'مشکلی پیش آمد' });
  }
}
