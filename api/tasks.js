else if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: 'شناسه کار الزامی است.' });
    }
    await client.query('DELETE FROM tasks WHERE id = $1', [id]);
    return res.status(200).json({ success: true });
}
