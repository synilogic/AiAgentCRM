# Sample Plugin

A demonstration plugin for the Ai Agentic CRM plugin system.

## Overview

This sample plugin showcases the capabilities of the Ai Agentic CRM plugin architecture, including:

- **Dynamic Loading**: Load and unload without server restart
- **API Integration**: Access CRM data through secure APIs
- **Event System**: Listen to and respond to CRM events
- **Settings Management**: Configurable plugin settings
- **Frontend Components**: React components for UI integration
- **Security**: Sandboxed execution environment

## Features

### Backend Features
- **Lead Processing**: Custom lead classification and scoring
- **Event Handling**: Automatic notifications on lead creation
- **API Endpoints**: RESTful endpoints for plugin functionality
- **Database Integration**: Direct access to CRM models
- **Health Monitoring**: Built-in health check endpoints

### Frontend Features
- **Dashboard**: Plugin status and overview
- **Lead Management**: Custom lead processing interface
- **Settings Panel**: Configuration management
- **Real-time Updates**: Live data synchronization

## Installation

1. **Upload Plugin**: Use the admin panel to upload the plugin package
2. **Install Dependencies**: The system will automatically install required packages
3. **Configure Settings**: Set up API keys and preferences
4. **Enable Plugin**: Activate the plugin from the admin panel

## Configuration

The plugin supports the following settings:

- **API Key**: Required for external service integration
- **Enable Notifications**: Toggle plugin notifications
- **Max Results**: Limit the number of results returned

## API Endpoints

### GET /api/plugins/sample-plugin/hello
Returns plugin status and information.

**Response:**
```json
{
  "message": "Hello from Sample Plugin!",
  "plugin": {
    "name": "sample-plugin",
    "version": "1.0.0",
    "uptime": "2 minutes",
    "settings": { ... }
  },
  "timestamp": "2025-07-15T10:30:00.000Z"
}
```

### GET /api/plugins/sample-plugin/leads/sample
Retrieve processed leads with plugin-specific data.

**Query Parameters:**
- `limit`: Number of results to return (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "company": "Example Corp",
      "score": 85,
      "priority": "high",
      "pluginData": {
        "processed": true,
        "timestamp": "2025-07-15T10:30:00.000Z",
        "classification": "hot"
      }
    }
  ],
  "meta": {
    "total": 1,
    "plugin": "sample-plugin",
    "processedAt": "2025-07-15T10:30:00.000Z"
  }
}
```

### POST /api/plugins/sample-plugin/leads/sample
Create a new lead through the plugin.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "company": "Example Inc",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Lead created successfully by sample plugin"
}
```

## Events

The plugin listens to the following events:

- **lead:created**: Triggered when a new lead is created
- **plugin:loaded**: Triggered when another plugin is loaded

## Development

### File Structure
```
sample-plugin/
├── plugin.json          # Plugin manifest
├── backend/
│   └── index.js         # Main plugin file
├── frontend/
│   ├── index.js         # Frontend entry point
│   └── components/      # React components
└── README.md           # Documentation
```

### Plugin Manifest
The `plugin.json` file defines:
- Plugin metadata (name, version, author)
- Dependencies and compatibility
- API routes and permissions
- Menu items and settings schema

### Backend Implementation
The backend uses a class-based approach with:
- `init()`: Plugin initialization
- Route handlers for API endpoints
- Event listeners for CRM events
- `cleanup()`: Resource cleanup

### Frontend Implementation
The frontend provides:
- React components for UI
- Plugin routes and navigation
- Settings management interface
- Integration with CRM APIs

## Security

The plugin runs in a secure sandbox with:
- **Restricted API Access**: Only permitted operations
- **File System Isolation**: Limited file access
- **Network Restrictions**: Whitelisted domains only
- **Resource Limits**: Memory and CPU constraints
- **Permission System**: Granular access control

## Testing

1. **Health Check**: Visit `/api/plugins/sample-plugin/hello`
2. **Lead Processing**: Test lead creation and retrieval
3. **Settings**: Verify configuration updates
4. **Frontend**: Check UI components and navigation

## Support

For issues or questions:
- Check the plugin logs in the admin panel
- Review the API documentation
- Contact the plugin developer

## License

This sample plugin is provided as-is for demonstration purposes. 