const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const complaintController = require('../controllers/complaintController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Configure storage for file attachments (uploads directory)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Public / User Routes
router.post('/submit', authenticateToken, upload.single('attachment'), complaintController.createComplaint);
router.get('/track/:refCode', complaintController.trackComplaint);
router.get('/track/ticket/:ticketCode', complaintController.trackComplaint); // Alternate route compatibility

// Analytics Route (Admin / Supervisor)
router.get('/analytics', authenticateToken, authorizeRoles('supervisor', 'admin'), complaintController.getAnalytics);

// Supervisor & Admin Review and Management Routes
router.get('/review', authenticateToken, authorizeRoles('supervisor', 'admin'), complaintController.getDepartmentComplaints);
router.patch('/:id/status', complaintController.updateComplaintStatus);
module.exports = router;