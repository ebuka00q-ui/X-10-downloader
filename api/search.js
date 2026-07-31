export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");

    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed."
        });
    }

    const query = req.query.q || "";

    return res.status(200).json({
        success: true,
        query,
        results: []
    });
}
