const database = require('../config/database');
const { HTTP_STATUS } = require('../utils/constants');

// Check if user has active subscription
const checkSubscription = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const subscription = await database.get(
            `SELECT * FROM subscriptions 
             WHERE userId = ? AND status = 'active' 
             AND endDate > datetime('now') 
             ORDER BY endDate DESC LIMIT 1`,
            [userId]
        );

        if (!subscription) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Active subscription required to access this feature'
            });
        }

        req.subscription = subscription;
        next();
    } catch (error) {
        console.error('Subscription check error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error checking subscription status'
        });
    }
};

// Check if user has premium subscription
const checkPremiumSubscription = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const subscription = await database.get(
            `SELECT * FROM subscriptions 
             WHERE userId = ? AND status = 'active' 
             AND planType IN ('premium', 'enterprise')
             AND endDate > datetime('now') 
             ORDER BY endDate DESC LIMIT 1`,
            [userId]
        );

        if (!subscription) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Premium subscription required to access this feature'
            });
        }

        req.subscription = subscription;
        next();
    } catch (error) {
        console.error('Premium subscription check error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error checking subscription status'
        });
    }
};

// Check if user has enterprise subscription
const checkEnterpriseSubscription = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const subscription = await database.get(
            `SELECT * FROM subscriptions 
             WHERE userId = ? AND status = 'active' 
             AND planType = 'enterprise'
             AND endDate > datetime('now') 
             ORDER BY endDate DESC LIMIT 1`,
            [userId]
        );

        if (!subscription) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Enterprise subscription required to access this feature'
            });
        }

        req.subscription = subscription;
        next();
    } catch (error) {
        console.error('Enterprise subscription check error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error checking subscription status'
        });
    }
};

module.exports = {
    checkSubscription,
    checkPremiumSubscription,
    checkEnterpriseSubscription
}; 