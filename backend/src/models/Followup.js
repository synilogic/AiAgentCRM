const mongoose = require('mongoose');

const followupSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  message: { type: String, required: true },
  scheduledAt: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  trigger: {
    type: { type: String, enum: ['time', 'status', 'keyword'] },
    value: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Followup', followupSchema); 