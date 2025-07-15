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
    general: {
      siteName: 'Ai Agentic CRM',
      siteDescription: 'AI-powered customer relationship management platform that streamlines lead management, automates follow-ups, and drives business growth through intelligent automation.',
      contactEmail: 'support@aiaagentcrm.com',
      supportPhone: '+1-800-123-4567',
      businessAddress: '123 Business Street, Suite 100, City, State 12345',
      businessHours: 'Monday - Friday: 9:00 AM - 6:00 PM',
      timezone: 'UTC-5 (EST)',
      language: 'en',
      currency: 'USD'
    },
    seo: {
      metaTitle: 'Ai Agentic CRM - AI-Powered Customer Relationship Management',
      metaDescription: 'Transform your business with AI-powered CRM. Automate lead management, streamline customer interactions, and boost conversions with intelligent automation.',
      metaKeywords: 'AI CRM, lead management, customer relationship management, automation, business growth',
      ogTitle: 'AI Agent CRM - Intelligent Customer Management',
      ogDescription: 'Revolutionize your customer relationships with AI-powered automation and intelligent lead management.',
      ogImage: '/og-image.jpg',
      twitterCard: 'summary_large_image'
    },
    homepage: {
      heroTitle: 'AI-Powered Customer Relationship Management',
      heroSubtitle: 'Streamline your business processes and boost conversions with intelligent automation',
      heroCtaText: 'Start Free Trial',
      heroCtaLink: '/register',
      features: [
        {
          title: 'AI-Powered Lead Scoring',
          description: 'Automatically prioritize leads based on conversion probability',
          icon: 'intelligence'
        },
        {
          title: 'Automated Follow-ups',
          description: 'Never miss a lead with intelligent follow-up sequences',
          icon: 'automation'
        },
        {
          title: 'Advanced Analytics',
          description: 'Get insights that drive better business decisions',
          icon: 'analytics'
        }
      ],
      content: 'Welcome to Ai Agentic CRM...',
    },
    pages: [
      {
        id: 1,
        title: 'Home',
        slug: 'home',
        content: 'Welcome to Ai Agentic CRM...',
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
    ],
    media: [
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
    ],
    userRegistration: {
      enableRegistration: true,
      enableLogin: true,
      requireEmailVerification: true,
      allowSocialLogin: false,
    },
    security: {
      enableCaptcha: true,
      maxLoginAttempts: 5,
      sessionTimeout: 24,
    },
  });

  const [pages, setPages] = useState([
    {
      id: 1,
      title: 'Home',
      slug: 'home',
      content: 'Welcome to Ai Agentic CRM...',
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
                      value={websiteData.general.siteName}
                      onChange={(e) => setWebsiteData({ ...websiteData, general: { ...websiteData.general, siteName: e.target.value } })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Site URL"
                      value={websiteData.general.siteUrl}
                      onChange={(e) => setWebsiteData({ ...websiteData, general: { ...websiteData.general, siteUrl: e.target.value } })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Site Description"
                      multiline
                      rows={3}
                      value={websiteData.general.siteDescription}
                      onChange={(e) => setWebsiteData({ ...websiteData, general: { ...websiteData.general, siteDescription: e.target.value } })}
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
                      value={websiteData.homepage.heroTitle}
                      onChange={(e) => setWebsiteData({ ...websiteData, homepage: { ...websiteData.homepage, heroTitle: e.target.value } })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Hero Subtitle"
                      multiline
                      rows={3}
                      value={websiteData.homepage.heroSubtitle}
                      onChange={(e) => setWebsiteData({ ...websiteData, homepage: { ...websiteData.homepage, heroSubtitle: e.target.value } })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Features
                    </Typography>
                    <List>
                      {websiteData.homepage.features.map((feature, index) => (
                        <ListItem key={index}>
                          <TextField
                            fullWidth
                            value={feature.title}
                            onChange={(e) => {
                              const updatedFeatures = [...websiteData.homepage.features];
                              updatedFeatures[index] = { ...updatedFeatures[index], title: e.target.value };
                              setWebsiteData({ ...websiteData, homepage: { ...websiteData.homepage, features: updatedFeatures } });
                            }}
                          />
                          <IconButton
                            color="error"
                            onClick={() => {
                              const updatedFeatures = websiteData.homepage.features.filter((_, i) => i !== index);
                              setWebsiteData({ ...websiteData, homepage: { ...websiteData.homepage, features: updatedFeatures } });
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
                          homepage: {
                            ...websiteData.homepage,
                            features: [...websiteData.homepage.features, { title: 'New Feature', description: '', icon: 'automation' }]
                          }
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
                      value={websiteData.general.primaryColor}
                      onChange={(e) => setWebsiteData({ ...websiteData, general: { ...websiteData.general, primaryColor: e.target.value } })}
                      type="color"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Secondary Color"
                      value={websiteData.general.secondaryColor}
                      onChange={(e) => setWebsiteData({ ...websiteData, general: { ...websiteData.general, secondaryColor: e.target.value } })}
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
                        value={websiteData.general.fontFamily}
                        onChange={(e) => setWebsiteData({ ...websiteData, general: { ...websiteData.general, fontFamily: e.target.value } })}
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
                          checked={websiteData.general.enableDarkMode}
                          onChange={(e) => setWebsiteData({ ...websiteData, general: { ...websiteData.general, enableDarkMode: e.target.checked } })}
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
                      value={websiteData.seo.metaTitle}
                      onChange={(e) => setWebsiteData({ ...websiteData, seo: { ...websiteData.seo, metaTitle: e.target.value } })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Meta Description"
                      multiline
                      rows={3}
                      value={websiteData.seo.metaDescription}
                      onChange={(e) => setWebsiteData({ ...websiteData, seo: { ...websiteData.seo, metaDescription: e.target.value } })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Google Analytics ID"
                      value={websiteData.general.googleAnalytics}
                      onChange={(e) => setWebsiteData({ ...websiteData, general: { ...websiteData.general, googleAnalytics: e.target.value } })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Facebook Pixel ID"
                      value={websiteData.general.facebookPixel}
                      onChange={(e) => setWebsiteData({ ...websiteData, general: { ...websiteData.general, facebookPixel: e.target.value } })}
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
                          checked={websiteData.userRegistration.enableRegistration}
                          onChange={(e) => setWebsiteData({ ...websiteData, userRegistration: { ...websiteData.userRegistration, enableRegistration: e.target.checked } })}
                        />
                      }
                      label="Enable User Registration"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={websiteData.userRegistration.enableLogin}
                          onChange={(e) => setWebsiteData({ ...websiteData, userRegistration: { ...websiteData.userRegistration, enableLogin: e.target.checked } })}
                        />
                      }
                      label="Enable User Login"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={websiteData.userRegistration.requireEmailVerification}
                          onChange={(e) => setWebsiteData({ ...websiteData, userRegistration: { ...websiteData.userRegistration, requireEmailVerification: e.target.checked } })}
                        />
                      }
                      label="Require Email Verification"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={websiteData.userRegistration.allowSocialLogin}
                          onChange={(e) => setWebsiteData({ ...websiteData, userRegistration: { ...websiteData.userRegistration, allowSocialLogin: e.target.checked } })}
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
                          checked={websiteData.security.enableCaptcha}
                          onChange={(e) => setWebsiteData({ ...websiteData, security: { ...websiteData.security, enableCaptcha: e.target.checked } })}
                        />
                      }
                      label="Enable CAPTCHA"
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      label="Max Login Attempts"
                      value={websiteData.security.maxLoginAttempts}
                      onChange={(e) => setWebsiteData({ ...websiteData, security: { ...websiteData.security, maxLoginAttempts: parseInt(e.target.value) } })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      label="Session Timeout (hours)"
                      value={websiteData.security.sessionTimeout}
                      onChange={(e) => setWebsiteData({ ...websiteData, security: { ...websiteData.security, sessionTimeout: parseInt(e.target.value) } })}
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