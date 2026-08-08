export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE");

    if (req.method === "GET") {
        return res.status(200).json({
            success: true,
            history: []
        });
    }

    if (req.method === "POST") {
        return res.status(200).json({
            success: true,
            message: "History saved."
        });
    }

    if (req.method === "DELETE") {
        return res.status(200).json({
            success: true,
            message: "History cleared."
        });
    }

    return res.status(405).json({
        success: false,
        message: "Method not allowed."
    });
}
