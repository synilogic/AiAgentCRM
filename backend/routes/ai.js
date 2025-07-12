const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();
const openaiService = require('../utils/openai');

// Apply auth middleware to all routes
router.use(auth);

// POST /api/ai/generate-response - Generate AI response for customer message
router.post('/generate-response', async (req, res) => {
  try {
    const { message, context = {}, settings = {} } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Get user's AI settings
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    const userSettings = user.preferences?.ai || {};

    // Merge user settings with request settings
    const finalSettings = { ...userSettings, ...settings };

    const result = await openaiService.generateResponse(message, context, finalSettings);
    
    if (result.success) {
      // Log AI usage
      await logAIUsage(req.user._id, 'generate_response', {
        messageLength: message.length,
        responseLength: result.response.length,
        tokensUsed: result.usage?.total_tokens || 0
      });
    }

    res.json(result);
  } catch (error) {
    console.error('AI generate response error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI response'
    });
  }
});

// POST /api/ai/analyze-lead - Analyze lead quality and score
router.post('/analyze-lead', async (req, res) => {
  try {
    const { message, contactInfo = {} } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const result = await openaiService.analyzeLead(message, contactInfo);
    
    if (result.success) {
      // Log AI usage
      await logAIUsage(req.user._id, 'analyze_lead', {
        messageLength: message.length,
        tokensUsed: result.usage?.total_tokens || 0
      });
    }

    res.json(result);
  } catch (error) {
    console.error('AI analyze lead error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze lead'
    });
  }
});

// POST /api/ai/generate-followup - Generate follow-up message suggestions
router.post('/generate-followup', async (req, res) => {
  try {
    const { leadData, previousMessages = [] } = req.body;
    
    if (!leadData) {
      return res.status(400).json({
        success: false,
        error: 'Lead data is required'
      });
    }

    const result = await openaiService.generateFollowupSuggestions(leadData, previousMessages);
    
    if (result.success) {
      // Log AI usage
      await logAIUsage(req.user._id, 'generate_followup', {
        leadScore: leadData.score,
        messagesCount: previousMessages.length,
        tokensUsed: result.usage?.total_tokens || 0
      });
    }

    res.json(result);
  } catch (error) {
    console.error('AI generate followup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate follow-up suggestions'
    });
  }
});

// POST /api/ai/extract-contact - Extract contact information from message
router.post('/extract-contact', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const result = await openaiService.extractContactInfo(message);
    
    if (result.success) {
      // Log AI usage
      await logAIUsage(req.user._id, 'extract_contact', {
        messageLength: message.length,
        tokensUsed: result.usage?.total_tokens || 0
      });
    }

    res.json(result);
  } catch (error) {
    console.error('AI extract contact error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract contact information'
    });
  }
});

// POST /api/ai/analyze-sentiment - Analyze conversation sentiment
router.post('/analyze-sentiment', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required'
      });
    }

    const result = await openaiService.analyzeSentiment(messages);
    
    if (result.success) {
      // Log AI usage
      await logAIUsage(req.user._id, 'analyze_sentiment', {
        messagesCount: messages.length,
        tokensUsed: result.usage?.total_tokens || 0
      });
    }

    res.json(result);
  } catch (error) {
    console.error('AI analyze sentiment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze sentiment'
    });
  }
});

// POST /api/ai/generate-email - Generate email content
router.post('/generate-email', async (req, res) => {
  try {
    const { subject, content, tone = 'professional', recipientInfo = {} } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    const result = await openaiService.generateEmailSubject(content, tone);
    
    if (result.success) {
      // Log AI usage
      await logAIUsage(req.user._id, 'generate_email', {
        contentLength: content.length,
        tokensUsed: result.usage?.total_tokens || 0
      });
    }

    res.json(result);
  } catch (error) {
    console.error('AI generate email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate email content'
    });
  }
});

// GET /api/ai/usage - Get AI usage statistics
router.get('/usage', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const Activity = require('../models/Activity');
    const usage = await Activity.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'ai_usage',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$metadata.operation',
          count: { $sum: 1 },
          totalTokens: { $sum: '$metadata.tokensUsed' },
          totalCost: { $sum: '$metadata.estimatedCost' }
        }
      }
    ]);

    res.json({
      success: true,
      usage,
      period
    });
  } catch (error) {
    console.error('Get AI usage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI usage statistics'
    });
  }
});

// POST /api/ai/settings - Update AI settings
router.post('/settings', async (req, res) => {
  try {
    const { 
      tone, 
      maxTokens, 
      temperature, 
      autoReply, 
      leadScoring, 
      sentimentAnalysis 
    } = req.body;

    const User = require('../models/User');
    const updateData = {};

    if (tone !== undefined) updateData['preferences.ai.tone'] = tone;
    if (maxTokens !== undefined) updateData['preferences.ai.maxTokens'] = maxTokens;
    if (temperature !== undefined) updateData['preferences.ai.temperature'] = temperature;
    if (autoReply !== undefined) updateData['preferences.ai.autoReply'] = autoReply;
    if (leadScoring !== undefined) updateData['preferences.ai.leadScoring'] = leadScoring;
    if (sentimentAnalysis !== undefined) updateData['preferences.ai.sentimentAnalysis'] = sentimentAnalysis;

    await User.findByIdAndUpdate(req.user._id, updateData);

    res.json({
      success: true,
      message: 'AI settings updated successfully'
    });
  } catch (error) {
    console.error('Update AI settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update AI settings'
    });
  }
});

// GET /api/ai/settings - Get AI settings
router.get('/settings', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      settings: user.preferences?.ai || {
        tone: 'professional',
        maxTokens: 500,
        temperature: 0.7,
        autoReply: false,
        leadScoring: true,
        sentimentAnalysis: true
      }
    });
  } catch (error) {
    console.error('Get AI settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI settings'
    });
  }
});

// POST /api/ai/validate-key - Validate OpenAI API key
router.post('/validate-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'API key is required'
      });
    }

    const result = await openaiService.validateAPIKey(apiKey);
    res.json(result);
  } catch (error) {
    console.error('Validate API key error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate API key'
    });
  }
});

// GET /api/ai/models - Get available AI models
router.get('/models', async (req, res) => {
  try {
    const models = [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Most capable model for complex tasks',
        maxTokens: 8192,
        costPer1kTokens: 0.03
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Faster and more cost-effective than GPT-4',
        maxTokens: 4096,
        costPer1kTokens: 0.01
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Good balance of speed and capability',
        maxTokens: 4096,
        costPer1kTokens: 0.002
      }
    ];

    res.json({
      success: true,
      models
    });
  } catch (error) {
    console.error('Get AI models error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI models'
    });
  }
});

// Helper function to log AI usage
async function logAIUsage(userId, operation, metadata) {
  try {
    const Activity = require('../models/Activity');
    
    // Calculate estimated cost (rough calculation)
    const tokensUsed = metadata.tokensUsed || 0;
    const estimatedCost = (tokensUsed / 1000) * 0.03; // Assuming GPT-4 pricing
    
    const activity = new Activity({
      user: userId,
      type: 'ai_usage',
      description: `AI ${operation} operation`,
      metadata: {
        operation,
        tokensUsed,
        estimatedCost,
        ...metadata
      }
    });

    await activity.save();
  } catch (error) {
    console.error('Log AI usage error:', error);
  }
}

module.exports = router; 
