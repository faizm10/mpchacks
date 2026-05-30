const express = require('express');
const { askHandler } = require('../controllers/askController');

const router = express.Router();

router.post('/ask', askHandler);

module.exports = router;
