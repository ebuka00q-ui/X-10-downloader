export default async function handler(req, res) {
    if (req.method === "GET") {
        return res.status(200).json([]);
    }

    if (req.method === "POST") {
        return res.status(200).json({
            success: true,
            message: "Notification saved."
        });
    }

    return res.status(405).json({
        error: "Method not allowed"
    });
}
