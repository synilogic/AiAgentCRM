const fs = require('fs').promises;
const path = require('path');
const vm = require('vm');

class PluginLoader {
  constructor(pluginManager) {
    this.pluginManager = pluginManager;
    this.moduleCache = new Map();
  }

  /**
   * Load a plugin
   */
  async loadPlugin(pluginDoc) {
    try {
      const pluginPath = path.join(process.cwd(), 'plugins', pluginDoc.path);
      const mainFile = path.join(pluginPath, pluginDoc.main);
      
      // Check if plugin files exist
      await fs.access(mainFile);
      
      // Clear module cache for hot reloading
      this.clearModuleCache(pluginPath);
      
      // Load plugin manifest
      const manifestPath = path.join(pluginPath, 'plugin.json');
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      
      // Create plugin context
      const context = this.createPluginContext(pluginDoc, manifest);
      
      // Load the plugin module
      const pluginModule = await this.loadPluginModule(mainFile, context);
      
      // Initialize plugin if it has an init method
      if (typeof pluginModule.init === 'function') {
        await pluginModule.init(context);
      }
      
      return pluginModule;
      
    } catch (error) {
      throw new Error(`Failed to load plugin ${pluginDoc.name}: ${error.message}`);
    }
  }

  /**
   * Load plugin module with context
   */
  async loadPluginModule(mainFile, context) {
    try {
      // Read plugin code
      const pluginCode = await fs.readFile(mainFile, 'utf8');
      
      // Create a sandbox for the plugin
      const sandbox = {
        ...context,
        require: this.createRequire(mainFile),
        module: { exports: {} },
        exports: {},
        __filename: mainFile,
        __dirname: path.dirname(mainFile),
        console: console,
        process: {
          env: process.env,
          cwd: process.cwd,
          version: process.version
        },
        Buffer: Buffer,
        setTimeout: setTimeout,
        setInterval: setInterval,
        clearTimeout: clearTimeout,
        clearInterval: clearInterval
      };
      
      // Link module.exports and exports
      sandbox.module.exports = sandbox.exports;
      
      // Execute plugin code in sandbox
      const script = new vm.Script(pluginCode, {
        filename: mainFile,
        displayErrors: true
      });
      
      script.runInNewContext(sandbox, {
        timeout: 10000, // 10 second timeout
        breakOnSigint: true
      });
      
      // Return the plugin module
      return sandbox.module.exports;
      
    } catch (error) {
      throw new Error(`Failed to execute plugin module: ${error.message}`);
    }
  }

  /**
   * Create plugin context
   */
  createPluginContext(pluginDoc, manifest) {
    return {
      // Plugin metadata
      plugin: {
        name: pluginDoc.name,
        version: pluginDoc.version,
        displayName: pluginDoc.displayName,
        description: pluginDoc.description,
        author: pluginDoc.author,
        manifest: manifest,
        settings: pluginDoc.settings.values || {}
      },
      
      // Core API access
      api: {
        // Database models
        models: {
          User: require('../models/User'),
          Lead: require('../models/Lead'),
          Activity: require('../models/Activity'),
          Task: require('../models/Task'),
          Message: require('../models/Message'),
          Plan: require('../models/Plan'),
          Payment: require('../models/Payment'),
          Notification: require('../models/Notification')
        },
        
        // Utility functions
        utils: {
          logger: console, // Replace with actual logger
          validator: require('validator'),
          crypto: require('crypto'),
          moment: require('moment')
        },
        
        // HTTP client
        http: require('axios'),
        
        // Event system
        events: this.pluginManager,
        
        // Plugin management
        pluginManager: {
          getPlugin: this.pluginManager.getPlugin.bind(this.pluginManager),
          getAllPlugins: this.pluginManager.getAllPlugins.bind(this.pluginManager),
          getPluginStatistics: this.pluginManager.getPluginStatistics.bind(this.pluginManager)
        }
      },
      
      // Restricted globals
      global: undefined,
      GLOBAL: undefined,
      root: undefined,
      window: undefined
    };
  }

  /**
   * Create a restricted require function
   */
  createRequire(pluginFile) {
    const pluginDir = path.dirname(pluginFile);
    const originalRequire = require;
    
    return function pluginRequire(moduleName) {
      // Allow built-in modules
      if (module.builtinModules && module.builtinModules.includes(moduleName)) {
        return originalRequire(moduleName);
      }
      
      // Allow whitelisted modules
      const allowedModules = [
        'lodash',
        'moment',
        'axios',
        'validator',
        'crypto',
        'path',
        'fs',
        'util',
        'events',
        'express',
        'mongoose'
      ];
      
      if (allowedModules.includes(moduleName)) {
        return originalRequire(moduleName);
      }
      
      // Allow relative requires within plugin directory
      if (moduleName.startsWith('./') || moduleName.startsWith('../')) {
        const resolvedPath = path.resolve(pluginDir, moduleName);
        if (resolvedPath.startsWith(pluginDir)) {
          return originalRequire(resolvedPath);
        }
      }
      
      // Check if module is installed in plugin's node_modules
      const pluginNodeModules = path.join(pluginDir, 'node_modules', moduleName);
      try {
        require.resolve(pluginNodeModules);
        return originalRequire(pluginNodeModules);
      } catch (error) {
        // Module not found in plugin's node_modules
      }
      
      throw new Error(`Module '${moduleName}' is not allowed or not found`);
    };
  }

  /**
   * Clear module cache for hot reloading
   */
  clearModuleCache(pluginPath) {
    const keys = Object.keys(require.cache);
    for (const key of keys) {
      if (key.startsWith(pluginPath)) {
        delete require.cache[key];
      }
    }
  }

  /**
   * Unload plugin
   */
  async unloadPlugin(pluginName) {
    if (this.moduleCache.has(pluginName)) {
      const pluginModule = this.moduleCache.get(pluginName);
      
      // Call cleanup if available
      if (typeof pluginModule.cleanup === 'function') {
        await pluginModule.cleanup();
      }
      
      this.moduleCache.delete(pluginName);
    }
  }

  /**
   * Reload plugin
   */
  async reloadPlugin(pluginDoc) {
    // Unload first
    await this.unloadPlugin(pluginDoc.name);
    
    // Load again
    return await this.loadPlugin(pluginDoc);
  }

  /**
   * Validate plugin code before loading
   */
  async validatePluginCode(pluginPath) {
    try {
      const mainFile = path.join(pluginPath, 'backend', 'index.js');
      const pluginCode = await fs.readFile(mainFile, 'utf8');
      
      // Basic syntax check
      new vm.Script(pluginCode, {
        filename: mainFile,
        displayErrors: true
      });
      
      // Check for dangerous patterns
      const dangerousPatterns = [
        /eval\s*\(/,
        /Function\s*\(/,
        /process\.exit/,
        /require\s*\(\s*['"]child_process['"]\s*\)/,
        /require\s*\(\s*['"]fs['"]\s*\)/,
        /require\s*\(\s*['"]path['"]\s*\)/,
        /\.\.\/\.\.\//,
        /\/etc\//,
        /\/usr\//,
        /\/var\//,
        /\/tmp\//
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(pluginCode)) {
          throw new Error(`Plugin contains potentially dangerous code: ${pattern.source}`);
        }
      }
      
      return true;
      
    } catch (error) {
      throw new Error(`Plugin code validation failed: ${error.message}`);
    }
  }
}

module.exports = PluginLoader; 