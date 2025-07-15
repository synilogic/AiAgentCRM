const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Plugin = require('../models/Plugin');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for plugin file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `plugin-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.zip', '.tar.gz', '.tgz'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only zip, tar.gz, tgz files are allowed.'));
    }
  }
});

// Middleware to check admin permissions
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all plugins
router.get('/plugins', auth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    
    const plugins = await Plugin.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    
    const total = await Plugin.countDocuments(query);
    
    res.json({
      plugins,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching plugins:', error);
    res.status(500).json({ error: 'Failed to fetch plugins' });
  }
});

// Get plugin by ID
router.get('/plugins/:id', auth, requireAdmin, async (req, res) => {
  try {
    const plugin = await Plugin.findById(req.params.id);
    
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    res.json(plugin);
  } catch (error) {
    console.error('Error fetching plugin:', error);
    res.status(500).json({ error: 'Failed to fetch plugin' });
  }
});

// Upload and install plugin
router.post('/plugins/upload', auth, requireAdmin, upload.single('plugin'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No plugin file uploaded' });
    }
    
    const pluginManager = req.app.get('pluginManager');
    
    // Install the plugin
    const plugin = await pluginManager.installPlugin(req.file.path, req.user._id);
    
    // Clean up uploaded file
    await fs.unlink(req.file.path);
    
    res.status(201).json({
      message: 'Plugin uploaded and installed successfully',
      plugin
    });
  } catch (error) {
    console.error('Error installing plugin:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Enable plugin
router.post('/plugins/:id/enable', auth, requireAdmin, async (req, res) => {
  try {
    const plugin = await Plugin.findById(req.params.id);
    
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    const pluginManager = req.app.get('pluginManager');
    await pluginManager.enablePlugin(plugin.name);
    
    res.json({ message: 'Plugin enabled successfully' });
  } catch (error) {
    console.error('Error enabling plugin:', error);
    res.status(500).json({ error: error.message });
  }
});

// Disable plugin
router.post('/plugins/:id/disable', auth, requireAdmin, async (req, res) => {
  try {
    const plugin = await Plugin.findById(req.params.id);
    
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    const pluginManager = req.app.get('pluginManager');
    await pluginManager.disablePlugin(plugin.name);
    
    res.json({ message: 'Plugin disabled successfully' });
  } catch (error) {
    console.error('Error disabling plugin:', error);
    res.status(500).json({ error: error.message });
  }
});

// Uninstall plugin
router.delete('/plugins/:id', auth, requireAdmin, async (req, res) => {
  try {
    const plugin = await Plugin.findById(req.params.id);
    
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    const pluginManager = req.app.get('pluginManager');
    await pluginManager.uninstallPlugin(plugin.name);
    
    res.json({ message: 'Plugin uninstalled successfully' });
  } catch (error) {
    console.error('Error uninstalling plugin:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update plugin settings
router.put('/plugins/:id/settings', auth, requireAdmin, async (req, res) => {
  try {
    const plugin = await Plugin.findById(req.params.id);
    
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    // Validate settings against schema
    if (plugin.settings.schema) {
      const { settings } = req.body;
      
      for (const [key, value] of Object.entries(settings)) {
        const schemaField = plugin.settings.schema[key];
        
        if (!schemaField) {
          return res.status(400).json({ error: `Unknown setting: ${key}` });
        }
        
        if (schemaField.required && (value === undefined || value === null)) {
          return res.status(400).json({ error: `Setting ${key} is required` });
        }
        
        // Type validation
        if (value !== undefined && typeof value !== schemaField.type) {
          return res.status(400).json({ error: `Setting ${key} must be of type ${schemaField.type}` });
        }
      }
    }
    
    await plugin.updateSettings(req.body.settings);
    
    res.json({ message: 'Plugin settings updated successfully' });
  } catch (error) {
    console.error('Error updating plugin settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get plugin statistics
router.get('/plugins-stats', auth, requireAdmin, async (req, res) => {
  try {
    const pluginManager = req.app.get('pluginManager');
    const stats = await pluginManager.getPluginStatistics();
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching plugin statistics:', error);
    res.status(500).json({ error: 'Failed to fetch plugin statistics' });
  }
});

// Get plugin menus for navigation
router.get('/plugin-menus', auth, async (req, res) => {
  try {
    const pluginManager = req.app.get('pluginManager');
    const menus = pluginManager.getPluginMenus();
    
    // Filter menus based on user permissions
    const userMenus = menus.filter(menu => {
      if (!menu.permissions || menu.permissions.length === 0) {
        return true;
      }
      
      // Check if user has required permissions
      return menu.permissions.some(permission => {
        // This would need to be implemented based on your permission system
        return req.user.role === 'admin' || req.user.permissions?.includes(permission);
      });
    });
    
    res.json(userMenus);
  } catch (error) {
    console.error('Error fetching plugin menus:', error);
    res.status(500).json({ error: 'Failed to fetch plugin menus' });
  }
});

// Get plugin logs
router.get('/plugins/:id/logs', auth, requireAdmin, async (req, res) => {
  try {
    const plugin = await Plugin.findById(req.params.id);
    
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    const { limit = 100 } = req.query;
    
    // This would need to be implemented based on your logging system
    const logs = [
      {
        timestamp: new Date(),
        level: 'info',
        message: `Plugin ${plugin.name} is running normally`,
        source: 'plugin-system'
      }
    ];
    
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching plugin logs:', error);
    res.status(500).json({ error: 'Failed to fetch plugin logs' });
  }
});

// Test plugin endpoint
router.post('/plugins/:id/test', auth, requireAdmin, async (req, res) => {
  try {
    const plugin = await Plugin.findById(req.params.id);
    
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    if (!plugin.isActive) {
      return res.status(400).json({ error: 'Plugin is not active' });
    }
    
    // Test plugin health
    const pluginManager = req.app.get('pluginManager');
    const loadedPlugin = pluginManager.loadedPlugins.get(plugin.name);
    
    if (!loadedPlugin) {
      return res.status(400).json({ error: 'Plugin is not loaded' });
    }
    
    // Call plugin health check if available
    let healthStatus = 'healthy';
    if (loadedPlugin.instance.healthCheck) {
      healthStatus = await loadedPlugin.instance.healthCheck();
    }
    
    res.json({
      status: 'ok',
      health: healthStatus,
      loadedAt: loadedPlugin.loadedAt,
      uptime: Date.now() - loadedPlugin.loadedAt.getTime()
    });
  } catch (error) {
    console.error('Error testing plugin:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get plugin registry information
router.get('/plugin-registry', auth, requireAdmin, async (req, res) => {
  try {
    const pluginManager = req.app.get('pluginManager');
    const registry = pluginManager.registry;
    
    res.json({
      statistics: registry.getStatistics(),
      state: registry.exportState()
    });
  } catch (error) {
    console.error('Error fetching plugin registry:', error);
    res.status(500).json({ error: 'Failed to fetch plugin registry' });
  }
});

// Search plugins (future marketplace integration)
router.get('/plugin-store/search', auth, requireAdmin, async (req, res) => {
  try {
    const { q, category, sort = 'popularity' } = req.query;
    
    // This would integrate with a plugin marketplace
    const results = [
      {
        id: 'sample-plugin',
        name: 'Sample Plugin',
        displayName: 'Sample Plugin',
        description: 'A sample plugin for demonstration',
        version: '1.0.0',
        author: 'Plugin Developer',
        category: 'utility',
        downloads: 1000,
        rating: 4.5,
        price: 0,
        verified: true
      }
    ];
    
    res.json({ results });
  } catch (error) {
    console.error('Error searching plugin store:', error);
    res.status(500).json({ error: 'Failed to search plugin store' });
  }
});

module.exports = router; 