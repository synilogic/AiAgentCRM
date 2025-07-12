const express = require('express');
const router = express.Router();

// GET /api/followups
router.get('/', (req, res) => {
  // TODO: Return list of follow-ups
  res.json({ followups: [] });
});

// POST /api/followups
router.post('/', (req, res) => {
  // TODO: Create new follow-up
  res.json({ message: 'Follow-up created (stub)' });
});

// PUT /api/followups/:id
router.put('/:id', (req, res) => {
  // TODO: Update follow-up
  res.json({ message: 'Follow-up updated (stub)' });
});

// DELETE /api/followups/:id
router.delete('/:id', (req, res) => {
  // TODO: Delete follow-up
  res.json({ message: 'Follow-up deleted (stub)' });
});

module.exports = router; 