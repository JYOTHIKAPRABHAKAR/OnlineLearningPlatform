const { verifyToken } = require('../utils/helpers');
const { LEARNER_ROLE, EDUCATOR_ROLE, HTTP_STATUS } = require('../utils/constants');

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Access token is required'
        });
    }

    try {
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

// Specific role middlewares
const authorizeLearner = authorizeRoles(LEARNER_ROLE);
const authorizeEducator = authorizeRoles(EDUCATOR_ROLE);
const authorizeBoth = authorizeRoles(LEARNER_ROLE, EDUCATOR_ROLE);

module.exports = {
    authenticateToken,
    authorizeRoles,
    authorizeLearner,
    authorizeEducator,
    authorizeBoth
}; 