import React from 'react';
import SamplePluginComponent from './components/SamplePluginComponent';
import SampleLeadsView from './components/SampleLeadsView';
import SampleSettings from './components/SampleSettings';

// Plugin Frontend Configuration
const SamplePluginFrontend = {
  name: 'sample-plugin',
  version: '1.0.0',
  displayName: 'Sample Plugin',
  
  // Main component
  component: SamplePluginComponent,
  
  // Plugin routes
  routes: [
    {
      path: '/plugins/sample',
      component: SamplePluginComponent,
      exact: true
    },
    {
      path: '/plugins/sample/leads',
      component: SampleLeadsView,
      exact: true
    },
    {
      path: '/plugins/sample/settings',
      component: SampleSettings,
      exact: true
    }
  ],
  
  // Menu items
  menu: [
    {
      title: 'Sample Plugin',
      path: '/plugins/sample',
      icon: 'puzzle-piece',
      children: [
        {
          title: 'Dashboard',
          path: '/plugins/sample',
          icon: 'dashboard'
        },
        {
          title: 'Leads',
          path: '/plugins/sample/leads',
          icon: 'users'
        },
        {
          title: 'Settings',
          path: '/plugins/sample/settings',
          icon: 'settings'
        }
      ]
    }
  ],
  
  // Settings configuration
  settings: {
    component: SampleSettings,
    schema: {
      apiKey: {
        type: 'string',
        label: 'API Key',
        description: 'Your API key for external service integration',
        required: true
      },
      enableNotifications: {
        type: 'boolean',
        label: 'Enable Notifications',
        description: 'Receive notifications from this plugin',
        default: true
      },
      maxResults: {
        type: 'number',
        label: 'Max Results',
        description: 'Maximum number of results to display',
        default: 10,
        min: 1,
        max: 100
      }
    }
  },
  
  // Plugin initialization
  init: async (pluginManager) => {
    console.log('Sample Plugin Frontend initialized');
    
    // Register plugin components
    pluginManager.registerComponent('SamplePluginComponent', SamplePluginComponent);
    pluginManager.registerComponent('SampleLeadsView', SampleLeadsView);
    pluginManager.registerComponent('SampleSettings', SampleSettings);
    
    // Register plugin hooks
    pluginManager.registerHook('afterLeadCreate', (lead) => {
      console.log('Sample Plugin: Lead created', lead);
    });
    
    return true;
  },
  
  // Plugin cleanup
  cleanup: async (pluginManager) => {
    console.log('Sample Plugin Frontend cleanup');
    
    // Unregister components
    pluginManager.unregisterComponent('SamplePluginComponent');
    pluginManager.unregisterComponent('SampleLeadsView');
    pluginManager.unregisterComponent('SampleSettings');
    
    // Unregister hooks
    pluginManager.unregisterHook('afterLeadCreate');
    
    return true;
  }
};

export default SamplePluginFrontend; 