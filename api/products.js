export default async function handler(req, res) {
  try {
    const sheetId = '1eic2VzD_GXVcycgZKKfUIRcG-DgdT3-QLILY8C2C75A';
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

    const response = await fetch(url);
    const csvText = await response.text();

    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell);
            currentCell = '';
        } else if (char === '\n' && !inQuotes) {
            currentRow.push(currentCell);
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
        } else if (char !== '\r') {
            currentCell += char;
        }
    }
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell);
        rows.push(currentRow);
    }

    if (rows.length === 0) return res.status(200).json([]);

    const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ''));
    const data = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            if(header) {
               obj[header] = row[index] ? row[index].replace(/^"|"$/g, '') : '';
            }
        });
        return obj;
    }).filter(item => item.title);

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'خطا در خواندن اطلاعات' });
  }
}
