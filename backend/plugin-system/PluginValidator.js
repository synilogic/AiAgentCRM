const fs = require('fs').promises;
const path = require('path');
const semver = require('semver');
const crypto = require('crypto');

class PluginValidator {
  constructor() {
    this.requiredFields = [
      'name',
      'version',
      'displayName',
      'description',
      'author',
      'main'
    ];
    
    this.optionalFields = [
      'homepage',
      'keywords',
      'frontend',
      'permissions',
      'dependencies',
      'compatibility',
      'routes',
      'models',
      'menu',
      'settings'
    ];
  }

  /**
   * Validate plugin from uploaded file
   */
  async validatePlugin(filePath) {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Extract and validate manifest
      const manifest = await this.extractManifest(filePath);
      
      // Validate manifest structure
      this.validateManifest(manifest);
      
      // Validate plugin code
      await this.validatePluginCode(filePath);
      
      // Validate dependencies
      await this.validateDependencies(manifest.dependencies);
      
      // Validate permissions
      this.validatePermissions(manifest.permissions);
      
      return manifest;
      
    } catch (error) {
      throw new Error(`Plugin validation failed: ${error.message}`);
    }
  }

  /**
   * Extract manifest from plugin file
   */
  async extractManifest(filePath) {
    try {
      // This is a placeholder - implementation depends on file format
      // For now, assume it's a directory with plugin.json
      const manifestPath = path.join(filePath, 'plugin.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf8');
      
      return JSON.parse(manifestContent);
      
    } catch (error) {
      throw new Error(`Failed to extract manifest: ${error.message}`);
    }
  }

  /**
   * Validate plugin manifest
   */
  validateManifest(manifest) {
    // Check required fields
    for (const field of this.requiredFields) {
      if (!manifest[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate field types and formats
    this.validateField('name', manifest.name, 'string', /^[a-z][a-z0-9\-]*$/);
    this.validateField('version', manifest.version, 'string');
    this.validateField('displayName', manifest.displayName, 'string');
    this.validateField('description', manifest.description, 'string');
    this.validateField('author', manifest.author, 'string');
    this.validateField('main', manifest.main, 'string');
    
    // Validate version format
    if (!semver.valid(manifest.version)) {
      throw new Error(`Invalid version format: ${manifest.version}`);
    }
    
    // Validate optional fields
    if (manifest.homepage && typeof manifest.homepage !== 'string') {
      throw new Error('homepage must be a string');
    }
    
    if (manifest.keywords && !Array.isArray(manifest.keywords)) {
      throw new Error('keywords must be an array');
    }
    
    if (manifest.permissions && !Array.isArray(manifest.permissions)) {
      throw new Error('permissions must be an array');
    }
    
    if (manifest.dependencies && typeof manifest.dependencies !== 'object') {
      throw new Error('dependencies must be an object');
    }
    
    if (manifest.routes && !Array.isArray(manifest.routes)) {
      throw new Error('routes must be an array');
    }
    
    if (manifest.models && !Array.isArray(manifest.models)) {
      throw new Error('models must be an array');
    }
    
    if (manifest.menu && !Array.isArray(manifest.menu)) {
      throw new Error('menu must be an array');
    }
    
    // Validate routes
    if (manifest.routes) {
      for (const route of manifest.routes) {
        this.validateRoute(route);
      }
    }
    
    // Validate models
    if (manifest.models) {
      for (const model of manifest.models) {
        this.validateModel(model);
      }
    }
    
    // Validate menu items
    if (manifest.menu) {
      for (const menuItem of manifest.menu) {
        this.validateMenuItem(menuItem);
      }
    }
    
    // Validate compatibility
    if (manifest.compatibility) {
      this.validateCompatibility(manifest.compatibility);
    }
    
    // Validate settings
    if (manifest.settings) {
      this.validateSettings(manifest.settings);
    }
  }

  /**
   * Validate a field
   */
  validateField(fieldName, value, type, pattern) {
    if (typeof value !== type) {
      throw new Error(`${fieldName} must be a ${type}`);
    }
    
    if (pattern && !pattern.test(value)) {
      throw new Error(`${fieldName} format is invalid`);
    }
  }

  /**
   * Validate route definition
   */
  validateRoute(route) {
    if (!route.path || typeof route.path !== 'string') {
      throw new Error('Route path is required and must be a string');
    }
    
    if (!route.method || typeof route.method !== 'string') {
      throw new Error('Route method is required and must be a string');
    }
    
    if (!route.handler || typeof route.handler !== 'string') {
      throw new Error('Route handler is required and must be a string');
    }
    
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!validMethods.includes(route.method.toUpperCase())) {
      throw new Error(`Invalid route method: ${route.method}`);
    }
    
    if (route.middleware && !Array.isArray(route.middleware)) {
      throw new Error('Route middleware must be an array');
    }
    
    if (route.permissions && !Array.isArray(route.permissions)) {
      throw new Error('Route permissions must be an array');
    }
  }

  /**
   * Validate model definition
   */
  validateModel(model) {
    if (!model.name || typeof model.name !== 'string') {
      throw new Error('Model name is required and must be a string');
    }
    
    if (!model.file || typeof model.file !== 'string') {
      throw new Error('Model file is required and must be a string');
    }
    
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(model.name)) {
      throw new Error('Model name must start with uppercase letter and contain only alphanumeric characters');
    }
  }

  /**
   * Validate menu item
   */
  validateMenuItem(menuItem) {
    if (!menuItem.title || typeof menuItem.title !== 'string') {
      throw new Error('Menu item title is required and must be a string');
    }
    
    if (!menuItem.path || typeof menuItem.path !== 'string') {
      throw new Error('Menu item path is required and must be a string');
    }
    
    if (menuItem.icon && typeof menuItem.icon !== 'string') {
      throw new Error('Menu item icon must be a string');
    }
    
    if (menuItem.permissions && !Array.isArray(menuItem.permissions)) {
      throw new Error('Menu item permissions must be an array');
    }
    
    if (menuItem.order && typeof menuItem.order !== 'number') {
      throw new Error('Menu item order must be a number');
    }
  }

  /**
   * Validate compatibility requirements
   */
  validateCompatibility(compatibility) {
    if (compatibility.coreVersion && !semver.validRange(compatibility.coreVersion)) {
      throw new Error(`Invalid core version range: ${compatibility.coreVersion}`);
    }
    
    if (compatibility.nodeVersion && !semver.validRange(compatibility.nodeVersion)) {
      throw new Error(`Invalid node version range: ${compatibility.nodeVersion}`);
    }
    
    // Check against current versions
    const currentCoreVersion = '1.0.0'; // Replace with actual core version
    const currentNodeVersion = process.version;
    
    if (compatibility.coreVersion && !semver.satisfies(currentCoreVersion, compatibility.coreVersion)) {
      throw new Error(`Plugin requires core version ${compatibility.coreVersion}, but current is ${currentCoreVersion}`);
    }
    
    if (compatibility.nodeVersion && !semver.satisfies(currentNodeVersion, compatibility.nodeVersion)) {
      throw new Error(`Plugin requires Node.js version ${compatibility.nodeVersion}, but current is ${currentNodeVersion}`);
    }
  }

  /**
   * Validate settings schema
   */
  validateSettings(settings) {
    if (typeof settings !== 'object') {
      throw new Error('Settings must be an object');
    }
    
    if (settings.configurable && typeof settings.configurable !== 'boolean') {
      throw new Error('Settings configurable must be a boolean');
    }
    
    if (settings.schema && typeof settings.schema !== 'object') {
      throw new Error('Settings schema must be an object');
    }
    
    // Validate schema structure
    if (settings.schema) {
      for (const [key, value] of Object.entries(settings.schema)) {
        if (typeof value !== 'object' || !value.type) {
          throw new Error(`Invalid schema for setting ${key}: must have type field`);
        }
        
        const validTypes = ['string', 'number', 'boolean', 'array', 'object'];
        if (!validTypes.includes(value.type)) {
          throw new Error(`Invalid schema type for setting ${key}: ${value.type}`);
        }
      }
    }
  }

  /**
   * Validate plugin code
   */
  async validatePluginCode(pluginPath) {
    try {
      const mainFile = path.join(pluginPath, 'backend', 'index.js');
      await fs.access(mainFile);
      
      const pluginCode = await fs.readFile(mainFile, 'utf8');
      
      // Check for dangerous patterns
      const dangerousPatterns = [
        { pattern: /eval\s*\(/, message: 'eval() is not allowed' },
        { pattern: /Function\s*\(/, message: 'Function constructor is not allowed' },
        { pattern: /process\.exit/, message: 'process.exit() is not allowed' },
        { pattern: /require\s*\(\s*['"]child_process['"]\s*\)/, message: 'child_process module is not allowed' },
        { pattern: /\.\.\/\.\.\//g, message: 'Directory traversal is not allowed' },
        { pattern: /\/etc\//, message: 'Access to /etc/ is not allowed' },
        { pattern: /\/usr\//, message: 'Access to /usr/ is not allowed' },
        { pattern: /\/var\//, message: 'Access to /var/ is not allowed' },
        { pattern: /\/tmp\//, message: 'Access to /tmp/ is not allowed' }
      ];
      
      for (const { pattern, message } of dangerousPatterns) {
        if (pattern.test(pluginCode)) {
          throw new Error(message);
        }
      }
      
      // Check code size
      if (pluginCode.length > 1024 * 1024) { // 1MB limit
        throw new Error('Plugin code is too large (max 1MB)');
      }
      
      // Basic syntax check
      try {
        new Function(pluginCode);
      } catch (error) {
        throw new Error(`Syntax error in plugin code: ${error.message}`);
      }
      
      return true;
      
    } catch (error) {
      throw new Error(`Plugin code validation failed: ${error.message}`);
    }
  }

  /**
   * Validate dependencies
   */
  async validateDependencies(dependencies) {
    if (!dependencies || typeof dependencies !== 'object') {
      return;
    }
    
    const allowedDependencies = [
      'lodash',
      'moment',
      'axios',
      'validator',
      'express',
      'mongoose',
      'bcryptjs',
      'jsonwebtoken',
      'nodemailer',
      'multer',
      'sharp',
      'pdf-lib',
      'csvtojson',
      'xmldom',
      'cheerio'
    ];
    
    for (const [name, version] of Object.entries(dependencies)) {
      if (!allowedDependencies.includes(name)) {
        throw new Error(`Dependency ${name} is not allowed`);
      }
      
      if (!semver.validRange(version)) {
        throw new Error(`Invalid version range for dependency ${name}: ${version}`);
      }
    }
  }

  /**
   * Validate permissions
   */
  validatePermissions(permissions) {
    if (!permissions || !Array.isArray(permissions)) {
      return;
    }
    
    const validPermissions = [
      'users:read',
      'users:write',
      'users:delete',
      'leads:read',
      'leads:write',
      'leads:delete',
      'activities:read',
      'activities:write',
      'activities:delete',
      'tasks:read',
      'tasks:write',
      'tasks:delete',
      'messages:read',
      'messages:write',
      'messages:delete',
      'payments:read',
      'payments:write',
      'notifications:read',
      'notifications:write',
      'api:access',
      'admin:access',
      'system:read',
      'system:write'
    ];
    
    for (const permission of permissions) {
      if (!validPermissions.includes(permission)) {
        throw new Error(`Invalid permission: ${permission}`);
      }
    }
  }

  /**
   * Calculate plugin checksum
   */
  async calculateChecksum(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    return hash.digest('hex');
  }

  /**
   * Validate plugin file format
   */
  validateFileFormat(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const allowedExtensions = ['.zip', '.tar.gz', '.tgz'];
    
    if (!allowedExtensions.includes(ext)) {
      throw new Error(`Invalid file format. Allowed formats: ${allowedExtensions.join(', ')}`);
    }
  }

  /**
   * Validate plugin size
   */
  async validateFileSize(filePath, maxSize = 10 * 1024 * 1024) { // 10MB default
    const stats = await fs.stat(filePath);
    if (stats.size > maxSize) {
      throw new Error(`Plugin file too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
    }
  }
}

module.exports = PluginValidator; 