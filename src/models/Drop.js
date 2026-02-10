const mongoose = require('mongoose');

const dropSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Drop name is required'],
    trim: true,
    maxlength: [100, 'Drop name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  launchDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
dropSchema.index({ isActive: 1 });
dropSchema.index({ createdAt: -1 });

const Drop = mongoose.model('Drop', dropSchema);

module.exports = Drop;
