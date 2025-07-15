const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../utils/logger');

// GET /api/config/features - Get dynamic features list for login page (public endpoint)
router.get('/features', async (req, res) => {
  try {
    const features = [
      { 
        icon: 'WhatsApp',
        text: 'WhatsApp Integration',
        color: '#25D366',
        description: 'Connect your WhatsApp Business account for seamless messaging',
        enabled: true
      },
      { 
        icon: 'AutoAwesome',
        text: 'AI-Powered Responses',
        color: '#6366f1',
        description: 'Intelligent automated responses using advanced AI',
        enabled: true
      },
      { 
        icon: 'TrendingUp',
        text: 'Advanced Analytics',
        color: '#10b981',
        description: 'Deep insights into your leads and customer behavior',
        enabled: true
      },
      { 
        icon: 'Psychology',
        text: 'Lead Scoring',
        color: '#f59e0b',
        description: 'Automatic lead scoring based on behavior and engagement',
        enabled: true
      },
      { 
        icon: 'Timeline',
        text: 'Workflow Automation',
        color: '#8b5cf6',
        description: 'Automate your sales processes with intelligent workflows',
        enabled: true
      },
      { 
        icon: 'Notifications',
        text: 'Real-time Notifications',
        color: '#ef4444',
        description: 'Get instant alerts for important events and activities',
        enabled: true
      }
    ];

    res.json({
      success: true,
      features
    });
  } catch (error) {
    logger.error('Get features error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch features'
    });
  }
});

// GET /api/config/navigation - Get dynamic navigation menu items
router.get('/navigation', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('plan');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const baseNavigation = [
      { text: 'Dashboard', icon: 'Dashboard', path: '/dashboard', enabled: true },
      { text: 'Leads', icon: 'People', path: '/leads', enabled: true },
      { text: 'WhatsApp', icon: 'WhatsApp', path: '/whatsapp', enabled: true },
      { text: 'Auto Follow-up', icon: 'Schedule', path: '/auto-followup', enabled: true },
      { text: 'AI Knowledge', icon: 'Psychology', path: '/ai-knowledge', enabled: true },
      { text: 'Integrations', icon: 'Link', path: '/integrations', enabled: true },
      { text: 'Analytics', icon: 'Analytics', path: '/analytics', enabled: true },
      { text: 'Settings', icon: 'Settings', path: '/settings', enabled: true }
    ];

    // Add plan-specific navigation items
    const planNavigation = [];
    
    if (user.plan && user.plan.features) {
      if (user.plan.features.subscriptionManagement) {
        planNavigation.push(
          { text: 'Subscription', icon: 'Payment', path: '/subscription', enabled: true },
          { text: 'Pricing', icon: 'Star', path: '/pricing', enabled: true }
        );
      }
      
      if (user.plan.features.helpSupport) {
        planNavigation.push(
          { text: 'Help & Support', icon: 'Help', path: '/help-support', enabled: true }
        );
      }
    } else {
      // Default for users without plan
      planNavigation.push(
        { text: 'Subscription', icon: 'Payment', path: '/subscription', enabled: true },
        { text: 'Pricing', icon: 'Star', path: '/pricing', enabled: true },
        { text: 'Help & Support', icon: 'Help', path: '/help-support', enabled: true }
      );
    }

    const navigation = [...baseNavigation, ...planNavigation];

    res.json({
      success: true,
      navigation
    });
  } catch (error) {
    logger.error('Get navigation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch navigation'
    });
  }
});

// GET /api/config/goals - Get user goals for dashboard
router.get('/goals', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get goals from user profile or provide defaults
    const goals = user.goals || [
      { 
        id: 'monthly_leads', 
        title: 'Monthly Leads Target', 
        target: 100, 
        current: 0, 
        deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        type: 'leads', 
        status: 'active' 
      },
      { 
        id: 'revenue_goal', 
        title: 'Monthly Revenue Goal', 
        target: 50000, 
        current: 0, 
        deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        type: 'revenue', 
        status: 'active' 
      },
      { 
        id: 'customer_satisfaction', 
        title: 'Customer Satisfaction', 
        target: 95, 
        current: 0, 
        deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        type: 'satisfaction', 
        status: 'active' 
      }
    ];

    res.json({
      success: true,
      goals
    });
  } catch (error) {
    logger.error('Get goals error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch goals'
    });
  }
});

// PUT /api/config/goals - Update user goals
router.put('/goals', auth, async (req, res) => {
  try {
    const { goals } = req.body;
    
    await User.findByIdAndUpdate(req.user._id, { goals });

    res.json({
      success: true,
      message: 'Goals updated successfully'
    });
  } catch (error) {
    logger.error('Update goals error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update goals'
    });
  }
});

// POST /api/config/goals - Create new goal
router.post('/goals', auth, async (req, res) => {
  try {
    const { title, target, deadline, type } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const newGoal = {
      id: `goal_${Date.now()}`,
      title,
      target,
      current: 0,
      deadline,
      type,
      status: 'active',
      createdAt: new Date()
    };

    user.goals = user.goals || [];
    user.goals.push(newGoal);
    await user.save();

    res.json({
      success: true,
      goal: newGoal,
      message: 'Goal created successfully'
    });
  } catch (error) {
    logger.error('Create goal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create goal'
    });
  }
});

// GET /api/config/social-links - Get user social links
router.get('/social-links', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const socialLinks = user.socialLinks || [
      { platform: 'facebook', url: '', icon: 'Facebook', color: '#1877f2' },
      { platform: 'twitter', url: '', icon: 'Twitter', color: '#1da1f2' },
      { platform: 'linkedin', url: '', icon: 'LinkedIn', color: '#0077b5' },
      { platform: 'instagram', url: '', icon: 'Instagram', color: '#e4405f' },
      { platform: 'youtube', url: '', icon: 'YouTube', color: '#ff0000' },
      { platform: 'github', url: '', icon: 'GitHub', color: '#333' },
      { platform: 'website', url: '', icon: 'Language', color: '#6366f1' }
    ];

    res.json({
      success: true,
      socialLinks
    });
  } catch (error) {
    logger.error('Get social links error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch social links'
    });
  }
});

// PUT /api/config/social-links - Update user social links
router.put('/social-links', auth, async (req, res) => {
  try {
    const { socialLinks } = req.body;
    
    await User.findByIdAndUpdate(req.user._id, { socialLinks });

    res.json({
      success: true,
      message: 'Social links updated successfully'
    });
  } catch (error) {
    logger.error('Update social links error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update social links'
    });
  }
});

// GET /api/config/team-members - Get user team members
router.get('/team-members', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const teamMembers = user.teamMembers || [];

    res.json({
      success: true,
      teamMembers
    });
  } catch (error) {
    logger.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team members'
    });
  }
});

// POST /api/config/team-members - Add team member
router.post('/team-members', auth, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const newTeamMember = {
      id: `member_${Date.now()}`,
      name,
      email,
      role,
      status: 'active',
      avatar: '',
      createdAt: new Date()
    };

    user.teamMembers = user.teamMembers || [];
    user.teamMembers.push(newTeamMember);
    await user.save();

    res.json({
      success: true,
      teamMember: newTeamMember,
      message: 'Team member added successfully'
    });
  } catch (error) {
    logger.error('Add team member error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add team member'
    });
  }
});

// PUT /api/config/team-members/:id - Update team member
router.put('/team-members/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const teamMemberIndex = user.teamMembers.findIndex(member => member.id === id);
    
    if (teamMemberIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Team member not found'
      });
    }

    user.teamMembers[teamMemberIndex] = {
      ...user.teamMembers[teamMemberIndex],
      name,
      email,
      role,
      status,
      updatedAt: new Date()
    };

    await user.save();

    res.json({
      success: true,
      teamMember: user.teamMembers[teamMemberIndex],
      message: 'Team member updated successfully'
    });
  } catch (error) {
    logger.error('Update team member error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update team member'
    });
  }
});

// DELETE /api/config/team-members/:id - Remove team member
router.delete('/team-members/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.teamMembers = user.teamMembers.filter(member => member.id !== id);
    await user.save();

    res.json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (error) {
    logger.error('Remove team member error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove team member'
    });
  }
});

module.exports = router; 