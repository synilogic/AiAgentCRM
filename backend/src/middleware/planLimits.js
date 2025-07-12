const User = require('../models/User');
const Plan = require('../models/Plan');

const checkPlanLimits = (feature) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).populate('plan');
      
      if (!user.plan) {
        return res.status(403).json({ 
          message: 'No active plan. Please upgrade to continue.' 
        });
      }

      const plan = user.plan;
      const limit = plan.limits[feature];
      
      // Check if feature is unlimited (-1)
      if (limit === -1) {
        return next();
      }

      // Check if user has exceeded limit
      if (user.usage[feature] >= limit) {
        return res.status(403).json({ 
          message: `You have reached your ${feature} limit for this plan. Please upgrade to continue.` 
        });
      }

      next();
    } catch (error) {
      console.error('Plan limit check error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
};

const incrementUsage = (feature) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);
      
      if (user.usage[feature] !== undefined) {
        user.usage[feature] += 1;
        await user.save();
      }
      
      next();
    } catch (error) {
      console.error('Usage increment error:', error);
      // Don't fail the request if usage tracking fails
      next();
    }
  };
};

module.exports = {
  checkPlanLimits,
  incrementUsage
}; 