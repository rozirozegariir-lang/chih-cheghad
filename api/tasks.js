export default async function handler(req, res) {
  const supabaseUrl = 'https://grfeyftvtknbrphpafqf.supabase.co';
  const supabaseKey = 'sb_publishable_-kLqQmw9tuRWOw8msWGqNA_aYkhTCjo';

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
    return res.status(500).json({ error: 'مشکلی پیش اومد' });
  }
}
