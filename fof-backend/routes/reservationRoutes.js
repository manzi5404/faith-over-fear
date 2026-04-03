const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

// Public/User Routes
router.post('/', protect, reservationController.createReservation);

// Admin Management Routes
router.get('/', verifyAdmin, reservationController.getReservations);
router.patch('/:id/status', verifyAdmin, reservationController.updateReservationStatus);
router.delete('/:id', verifyAdmin, reservationController.deleteReservation);

module.exports = router;
