const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/leads', require('./leads'));
router.use('/plans', require('./plans'));
router.use('/followups', require('./followups'));
router.use('/analytics', require('./analytics'));
router.use('/whatsapp', require('./whatsapp'));
router.use('/users', require('./users'));
// TODO: Add more routes as needed

module.exports = router; 