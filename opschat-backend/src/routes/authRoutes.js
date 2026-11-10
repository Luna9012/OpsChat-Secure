
const jwt = require('jsonwebtoken');
const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
};

// Check username availability
router.post('/check-username', async (req, res) => {
    const username = req.body.username?.trim();

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { username }
        });

        return res.status(200).json({
            available: !user
        });
    } catch (error) {
        console.error('Username check error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Update profile - authenticated users only
router.post('/update-profile', authMiddleware, async (req, res) => {
    const { username, name } = req.body;

    if (!username?.trim()) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: {
                id: req.user.userId
            },
            data: {
                username: username.trim(),
                name: name?.trim() || null
            },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                avatar: true,
                avatarColor: true,
                status: true,
                bio: true
            }
        });

        return res.status(200).json({
            success: true,
            user: updatedUser
        });

    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({
                error: 'Username taken'
            });
        }

        console.error('Profile update error:', error);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Signup
router.post('/signup', async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
        return res.status(400).json({
            error: 'Required fields missing'
        });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
            error: 'Invalid email address'
        });
    }

    if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({
            error: 'Password must contain at least 8 characters'
        });
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                error: 'Email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword
            }
        });

        // Auto-join default workspace
        try {
            await prisma.workspaceMember.create({
                data: {
                    userId: newUser.id,
                    workspaceId: 1,
                    role: 'MEMBER'
                }
            });
        } catch (workspaceError) {
            console.error('Default workspace join failed:', workspaceError);
        }

        const token = generateToken(newUser.id);

        return res.status(201).json({
            success: true,
            token,
            user: {
                id: newUser.id,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error('Signup error:', error);

        if (error.code === 'P2002') {
            return res.status(409).json({
                error: 'Email already exists'
            });
        }

        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
        return res.status(400).json({
            error: 'Required fields missing'
        });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        const isValidPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        const token = generateToken(user.id);
        const isProfileSetup = !!user.username;

        console.log(`User logged in: ${email}`);

        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                name: user.name
            },
            isProfileSetup
        });

    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

module.exports = router;
