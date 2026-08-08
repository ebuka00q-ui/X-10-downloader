export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Both keys pulled safely from Vercel Environment Variables
    const detailsKey = process.env.SPORTS_API_KEY_DETAILS;
    const imagesKey = process.env.SPORTS_API_KEY_IMAGES;

    const { type, query } = req.query;

    // Route request based on whether user needs images or data
    let apiUrl = '';
    if (type === 'image') {
      apiUrl = `https://www.thesportsdb.com/api/v1/json/${imagesKey}/searchplayers.php?p=${encodeURIComponent(query)}`;
    } else {
      apiUrl = `https://www.thesportsdb.com/api/v1/json/${detailsKey}/searchteams.php?t=${encodeURIComponent(query)}`;
    }

    const response = await fetch(apiUrl);
    const data = await response.json();

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Sports API Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch sports data' });
  }
}
