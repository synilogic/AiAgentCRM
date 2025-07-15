const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const Plugin = require('../models/Plugin');
const PluginLoader = require('./PluginLoader');
const PluginValidator = require('./PluginValidator');
const PluginSandbox = require('./PluginSandbox');
const PluginRegistry = require('./PluginRegistry');

class PluginManager extends EventEmitter {
  constructor(app) {
    super();
    this.app = app;
    this.pluginsDir = path.join(process.cwd(), 'plugins');
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    
    this.loader = new PluginLoader(this);
    this.validator = new PluginValidator();
    this.sandbox = new PluginSandbox();
    this.registry = new PluginRegistry();
    
    this.loadedPlugins = new Map();
    this.pluginRoutes = new Map();
    this.pluginMenus = new Map();
    
    // Plugin lifecycle events
    this.on('plugin:loading', this.onPluginLoading.bind(this));
    this.on('plugin:loaded', this.onPluginLoaded.bind(this));
    this.on('plugin:unloading', this.onPluginUnloading.bind(this));
    this.on('plugin:unloaded', this.onPluginUnloaded.bind(this));
    this.on('plugin:error', this.onPluginError.bind(this));
  }

  /**
   * Initialize the plugin system
   */
  async initialize() {
    try {
      console.log('🔌 Initializing Plugin System...');
      
      // Ensure directories exist
      await this.ensureDirectories();
      
      // Load all active plugins from database
      const activePlugins = await Plugin.findActive();
      
      console.log(`📦 Found ${activePlugins.length} active plugins`);
      
      // Load each plugin
      for (const pluginDoc of activePlugins) {
        try {
          await this.loadPlugin(pluginDoc);
        } catch (error) {
          console.error(`❌ Failed to load plugin ${pluginDoc.name}:`, error);
          await pluginDoc.recordError(error);
        }
      }
      
      // Start plugin discovery service
      await this.startDiscoveryService();
      
      console.log('✅ Plugin System initialized successfully');
      
    } catch (error) {
      console.error('❌ Plugin System initialization failed:', error);
      throw error;
    }
  }

  /**
   * Install a plugin from uploaded file
   */
  async installPlugin(filePath, userId) {
    try {
      console.log(`📦 Installing plugin from ${filePath}...`);
      
      // Extract and validate plugin
      const pluginInfo = await this.validator.validatePlugin(filePath);
      
      // Check if plugin already exists
      const existingPlugin = await Plugin.findOne({ name: pluginInfo.name });
      if (existingPlugin) {
        throw new Error(`Plugin ${pluginInfo.name} already exists`);
      }
      
      // Create plugin directory
      const pluginDir = path.join(this.pluginsDir, pluginInfo.name);
      await fs.mkdir(pluginDir, { recursive: true });
      
      // Extract plugin files
      await this.extractPlugin(filePath, pluginDir);
      
      // Create plugin record in database
      const pluginDoc = new Plugin({
        name: pluginInfo.name,
        version: pluginInfo.version,
        displayName: pluginInfo.displayName,
        description: pluginInfo.description,
        author: pluginInfo.author,
        homepage: pluginInfo.homepage,
        keywords: pluginInfo.keywords,
        path: pluginInfo.name,
        main: pluginInfo.main,
        frontend: pluginInfo.frontend,
        permissions: pluginInfo.permissions,
        dependencies: pluginInfo.dependencies,
        compatibility: pluginInfo.compatibility,
        routes: pluginInfo.routes,
        models: pluginInfo.models,
        menu: pluginInfo.menu,
        settings: pluginInfo.settings,
        manifest: pluginInfo,
        installation: {
          installedBy: userId,
          source: 'upload',
          checksum: await this.calculateChecksum(filePath),
          size: (await fs.stat(filePath)).size
        }
      });
      
      await pluginDoc.save();
      
      // Install dependencies
      await this.installDependencies(pluginDir, pluginInfo.dependencies);
      
      console.log(`✅ Plugin ${pluginInfo.name} installed successfully`);
      
      this.emit('plugin:installed', pluginDoc);
      
      return pluginDoc;
      
    } catch (error) {
      console.error('❌ Plugin installation failed:', error);
      throw error;
    }
  }

  /**
   * Load a plugin
   */
  async loadPlugin(pluginDoc) {
    try {
      console.log(`🔄 Loading plugin ${pluginDoc.name}...`);
      
      this.emit('plugin:loading', pluginDoc);
      
      // Check if already loaded
      if (this.loadedPlugins.has(pluginDoc.name)) {
        console.log(`⚠️  Plugin ${pluginDoc.name} already loaded`);
        return;
      }
      
      // Load plugin code
      const pluginInstance = await this.loader.loadPlugin(pluginDoc);
      
      // Register plugin routes
      await this.registerPluginRoutes(pluginDoc, pluginInstance);
      
      // Register plugin models
      await this.registerPluginModels(pluginDoc, pluginInstance);
      
      // Register plugin menu items
      await this.registerPluginMenus(pluginDoc);
      
      // Store loaded plugin
      this.loadedPlugins.set(pluginDoc.name, {
        doc: pluginDoc,
        instance: pluginInstance,
        loadedAt: new Date()
      });
      
      // Update plugin status
      await pluginDoc.activate();
      
      console.log(`✅ Plugin ${pluginDoc.name} loaded successfully`);
      
      this.emit('plugin:loaded', pluginDoc);
      
    } catch (error) {
      console.error(`❌ Failed to load plugin ${pluginDoc.name}:`, error);
      await pluginDoc.recordError(error);
      this.emit('plugin:error', pluginDoc, error);
      throw error;
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginName) {
    try {
      console.log(`🔄 Unloading plugin ${pluginName}...`);
      
      const loadedPlugin = this.loadedPlugins.get(pluginName);
      if (!loadedPlugin) {
        throw new Error(`Plugin ${pluginName} is not loaded`);
      }
      
      this.emit('plugin:unloading', loadedPlugin.doc);
      
      // Unregister routes
      await this.unregisterPluginRoutes(pluginName);
      
      // Unregister models
      await this.unregisterPluginModels(pluginName);
      
      // Unregister menu items
      await this.unregisterPluginMenus(pluginName);
      
      // Call plugin cleanup if available
      if (loadedPlugin.instance.cleanup) {
        await loadedPlugin.instance.cleanup();
      }
      
      // Remove from loaded plugins
      this.loadedPlugins.delete(pluginName);
      
      // Update plugin status
      await loadedPlugin.doc.deactivate();
      
      console.log(`✅ Plugin ${pluginName} unloaded successfully`);
      
      this.emit('plugin:unloaded', loadedPlugin.doc);
      
    } catch (error) {
      console.error(`❌ Failed to unload plugin ${pluginName}:`, error);
      this.emit('plugin:error', { name: pluginName }, error);
      throw error;
    }
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginName) {
    try {
      const pluginDoc = await Plugin.findOne({ name: pluginName });
      if (!pluginDoc) {
        throw new Error(`Plugin ${pluginName} not found`);
      }
      
      if (pluginDoc.isActive) {
        throw new Error(`Plugin ${pluginName} is already active`);
      }
      
      await this.loadPlugin(pluginDoc);
      
      return pluginDoc;
      
    } catch (error) {
      console.error(`❌ Failed to enable plugin ${pluginName}:`, error);
      throw error;
    }
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginName) {
    try {
      const pluginDoc = await Plugin.findOne({ name: pluginName });
      if (!pluginDoc) {
        throw new Error(`Plugin ${pluginName} not found`);
      }
      
      if (!pluginDoc.isActive) {
        throw new Error(`Plugin ${pluginName} is not active`);
      }
      
      await this.unloadPlugin(pluginName);
      
      return pluginDoc;
      
    } catch (error) {
      console.error(`❌ Failed to disable plugin ${pluginName}:`, error);
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginName) {
    try {
      console.log(`🗑️  Uninstalling plugin ${pluginName}...`);
      
      const pluginDoc = await Plugin.findOne({ name: pluginName });
      if (!pluginDoc) {
        throw new Error(`Plugin ${pluginName} not found`);
      }
      
      // Unload plugin if active
      if (pluginDoc.isActive) {
        await this.unloadPlugin(pluginName);
      }
      
      // Remove plugin files
      const pluginDir = path.join(this.pluginsDir, pluginName);
      await fs.rmdir(pluginDir, { recursive: true });
      
      // Remove from database
      await Plugin.deleteOne({ name: pluginName });
      
      console.log(`✅ Plugin ${pluginName} uninstalled successfully`);
      
      this.emit('plugin:uninstalled', pluginDoc);
      
    } catch (error) {
      console.error(`❌ Failed to uninstall plugin ${pluginName}:`, error);
      throw error;
    }
  }

  /**
   * Get all plugins
   */
  async getAllPlugins() {
    return await Plugin.find().sort({ createdAt: -1 });
  }

  /**
   * Get plugin by name
   */
  async getPlugin(pluginName) {
    return await Plugin.findOne({ name: pluginName });
  }

  /**
   * Get plugin statistics
   */
  async getPluginStatistics() {
    const stats = await Plugin.getStatistics();
    const loadedCount = this.loadedPlugins.size;
    
    return {
      total: await Plugin.countDocuments(),
      active: await Plugin.countDocuments({ status: 'active' }),
      inactive: await Plugin.countDocuments({ status: 'inactive' }),
      error: await Plugin.countDocuments({ status: 'error' }),
      loaded: loadedCount,
      details: stats
    };
  }

  /**
   * Register plugin routes
   */
  async registerPluginRoutes(pluginDoc, pluginInstance) {
    if (!pluginDoc.routes || pluginDoc.routes.length === 0) {
      return;
    }
    
    const router = require('express').Router();
    const pluginRoutes = [];
    
    for (const route of pluginDoc.routes) {
      const handler = pluginInstance[route.handler];
      if (typeof handler === 'function') {
        const middleware = [
          this.createPluginMiddleware(pluginDoc),
          ...(route.middleware || []).map(m => pluginInstance[m]).filter(Boolean)
        ];
        
        router[route.method.toLowerCase()](route.path, ...middleware, handler.bind(pluginInstance));
        pluginRoutes.push(route);
      }
    }
    
    // Mount plugin routes
    this.app.use('/api/plugins/' + pluginDoc.name, router);
    this.pluginRoutes.set(pluginDoc.name, pluginRoutes);
  }

  /**
   * Unregister plugin routes
   */
  async unregisterPluginRoutes(pluginName) {
    // Express doesn't have a direct way to unregister routes
    // This would require a more sophisticated routing system
    this.pluginRoutes.delete(pluginName);
  }

  /**
   * Register plugin models
   */
  async registerPluginModels(pluginDoc, pluginInstance) {
    if (!pluginDoc.models || pluginDoc.models.length === 0) {
      return;
    }
    
    for (const model of pluginDoc.models) {
      const ModelClass = pluginInstance[model.name];
      if (ModelClass) {
        this.registry.registerModel(pluginDoc.name, model.name, ModelClass);
      }
    }
  }

  /**
   * Unregister plugin models
   */
  async unregisterPluginModels(pluginName) {
    this.registry.unregisterModels(pluginName);
  }

  /**
   * Register plugin menu items
   */
  async registerPluginMenus(pluginDoc) {
    if (pluginDoc.menu && pluginDoc.menu.length > 0) {
      this.pluginMenus.set(pluginDoc.name, pluginDoc.menu);
    }
  }

  /**
   * Unregister plugin menu items
   */
  async unregisterPluginMenus(pluginName) {
    this.pluginMenus.delete(pluginName);
  }

  /**
   * Get all plugin menu items
   */
  getPluginMenus() {
    const menus = [];
    for (const [pluginName, pluginMenus] of this.pluginMenus) {
      menus.push(...pluginMenus.map(menu => ({ ...menu, plugin: pluginName })));
    }
    return menus.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Create plugin middleware
   */
  createPluginMiddleware(pluginDoc) {
    return async (req, res, next) => {
      // Add plugin context to request
      req.plugin = {
        name: pluginDoc.name,
        version: pluginDoc.version,
        permissions: pluginDoc.permissions
      };
      
      // Increment API call counter
      await pluginDoc.incrementApiCalls();
      
      next();
    };
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const dirs = [this.pluginsDir, this.uploadsDir];
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Start plugin discovery service
   */
  async startDiscoveryService() {
    // Watch for new plugins in the plugins directory
    const watcher = require('chokidar').watch(this.pluginsDir, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true
    });
    
    watcher.on('addDir', async (pluginPath) => {
      // Check if it's a new plugin directory
      const manifestPath = path.join(pluginPath, 'plugin.json');
      try {
        await fs.access(manifestPath);
        // New plugin detected, process it
        console.log(`🔍 New plugin detected: ${pluginPath}`);
      } catch (error) {
        // Not a plugin directory
      }
    });
  }

  /**
   * Extract plugin files
   */
  async extractPlugin(filePath, targetDir) {
    // Implementation depends on the upload format (zip, tar, etc.)
    // This is a placeholder for the actual extraction logic
    console.log(`📦 Extracting plugin from ${filePath} to ${targetDir}`);
  }

  /**
   * Install plugin dependencies
   */
  async installDependencies(pluginDir, dependencies) {
    if (!dependencies || Object.keys(dependencies).length === 0) {
      return;
    }
    
    console.log(`📦 Installing dependencies for plugin...`);
    
    // Create package.json for the plugin
    const packageJson = {
      name: path.basename(pluginDir),
      version: '1.0.0',
      dependencies: dependencies
    };
    
    await fs.writeFile(
      path.join(pluginDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    // Install dependencies (this would run npm install in the plugin directory)
    // Implementation depends on your deployment environment
  }

  /**
   * Calculate file checksum
   */
  async calculateChecksum(filePath) {
    const crypto = require('crypto');
    const fileBuffer = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    return hash.digest('hex');
  }

  // Event handlers
  onPluginLoading(pluginDoc) {
    console.log(`🔄 Plugin ${pluginDoc.name} is loading...`);
  }

  onPluginLoaded(pluginDoc) {
    console.log(`✅ Plugin ${pluginDoc.name} loaded successfully`);
  }

  onPluginUnloading(pluginDoc) {
    console.log(`🔄 Plugin ${pluginDoc.name} is unloading...`);
  }

  onPluginUnloaded(pluginDoc) {
    console.log(`✅ Plugin ${pluginDoc.name} unloaded successfully`);
  }

  onPluginError(pluginDoc, error) {
    console.error(`❌ Plugin ${pluginDoc.name} error:`, error);
  }
}

module.exports = PluginManager; 