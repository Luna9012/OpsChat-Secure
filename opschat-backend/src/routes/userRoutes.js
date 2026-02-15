const express = require('express');
const multer = require('multer');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});


router.get('/profile', authenticateToken, userController.getProfile);

router.put('/profile', authenticateToken, userController.updateProfile);

router.post('/upload-avatar', authenticateToken, upload.single('avatar'), userController.uploadAvatar);

router.get('/:userId', authenticateToken, userController.getUserById);

module.exports = router;