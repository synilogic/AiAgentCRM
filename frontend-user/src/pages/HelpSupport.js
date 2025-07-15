import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  Divider,
  Alert,
} from '@mui/material';
import {
  Help as HelpIcon,
  VideoLibrary as VideoIcon,
  Book as BookIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  PlayCircle as PlayIcon,
  Article as ArticleIcon,
  ContactSupport as ContactIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
  School as SchoolIcon,
  Settings as SettingsIcon,
  WhatsApp as WhatsAppIcon,
  Psychology as PsychologyIcon,
  Link as LinkIcon,
} from '@mui/icons-material';

const HelpSupport = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAccordion, setExpandedAccordion] = useState('panel1');

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const faqs = [
    {
      category: 'Getting Started',
      items: [
        {
          question: 'How do I create my first lead?',
          answer: 'Navigate to the Leads section and click "Add New Lead". Fill in the required information and save. You can also import leads from CSV files or connect integrations.',
        },
        {
          question: 'How do I connect WhatsApp?',
          answer: 'Go to the WhatsApp section and click "Generate QR Code". Scan the QR code with your WhatsApp mobile app to establish the connection.',
        },
        {
          question: 'How do I set up automated follow-ups?',
          answer: 'Navigate to Auto Follow-up Sequences and create a new sequence. Define triggers, delays, and messages to automate your follow-up process.',
        },
      ],
    },
    {
      category: 'AI Features',
      items: [
        {
          question: 'How do I train the AI on my business?',
          answer: 'Go to AI Knowledge Base and add questions and answers specific to your business. The AI will learn from these to provide better responses.',
        },
        {
          question: 'Can I customize AI responses?',
          answer: 'Yes, you can customize AI responses by adding knowledge base items and setting response templates in the AI settings.',
        },
        {
          question: 'How accurate are AI responses?',
          answer: 'AI responses improve over time as you add more knowledge base items and the system learns from your interactions.',
        },
      ],
    },
    {
      category: 'Integrations',
      items: [
        {
          question: 'How do I connect Google Sheets?',
          answer: 'Go to Integrations, select Google Sheets, and follow the authentication process. You can then sync your leads and data.',
        },
        {
          question: 'Can I import leads from Facebook?',
          answer: 'Yes, you can connect Facebook Lead Ads through the Integrations section to automatically import leads.',
        },
        {
          question: 'How do webhooks work?',
          answer: 'Webhooks allow you to send data to external systems. Set up a webhook URL in the Integrations section to receive real-time updates.',
        },
      ],
    },
    {
      category: 'Billing & Plans',
      items: [
        {
          question: 'How do I upgrade my plan?',
          answer: 'Go to Subscription in your dashboard to view available plans and upgrade options. Changes are applied immediately.',
        },
        {
          question: 'Can I cancel my subscription?',
          answer: 'Yes, you can cancel your subscription at any time from the Subscription page. You\'ll have access until the end of your billing period.',
        },
        {
          question: 'What happens if I exceed my plan limits?',
          answer: 'You\'ll receive notifications when approaching limits. You can upgrade your plan or wait until the next billing cycle.',
        },
      ],
    },
  ];

  const tutorials = [
    {
              title: 'Getting Started with Ai Agentic CRM',
      description: 'Learn the basics of setting up your account and navigating the dashboard.',
      duration: '5 min',
      category: 'Beginner',
      videoUrl: '#',
    },
    {
      title: 'Connecting WhatsApp Business',
      description: 'Step-by-step guide to connect your WhatsApp account for messaging.',
      duration: '3 min',
      category: 'Setup',
      videoUrl: '#',
    },
    {
      title: 'Creating Automated Follow-ups',
      description: 'Learn how to set up automated message sequences for better lead engagement.',
      duration: '8 min',
      category: 'Automation',
      videoUrl: '#',
    },
    {
      title: 'Training Your AI Assistant',
      description: 'How to add knowledge base items and train your AI for better responses.',
      duration: '6 min',
      category: 'AI',
      videoUrl: '#',
    },
    {
      title: 'Setting Up Integrations',
      description: 'Connect Google Sheets, Facebook, and other third-party services.',
      duration: '7 min',
      category: 'Integrations',
      videoUrl: '#',
    },
    {
      title: 'Managing Your Subscription',
      description: 'Learn about plan features, upgrades, and billing management.',
      duration: '4 min',
      category: 'Billing',
      videoUrl: '#',
    },
  ];

  const guides = [
    {
      title: 'Complete Setup Guide',
              description: 'Comprehensive guide to get your Ai Agentic CRM up and running.',
      icon: <SettingsIcon />,
      category: 'Setup',
    },
    {
      title: 'WhatsApp Integration Guide',
      description: 'Detailed instructions for connecting and managing WhatsApp.',
      icon: <WhatsAppIcon />,
      category: 'Integration',
    },
    {
      title: 'AI Training Manual',
      description: 'Best practices for training your AI assistant effectively.',
      icon: <PsychologyIcon />,
      category: 'AI',
    },
    {
      title: 'Automation Workflows',
      description: 'Advanced automation techniques and workflow examples.',
      icon: <LinkIcon />,
      category: 'Automation',
    },
  ];

  const contactMethods = [
    {
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      icon: <EmailIcon />,
      action: 'support@aiagentcrm.com',
      type: 'email',
    },
    {
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      icon: <ChatIcon />,
      action: 'Start Chat',
      type: 'chat',
    },
    {
      title: 'Phone Support',
      description: 'Call us for immediate assistance',
      icon: <PhoneIcon />,
      action: '+1 (555) 123-4567',
      type: 'phone',
    },
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.items.length > 0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Help & Support
      </Typography>

      {/* Search */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search for help articles, tutorials, or FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 600 }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Quick Help */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Quick Help
              </Typography>
              <List>
                {guides.map((guide, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ color: 'primary.main' }}>
                      {guide.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={guide.title}
                      secondary={guide.description}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Video Tutorials */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Video Tutorials
              </Typography>
              <Grid container spacing={2}>
                {tutorials.map((tutorial, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{ color: 'primary.main' }}>
                          <PlayIcon />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            {tutorial.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                            {tutorial.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip label={tutorial.duration} size="small" variant="outlined" />
                            <Chip label={tutorial.category} size="small" color="primary" />
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* FAQs */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Frequently Asked Questions
              </Typography>
              
              {filteredFaqs.length === 0 && searchQuery && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No results found for "{searchQuery}". Try different keywords or browse all FAQs below.
                </Alert>
              )}

              {faqs.map((category, categoryIndex) => (
                <Accordion
                  key={categoryIndex}
                  expanded={expandedAccordion === `panel${categoryIndex}`}
                  onChange={handleAccordionChange(`panel${categoryIndex}`)}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {category.category}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {category.items.map((item, itemIndex) => (
                      <Box key={itemIndex} sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          {item.question}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {item.answer}
                        </Typography>
                        {itemIndex < category.items.length - 1 && <Divider sx={{ mt: 2 }} />}
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Support */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Contact Support
              </Typography>
              <Grid container spacing={3}>
                {contactMethods.map((method, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                      <Box sx={{ color: 'primary.main', mb: 2 }}>
                        {method.icon}
                      </Box>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                        {method.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        {method.description}
                      </Typography>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => {
                          if (method.type === 'email') {
                            window.open(`mailto:${method.action}`);
                          } else if (method.type === 'phone') {
                            window.open(`tel:${method.action}`);
                          } else {
                            // Handle chat
                            alert('Chat feature coming soon!');
                          }
                        }}
                      >
                        {method.action}
                      </Button>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HelpSupport; 