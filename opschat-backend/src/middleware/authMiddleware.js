

const authMiddleware = (req, res, next) => {
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    req.user = {
        userId: parseInt(userId)
    };

    next();
};

module.exports = authMiddleware;
module.exports.authenticateToken = authMiddleware;
