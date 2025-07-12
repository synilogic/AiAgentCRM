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
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Web as WebIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Palette as PaletteIcon,
  Typography as TypographyIcon,
  Image as ImageIcon,
  ContentCopy as ContentCopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const WebsiteSettings = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [websiteData, setWebsiteData] = useState({
    // General Settings
    siteName: 'AI Agent CRM',
    siteDescription: 'Powerful CRM with AI-powered automation',
    siteUrl: 'https://aiagentcrm.com',
    logo: '',
    favicon: '',
    
    // Content Management
    heroTitle: 'Transform Your Business with AI-Powered CRM',
    heroSubtitle: 'Automate lead management, boost conversions, and grow your business with intelligent automation.',
    features: [
      'AI-Powered Lead Scoring',
      'WhatsApp Integration',
      'Automated Follow-ups',
      'Advanced Analytics',
    ],
    
    // Design & Branding
    primaryColor: '#2563eb',
    secondaryColor: '#10b981',
    fontFamily: 'Inter',
    enableDarkMode: false,
    
    // SEO & Marketing
    metaTitle: 'AI Agent CRM - AI-Powered Customer Relationship Management',
    metaDescription: 'Transform your business with AI-powered CRM automation. Manage leads, automate follow-ups, and boost conversions.',
    googleAnalytics: '',
    facebookPixel: '',
    
    // User Registration
    enableRegistration: true,
    enableLogin: true,
    requireEmailVerification: true,
    allowSocialLogin: false,
    
    // Security
    enableCaptcha: true,
    maxLoginAttempts: 5,
    sessionTimeout: 24,
  });

  const [pages, setPages] = useState([
    {
      id: 1,
      title: 'Home',
      slug: 'home',
      content: 'Welcome to AI Agent CRM...',
      isPublished: true,
      isHome: true,
    },
    {
      id: 2,
      title: 'About',
      slug: 'about',
      content: 'About our company...',
      isPublished: true,
      isHome: false,
    },
    {
      id: 3,
      title: 'Features',
      slug: 'features',
      content: 'Our features...',
      isPublished: true,
      isHome: false,
    },
    {
      id: 4,
      title: 'Pricing',
      slug: 'pricing',
      content: 'Pricing plans...',
      isPublished: true,
      isHome: false,
    },
  ]);

  const [media, setMedia] = useState([
    {
      id: 1,
      name: 'hero-image.jpg',
      url: '/images/hero-image.jpg',
      type: 'image',
      size: '2.5 MB',
      uploadedAt: '2024-01-15',
    },
    {
      id: 2,
      name: 'logo.png',
      url: '/images/logo.png',
      type: 'image',
      size: '150 KB',
      uploadedAt: '2024-01-10',
    },
  ]);

  useEffect(() => {
    loadWebsiteSettings();
  }, []);

  const loadWebsiteSettings = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/website-settings');
      setWebsiteData(response.data);
    } catch (err) {
      console.error('Error loading website settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.put('/admin/website-settings', websiteData);
      // Show success message
    } catch (err) {
      console.error('Error saving website settings:', err);
    }
  };

  const handlePreview = () => {
    window.open('/preview', '_blank');
  };

  const handlePublish = async () => {
    try {
      await api.post('/admin/website-settings/publish');
      // Show success message
    } catch (err) {
      console.error('Error publishing website:', err);
    }
  };

  const handleUploadMedia = (event) => {
    const files = event.target.files;
    // Handle file upload logic
  };

  const handleDeleteMedia = (mediaId) => {
    setMedia(media.filter(m => m.id !== mediaId));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Website Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={handlePreview}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save Changes
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<WebIcon />}
            onClick={handlePublish}
          >
            Publish
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
            <Tab label="General" />
            <Tab label="Content" />
            <Tab label="Design" />
            <Tab label="SEO" />
            <Tab label="Pages" />
            <Tab label="Media" />
            <Tab label="Users" />
            <Tab label="Security" />
          </Tabs>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {selectedTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Site Name"
                      value={websiteData.siteName}
                      onChange={(e) => setWebsiteData({ ...websiteData, siteName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Site URL"
                      value={websiteData.siteUrl}
                      onChange={(e) => setWebsiteData({ ...websiteData, siteUrl: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Site Description"
                      multiline
                      rows={3}
                      value={websiteData.siteDescription}
                      onChange={(e) => setWebsiteData({ ...websiteData, siteDescription: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Logo
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      component="label"
                    >
                      Upload Logo
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleUploadMedia}
                      />
                    </Button>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Favicon
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      component="label"
                    >
                      Upload Favicon
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleUploadMedia}
                      />
                    </Button>
                  </Grid>
                </Grid>
              )}

              {selectedTab === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Hero Section
                    </Typography>
                    <TextField
                      fullWidth
                      label="Hero Title"
                      value={websiteData.heroTitle}
                      onChange={(e) => setWebsiteData({ ...websiteData, heroTitle: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Hero Subtitle"
                      multiline
                      rows={3}
                      value={websiteData.heroSubtitle}
                      onChange={(e) => setWebsiteData({ ...websiteData, heroSubtitle: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Features
                    </Typography>
                    <List>
                      {websiteData.features.map((feature, index) => (
                        <ListItem key={index}>
                          <TextField
                            fullWidth
                            value={feature}
                            onChange={(e) => {
                              const updatedFeatures = [...websiteData.features];
                              updatedFeatures[index] = e.target.value;
                              setWebsiteData({ ...websiteData, features: updatedFeatures });
                            }}
                          />
                          <IconButton
                            color="error"
                            onClick={() => {
                              const updatedFeatures = websiteData.features.filter((_, i) => i !== index);
                              setWebsiteData({ ...websiteData, features: updatedFeatures });
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setWebsiteData({
                          ...websiteData,
                          features: [...websiteData.features, 'New Feature']
                        });
                      }}
                    >
                      Add Feature
                    </Button>
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
                      value={websiteData.primaryColor}
                      onChange={(e) => setWebsiteData({ ...websiteData, primaryColor: e.target.value })}
                      type="color"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Secondary Color"
                      value={websiteData.secondaryColor}
                      onChange={(e) => setWebsiteData({ ...websiteData, secondaryColor: e.target.value })}
                      type="color"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Typography
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Font Family</InputLabel>
                      <Select
                        value={websiteData.fontFamily}
                        onChange={(e) => setWebsiteData({ ...websiteData, fontFamily: e.target.value })}
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
                          checked={websiteData.enableDarkMode}
                          onChange={(e) => setWebsiteData({ ...websiteData, enableDarkMode: e.target.checked })}
                        />
                      }
                      label="Enable Dark Mode"
                    />
                  </Grid>
                </Grid>
              )}

              {selectedTab === 3 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Meta Title"
                      value={websiteData.metaTitle}
                      onChange={(e) => setWebsiteData({ ...websiteData, metaTitle: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Meta Description"
                      multiline
                      rows={3}
                      value={websiteData.metaDescription}
                      onChange={(e) => setWebsiteData({ ...websiteData, metaDescription: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Google Analytics ID"
                      value={websiteData.googleAnalytics}
                      onChange={(e) => setWebsiteData({ ...websiteData, googleAnalytics: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Facebook Pixel ID"
                      value={websiteData.facebookPixel}
                      onChange={(e) => setWebsiteData({ ...websiteData, facebookPixel: e.target.value })}
                    />
                  </Grid>
                </Grid>
              )}

              {selectedTab === 4 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Pages
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setOpenDialog(true)}
                    >
                      Add Page
                    </Button>
                  </Box>
                  <List>
                    {pages.map((page) => (
                      <ListItem key={page.id}>
                        <ListItemIcon>
                          <WebIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={page.title}
                          secondary={`/${page.slug}`}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip
                            label={page.isPublished ? 'Published' : 'Draft'}
                            color={page.isPublished ? 'success' : 'default'}
                            size="small"
                          />
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {selectedTab === 5 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Media Library
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<UploadIcon />}
                      component="label"
                    >
                      Upload Media
                      <input
                        type="file"
                        hidden
                        multiple
                        accept="image/*"
                        onChange={handleUploadMedia}
                      />
                    </Button>
                  </Box>
                  <ImageList cols={3} gap={8}>
                    {media.map((item) => (
                      <ImageListItem key={item.id}>
                        <img
                          src={item.url}
                          alt={item.name}
                          loading="lazy"
                          style={{ height: 200, objectFit: 'cover' }}
                        />
                        <ImageListItemBar
                          title={item.name}
                          subtitle={item.size}
                          actionIcon={
                            <IconButton
                              sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                              onClick={() => handleDeleteMedia(item.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          }
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                </Box>
              )}

              {selectedTab === 6 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      User Registration
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={websiteData.enableRegistration}
                          onChange={(e) => setWebsiteData({ ...websiteData, enableRegistration: e.target.checked })}
                        />
                      }
                      label="Enable User Registration"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={websiteData.enableLogin}
                          onChange={(e) => setWebsiteData({ ...websiteData, enableLogin: e.target.checked })}
                        />
                      }
                      label="Enable User Login"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={websiteData.requireEmailVerification}
                          onChange={(e) => setWebsiteData({ ...websiteData, requireEmailVerification: e.target.checked })}
                        />
                      }
                      label="Require Email Verification"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={websiteData.allowSocialLogin}
                          onChange={(e) => setWebsiteData({ ...websiteData, allowSocialLogin: e.target.checked })}
                        />
                      }
                      label="Allow Social Login"
                    />
                  </Grid>
                </Grid>
              )}

              {selectedTab === 7 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Security Settings
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={websiteData.enableCaptcha}
                          onChange={(e) => setWebsiteData({ ...websiteData, enableCaptcha: e.target.checked })}
                        />
                      }
                      label="Enable CAPTCHA"
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      label="Max Login Attempts"
                      value={websiteData.maxLoginAttempts}
                      onChange={(e) => setWebsiteData({ ...websiteData, maxLoginAttempts: parseInt(e.target.value) })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      label="Session Timeout (hours)"
                      value={websiteData.sessionTimeout}
                      onChange={(e) => setWebsiteData({ ...websiteData, sessionTimeout: parseInt(e.target.value) })}
                    />
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

export default WebsiteSettings; 