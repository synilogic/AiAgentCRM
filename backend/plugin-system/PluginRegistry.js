class PluginRegistry {
  constructor() {
    this.models = new Map();
    this.components = new Map();
    this.services = new Map();
    this.hooks = new Map();
    this.middleware = new Map();
    this.events = new Map();
  }

  /**
   * Register a plugin model
   */
  registerModel(pluginName, modelName, ModelClass) {
    const key = `${pluginName}:${modelName}`;
    
    if (this.models.has(key)) {
      throw new Error(`Model ${modelName} already registered for plugin ${pluginName}`);
    }
    
    this.models.set(key, {
      pluginName,
      modelName,
      ModelClass,
      registeredAt: new Date()
    });
    
    console.log(`📋 Registered model ${modelName} for plugin ${pluginName}`);
  }

  /**
   * Unregister plugin models
   */
  unregisterModels(pluginName) {
    const keysToDelete = [];
    
    for (const [key, model] of this.models) {
      if (model.pluginName === pluginName) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.models.delete(key);
    }
    
    console.log(`📋 Unregistered ${keysToDelete.length} models for plugin ${pluginName}`);
  }

  /**
   * Get plugin model
   */
  getModel(pluginName, modelName) {
    const key = `${pluginName}:${modelName}`;
    return this.models.get(key);
  }

  /**
   * Get all models for a plugin
   */
  getPluginModels(pluginName) {
    const pluginModels = [];
    
    for (const [key, model] of this.models) {
      if (model.pluginName === pluginName) {
        pluginModels.push(model);
      }
    }
    
    return pluginModels;
  }

  /**
   * Register a plugin component
   */
  registerComponent(pluginName, componentName, ComponentClass) {
    const key = `${pluginName}:${componentName}`;
    
    if (this.components.has(key)) {
      throw new Error(`Component ${componentName} already registered for plugin ${pluginName}`);
    }
    
    this.components.set(key, {
      pluginName,
      componentName,
      ComponentClass,
      registeredAt: new Date()
    });
    
    console.log(`🧩 Registered component ${componentName} for plugin ${pluginName}`);
  }

  /**
   * Unregister plugin components
   */
  unregisterComponents(pluginName) {
    const keysToDelete = [];
    
    for (const [key, component] of this.components) {
      if (component.pluginName === pluginName) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.components.delete(key);
    }
    
    console.log(`🧩 Unregistered ${keysToDelete.length} components for plugin ${pluginName}`);
  }

  /**
   * Get plugin component
   */
  getComponent(pluginName, componentName) {
    const key = `${pluginName}:${componentName}`;
    return this.components.get(key);
  }

  /**
   * Register a plugin service
   */
  registerService(pluginName, serviceName, ServiceClass) {
    const key = `${pluginName}:${serviceName}`;
    
    if (this.services.has(key)) {
      throw new Error(`Service ${serviceName} already registered for plugin ${pluginName}`);
    }
    
    this.services.set(key, {
      pluginName,
      serviceName,
      ServiceClass,
      instance: null,
      registeredAt: new Date()
    });
    
    console.log(`⚙️ Registered service ${serviceName} for plugin ${pluginName}`);
  }

  /**
   * Get plugin service instance
   */
  getService(pluginName, serviceName) {
    const key = `${pluginName}:${serviceName}`;
    const service = this.services.get(key);
    
    if (!service) {
      return null;
    }
    
    // Create instance if it doesn't exist
    if (!service.instance) {
      service.instance = new service.ServiceClass();
    }
    
    return service.instance;
  }

  /**
   * Unregister plugin services
   */
  unregisterServices(pluginName) {
    const keysToDelete = [];
    
    for (const [key, service] of this.services) {
      if (service.pluginName === pluginName) {
        // Cleanup service instance
        if (service.instance && typeof service.instance.cleanup === 'function') {
          service.instance.cleanup();
        }
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.services.delete(key);
    }
    
    console.log(`⚙️ Unregistered ${keysToDelete.length} services for plugin ${pluginName}`);
  }

  /**
   * Register a plugin hook
   */
  registerHook(pluginName, hookName, hookFunction) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    
    const hook = {
      pluginName,
      hookFunction,
      registeredAt: new Date()
    };
    
    this.hooks.get(hookName).push(hook);
    
    console.log(`🪝 Registered hook ${hookName} for plugin ${pluginName}`);
  }

  /**
   * Execute hooks
   */
  async executeHooks(hookName, ...args) {
    const hooks = this.hooks.get(hookName);
    
    if (!hooks || hooks.length === 0) {
      return args;
    }
    
    let result = args;
    
    for (const hook of hooks) {
      try {
        result = await hook.hookFunction(...result);
      } catch (error) {
        console.error(`❌ Hook ${hookName} failed for plugin ${hook.pluginName}:`, error);
      }
    }
    
    return result;
  }

  /**
   * Unregister plugin hooks
   */
  unregisterHooks(pluginName) {
    let removedCount = 0;
    
    for (const [hookName, hooks] of this.hooks) {
      const filteredHooks = hooks.filter(hook => hook.pluginName !== pluginName);
      
      if (filteredHooks.length !== hooks.length) {
        removedCount += hooks.length - filteredHooks.length;
        this.hooks.set(hookName, filteredHooks);
      }
    }
    
    console.log(`🪝 Unregistered ${removedCount} hooks for plugin ${pluginName}`);
  }

  /**
   * Register plugin middleware
   */
  registerMiddleware(pluginName, middlewareName, middlewareFunction) {
    const key = `${pluginName}:${middlewareName}`;
    
    if (this.middleware.has(key)) {
      throw new Error(`Middleware ${middlewareName} already registered for plugin ${pluginName}`);
    }
    
    this.middleware.set(key, {
      pluginName,
      middlewareName,
      middlewareFunction,
      registeredAt: new Date()
    });
    
    console.log(`🔗 Registered middleware ${middlewareName} for plugin ${pluginName}`);
  }

  /**
   * Get plugin middleware
   */
  getMiddleware(pluginName, middlewareName) {
    const key = `${pluginName}:${middlewareName}`;
    const middleware = this.middleware.get(key);
    
    return middleware ? middleware.middlewareFunction : null;
  }

  /**
   * Unregister plugin middleware
   */
  unregisterMiddleware(pluginName) {
    const keysToDelete = [];
    
    for (const [key, middleware] of this.middleware) {
      if (middleware.pluginName === pluginName) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.middleware.delete(key);
    }
    
    console.log(`🔗 Unregistered ${keysToDelete.length} middleware for plugin ${pluginName}`);
  }

  /**
   * Register plugin event listener
   */
  registerEventListener(pluginName, eventName, listenerFunction) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    
    const listener = {
      pluginName,
      listenerFunction,
      registeredAt: new Date()
    };
    
    this.events.get(eventName).push(listener);
    
    console.log(`📡 Registered event listener ${eventName} for plugin ${pluginName}`);
  }

  /**
   * Emit event to plugin listeners
   */
  async emitEvent(eventName, ...args) {
    const listeners = this.events.get(eventName);
    
    if (!listeners || listeners.length === 0) {
      return;
    }
    
    for (const listener of listeners) {
      try {
        await listener.listenerFunction(...args);
      } catch (error) {
        console.error(`❌ Event listener ${eventName} failed for plugin ${listener.pluginName}:`, error);
      }
    }
  }

  /**
   * Unregister plugin event listeners
   */
  unregisterEventListeners(pluginName) {
    let removedCount = 0;
    
    for (const [eventName, listeners] of this.events) {
      const filteredListeners = listeners.filter(listener => listener.pluginName !== pluginName);
      
      if (filteredListeners.length !== listeners.length) {
        removedCount += listeners.length - filteredListeners.length;
        this.events.set(eventName, filteredListeners);
      }
    }
    
    console.log(`📡 Unregistered ${removedCount} event listeners for plugin ${pluginName}`);
  }

  /**
   * Clean up all plugin registrations
   */
  unregisterAll(pluginName) {
    this.unregisterModels(pluginName);
    this.unregisterComponents(pluginName);
    this.unregisterServices(pluginName);
    this.unregisterHooks(pluginName);
    this.unregisterMiddleware(pluginName);
    this.unregisterEventListeners(pluginName);
    
    console.log(`🧹 Cleaned up all registrations for plugin ${pluginName}`);
  }

  /**
   * Get registry statistics
   */
  getStatistics() {
    const stats = {
      models: this.models.size,
      components: this.components.size,
      services: this.services.size,
      hooks: Array.from(this.hooks.values()).reduce((sum, hooks) => sum + hooks.length, 0),
      middleware: this.middleware.size,
      eventListeners: Array.from(this.events.values()).reduce((sum, listeners) => sum + listeners.length, 0)
    };
    
    return stats;
  }

  /**
   * Get all registrations for a plugin
   */
  getPluginRegistrations(pluginName) {
    const registrations = {
      models: [],
      components: [],
      services: [],
      hooks: [],
      middleware: [],
      eventListeners: []
    };
    
    // Models
    for (const [key, model] of this.models) {
      if (model.pluginName === pluginName) {
        registrations.models.push(model);
      }
    }
    
    // Components
    for (const [key, component] of this.components) {
      if (component.pluginName === pluginName) {
        registrations.components.push(component);
      }
    }
    
    // Services
    for (const [key, service] of this.services) {
      if (service.pluginName === pluginName) {
        registrations.services.push(service);
      }
    }
    
    // Hooks
    for (const [hookName, hooks] of this.hooks) {
      for (const hook of hooks) {
        if (hook.pluginName === pluginName) {
          registrations.hooks.push({ hookName, ...hook });
        }
      }
    }
    
    // Middleware
    for (const [key, middleware] of this.middleware) {
      if (middleware.pluginName === pluginName) {
        registrations.middleware.push(middleware);
      }
    }
    
    // Event listeners
    for (const [eventName, listeners] of this.events) {
      for (const listener of listeners) {
        if (listener.pluginName === pluginName) {
          registrations.eventListeners.push({ eventName, ...listener });
        }
      }
    }
    
    return registrations;
  }

  /**
   * Export registry state
   */
  exportState() {
    return {
      models: Object.fromEntries(this.models),
      components: Object.fromEntries(this.components),
      services: Object.fromEntries(this.services),
      hooks: Object.fromEntries(this.hooks),
      middleware: Object.fromEntries(this.middleware),
      events: Object.fromEntries(this.events)
    };
  }

  /**
   * Import registry state
   */
  importState(state) {
    this.models = new Map(Object.entries(state.models || {}));
    this.components = new Map(Object.entries(state.components || {}));
    this.services = new Map(Object.entries(state.services || {}));
    this.hooks = new Map(Object.entries(state.hooks || {}));
    this.middleware = new Map(Object.entries(state.middleware || {}));
    this.events = new Map(Object.entries(state.events || {}));
  }
}

module.exports = PluginRegistry; 