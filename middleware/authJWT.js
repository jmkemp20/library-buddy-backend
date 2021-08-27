const jwt = require('jsonwebtoken');
const secret = process.env.JWT_KEY;

exports.verifyToken = (req, res, next) => {
    const token = req.headers["x-api-key"];

    if (!token) {
        return res.status(403).send({ error: "No Token Provided" });
    }

    jwt.verify(token, secret, (err, decoded) => {
        if (err) return res.status(401).send({ error: "Unauthorized" });
        req.user_id = decoded.id;
        next();
    })
};
