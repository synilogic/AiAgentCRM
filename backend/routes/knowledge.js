const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const KnowledgeBase = require('../models/KnowledgeBase');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/knowledge');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.pdf', '.doc', '.docx', '.md', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only text, PDF, DOC, DOCX, MD, and JSON files are allowed'));
    }
  }
});

// GET /api/knowledge - Get all knowledge base items
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category = '',
      type = '',
      status = '',
      search = '',
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { userId: req.user._id, isActive: true };

    if (category) filter.category = category;
    if (type) filter.type = type;
    if (status) filter.status = status;

    let query;
    if (search) {
      // Text search
      filter.$text = { $search: search };
      query = KnowledgeBase.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, [sortBy]: sortOrder === 'desc' ? -1 : 1 });
    } else {
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      query = KnowledgeBase.find(filter).sort(sort);
    }

    const items = await query
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await KnowledgeBase.countDocuments(filter);

    // Get category counts
    const categoryCounts = await KnowledgeBase.aggregate([
      { $match: { userId: req.user._id, isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Get type counts
    const typeCounts = await KnowledgeBase.aggregate([
      { $match: { userId: req.user._id, isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      items,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      filters: {
        categoryCounts: categoryCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        typeCounts: typeCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get knowledge items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch knowledge items'
    });
  }
});

// GET /api/knowledge/:id - Get single knowledge item
router.get('/:id', async (req, res) => {
  try {
    const item = await KnowledgeBase.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('relatedItems', 'title category type');

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge item not found'
      });
    }

    res.json({
      success: true,
      item
    });
  } catch (error) {
    console.error('Get knowledge item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch knowledge item'
    });
  }
});

// POST /api/knowledge - Create new knowledge item
router.post('/', [
  body('title').notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('content').notEmpty().withMessage('Content is required').isLength({ max: 10000 }),
  body('category').optional().isIn(['general', 'product', 'support', 'sales', 'technical', 'policy', 'faq', 'training', 'other']),
  body('type').optional().isIn(['text', 'document', 'faq', 'conversation', 'script', 'template'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      title,
      content,
      summary,
      category = 'general',
      type = 'text',
      tags = [],
      trainingExamples = [],
      language = 'en',
      priority = 5
    } = req.body;

    // Extract keywords from content (simple implementation)
    const keywords = extractKeywords(content);

    const item = new KnowledgeBase({
      userId: req.user._id,
      title,
      content,
      summary,
      category,
      type,
      tags,
      keywords,
      trainingExamples,
      language,
      priority,
      status: 'active'
    });

    await item.save();

    res.status(201).json({
      success: true,
      message: 'Knowledge item created successfully',
      item
    });
  } catch (error) {
    console.error('Create knowledge item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create knowledge item'
    });
  }
});

// PUT /api/knowledge/:id - Update knowledge item
router.put('/:id', [
  body('title').optional().isLength({ max: 200 }),
  body('content').optional().isLength({ max: 10000 }),
  body('category').optional().isIn(['general', 'product', 'support', 'sales', 'technical', 'policy', 'faq', 'training', 'other']),
  body('type').optional().isIn(['text', 'document', 'faq', 'conversation', 'script', 'template'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const item = await KnowledgeBase.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge item not found'
      });
    }

    // Create version before updating
    if (req.body.content && req.body.content !== item.content) {
      await item.createVersion();
    }

    const allowedFields = [
      'title', 'content', 'summary', 'category', 'type', 'tags',
      'priority', 'status', 'language', 'trainingExamples'
    ];
    
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Update keywords if content changed
    if (updateData.content) {
      updateData.keywords = extractKeywords(updateData.content);
    }

    Object.assign(item, updateData);
    await item.save();

    res.json({
      success: true,
      message: 'Knowledge item updated successfully',
      item
    });
  } catch (error) {
    console.error('Update knowledge item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update knowledge item'
    });
  }
});

// DELETE /api/knowledge/:id - Delete knowledge item
router.delete('/:id', async (req, res) => {
  try {
    const item = await KnowledgeBase.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge item not found'
      });
    }

    // Soft delete
    item.isActive = false;
    item.status = 'archived';
    await item.save();

    res.json({
      success: true,
      message: 'Knowledge item deleted successfully'
    });
  } catch (error) {
    console.error('Delete knowledge item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete knowledge item'
    });
  }
});

// POST /api/knowledge/upload - Upload knowledge file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { title, category = 'general', type = 'document' } = req.body;

    // Read file content
    const filePath = req.file.path;
    let content = '';

    if (req.file.mimetype === 'text/plain' || path.extname(req.file.originalname) === '.txt') {
      content = fs.readFileSync(filePath, 'utf8');
    } else if (path.extname(req.file.originalname) === '.md') {
      content = fs.readFileSync(filePath, 'utf8');
    } else if (path.extname(req.file.originalname) === '.json') {
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      content = JSON.stringify(jsonData, null, 2);
    } else {
      // For other file types, store basic info and mark for processing
      content = `Uploaded file: ${req.file.originalname}`;
    }

    const keywords = extractKeywords(content);

    const item = new KnowledgeBase({
      userId: req.user._id,
      title: title || req.file.originalname,
      content,
      summary: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
      category,
      type,
      keywords,
      source: 'upload',
      originalFileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      status: 'active'
    });

    await item.save();

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.status(201).json({
      success: true,
      message: 'Knowledge item uploaded successfully',
      item
    });
  } catch (error) {
    console.error('Upload knowledge item error:', error);
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload knowledge item'
    });
  }
});

// POST /api/knowledge/search - Advanced search
router.post('/search', async (req, res) => {
  try {
    const { query, filters = {}, limit = 20 } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const items = await KnowledgeBase.searchContent(req.user._id, query, {
      category: filters.category,
      type: filters.type,
      limit
    });

    res.json({
      success: true,
      items,
      query,
      count: items.length
    });
  } catch (error) {
    console.error('Search knowledge items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search knowledge items'
    });
  }
});

// GET /api/knowledge/stats - Get knowledge base statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalItems,
      activeItems,
      categoryCounts,
      typeCounts,
      recentItems,
      popularItems
    ] = await Promise.all([
      KnowledgeBase.countDocuments({ userId: req.user._id }),
      KnowledgeBase.countDocuments({ userId: req.user._id, isActive: true, status: 'active' }),
      KnowledgeBase.aggregate([
        { $match: { userId: req.user._id, isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      KnowledgeBase.aggregate([
        { $match: { userId: req.user._id, isActive: true } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      KnowledgeBase.getRecentItems(req.user._id, 5),
      KnowledgeBase.getPopularItems(req.user._id, 5)
    ]);

    const stats = {
      totalItems,
      activeItems,
      categoryCounts: categoryCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      typeCounts: typeCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentItems,
      popularItems
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get knowledge stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch knowledge statistics'
    });
  }
});

// POST /api/knowledge/:id/train - Add training example
router.post('/:id/train', [
  body('question').notEmpty().withMessage('Question is required'),
  body('answer').notEmpty().withMessage('Answer is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { question, answer, context = '', confidence = 0.8 } = req.body;

    const item = await KnowledgeBase.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge item not found'
      });
    }

    await item.addTrainingExample(question, answer, context, confidence);

    res.json({
      success: true,
      message: 'Training example added successfully',
      item
    });
  } catch (error) {
    console.error('Add training example error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add training example'
    });
  }
});

// Utility function to extract keywords
function extractKeywords(text) {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !isStopWord(word));
  
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  return Object.keys(wordFreq)
    .sort((a, b) => wordFreq[b] - wordFreq[a])
    .slice(0, 20);
}

function isStopWord(word) {
  const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'being', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'cannot'];
  return stopWords.includes(word);
}

module.exports = router; 