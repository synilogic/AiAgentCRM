const vm = require('vm');
const path = require('path');

class PluginSandbox {
  constructor() {
    this.sandboxes = new Map();
    this.resourceLimits = {
      maxMemory: 50 * 1024 * 1024, // 50MB per plugin
      maxCpuTime: 5000, // 5 seconds CPU time
      maxExecutionTime: 30000, // 30 seconds wall time
      maxFileSize: 10 * 1024 * 1024, // 10MB max file size
      maxNetworkConnections: 10
    };
  }

  /**
   * Create a sandboxed execution environment for a plugin
   */
  createSandbox(pluginDoc, context) {
    const sandbox = {
      // Plugin context
      ...context,
      
      // Restricted require function
      require: this.createRestrictedRequire(pluginDoc),
      
      // Module system
      module: { exports: {} },
      exports: {},
      
      // File system paths
      __filename: path.join(process.cwd(), 'plugins', pluginDoc.path, pluginDoc.main),
      __dirname: path.join(process.cwd(), 'plugins', pluginDoc.path),
      
      // Console (with logging restrictions)
      console: this.createRestrictedConsole(pluginDoc),
      
      // Restricted process object
      process: this.createRestrictedProcess(),
      
      // Safe global objects
      Buffer: Buffer,
      Date: Date,
      Error: Error,
      JSON: JSON,
      Math: Math,
      Object: Object,
      RegExp: RegExp,
      String: String,
      Number: Number,
      Boolean: Boolean,
      Array: Array,
      
      // Timers with restrictions
      setTimeout: this.createRestrictedTimer(setTimeout),
      setInterval: this.createRestrictedTimer(setInterval),
      clearTimeout: clearTimeout,
      clearInterval: clearInterval,
      
      // Restricted globals (undefined to prevent access)
      global: undefined,
      GLOBAL: undefined,
      root: undefined,
      window: undefined,
      self: undefined,
      
      // Security context
      __security: {
        pluginName: pluginDoc.name,
        permissions: pluginDoc.permissions || [],
        resourceLimits: this.resourceLimits,
        restrictions: pluginDoc.security.sandbox.restrictions || []
      }
    };
    
    // Link module.exports and exports
    sandbox.module.exports = sandbox.exports;
    
    // Store sandbox reference
    this.sandboxes.set(pluginDoc.name, sandbox);
    
    return sandbox;
  }

  /**
   * Execute code in sandbox
   */
  async executeInSandbox(pluginDoc, code, sandbox) {
    try {
      // Resource monitoring
      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;
      
      // Create VM script
      const script = new vm.Script(code, {
        filename: sandbox.__filename,
        displayErrors: true,
        timeout: this.resourceLimits.maxExecutionTime
      });
      
      // Execute in sandbox
      const result = script.runInNewContext(sandbox, {
        timeout: this.resourceLimits.maxExecutionTime,
        breakOnSigint: true,
        microtaskMode: 'afterEvaluate'
      });
      
      // Monitor resource usage
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      const executionTime = endTime - startTime;
      const memoryUsed = endMemory - startMemory;
      
      // Check resource limits
      if (executionTime > this.resourceLimits.maxExecutionTime) {
        throw new Error(`Plugin exceeded maximum execution time: ${executionTime}ms`);
      }
      
      if (memoryUsed > this.resourceLimits.maxMemory) {
        throw new Error(`Plugin exceeded maximum memory usage: ${memoryUsed} bytes`);
      }
      
      // Log resource usage
      console.log(`Plugin ${pluginDoc.name} - Execution: ${executionTime}ms, Memory: ${memoryUsed} bytes`);
      
      return result;
      
    } catch (error) {
      // Enhanced error handling
      if (error.name === 'ReferenceError' && error.message.includes('not defined')) {
        throw new Error(`Plugin attempted to access restricted variable: ${error.message}`);
      }
      
      if (error.name === 'TypeError' && error.message.includes('not a function')) {
        throw new Error(`Plugin attempted to call restricted function: ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Create restricted require function
   */
  createRestrictedRequire(pluginDoc) {
    const pluginDir = path.join(process.cwd(), 'plugins', pluginDoc.path);
    const originalRequire = require;
    
    return function restrictedRequire(moduleName) {
      // Check if module is allowed
      if (!this.isModuleAllowed(moduleName, pluginDoc.permissions)) {
        throw new Error(`Module '${moduleName}' is not allowed for plugin ${pluginDoc.name}`);
      }
      
      // Built-in modules
      if (module.builtinModules && module.builtinModules.includes(moduleName)) {
        return this.wrapBuiltinModule(originalRequire(moduleName), moduleName);
      }
      
      // Whitelisted external modules
      const allowedModules = this.getAllowedModules(pluginDoc.permissions);
      if (allowedModules.includes(moduleName)) {
        return originalRequire(moduleName);
      }
      
      // Relative requires within plugin directory
      if (moduleName.startsWith('./') || moduleName.startsWith('../')) {
        const resolvedPath = path.resolve(pluginDir, moduleName);
        if (resolvedPath.startsWith(pluginDir)) {
          return originalRequire(resolvedPath);
        }
        throw new Error(`Plugin cannot access files outside its directory: ${moduleName}`);
      }
      
      // Plugin's own node_modules
      const pluginNodeModules = path.join(pluginDir, 'node_modules', moduleName);
      try {
        require.resolve(pluginNodeModules);
        return originalRequire(pluginNodeModules);
      } catch (error) {
        // Module not found
      }
      
      throw new Error(`Module '${moduleName}' is not allowed or not found`);
    }.bind(this);
  }

  /**
   * Check if module is allowed based on permissions
   */
  isModuleAllowed(moduleName, permissions) {
    const modulePermissions = {
      'fs': ['system:read', 'system:write'],
      'child_process': ['system:write'],
      'cluster': ['system:write'],
      'dgram': ['network:access'],
      'net': ['network:access'],
      'tls': ['network:access'],
      'crypto': ['crypto:access'],
      'os': ['system:read'],
      'process': ['system:read'],
      'vm': ['system:write']
    };
    
    if (modulePermissions[moduleName]) {
      return permissions.some(permission => 
        modulePermissions[moduleName].includes(permission)
      );
    }
    
    return true; // Allow by default for unlisted modules
  }

  /**
   * Get allowed modules based on permissions
   */
  getAllowedModules(permissions) {
    const baseModules = [
      'lodash',
      'moment',
      'axios',
      'validator',
      'express',
      'mongoose'
    ];
    
    const permissionModules = {
      'crypto:access': ['crypto'],
      'network:access': ['http', 'https', 'url'],
      'system:read': ['os', 'path', 'util'],
      'system:write': ['fs']
    };
    
    let allowedModules = [...baseModules];
    
    for (const permission of permissions) {
      if (permissionModules[permission]) {
        allowedModules = allowedModules.concat(permissionModules[permission]);
      }
    }
    
    return [...new Set(allowedModules)];
  }

  /**
   * Wrap built-in modules with restrictions
   */
  wrapBuiltinModule(module, moduleName) {
    switch (moduleName) {
      case 'fs':
        return this.wrapFileSystem(module);
      case 'http':
      case 'https':
        return this.wrapHttpModule(module);
      case 'crypto':
        return this.wrapCryptoModule(module);
      default:
        return module;
    }
  }

  /**
   * Wrap file system module with restrictions
   */
  wrapFileSystem(fs) {
    const restrictedPaths = [
      '/etc/',
      '/usr/',
      '/var/',
      '/tmp/',
      '/home/',
      '/root/',
      process.cwd() + '/backend/',
      process.cwd() + '/frontend/',
      process.cwd() + '/.env'
    ];
    
    const checkPath = (filePath) => {
      const absolutePath = path.resolve(filePath);
      for (const restricted of restrictedPaths) {
        if (absolutePath.startsWith(restricted)) {
          throw new Error(`Access denied to path: ${filePath}`);
        }
      }
    };
    
    return {
      ...fs,
      readFile: (filePath, ...args) => {
        checkPath(filePath);
        return fs.readFile(filePath, ...args);
      },
      writeFile: (filePath, ...args) => {
        checkPath(filePath);
        return fs.writeFile(filePath, ...args);
      },
      access: (filePath, ...args) => {
        checkPath(filePath);
        return fs.access(filePath, ...args);
      },
      stat: (filePath, ...args) => {
        checkPath(filePath);
        return fs.stat(filePath, ...args);
      }
    };
  }

  /**
   * Wrap HTTP module with restrictions
   */
  wrapHttpModule(http) {
    const allowedDomains = [
      'api.github.com',
      'api.stripe.com',
      'api.paypal.com',
      'graph.facebook.com',
      'api.twitter.com'
    ];
    
    const checkUrl = (url) => {
      const urlObj = new URL(url);
      if (!allowedDomains.includes(urlObj.hostname)) {
        throw new Error(`HTTP request to ${urlObj.hostname} is not allowed`);
      }
    };
    
    return {
      ...http,
      request: (url, ...args) => {
        if (typeof url === 'string') {
          checkUrl(url);
        } else if (url.hostname) {
          checkUrl(`http://${url.hostname}`);
        }
        return http.request(url, ...args);
      },
      get: (url, ...args) => {
        checkUrl(url);
        return http.get(url, ...args);
      }
    };
  }

  /**
   * Wrap crypto module with restrictions
   */
  wrapCryptoModule(crypto) {
    return {
      ...crypto,
      // Remove potentially dangerous functions
      privateDecrypt: undefined,
      publicDecrypt: undefined,
      privateEncrypt: undefined,
      publicEncrypt: undefined
    };
  }

  /**
   * Create restricted console
   */
  createRestrictedConsole(pluginDoc) {
    const originalConsole = console;
    const logLimit = 1000; // Max 1000 log messages per plugin
    let logCount = 0;
    
    return {
      log: (...args) => {
        if (logCount++ < logLimit) {
          originalConsole.log(`[Plugin:${pluginDoc.name}]`, ...args);
        }
      },
      error: (...args) => {
        if (logCount++ < logLimit) {
          originalConsole.error(`[Plugin:${pluginDoc.name}]`, ...args);
        }
      },
      warn: (...args) => {
        if (logCount++ < logLimit) {
          originalConsole.warn(`[Plugin:${pluginDoc.name}]`, ...args);
        }
      },
      info: (...args) => {
        if (logCount++ < logLimit) {
          originalConsole.info(`[Plugin:${pluginDoc.name}]`, ...args);
        }
      },
      debug: (...args) => {
        if (logCount++ < logLimit) {
          originalConsole.debug(`[Plugin:${pluginDoc.name}]`, ...args);
        }
      }
    };
  }

  /**
   * Create restricted process object
   */
  createRestrictedProcess() {
    return {
      env: {
        NODE_ENV: process.env.NODE_ENV,
        // Only expose safe environment variables
      },
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: () => process.cwd(),
      // Remove dangerous methods
      exit: undefined,
      kill: undefined,
      abort: undefined,
      chdir: undefined,
      setuid: undefined,
      setgid: undefined
    };
  }

  /**
   * Create restricted timer functions
   */
  createRestrictedTimer(originalTimer) {
    const maxTimers = 100;
    let timerCount = 0;
    
    return function(...args) {
      if (timerCount++ > maxTimers) {
        throw new Error('Plugin exceeded maximum number of timers');
      }
      
      // Wrap callback to track timer completion
      const originalCallback = args[0];
      args[0] = function(...callbackArgs) {
        timerCount--;
        return originalCallback(...callbackArgs);
      };
      
      return originalTimer(...args);
    };
  }

  /**
   * Clean up sandbox
   */
  destroySandbox(pluginName) {
    if (this.sandboxes.has(pluginName)) {
      const sandbox = this.sandboxes.get(pluginName);
      
      // Clear all timers
      if (sandbox.__timers) {
        for (const timer of sandbox.__timers) {
          clearTimeout(timer);
          clearInterval(timer);
        }
      }
      
      // Clear sandbox reference
      this.sandboxes.delete(pluginName);
    }
  }

  /**
   * Get sandbox for plugin
   */
  getSandbox(pluginName) {
    return this.sandboxes.get(pluginName);
  }

  /**
   * Update resource limits
   */
  updateResourceLimits(limits) {
    this.resourceLimits = { ...this.resourceLimits, ...limits };
  }

  /**
   * Get resource usage statistics
   */
  getResourceUsage() {
    const usage = {};
    for (const [pluginName, sandbox] of this.sandboxes) {
      usage[pluginName] = {
        memoryUsage: sandbox.__memoryUsage || 0,
        cpuTime: sandbox.__cpuTime || 0,
        timers: sandbox.__timers ? sandbox.__timers.length : 0
      };
    }
    return usage;
  }
}

module.exports = PluginSandbox; 