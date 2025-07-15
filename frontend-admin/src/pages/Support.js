import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Avatar,
  Paper,
  IconButton,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Chat as ChatIcon,
  WhatsApp as WhatsAppIcon,
  Schedule as ScheduleIcon,
  Language as LanguageIcon,
  Help as HelpIcon,
  Book as BookIcon,
  VideoLibrary as VideoIcon,
  Download as DownloadIcon,
  BugReport as BugIcon,
  Feedback as FeedbackIcon,
  ExpandMore as ExpandMoreIcon,
  Launch as LaunchIcon,
  ContactSupport as SupportIcon,
  ContactSupport as ContactIcon,
  Description as DocumentIcon,
  PlayCircle as PlayIcon,
  GetApp as GetAppIcon,
  Search as SearchIcon,
  Star as StarIcon,
  ThumbUp as ThumbUpIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Group as TeamIcon,
} from '@mui/icons-material';

const Support = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactDialog, setContactDialog] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    priority: 'normal',
    message: '',
  });

  const [feedbackForm, setFeedbackForm] = useState({
    type: 'suggestion',
    rating: 5,
    message: '',
  });

  const contactMethods = [
    {
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      icon: <EmailIcon />,
      contact: 'support@aiagentcrm.com',
      action: 'Send Email',
      color: '#3B82F6',
      available: '24/7',
    },
    {
      title: 'Live Chat',
      description: 'Chat with our support team',
      icon: <ChatIcon />,
      contact: 'Available in admin panel',
      action: 'Start Chat',
      color: '#10B981',
      available: 'Mon-Fri 9AM-6PM EST',
    },
    {
      title: 'Phone Support',
      description: 'Speak directly with our team',
      icon: <PhoneIcon />,
      contact: '+1 (800) 123-4567',
      action: 'Call Now',
      color: '#F59E0B',
      available: 'Mon-Fri 9AM-6PM EST',
    },
    {
      title: 'WhatsApp Support',
      description: 'Quick support via WhatsApp',
      icon: <WhatsAppIcon />,
      contact: '+1 (800) 123-4567',
      action: 'Message',
      color: '#25D366',
      available: 'Mon-Fri 9AM-6PM EST',
    },
  ];

  const supportTeam = [
    {
      name: 'Sarah Johnson',
      role: 'Support Team Lead',
      email: 'sarah.johnson@aiagentcrm.com',
      specialties: ['Technical Issues', 'Account Management'],
      avatar: '',
    },
    {
      name: 'Mike Chen',
      role: 'Technical Support Specialist',
      email: 'mike.chen@aiagentcrm.com',
      specialties: ['API Integration', 'WhatsApp Setup'],
      avatar: '',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Customer Success Manager',
      email: 'emily.rodriguez@aiagentcrm.com',
      specialties: ['Onboarding', 'Best Practices'],
      avatar: '',
    },
  ];

  const documentation = [
    {
      category: 'Getting Started',
      items: [
        { title: 'Quick Start Guide', type: 'PDF', size: '2.3 MB', downloads: 1234 },
        { title: 'Installation Video', type: 'Video', duration: '15 min', views: 5678 },
        { title: 'Setup Checklist', type: 'PDF', size: '0.8 MB', downloads: 2341 },
      ],
    },
    {
      category: 'User Management',
      items: [
        { title: 'Managing Users & Roles', type: 'PDF', size: '1.5 MB', downloads: 987 },
        { title: 'Permission Settings', type: 'Video', duration: '8 min', views: 1456 },
        { title: 'User Analytics Guide', type: 'PDF', size: '2.1 MB', downloads: 654 },
      ],
    },
    {
      category: 'API Documentation',
      items: [
        { title: 'API Reference Guide', type: 'PDF', size: '4.2 MB', downloads: 3456 },
        { title: 'Integration Examples', type: 'Code', size: '0.5 MB', downloads: 2789 },
        { title: 'Authentication Setup', type: 'Video', duration: '12 min', views: 1987 },
      ],
    },
    {
      category: 'Troubleshooting',
      items: [
        { title: 'Common Issues & Solutions', type: 'PDF', size: '1.8 MB', downloads: 4567 },
        { title: 'Error Code Reference', type: 'PDF', size: '0.9 MB', downloads: 1234 },
        { title: 'Debug Mode Guide', type: 'Video', duration: '10 min', views: 876 },
      ],
    },
  ];

  const faqs = [
    {
      question: 'How do I reset a user\'s password?',
      answer: 'Go to User Management → Select user → Click "Reset Password" → Choose to send reset link or set new password directly.',
      category: 'User Management',
      popularity: 95,
    },
    {
      question: 'How do I configure WhatsApp integration?',
      answer: 'Navigate to Integrations → WhatsApp → Follow the setup wizard to connect your WhatsApp Business API account.',
      category: 'Integrations',
      popularity: 88,
    },
    {
      question: 'How do I view system analytics?',
      answer: 'Access Analytics from the main menu → Select date range → Choose metrics → View reports and export data.',
      category: 'Analytics',
      popularity: 76,
    },
    {
      question: 'How do I manage subscription plans?',
      answer: 'Go to Plans & Pricing → Create/edit plans → Set limits and features → Publish or save as draft.',
      category: 'Billing',
      popularity: 82,
    },
    {
      question: 'How do I backup system data?',
      answer: 'System Settings → Backup & Restore → Create backup → Choose full or partial backup → Download when complete.',
      category: 'System',
      popularity: 65,
    },
  ];

  const systemStatus = [
    { service: 'API Gateway', status: 'operational', uptime: '99.9%' },
    { service: 'Database', status: 'operational', uptime: '99.8%' },
    { service: 'Email Service', status: 'operational', uptime: '99.9%' },
    { service: 'WhatsApp Integration', status: 'maintenance', uptime: '99.7%' },
    { service: 'Payment Processing', status: 'operational', uptime: '99.9%' },
  ];

  const handleContactSubmit = () => {
    // Simulate form submission
    setSnackbar({ open: true, message: 'Support ticket created successfully!', severity: 'success' });
    setContactDialog(false);
    setContactForm({ name: '', email: '', subject: '', priority: 'normal', message: '' });
  };

  const handleFeedbackSubmit = () => {
    // Simulate feedback submission
    setSnackbar({ open: true, message: 'Thank you for your feedback!', severity: 'success' });
    setFeedbackDialog(false);
    setFeedbackForm({ type: 'suggestion', rating: 5, message: '' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return '#10B981';
      case 'maintenance': return '#F59E0B';
      case 'outage': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Support Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Get help, documentation, and support for Ai Agentic CRM
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ContactIcon />}
            onClick={() => setContactDialog(true)}
          >
            Contact Support
          </Button>
          <Button
            variant="contained"
            startIcon={<FeedbackIcon />}
            onClick={() => setFeedbackDialog(true)}
          >
            Send Feedback
          </Button>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Contact & Support" />
        <Tab label="Documentation" />
        <Tab label="FAQs" />
        <Tab label="System Status" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Contact Methods */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Get Support
            </Typography>
            <Grid container spacing={2}>
              {contactMethods.map((method, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)' } }}>
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Avatar
                        sx={{
                          bgcolor: method.color,
                          width: 56,
                          height: 56,
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        {method.icon}
                      </Avatar>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        {method.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {method.description}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                        {method.contact}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                        {method.available}
                      </Typography>
                      <Button variant="outlined" size="small" fullWidth>
                        {method.action}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Support Team */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Our Support Team
            </Typography>
            <Grid container spacing={2}>
              {supportTeam.map((member, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          {member.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {member.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {member.role}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {member.email}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {member.specialties.map((specialty, idx) => (
                          <Chip key={idx} label={specialty} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Search */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ mb: 3 }}
            />
          </Grid>

          {/* Documentation Categories */}
          {documentation.map((category, index) => (
            <Grid item xs={12} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <BookIcon sx={{ mr: 1 }} />
                    {category.category}
                  </Typography>
                  <List>
                    {category.items.map((item, idx) => (
                      <ListItem key={idx} divider={idx < category.items.length - 1}>
                        <ListItemIcon>
                          {item.type === 'Video' ? <VideoIcon /> : 
                           item.type === 'Code' ? <DocumentIcon /> : <BookIcon />}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.title}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                              <Chip label={item.type} size="small" />
                              {item.size && <Typography variant="caption">{item.size}</Typography>}
                              {item.duration && <Typography variant="caption">{item.duration}</Typography>}
                              {item.downloads && (
                                <Typography variant="caption">{item.downloads} downloads</Typography>
                              )}
                              {item.views && (
                                <Typography variant="caption">{item.views} views</Typography>
                              )}
                            </Box>
                          }
                        />
                        <Button
                          startIcon={item.type === 'Video' ? <PlayIcon /> : <GetAppIcon />}
                          variant="outlined"
                          size="small"
                        >
                          {item.type === 'Video' ? 'Watch' : 'Download'}
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <HelpIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              Frequently Asked Questions
            </Typography>
          </Box>
          
          {faqs.map((faq, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    {faq.question}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                    <Chip label={faq.category} size="small" variant="outlined" />
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ThumbUpIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {faq.popularity}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <SupportIcon sx={{ mr: 1 }} />
                  System Status
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Service</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Uptime</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {systemStatus.map((service, index) => (
                        <TableRow key={index}>
                          <TableCell>{service.service}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  backgroundColor: getStatusColor(service.status),
                                  mr: 1,
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  textTransform: 'capitalize',
                                  color: getStatusColor(service.status),
                                  fontWeight: 'medium',
                                }}
                              >
                                {service.status}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{service.uptime}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Alert severity="info">
              For real-time system status updates, visit our status page at{' '}
              <Link href="https://status.aiagentcrm.com" target="_blank" rel="noopener">
                status.aiagentcrm.com
              </Link>
            </Alert>
          </Grid>
        </Grid>
      )}

      {/* Contact Support Dialog */}
      <Dialog open={contactDialog} onClose={() => setContactDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Contact Support</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Your Name"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Priority"
                value={contactForm.priority}
                onChange={(e) => setContactForm({ ...contactForm, priority: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message"
                multiline
                rows={4}
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                placeholder="Describe your issue or question..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleContactSubmit}>
            Send Message
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialog} onClose={() => setFeedbackDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Feedback</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Feedback Type"
                value={feedbackForm.type}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, type: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="suggestion">Suggestion</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="general">General Feedback</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Typography component="legend">Rating</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <IconButton
                    key={rating}
                    onClick={() => setFeedbackForm({ ...feedbackForm, rating })}
                    color={rating <= feedbackForm.rating ? 'primary' : 'default'}
                  >
                    <StarIcon />
                  </IconButton>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Your Feedback"
                multiline
                rows={4}
                value={feedbackForm.message}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                placeholder="Share your thoughts and suggestions..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleFeedbackSubmit}>
            Send Feedback
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Support; 