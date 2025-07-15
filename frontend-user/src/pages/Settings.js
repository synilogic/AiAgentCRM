import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Avatar,
  Divider,
  Stack,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Badge,
  Tooltip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Group as TeamIcon,
  Link as LinkIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
  YouTube as YouTubeIcon,
  GitHub as GitHubIcon,
  Language as WebsiteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Upload as UploadIcon,
  Analytics as AnalyticsIcon,
  Message as MessageIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import apiService from '../services/api';
import { styled } from '@mui/material/styles';

// Styled components
const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  fontSize: '3rem',
  border: `4px solid ${theme.palette.primary.main}`,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: theme.shadows[8],
  },
}));

const SocialLinkCard = styled(Card)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
}));

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const EnhancedSettings = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    businessName: user?.businessName || '',
    industry: user?.industry || '',
    companySize: user?.companySize || '',
    website: user?.website || '',
    avatar: user?.avatar || ''
  });

  const [preferences, setPreferences] = useState({
    language: user?.preferences?.language || 'en',
    timezone: user?.preferences?.timezone || 'Asia/Kolkata',
    dateFormat: user?.preferences?.dateFormat || 'DD/MM/YYYY',
    currency: user?.preferences?.currency || 'INR',
    theme: user?.preferences?.theme || 'light'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      newLeads: user?.notificationSettings?.email?.newLeads || true,
      taskReminders: user?.notificationSettings?.email?.taskReminders || true,
      weeklyReports: user?.notificationSettings?.email?.weeklyReports || true,
      systemUpdates: user?.notificationSettings?.email?.systemUpdates || true
    },
    push: {
      newMessages: user?.notificationSettings?.push?.newMessages || true,
      taskDeadlines: user?.notificationSettings?.push?.taskDeadlines || true,
      leadUpdates: user?.notificationSettings?.push?.leadUpdates || true
    },
    whatsapp: {
      newLeads: user?.notificationSettings?.whatsapp?.newLeads || false,
      reminders: user?.notificationSettings?.whatsapp?.reminders || false
    }
  });

  const [socialLinks, setSocialLinks] = useState([]);

  const [teamMembers, setTeamMembers] = useState([]);
  const [socialLinksLoading, setSocialLinksLoading] = useState(true);
  const [teamMembersLoading, setTeamMembersLoading] = useState(true);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [photoDialog, setPhotoDialog] = useState(false);
  const [teamDialog, setTeamDialog] = useState(false);
  const [newTeamMember, setNewTeamMember] = useState({ name: '', email: '', role: 'Member' });

  // Helper function to get social media icons
  const getSocialIcon = (platform) => {
    const iconMap = {
      'facebook': <FacebookIcon />,
      'twitter': <TwitterIcon />,
      'linkedin': <LinkedInIcon />,
      'instagram': <InstagramIcon />,
      'youtube': <YouTubeIcon />,
      'github': <GitHubIcon />,
      'website': <WebsiteIcon />,
    };
    return iconMap[platform] || <WebsiteIcon />;
  };

  // Fetch social links from API
  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        const response = await apiService.getSocialLinks();
        if (response.success) {
          setSocialLinks(response.socialLinks);
        }
      } catch (error) {
        console.error('Failed to fetch social links:', error);
      } finally {
        setSocialLinksLoading(false);
      }
    };

    fetchSocialLinks();
  }, []);

  // Fetch team members from API
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await apiService.getTeamMembers();
        if (response.success) {
          setTeamMembers(response.teamMembers);
        }
      } catch (error) {
        console.error('Failed to fetch team members:', error);
      } finally {
        setTeamMembersLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  // Mutations
  const updateProfileMutation = useMutation(
    (data) => apiService.updateUserProfile(data),
    {
      onSuccess: (data) => {
        updateUser(data.user);
        queryClient.invalidateQueries(['user-profile']);
        setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({ open: true, message: 'Failed to update profile', severity: 'error' });
      }
    }
  );

  const updatePreferencesMutation = useMutation(
    (data) => apiService.updateUserSettings(data),
    {
      onSuccess: () => {
        setSnackbar({ open: true, message: 'Preferences updated successfully!', severity: 'success' });
      },
      onError: () => {
        setSnackbar({ open: true, message: 'Failed to update preferences', severity: 'error' });
      }
    }
  );

  const updateNotificationsMutation = useMutation(
    (data) => apiService.updateUserSettings(data),
    {
      onSuccess: () => {
        setSnackbar({ open: true, message: 'Notification settings updated!', severity: 'success' });
      },
      onError: () => {
        setSnackbar({ open: true, message: 'Failed to update notifications', severity: 'error' });
      }
    }
  );

  const changePasswordMutation = useMutation(
    (data) => apiService.changePassword(data),
    {
      onSuccess: () => {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setSnackbar({ open: true, message: 'Password changed successfully!', severity: 'success' });
      },
      onError: () => {
        setSnackbar({ open: true, message: 'Failed to change password', severity: 'error' });
      }
    }
  );

  // Handlers
  const handleProfileSubmit = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handlePreferencesSubmit = () => {
    updatePreferencesMutation.mutate(preferences);
  };

  const handleNotificationsSubmit = () => {
    updateNotificationsMutation.mutate(notificationSettings);
  };

  const handlePasswordSubmit = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSnackbar({ open: true, message: 'Passwords do not match', severity: 'error' });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // In a real app, you'd upload this file
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData({ ...profileData, avatar: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSocialLinkUpdate = async (platform, url) => {
    try {
      const updatedLinks = socialLinks.map(link => 
        link.platform === platform ? { ...link, url } : link
      );
      
      const response = await apiService.updateSocialLinks(updatedLinks);
      if (response.success) {
        setSocialLinks(updatedLinks);
        setSnackbar({ open: true, message: 'Social link updated successfully!', severity: 'success' });
      }
    } catch (error) {
      console.error('Failed to update social link:', error);
      setSnackbar({ open: true, message: 'Failed to update social link', severity: 'error' });
    }
  };

  const addTeamMember = async () => {
    if (newTeamMember.name && newTeamMember.email) {
      try {
        const response = await apiService.addTeamMember(newTeamMember);
        if (response.success) {
          setTeamMembers([...teamMembers, response.teamMember]);
          setNewTeamMember({ name: '', email: '', role: 'Member' });
          setTeamDialog(false);
          setSnackbar({ open: true, message: 'Team member invited!', severity: 'success' });
        }
      } catch (error) {
        console.error('Failed to add team member:', error);
        setSnackbar({ open: true, message: 'Failed to invite team member', severity: 'error' });
      }
    }
  };

  const removeTeamMember = async (id) => {
    try {
      const response = await apiService.removeTeamMember(id);
      if (response.success) {
        setTeamMembers(teamMembers.filter(member => member.id !== id));
        setSnackbar({ open: true, message: 'Team member removed', severity: 'info' });
      }
    } catch (error) {
      console.error('Failed to remove team member:', error);
      setSnackbar({ open: true, message: 'Failed to remove team member', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Account Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account settings and preferences
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<PersonIcon />} label="Profile" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<SecurityIcon />} label="Security" />
          <Tab icon={<PaletteIcon />} label="Preferences" />
          <Tab icon={<TeamIcon />} label="Team" />
          <Tab icon={<LinkIcon />} label="Social Links" />
        </Tabs>
      </Box>

      {/* Profile Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FeatureCard>
              <CardContent sx={{ textAlign: 'center' }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <IconButton
                      size="small"
                      sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                      onClick={() => setPhotoDialog(true)}
                    >
                      <PhotoCameraIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ProfileAvatar
                    src={profileData.avatar}
                    onClick={() => setPhotoDialog(true)}
                  >
                    {profileData.name?.charAt(0)?.toUpperCase() || 'U'}
                  </ProfileAvatar>
                </Badge>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  {profileData.name || 'User Name'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {profileData.email}
                </Typography>
                <Stack direction="row" justifyContent="center" spacing={1} sx={{ mt: 2 }}>
                  <Chip size="small" label="Pro Plan" color="primary" />
                  <Chip size="small" label="Verified" color="success" icon={<VerifiedIcon />} />
                </Stack>
              </CardContent>
            </FeatureCard>
          </Grid>

          <Grid item xs={12} md={8}>
            <FeatureCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Website"
                      value={profileData.website}
                      onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      multiline
                      rows={3}
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Business Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Business Name"
                      value={profileData.businessName}
                      onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Industry"
                      value={profileData.industry}
                      onChange={(e) => setProfileData({ ...profileData, industry: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Company Size</InputLabel>
                      <Select
                        value={profileData.companySize}
                        onChange={(e) => setProfileData({ ...profileData, companySize: e.target.value })}
                      >
                        <MenuItem value="1-10">1-10 employees</MenuItem>
                        <MenuItem value="11-50">11-50 employees</MenuItem>
                        <MenuItem value="51-200">51-200 employees</MenuItem>
                        <MenuItem value="201-500">201-500 employees</MenuItem>
                        <MenuItem value="500+">500+ employees</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, textAlign: 'right' }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleProfileSubmit}
                    disabled={updateProfileMutation.isLoading}
                  >
                    Save Changes
                  </Button>
                </Box>
              </CardContent>
            </FeatureCard>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Notifications Tab */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FeatureCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Email Notifications
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon />
                    </ListItemIcon>
                    <ListItemText primary="New Leads" secondary="Get notified when new leads are generated" />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notificationSettings.email.newLeads}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          email: { ...notificationSettings.email, newLeads: e.target.checked }
                        })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AssignmentIcon />
                    </ListItemIcon>
                    <ListItemText primary="Task Reminders" secondary="Receive reminders for upcoming tasks" />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notificationSettings.email.taskReminders}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          email: { ...notificationSettings.email, taskReminders: e.target.checked }
                        })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AnalyticsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Weekly Reports" secondary="Get weekly performance summaries" />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notificationSettings.email.weeklyReports}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          email: { ...notificationSettings.email, weeklyReports: e.target.checked }
                        })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </FeatureCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <FeatureCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Push Notifications
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <MessageIcon />
                    </ListItemIcon>
                    <ListItemText primary="New Messages" secondary="Get notified of new chat messages" />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notificationSettings.push.newMessages}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          push: { ...notificationSettings.push, newMessages: e.target.checked }
                        })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon />
                    </ListItemIcon>
                    <ListItemText primary="Task Deadlines" secondary="Alerts for approaching deadlines" />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notificationSettings.push.taskDeadlines}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          push: { ...notificationSettings.push, taskDeadlines: e.target.checked }
                        })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <PeopleIcon />
                    </ListItemIcon>
                    <ListItemText primary="Lead Updates" secondary="Updates on lead status changes" />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notificationSettings.push.leadUpdates}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          push: { ...notificationSettings.push, leadUpdates: e.target.checked }
                        })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </FeatureCard>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ textAlign: 'right' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleNotificationsSubmit}
                disabled={updateNotificationsMutation.isLoading}
              >
                Save Notification Settings
              </Button>
            </Box>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Security Tab */}
      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FeatureCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Change Password
                </Typography>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Current Password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    type="password"
                    label="New Password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    type="password"
                    label="Confirm New Password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                  <Button
                    variant="contained"
                    onClick={handlePasswordSubmit}
                    disabled={changePasswordMutation.isLoading}
                  >
                    Change Password
                  </Button>
                </Stack>
              </CardContent>
            </FeatureCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <FeatureCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Security Settings
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <SecurityIcon />
                    </ListItemIcon>
                    <ListItemText primary="Two-Factor Authentication" secondary="Add an extra layer of security" />
                    <ListItemSecondaryAction>
                      <Button variant="outlined" size="small">
                        Enable
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <VerifiedIcon />
                    </ListItemIcon>
                    <ListItemText primary="Email Verification" secondary="Your email is verified" />
                    <ListItemSecondaryAction>
                      <Chip label="Verified" color="success" size="small" />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </FeatureCard>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Preferences Tab */}
      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FeatureCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  General Preferences
                </Typography>
                <Stack spacing={3}>
                  <FormControl fullWidth>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="hi">Hindi</MenuItem>
                      <MenuItem value="es">Spanish</MenuItem>
                      <MenuItem value="fr">French</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      value={preferences.timezone}
                      onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                    >
                      <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST)</MenuItem>
                      <MenuItem value="America/New_York">America/New_York (EST)</MenuItem>
                      <MenuItem value="Europe/London">Europe/London (GMT)</MenuItem>
                      <MenuItem value="Asia/Tokyo">Asia/Tokyo (JST)</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Date Format</InputLabel>
                    <Select
                      value={preferences.dateFormat}
                      onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                    >
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={preferences.currency}
                      onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                    >
                      <MenuItem value="INR">Indian Rupee (₹)</MenuItem>
                      <MenuItem value="USD">US Dollar ($)</MenuItem>
                      <MenuItem value="EUR">Euro (€)</MenuItem>
                      <MenuItem value="GBP">British Pound (£)</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </CardContent>
            </FeatureCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <FeatureCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Theme & Display
                </Typography>
                <Stack spacing={3}>
                  <FormControl fullWidth>
                    <InputLabel>Theme</InputLabel>
                    <Select
                      value={preferences.theme}
                      onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                      <MenuItem value="auto">Auto</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </CardContent>
            </FeatureCard>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ textAlign: 'right' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handlePreferencesSubmit}
                disabled={updatePreferencesMutation.isLoading}
              >
                Save Preferences
              </Button>
            </Box>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Team Tab */}
      <TabPanel value={activeTab} index={4}>
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Team Members ({teamMembers.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setTeamDialog(true)}
            >
              Invite Member
            </Button>
          </Stack>

          <Grid container spacing={3}>
            {teamMembersLoading ? (
              // Loading skeletons
              [1, 2, 3].map((i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Skeleton variant="text" width={120} height={20} />
                          <Skeleton variant="text" width={180} height={16} />
                        </Box>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Skeleton variant="rectangular" width={60} height={24} />
                        <Skeleton variant="rectangular" width={70} height={24} />
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <Skeleton variant="circular" width={32} height={32} />
                        <Skeleton variant="circular" width={32} height={32} />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : teamMembers.length > 0 ? (
              teamMembers.map((member) => (
                <Grid item xs={12} sm={6} md={4} key={member.id}>
                  <FeatureCard>
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                        <Avatar src={member.avatar}>
                          {member.name?.charAt(0)?.toUpperCase() || 'U'}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {member.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {member.email}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Chip
                          label={member.role}
                          color={member.role === 'Admin' ? 'primary' : 'default'}
                          size="small"
                        />
                        <Chip
                          label={member.status}
                          color={member.status === 'active' ? 'success' : 'warning'}
                          size="small"
                        />
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => removeTeamMember(member.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </CardContent>
                  </FeatureCard>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <TeamIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No team members yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                      Invite team members to collaborate on your CRM
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setTeamDialog(true)}
                    >
                      Invite First Member
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      </TabPanel>

      {/* Social Links Tab */}
      <TabPanel value={activeTab} index={5}>
        <Typography variant="h6" gutterBottom>
          Social Media Links
        </Typography>
        <Grid container spacing={3}>
          {socialLinksLoading ? (
            // Loading skeletons
            [1, 2, 3, 4, 5, 6].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Skeleton variant="text" width={100} height={24} />
                    </Stack>
                    <Skeleton variant="rectangular" height={56} />
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            socialLinks.map((link) => (
              <Grid item xs={12} sm={6} md={4} key={link.platform}>
                <SocialLinkCard>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                      <Avatar sx={{ bgcolor: link.color }}>
                        {getSocialIcon(link.platform)}
                      </Avatar>
                      <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                        {link.platform}
                      </Typography>
                    </Stack>
                    <TextField
                      fullWidth
                      label={`${link.platform} URL`}
                      value={link.url || ''}
                      onChange={(e) => handleSocialLinkUpdate(link.platform, e.target.value)}
                      placeholder={`Enter your ${link.platform} URL`}
                    />
                  </CardContent>
                </SocialLinkCard>
              </Grid>
            ))
          )}
        </Grid>
      </TabPanel>

      {/* Photo Upload Dialog */}
      <Dialog open={photoDialog} onClose={() => setPhotoDialog(false)}>
        <DialogTitle>Update Profile Photo</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1, textAlign: 'center' }}>
            <ProfileAvatar src={profileData.avatar}>
              {profileData.name?.charAt(0)?.toUpperCase() || 'U'}
            </ProfileAvatar>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="avatar-upload"
              type="file"
              onChange={handleAvatarUpload}
            />
            <label htmlFor="avatar-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<UploadIcon />}
              >
                Choose Photo
              </Button>
            </label>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setPhotoDialog(false)}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Team Member Dialog */}
      <Dialog open={teamDialog} onClose={() => setTeamDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={newTeamMember.name}
              onChange={(e) => setNewTeamMember({ ...newTeamMember, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={newTeamMember.email}
              onChange={(e) => setNewTeamMember({ ...newTeamMember, email: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={newTeamMember.role}
                onChange={(e) => setNewTeamMember({ ...newTeamMember, role: e.target.value })}
              >
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Member">Member</MenuItem>
                <MenuItem value="Viewer">Viewer</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={addTeamMember}>
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnhancedSettings; 