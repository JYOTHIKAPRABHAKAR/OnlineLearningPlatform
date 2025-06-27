const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Password hashing
const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

// Password comparison
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// JWT token generation
const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// JWT token verification
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Generate secure random string
const generateRandomString = (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Generate session ID for tests
const generateSessionId = () => {
    return `session_${Date.now()}_${generateRandomString(8)}`;
};

// Calculate percentage
const calculatePercentage = (part, total) => {
    if (total === 0) return 0;
    return Math.round((part / total) * 100 * 100) / 100;
};

// Format date to ISO string
const formatDate = (date) => {
    return new Date(date).toISOString();
};

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Sanitize input
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
};

// Generate secure URL for files (simulated)
const generateSecureUrl = (filePath, expiresIn = 3600) => {
    // In a real implementation, this would generate signed URLs for cloud storage
    // For now, we'll simulate it with a timestamp
    const timestamp = Date.now();
    return `${filePath}?token=${timestamp}&expires=${timestamp + (expiresIn * 1000)}`;
};

// Calculate test score and analysis
const calculateTestScore = (answers, questions) => {
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    let totalMarks = 0;
    let earnedMarks = 0;
    let subjectAnalysis = {};

    questions.forEach((question, index) => {
        const userAnswer = answers[index + 1];
        
        if (!userAnswer) {
            unattempted++;
        } else if (userAnswer === question.correctAnswer) {
            correct++;
            earnedMarks += question.marks;
        } else {
            incorrect++;
            earnedMarks -= question.negativeMarks;
        }
        
        totalMarks += question.marks;
    });

    const score = totalMarks > 0 ? (earnedMarks / totalMarks) * 100 : 0;

    return {
        score: Math.max(0, score),
        correct,
        incorrect,
        unattempted,
        totalMarks,
        earnedMarks
    };
};

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    generateRandomString,
    generateSessionId,
    calculatePercentage,
    formatDate,
    isValidEmail,
    sanitizeInput,
    generateSecureUrl,
    calculateTestScore
}; 