const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeLearner } = require('../middleware/auth');
const { validateId, validateSubscription } = require('../middleware/validation');
const db = require('../config/database');

// Get available subscription plans
router.get('/plans', async (req, res) => {
    try {
        const plans = await db.all('SELECT * FROM subscription_plans WHERE isActive = 1 ORDER BY price ASC');
        // Parse features from JSON string to array
        const parsedPlans = plans.map(plan => ({
            ...plan,
            features: Array.isArray(plan.features)
                ? plan.features
                : (typeof plan.features === 'string' ? JSON.parse(plan.features) : [])
        }));
        res.json({ success: true, plans: parsedPlans });
    } catch (error) {
        console.error('Get subscription plans error:', error);
        res.status(500).json({ success: false, message: 'Failed to get subscription plans' });
    }
});

// Get user's current subscription
router.get('/current', authenticateToken, authorizeLearner, async (req, res) => {
    try {
        const { id: userId } = req.user;

        const subscription = await db.get(
            `SELECT s.*, sp.name as planName, sp.features
             FROM subscriptions s
             JOIN subscription_plans sp ON s.planId = sp.id
             WHERE s.userId = ? AND s.status = 'active'
             ORDER BY s.createdAt DESC
             LIMIT 1`,
            [userId]
        );

        if (!subscription) {
            return res.status(200).json({
                success: true,
                data: {
                    hasActiveSubscription: false,
                    subscription: null
                }
            });
        }

        // Check if subscription is expired
        const now = new Date();
        const endDate = new Date(subscription.endDate);
        const isExpired = now > endDate;

        res.status(200).json({
            success: true,
            data: {
                hasActiveSubscription: !isExpired,
                subscription: {
                    ...subscription,
                    isExpired,
                    daysRemaining: isExpired ? 0 : Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
                }
            }
        });
    } catch (error) {
        console.error('Get current subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching current subscription'
        });
    }
});

// Subscribe to a plan
router.post('/subscribe', authenticateToken, authorizeLearner, validateSubscription, async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { planId, paymentMethod, couponCode } = req.body;

        // Check if plan exists
        const plan = await db.get(
            'SELECT * FROM subscription_plans WHERE id = ? AND isActive = 1',
            [planId]
        );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Subscription plan not found'
            });
        }

        // Check if user already has an active subscription
        const existingSubscription = await db.get(
            'SELECT * FROM subscriptions WHERE userId = ? AND status = "active" AND endDate > datetime("now")',
            [userId]
        );

        if (existingSubscription) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active subscription'
            });
        }

        // Apply coupon if provided
        let finalPrice = plan.price;
        let discountAmount = 0;
        let couponId = null;

        if (couponCode) {
            const coupon = await db.get(
                'SELECT * FROM coupons WHERE code = ? AND isActive = 1 AND expiryDate > datetime("now")',
                [couponCode]
            );

            if (coupon) {
                if (coupon.discountType === 'percentage') {
                    discountAmount = (plan.price * coupon.discountValue) / 100;
                } else {
                    discountAmount = coupon.discountValue;
                }
                finalPrice = Math.max(0, plan.price - discountAmount);
                couponId = coupon.id;
            }
        }

        // Calculate subscription dates
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000); // Convert days to milliseconds

        // Create subscription record
        const result = await db.run(
            `INSERT INTO subscriptions (userId, planId, planName, planType, price, features, startDate, endDate, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            [userId, planId, plan.name, plan.type, plan.price, plan.features, startDate.toISOString(), endDate.toISOString()]
        );

        const subscriptionId = result.lastID;

        // Get created subscription
        const subscription = await db.get(
            `SELECT s.*, sp.name as planName, sp.features
             FROM subscriptions s
             JOIN subscription_plans sp ON s.planId = sp.id
             WHERE s.id = ?`,
            [subscriptionId]
        );

        res.status(201).json({
            success: true,
            message: 'Subscription created successfully',
            data: {
                subscription,
                payment: {
                    originalPrice: plan.price,
                    discountAmount,
                    finalPrice,
                    paymentMethod
                }
            }
        });
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating subscription'
        });
    }
});

// Purchase subscription (alias for subscribe)
router.post('/purchase', authenticateToken, authorizeLearner, validateSubscription, async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { planId, paymentMethod, couponCode } = req.body;

        // Check if plan exists
        const plan = await db.get(
            'SELECT * FROM subscription_plans WHERE id = ? AND isActive = 1',
            [planId]
        );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Subscription plan not found'
            });
        }

        // Check if user already has an active subscription
        const existingSubscription = await db.get(
            'SELECT * FROM subscriptions WHERE userId = ? AND status = "active" AND endDate > datetime("now")',
            [userId]
        );

        if (existingSubscription) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active subscription'
            });
        }

        // Apply coupon if provided
        let finalPrice = plan.price;
        let discountAmount = 0;
        let couponId = null;

        if (couponCode) {
            const coupon = await db.get(
                'SELECT * FROM coupons WHERE code = ? AND isActive = 1 AND expiryDate > datetime("now")',
                [couponCode]
            );

            if (coupon) {
                if (coupon.discountType === 'percentage') {
                    discountAmount = (plan.price * coupon.discountValue) / 100;
                } else {
                    discountAmount = coupon.discountValue;
                }
                finalPrice = Math.max(0, plan.price - discountAmount);
                couponId = coupon.id;
            }
        }

        // Calculate subscription dates
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

        // Create subscription record
        const result = await db.run(
            `INSERT INTO subscriptions (userId, planId, planName, planType, price, features, startDate, endDate, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            [userId, planId, plan.name, plan.type, plan.price, plan.features, startDate.toISOString(), endDate.toISOString()]
        );

        const subscriptionId = result.lastID;

        // Get created subscription
        let subscription = await db.get(
            `SELECT s.*, sp.name as planName, sp.features
             FROM subscriptions s
             JOIN subscription_plans sp ON s.planId = sp.id
             WHERE s.id = ?`,
            [subscriptionId]
        );

        // Parse features from JSON string to array
        if (subscription && typeof subscription.features === 'string') {
            try {
                subscription.features = JSON.parse(subscription.features);
            } catch (e) {
                subscription.features = [];
            }
        }

        res.status(201).json({
            success: true,
            message: 'Subscription purchased successfully',
            data: {
                subscription,
                payment: {
                    originalPrice: plan.price,
                    discountAmount,
                    finalPrice,
                    paymentMethod
                }
            }
        });
    } catch (error) {
        console.error('Purchase subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Error purchasing subscription'
        });
    }
});

// Cancel subscription
router.post('/cancel', authenticateToken, authorizeLearner, async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { reason } = req.body;

        // Get current active subscription
        const subscription = await db.get(
            'SELECT * FROM subscriptions WHERE userId = ? AND status = "active" AND endDate > datetime("now")',
            [userId]
        );

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'No active subscription found'
            });
        }

        // Update subscription status
        await db.run(
            'UPDATE subscriptions SET status = "cancelled" WHERE id = ?',
            [subscription.id]
        );

        res.status(200).json({
            success: true,
            message: 'Subscription cancelled successfully',
            data: {
                subscriptionId: subscription.id,
                cancelledAt: new Date().toISOString(),
                endDate: subscription.endDate
            }
        });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling subscription'
        });
    }
});

// Renew subscription
router.post('/renew', authenticateToken, authorizeLearner, async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { paymentMethod, couponCode } = req.body;

        // Get current subscription
        const currentSubscription = await db.get(
            `SELECT s.*, sp.price, sp.duration
             FROM subscriptions s
             JOIN subscription_plans sp ON s.planId = sp.id
             WHERE s.userId = ? AND s.status = "active"
             ORDER BY s.createdAt DESC
             LIMIT 1`,
            [userId]
        );

        if (!currentSubscription) {
            return res.status(404).json({
                success: false,
                message: 'No subscription found to renew'
            });
        }

        // Apply coupon if provided
        let finalPrice = currentSubscription.price;
        let discountAmount = 0;
        let couponId = null;

        if (couponCode) {
            const coupon = await db.get(
                'SELECT * FROM coupons WHERE code = ? AND isActive = 1 AND expiryDate > datetime("now")',
                [couponCode]
            );

            if (coupon) {
                if (coupon.discountType === 'percentage') {
                    discountAmount = (currentSubscription.price * coupon.discountValue) / 100;
                } else {
                    discountAmount = coupon.discountValue;
                }
                finalPrice = Math.max(0, currentSubscription.price - discountAmount);
                couponId = coupon.id;
            }
        }

        // Calculate new end date (extend from current end date)
        const currentEndDate = new Date(currentSubscription.endDate);
        const newEndDate = new Date(currentEndDate.getTime() + currentSubscription.duration * 24 * 60 * 60 * 1000);

        // Create renewal record
        const result = await db.run(
            `INSERT INTO subscriptions (userId, planId, startDate, endDate, amount, discountAmount, couponId, paymentMethod, status, isActive, isRenewal)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, 1)`,
            [userId, currentSubscription.planId, currentEndDate.toISOString(), newEndDate.toISOString(), currentSubscription.price, discountAmount, couponId, paymentMethod]
        );

        const renewalId = result.lastID;

        // Get renewal details
        const renewal = await db.get(
            `SELECT s.*, sp.name as planName
             FROM subscriptions s
             JOIN subscription_plans sp ON s.planId = sp.id
             WHERE s.id = ?`,
            [renewalId]
        );

        res.status(201).json({
            success: true,
            message: 'Subscription renewed successfully',
            data: {
                renewal,
                payment: {
                    originalPrice: currentSubscription.price,
                    discountAmount,
                    finalPrice,
                    paymentMethod
                }
            }
        });
    } catch (error) {
        console.error('Renew subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Error renewing subscription'
        });
    }
});

// Get subscription history
router.get('/history', authenticateToken, authorizeLearner, async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

        const subscriptions = await db.all(
            `SELECT s.*, sp.name as planName, sp.features
             FROM subscriptions s
             JOIN subscription_plans sp ON s.planId = sp.id
             WHERE s.userId = ?
             ORDER BY s.createdAt DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        // Get total count
        const totalCount = await db.get(
            'SELECT COUNT(*) as count FROM subscriptions WHERE userId = ?',
            [userId]
        );

        res.status(200).json({
            success: true,
            data: {
                subscriptions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount.count,
                    totalPages: Math.ceil(totalCount.count / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get subscription history error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subscription history'
        });
    }
});

// Get subscription benefits
router.get('/benefits', authenticateToken, authorizeLearner, async (req, res) => {
    try {
        const { id: userId } = req.user;

        // Get current subscription
        const subscription = await db.get(
            `SELECT s.*, sp.features, sp.name as planName
             FROM subscriptions s
             JOIN subscription_plans sp ON s.planId = sp.id
             WHERE s.userId = ? AND s.status = "active" AND s.endDate > datetime("now")
             ORDER BY s.createdAt DESC
             LIMIT 1`,
            [userId]
        );

        if (!subscription) {
            return res.status(200).json({
                success: true,
                data: {
                    hasSubscription: false,
                    benefits: []
                }
            });
        }

        // Parse features
        const features = JSON.parse(subscription.features || '[]');

        res.status(200).json({
            success: true,
            data: {
                hasSubscription: true,
                planName: subscription.planName,
                benefits: features,
                subscriptionEndDate: subscription.endDate
            }
        });
    } catch (error) {
        console.error('Get subscription benefits error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subscription benefits'
        });
    }
});

// Validate coupon code
router.post('/validate-coupon', authenticateToken, authorizeLearner, async (req, res) => {
    try {
        const { couponCode, planId } = req.body;

        if (!couponCode) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code is required'
            });
        }

        // Get coupon details
        const coupon = await db.get(
            'SELECT * FROM coupons WHERE code = ? AND isActive = 1 AND expiryDate > datetime("now")',
            [couponCode]
        );

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired coupon code'
            });
        }

        // Check if user has already used this coupon
        const usageCount = await db.get(
            'SELECT COUNT(*) as count FROM subscriptions WHERE userId = ? AND couponId = ?',
            [req.user.id, coupon.id]
        );

        if (usageCount.count >= coupon.maxUsagePerUser) {
            return res.status(400).json({
                success: false,
                message: 'You have already used this coupon maximum times'
            });
        }

        // Get plan details for calculation
        const plan = await db.get(
            'SELECT * FROM subscription_plans WHERE id = ?',
            [planId]
        );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = (plan.price * coupon.discountValue) / 100;
        } else {
            discountAmount = coupon.discountValue;
        }

        const finalPrice = Math.max(0, plan.price - discountAmount);

        res.status(200).json({
            success: true,
            data: {
                coupon: {
                    id: coupon.id,
                    code: coupon.code,
                    discountType: coupon.discountType,
                    discountValue: coupon.discountValue,
                    description: coupon.description
                },
                calculation: {
                    originalPrice: plan.price,
                    discountAmount,
                    finalPrice
                }
            }
        });
    } catch (error) {
        console.error('Validate coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating coupon'
        });
    }
});

// Get user's active subscription
router.get('/my', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const subscription = await db.get(`
            SELECT s.*, sp.name as planName, sp.features
            FROM subscriptions s
            JOIN subscription_plans sp ON s.planId = sp.id
            WHERE s.userId = ? AND s.status = "active" AND s.endDate > datetime('now')
            ORDER BY s.createdAt DESC
            LIMIT 1
        `, [userId]);
        
        res.json({ success: true, subscription });
    } catch (error) {
        console.error('Get my subscription error:', error);
        res.status(500).json({ success: false, message: 'Failed to get subscription' });
    }
});

module.exports = router; 