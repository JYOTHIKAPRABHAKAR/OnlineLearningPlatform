const User = require('../models/user');
const Educator = require('../models/educator');
const { HTTP_STATUS } = require('../utils/constants');

class AuthController {
    // Register a new learner
    static async registerLearner(req, res) {
        try {
            const { name, email, password, mobile, phone, targetExam, preferredLanguage, firstName, lastName } = req.body;
            // Split name into firstName and lastName if provided
            let splitFirstName, splitLastName;
            if (name) {
                const parts = name.trim().split(' ');
                splitFirstName = parts[0];
                splitLastName = parts.slice(1).join(' ') || '';
            }
            // Use either phone or mobile
            const phoneNumber = phone || mobile;
            // Check if user already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(HTTP_STATUS.CONFLICT).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }
            // Prepare user creation object
            const userObj = {
                email,
                password,
                targetExam,
                preferredLanguage,
                phone: phoneNumber
            };
            if (name) {
                userObj.firstName = splitFirstName;
                userObj.lastName = splitLastName;
            } else {
                if (firstName) userObj.firstName = firstName;
                if (lastName) userObj.lastName = lastName;
            }
            // Create new user
            const userId = await User.create(userObj);
            // Get user data and generate token
            const user = await User.findById(userId);
            const token = require('../utils/helpers').generateToken({
                id: user.id,
                email: user.email,
                role: 'learner'
            });
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Registration successful',
                userId: user.id,
                token
            });
        } catch (error) {
            console.error('User registration error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error registering user'
            });
        }
    }

    // Register a new educator
    static async registerEducator(req, res) {
        try {
            const { name, email, password, firstName, lastName, bio, subjects, experience, qualification, mobile, phone } = req.body;
            // Handle name splitting for compatibility
            let splitFirstName, splitLastName;
            if (name) {
                const parts = name.trim().split(' ');
                splitFirstName = parts[0];
                splitLastName = parts.slice(1).join(' ') || '';
            }
            // Use either phone or mobile
            const phoneNumber = phone || mobile;
            // Check if educator already exists
            const existingEducator = await Educator.findByEmail(email);
            if (existingEducator) {
                return res.status(HTTP_STATUS.CONFLICT).json({
                    success: false,
                    message: 'Educator with this email already exists'
                });
            }
            // Prepare educator creation object
            let subjectsArray;
            if (Array.isArray(subjects)) {
                subjectsArray = subjects;
            } else if (typeof subjects === 'string') {
                subjectsArray = subjects.split(',').map(s => s.trim());
            } else {
                subjectsArray = [];
            }
            const educatorObj = {
                email,
                password,
                bio,
                subjects: JSON.stringify(subjectsArray),
                experience,
                qualification,
                phone: phoneNumber
            };
            if (name) {
                educatorObj.firstName = splitFirstName;
                educatorObj.lastName = splitLastName;
            } else {
                if (firstName) educatorObj.firstName = firstName;
                if (lastName) educatorObj.lastName = lastName;
            }
            // Create new educator
            const educatorId = await Educator.create(educatorObj);
            // Get educator data and generate token
            const educator = await Educator.findById(educatorId);
            const token = require('../utils/helpers').generateToken({
                id: educator.id,
                email: educator.email,
                role: 'educator'
            });
            // Parse subjects before sending response
            let parsedSubjects;
            try {
                parsedSubjects = JSON.parse(educator.subjects);
            } catch {
                parsedSubjects = educator.subjects;
            }
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Educator registered successfully',
                data: {
                    educatorId: educator.id,
                    token,
                    educator: {
                        id: educator.id,
                        email: educator.email,
                        firstName: educator.firstName,
                        lastName: educator.lastName,
                        bio: educator.bio,
                        subjects: parsedSubjects,
                        experience: educator.experience,
                        qualification: educator.qualification,
                        phone: educator.phone
                    }
                }
            });
        } catch (error) {
            console.error('Educator registration error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error registering educator'
            });
        }
    }

    // Login for both users and educators
    static async login(req, res) {
        try {
            const { email, password, role } = req.body;
            if (!role || (role !== 'learner' && role !== 'educator')) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'Role must be either "learner" or "educator"'
                });
            }
            let authResult = null;
            if (role === 'learner') {
                authResult = await User.authenticate(email, password);
            } else if (role === 'educator') {
                authResult = await Educator.authenticate(email, password);
            }
            if (!authResult) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }
            // Generate token with correct role
            const token = require('../utils/helpers').generateToken({
                id: authResult.user ? authResult.user.id : authResult.educator.id,
                email: authResult.user ? authResult.user.email : authResult.educator.email,
                role
            });
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Login successful',
                role,
                token
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error during login'
            });
        }
    }

    // Get current user profile
    static async getProfile(req, res) {
        try {
            const { id, role } = req.user;

            let profile;
            if (role === 'learner') {
                profile = await User.findById(id);
                if (!profile) {
                    return res.status(HTTP_STATUS.NOT_FOUND).json({
                        success: false,
                        message: 'User not found'
                    });
                }
            } else {
                profile = await Educator.findById(id);
                if (!profile) {
                    return res.status(HTTP_STATUS.NOT_FOUND).json({
                        success: false,
                        message: 'Educator not found'
                    });
                }
            }

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: {
                    profile,
                    role
                }
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error fetching profile'
            });
        }
    }

    // Update user profile
    static async updateProfile(req, res) {
        try {
            const { id, role } = req.user;
            const updateData = req.body;

            let updated;
            if (role === 'learner') {
                updated = await User.update(id, updateData);
            } else {
                updated = await Educator.update(id, updateData);
            }

            if (!updated) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: `${role === 'learner' ? 'User' : 'Educator'} not found`
                });
            }

            // Get updated profile
            const profile = role === 'learner' ? await User.findById(id) : await Educator.findById(id);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    profile,
                    role
                }
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error updating profile'
            });
        }
    }

    // Change password
    static async changePassword(req, res) {
        try {
            const { id, role } = req.user;
            const { currentPassword, newPassword } = req.body;

            // Verify current password
            let isValidPassword = false;
            if (role === 'learner') {
                const user = await User.findByEmail(req.user.email);
                isValidPassword = await require('../utils/helpers').comparePassword(currentPassword, user.password);
            } else {
                const educator = await Educator.findByEmail(req.user.email);
                isValidPassword = await require('../utils/helpers').comparePassword(currentPassword, educator.password);
            }

            if (!isValidPassword) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Update password
            let updated;
            if (role === 'learner') {
                updated = await User.updatePassword(id, newPassword);
            } else {
                updated = await Educator.updatePassword(id, newPassword);
            }

            if (!updated) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: `${role === 'learner' ? 'User' : 'Educator'} not found`
                });
            }

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error changing password'
            });
        }
    }

    // Login for educators only
    static async loginEducator(req, res) {
        try {
            const { email, password } = req.body;
            // Authenticate as educator only
            const authResult = await Educator.authenticate(email, password);
            if (!authResult) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Educator logged in successfully',
                data: {
                    token: authResult.token,
                    educator: authResult.educator
                }
            });
        } catch (error) {
            console.error('Educator login error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error during educator login'
            });
        }
    }

    // Login for learners only
    static async loginLearner(req, res) {
        try {
            const { email, password } = req.body;
            // Authenticate as learner only
            const authResult = await User.authenticate(email, password);
            if (!authResult) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Learner logged in successfully',
                data: {
                    token: authResult.token,
                    learner: authResult.user
                }
            });
        } catch (error) {
            console.error('Learner login error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error during learner login'
            });
        }
    }
}

module.exports = AuthController; 