const express = require('express');
const router = express.Router();
const { createDrop, listDrops, updateDrop, removeDrop } = require('../controllers/dropController');

router.post('/', createDrop);
router.get('/', listDrops);
router.put('/:id', updateDrop);
router.delete('/:id', removeDrop);

module.exports = router;