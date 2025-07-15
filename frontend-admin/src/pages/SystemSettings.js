import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Avatar,
  InputAdornment,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Web as WebIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const SystemSettings = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [systemData, setSystemData] = useState({
    // Profile Management
    adminProfile: {
      name: 'Admin User',
      email: 'admin@aiagentcrm.com',
      phone: '+1 (555) 123-4567',
      avatar: '',
      role: 'Super Admin',
      timezone: 'UTC',
      language: 'en',
    },

    // Company Information
    company: {
      name: 'Ai Agentic CRM',
      email: 'contact@aiagentcrm.com',
      phone: '+1 (555) 123-4567',
      address: '123 Business Street, Tech City, TC 12345',
      website: 'https://aiagentcrm.com',
      description: 'Leading AI-powered CRM solution for modern businesses',
      founded: '2024',
      employees: '50-100',
      industry: 'Technology',
      socialMedia: {
        facebook: 'https://facebook.com/aiagentcrm',
        twitter: 'https://twitter.com/aiagentcrm',
        linkedin: 'https://linkedin.com/company/aiagentcrm',
        instagram: 'https://instagram.com/aiagentcrm',
      },
    },

    // Branding & Theme
    branding: {
      logo: '',
      favicon: '',
      primaryColor: '#2563eb',
      secondaryColor: '#10b981',
      accentColor: '#f59e0b',
      fontFamily: 'Inter',
      enableDarkMode: false,
      customCSS: '',
    },

    // Language & Localization
    localization: {
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'es', 'fr', 'de', 'hi', 'zh'],
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      currency: 'INR',
      currencySymbol: '₹',
    },

    // Security Settings
    security: {
      enableTwoFactor: true,
      requireStrongPasswords: true,
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      enableCaptcha: true,
      enableIPWhitelist: false,
      allowedIPs: [],
      enableAuditLog: true,
    },

    // Module Management
    modules: {
      whatsapp: { enabled: true, name: 'WhatsApp Integration' },
      ai: { enabled: true, name: 'AI Assistant' },
      analytics: { enabled: true, name: 'Analytics' },
      integrations: { enabled: true, name: 'Third-party Integrations' },
      notifications: { enabled: true, name: 'Notifications' },
      reports: { enabled: true, name: 'Reports' },
      backup: { enabled: true, name: 'Backup & Restore' },
      api: { enabled: true, name: 'API Access' },
    },

    // System Information
    system: {
      version: '1.0.0',
      lastUpdate: '2024-01-15',
      databaseSize: '2.5 GB',
      storageUsed: '15.2 GB',
      totalUsers: 1250,
      activeUsers: 890,
      uptime: '99.9%',
    },
  });

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ];

  const timezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'EST', label: 'EST (Eastern Standard Time)' },
    { value: 'PST', label: 'PST (Pacific Standard Time)' },
    { value: 'GMT', label: 'GMT (Greenwich Mean Time)' },
    { value: 'IST', label: 'IST (Indian Standard Time)' },
  ];

  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  ];

  useEffect(() => {
    loadSystemSettings();
  }, []);

  const loadSystemSettings = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/system-settings');
      setSystemData(response.data);
    } catch (err) {
      console.error('Error loading system settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.put('/admin/system-settings', systemData);
      // Show success message
    } catch (err) {
      console.error('Error saving system settings:', err);
    }
  };

  const handleBackup = async () => {
    try {
      await api.post('/admin/system-settings/backup');
      // Show success message
    } catch (err) {
      console.error('Error creating backup:', err);
    }
  };

  const handleRestore = async () => {
    try {
      await api.post('/admin/system-settings/restore');
      // Show success message
    } catch (err) {
      console.error('Error restoring backup:', err);
    }
  };

  const toggleModule = (moduleKey) => {
    setSystemData({
      ...systemData,
      modules: {
        ...systemData.modules,
        [moduleKey]: {
          ...systemData.modules[moduleKey],
          enabled: !systemData.modules[moduleKey].enabled,
        },
      },
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          System Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<BackupIcon />}
            onClick={handleBackup}
          >
            Backup
          </Button>
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={handleRestore}
          >
            Restore
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
            <Tab label="Profile" />
            <Tab label="Company" />
            <Tab label="Branding" />
            <Tab label="Localization" />
            <Tab label="Security" />
            <Tab label="Modules" />
            <Tab label="System" />
          </Tabs>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {selectedTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Avatar
                        sx={{
                          width: 120,
                          height: 120,
                          mx: 'auto',
                          mb: 2,
                          bgcolor: 'primary.main',
                          fontSize: '3rem',
                        }}
                      >
                        {systemData.adminProfile.name.charAt(0)}
                      </Avatar>
                      <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        component="label"
                      >
                        Change Avatar
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                        />
                      </Button>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          value={systemData.adminProfile.name}
                          onChange={(e) => setSystemData({
                            ...systemData,
                            adminProfile: { ...systemData.adminProfile, name: e.target.value }
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          type="email"
                          value={systemData.adminProfile.email}
                          onChange={(e) => setSystemData({
                            ...systemData,
                            adminProfile: { ...systemData.adminProfile, email: e.target.value }
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Phone"
                          value={systemData.adminProfile.phone}
                          onChange={(e) => setSystemData({
                            ...systemData,
                            adminProfile: { ...systemData.adminProfile, phone: e.target.value }
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Role"
                          value={systemData.adminProfile.role}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Timezone</InputLabel>
                          <Select
                            value={systemData.adminProfile.timezone}
                            onChange={(e) => setSystemData({
                              ...systemData,
                              adminProfile: { ...systemData.adminProfile, timezone: e.target.value }
                            })}
                            label="Timezone"
                          >
                            {timezones.map((tz) => (
                              <MenuItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Language</InputLabel>
                          <Select
                            value={systemData.adminProfile.language}
                            onChange={(e) => setSystemData({
                              ...systemData,
                              adminProfile: { ...systemData.adminProfile, language: e.target.value }
                            })}
                            label="Language"
                          >
                            {languages.map((lang) => (
                              <MenuItem key={lang.code} value={lang.code}>
                                {lang.flag} {lang.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              )}

              {selectedTab === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Company Name"
                      value={systemData.company.name}
                      onChange={(e) => setSystemData({
                        ...systemData,
                        company: { ...systemData.company, name: e.target.value }
                      })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Company Email"
                      type="email"
                      value={systemData.company.email}
                      onChange={(e) => setSystemData({
                        ...systemData,
                        company: { ...systemData.company, email: e.target.value }
                      })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Company Phone"
                      value={systemData.company.phone}
                      onChange={(e) => setSystemData({
                        ...systemData,
                        company: { ...systemData.company, phone: e.target.value }
                      })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Website"
                      value={systemData.company.website}
                      onChange={(e) => setSystemData({
                        ...systemData,
                        company: { ...systemData.company, website: e.target.value }
                      })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Address"
                      multiline
                      rows={3}
                      value={systemData.company.address}
                      onChange={(e) => setSystemData({
                        ...systemData,
                        company: { ...systemData.company, address: e.target.value }
                      })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={3}
                      value={systemData.company.description}
                      onChange={(e) => setSystemData({
                        ...systemData,
                        company: { ...systemData.company, description: e.target.value }
                      })}
                      sx={{ mb: 2 }}
                    />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Founded"
                          value={systemData.company.founded}
                          onChange={(e) => setSystemData({
                            ...systemData,
                            company: { ...systemData.company, founded: e.target.value }
                          })}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Employees"
                          value={systemData.company.employees}
                          onChange={(e) => setSystemData({
                            ...systemData,
                            company: { ...systemData.company, employees: e.target.value }
                          })}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Social Media
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Facebook"
                          value={systemData.company.socialMedia.facebook}
                          onChange={(e) => setSystemData({
                            ...systemData,
                            company: {
                              ...systemData.company,
                              socialMedia: { ...systemData.company.socialMedia, facebook: e.target.value }
                            }
                          })}
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><FacebookIcon /></InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Twitter"
                          value={systemData.company.socialMedia.twitter}
                          onChange={(e) => setSystemData({
                            ...systemData,
                            company: {
                              ...systemData.company,
                              socialMedia: { ...systemData.company.socialMedia, twitter: e.target.value }
                            }
                          })}
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><TwitterIcon /></InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="LinkedIn"
                          value={systemData.company.socialMedia.linkedin}
                          onChange={(e) => setSystemData({
                            ...systemData,
                            company: {
                              ...systemData.company,
                              socialMedia: { ...systemData.company.socialMedia, linkedin: e.target.value }
                            }
                          })}
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><LinkedInIcon /></InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Instagram"
                          value={systemData.company.socialMedia.instagram}
                          onChange={(e) => setSystemData({
                            ...systemData,
                            company: {
                              ...systemData.company,
                              socialMedia: { ...systemData.company.socialMedia, instagram: e.target.value }
                            }
                          })}
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><InstagramIcon /></InputAdornment>,
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              )}

              {selectedTab === 2 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Colors
                    </Typography>
                    <TextField
                      fullWidth
                      label="Primary Color"
                      value={systemData.branding.primaryColor}
                      onChange={(e) => setSystemData({
                        ...systemData,
                        branding: { ...systemData.branding, primaryColor: e.target.value }
                      })}
                      type="color"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Secondary Color"
                      value={systemData.branding.secondaryColor}
                      onChange={(e) => setSystemData({
                        ...systemData,
                        branding: { ...systemData.branding, secondaryColor: e.target.value }
                      })}
                      type="color"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Accent Color"
                      value={systemData.branding.accentColor}
                      onChange={(e) => setSystemData({
                        ...systemData,
                        branding: { ...systemData.branding, accentColor: e.target.value }
                      })}
                      type="color"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Typography & Theme
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Font Family</InputLabel>
                      <Select
                        value={systemData.branding.fontFamily}
                        onChange={(e) => setSystemData({
                          ...systemData,
                          branding: { ...systemData.branding, fontFamily: e.target.value }
                        })}
                        label="Font Family"
                      >
                        <MenuItem value="Inter">Inter</MenuItem>
                        <MenuItem value="Roboto">Roboto</MenuItem>
                        <MenuItem value="Open Sans">Open Sans</MenuItem>
                        <MenuItem value="Poppins">Poppins</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemData.branding.enableDarkMode}
                          onChange={(e) => setSystemData({
                            ...systemData,
                            branding: { ...systemData.branding, enableDarkMode: e.target.checked }
                          })}
                        />
                      }
                      label="Enable Dark Mode"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Custom CSS"
                      multiline
                      rows={4}
                      value={systemData.branding.customCSS}
                      onChange={(e) => setSystemData({
                        ...systemData,
                        branding: { ...systemData.branding, customCSS: e.target.value }
                      })}
                      placeholder="/* Add your custom CSS here */"
                    />
                  </Grid>
                </Grid>
              )}

              {selectedTab === 3 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Language & Region
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Default Language</InputLabel>
                      <Select
                        value={systemData.localization.defaultLanguage}
                        onChange={(e) => setSystemData({
                          ...systemData,
                          localization: { ...systemData.localization, defaultLanguage: e.target.value }
                        })}
                        label="Default Language"
                      >
                        {languages.map((lang) => (
                          <MenuItem key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Timezone</InputLabel>
                      <Select
                        value={systemData.localization.timezone}
                        onChange={(e) => setSystemData({
                          ...systemData,
                          localization: { ...systemData.localization, timezone: e.target.value }
                        })}
                        label="Timezone"
                      >
                        {timezones.map((tz) => (
                          <MenuItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Currency</InputLabel>
                      <Select
                        value={systemData.localization.currency}
                        onChange={(e) => setSystemData({
                          ...systemData,
                          localization: { ...systemData.localization, currency: e.target.value }
                        })}
                        label="Currency"
                      >
                        {currencies.map((curr) => (
                          <MenuItem key={curr.code} value={curr.code}>
                            {curr.symbol} {curr.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Date & Time Format
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Date Format</InputLabel>
                      <Select
                        value={systemData.localization.dateFormat}
                        onChange={(e) => setSystemData({
                          ...systemData,
                          localization: { ...systemData.localization, dateFormat: e.target.value }
                        })}
                        label="Date Format"
                      >
                        <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                        <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                        <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Time Format</InputLabel>
                      <Select
                        value={systemData.localization.timeFormat}
                        onChange={(e) => setSystemData({
                          ...systemData,
                          localization: { ...systemData.localization, timeFormat: e.target.value }
                        })}
                        label="Time Format"
                      >
                        <MenuItem value="12h">12-hour (AM/PM)</MenuItem>
                        <MenuItem value="24h">24-hour</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}

              {selectedTab === 4 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Authentication & Security
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemData.security.enableTwoFactor}
                          onChange={(e) => setSystemData({
                            ...systemData,
                            security: { ...systemData.security, enableTwoFactor: e.target.checked }
                          })}
                        />
                      }
                      label="Enable Two-Factor Authentication"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemData.security.requireStrongPasswords}
                          onChange={(e) => setSystemData({
                            ...systemData,
                            security: { ...systemData.security, requireStrongPasswords: e.target.checked }
                          })}
                        />
                      }
                      label="Require Strong Passwords"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemData.security.enableCaptcha}
                          onChange={(e) => setSystemData({
                            ...systemData,
                            security: { ...systemData.security, enableCaptcha: e.target.checked }
                          })}
                        />
                      }
                      label="Enable CAPTCHA"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemData.security.enableAuditLog}
                          onChange={(e) => setSystemData({
                            ...systemData,
                            security: { ...systemData.security, enableAuditLog: e.target.checked }
                          })}
                        />
                      }
                      label="Enable Audit Log"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Session & Access Control
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      label="Session Timeout (hours)"
                      value={systemData.security.sessionTimeout}
                      onChange={(e) => setSystemData({
                        ...systemData,
                        security: { ...systemData.security, sessionTimeout: parseInt(e.target.value) }
                      })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      label="Max Login Attempts"
                      value={systemData.security.maxLoginAttempts}
                      onChange={(e) => setSystemData({
                        ...systemData,
                        security: { ...systemData.security, maxLoginAttempts: parseInt(e.target.value) }
                      })}
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemData.security.enableIPWhitelist}
                          onChange={(e) => setSystemData({
                            ...systemData,
                            security: { ...systemData.security, enableIPWhitelist: e.target.checked }
                          })}
                        />
                      }
                      label="Enable IP Whitelist"
                    />
                  </Grid>
                </Grid>
              )}

              {selectedTab === 5 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Module Management
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(systemData.modules).map(([key, module]) => (
                      <Grid item xs={12} md={6} key={key}>
                        <Card>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {module.name}
                                </Typography>
                                <Chip
                                  label={module.enabled ? 'Enabled' : 'Disabled'}
                                  color={module.enabled ? 'success' : 'default'}
                                  size="small"
                                />
                              </Box>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={module.enabled}
                                    onChange={() => toggleModule(key)}
                                  />
                                }
                                label=""
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {selectedTab === 6 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      System Information
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <InfoIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Version"
                          secondary={systemData.system.version}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CalendarIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Last Update"
                          secondary={systemData.system.lastUpdate}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <StorageIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Database Size"
                          secondary={systemData.system.databaseSize}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <StorageIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Storage Used"
                          secondary={systemData.system.storageUsed}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      User Statistics
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Total Users"
                          secondary={systemData.system.totalUsers.toLocaleString()}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Active Users"
                          secondary={systemData.system.activeUsers.toLocaleString()}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <TrendingUpIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Uptime"
                          secondary={systemData.system.uptime}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemSettings; 