const prisma = require('../config/database');
const { s3Client, PutObjectCommand, BUCKET_NAME } = require('../config/s3');
const crypto = require('crypto');

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                status: true,
                bio: true,
                avatar: true,
                avatarColor: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, status, bio, avatar, avatarColor } = req.body;

        // Validation
        if (status && status.length > 60) {
            return res.status(400).json({ error: "Status must be less than 60 characters" });
        }
        if (bio && bio.length > 500) {
            return res.status(400).json({ error: "Bio must be less than 500 characters" });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                status,
                bio,
                avatar,
                avatarColor
            },
            select: {
                id: true,
                username: true,
                name: true,
                status: true,
                bio: true,
                avatar: true,
                avatarColor: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
};

// Upload avatar image 
const uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const file = req.file;
        const fileExtension = file.originalname.split('.').pop() || 'jpg';
        const fileName = `avatars/${userId}-${crypto.randomUUID()}.${fileExtension}`;

        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));

        // Public URL for the browser to access the image
        const baseUrl = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT || 'http://localhost:9000';
        const publicUrl = `${baseUrl}/${BUCKET_NAME}/${fileName}`;

        res.json({ publicUrl, fileName });
    } catch (error) {
        console.error("Upload Avatar Error:", error);
        res.status(500).json({ error: "Failed to upload avatar" });
    }
};

// Get any user's public profile by ID
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            select: {
                id: true,
                username: true,
                name: true,
                status: true,
                bio: true,
                avatar: true,
                avatarColor: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("Get User By ID Error:", error);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    uploadAvatar,
    getUserById
};