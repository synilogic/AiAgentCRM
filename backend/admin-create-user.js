// POST /api/admin/users - Create new user
router.post('/users', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').isLength({ min: 1 }),
  body('role').optional().isIn(['user', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid input data',
        errors: errors.array()
      });
    }

    const { email, password, name, role = 'user', businessName, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create new user (password will be hashed by pre-save middleware)
    const user = new User({
      email,
      password,
      name,
      role,
      businessName,
      phone,
      isEmailVerified: true,
      subscription: {
        status: 'trial',
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
      }
    });

    await user.save();

    // Log activity
    try {
      await Activity.create({
        user: req.user.id,
        type: 'admin_user_create',
        description: `Admin created user ${user.email}`,
        metadata: { createdUserId: user._id }
      });
    } catch (activityError) {
      console.warn('Failed to log activity:', activityError.message);
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessName: user.businessName,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
}); 