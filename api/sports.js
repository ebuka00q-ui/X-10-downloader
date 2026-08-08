export default async function handler(req, res) {
  // CORS headers so your app can talk to this backend safely
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Fetch match details from your sports details API
    const detailsResponse = await fetch('YOUR_SPORTS_DETAILS_API_URL', {
      headers: {
        'x-api-key': process.env.SPORTS_API_KEY_DETAILS
      }
    });
    const detailsData = await detailsResponse.json();

    // 2. Fetch badges/images from your sports images API
    const imagesResponse = await fetch('YOUR_SPORTS_IMAGES_API_URL', {
      headers: {
        'x-api-key': process.env.SPORTS_API_KEY_IMAGES
      }
    });
    const imagesData = await imagesResponse.json();

    // 3. Return clean combined payload back to the app
    return res.status(200).json({
      success: true,
      matches: detailsData,
      media: imagesData
    });

  } catch (error) {
    console.error('Backend API Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch sports data from server' });
  }
                }
        
