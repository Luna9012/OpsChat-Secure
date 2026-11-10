
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.userId) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = { userId: Number(decoded.userId) };
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;
module.exports.authenticateToken = authMiddleware;
