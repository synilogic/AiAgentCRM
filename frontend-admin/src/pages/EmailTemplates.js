import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Alert,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import adminApi from '../services/api';
import { emailTemplateService } from '../services/adminExtensions';

const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [previewVariables, setPreviewVariables] = useState({});
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    category: 'user_management',
    variables: [],
    isActive: true,
    tags: []
  });
  const [filters, setFilters] = useState({
    category: '',
    status: ''
  });

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
    setTimeout(() => {
      setNotification({ open: false, message: '', severity: 'success' });
    }, 4000);
  };

  const categories = [
    { value: 'user_management', label: 'User Management' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'notifications', label: 'Notifications' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'system', label: 'System' }
  ];

  useEffect(() => {
    fetchTemplates();
  }, [filters]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await emailTemplateService.getAll(filters);
      setTemplates(response.templates || []);
    } catch (error) {
      showNotification('Failed to fetch email templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template = null) => {
    if (template) {
      setFormData({
        name: template.name,
        displayName: template.displayName,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        category: template.category,
        variables: template.variables || [],
        isActive: template.isActive,
        tags: template.tags || []
      });
      setSelectedTemplate(template);
      setIsEditing(true);
    } else {
      setFormData({
        name: '',
        displayName: '',
        subject: '',
        htmlContent: '',
        textContent: '',
        category: 'user_management',
        variables: [],
        isActive: true,
        tags: []
      });
      setSelectedTemplate(null);
      setIsEditing(false);
    }
    setOpenDialog(true);
    setTabValue(0);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTemplate(null);
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    try {
      if (isEditing) {
        await emailTemplateService.update(selectedTemplate._id, formData);
        showNotification('Email template updated successfully', 'success');
      } else {
        await emailTemplateService.create(formData);
        showNotification('Email template created successfully', 'success');
      }
      
      fetchTemplates();
      handleCloseDialog();
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Failed to save email template',
        'error'
      );
    }
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this email template?')) {
      try {
        await emailTemplateService.delete(templateId);
        showNotification('Email template deleted successfully', 'success');
        fetchTemplates();
      } catch (error) {
        showNotification('Failed to delete email template', 'error');
      }
    }
  };

  const handlePreview = async (template) => {
    try {
      // Initialize preview variables with default values
      const defaultVariables = {};
      template.variables?.forEach(variable => {
        defaultVariables[variable.name] = variable.defaultValue || `{{${variable.name}}}`;
      });
      
      setPreviewVariables(defaultVariables);
      setSelectedTemplate(template);
      setOpenPreviewDialog(true);
      
      // Generate preview with default values
      generatePreview(template, defaultVariables);
    } catch (error) {
      showNotification('Failed to open preview', 'error');
    }
  };

  const generatePreview = async (template, variables) => {
    try {
      const response = await emailTemplateService.preview(template._id, { variables });
      setPreviewData(response.preview);
    } catch (error) {
      showNotification('Failed to generate preview', 'error');
    }
  };

  const addVariable = () => {
    setFormData({
      ...formData,
      variables: [
        ...formData.variables,
        { name: '', description: '', required: false, defaultValue: '' }
      ]
    });
  };

  const updateVariable = (index, field, value) => {
    const updatedVariables = [...formData.variables];
    updatedVariables[index][field] = value;
    setFormData({ ...formData, variables: updatedVariables });
  };

  const removeVariable = (index) => {
    const updatedVariables = formData.variables.filter((_, i) => i !== index);
    setFormData({ ...formData, variables: updatedVariables });
  };

  const getCategoryColor = (category) => {
    const colors = {
      user_management: 'primary',
      billing: 'success',
      notifications: 'warning',
      marketing: 'info',
      system: 'error'
    };
    return colors[category] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Notification */}
      {notification.open && (
        <Alert 
          severity={notification.severity} 
          sx={{ mb: 2 }}
          onClose={() => setNotification({ open: false, message: '', severity: 'success' })}
        >
          {notification.message}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Email Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Template
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            select
            fullWidth
            label="Category"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.value} value={category.value}>
                {category.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            select
            fullWidth
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Usage</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template._id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{template.displayName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {template.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{template.subject}</TableCell>
                    <TableCell>
                      <Chip
                        label={categories.find(c => c.value === template.category)?.label}
                        color={getCategoryColor(template.category)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={template.isActive ? 'Active' : 'Inactive'}
                        color={template.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {template.usage?.totalSent || 0} sent
                      </Typography>
                      {template.usage?.successRate && (
                        <Typography variant="caption" color="text.secondary">
                          {template.usage.successRate.toFixed(1)}% success
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Preview">
                        <IconButton
                          size="small"
                          onClick={() => handlePreview(template)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(template)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {!template.isDefault && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(template._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Email Template' : 'Create Email Template'}
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Basic Info" />
            <Tab label="Content" />
            <Tab label="Variables" />
            <Tab label="Settings" />
          </Tabs>

          {tabValue === 0 && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Template Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isEditing}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Display Name"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    margin="normal"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.value} value={category.value}>
                        {category.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {tabValue === 1 && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="HTML Content"
                value={formData.htmlContent}
                onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                multiline
                rows={10}
                margin="normal"
                helperText="Use {{variable_name}} for dynamic content"
              />
              <TextField
                fullWidth
                label="Text Content"
                value={formData.textContent}
                onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                multiline
                rows={6}
                margin="normal"
                helperText="Plain text version of the email"
              />
            </Box>
          )}

          {tabValue === 2 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Template Variables</Typography>
                <Button startIcon={<AddIcon />} onClick={addVariable}>
                  Add Variable
                </Button>
              </Box>
              
              {formData.variables.map((variable, index) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>
                      {variable.name || `Variable ${index + 1}`}
                      {variable.required && <Chip label="Required" size="small" sx={{ ml: 1 }} />}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Variable Name"
                          value={variable.name}
                          onChange={(e) => updateVariable(index, 'name', e.target.value)}
                          helperText="Use underscore format: user_name"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Default Value"
                          value={variable.defaultValue || ''}
                          onChange={(e) => updateVariable(index, 'defaultValue', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Description"
                          value={variable.description}
                          onChange={(e) => updateVariable(index, 'description', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={variable.required}
                              onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                            />
                          }
                          label="Required Variable"
                        />
                        <Button
                          color="error"
                          onClick={() => removeVariable(index)}
                          sx={{ ml: 2 }}
                        >
                          Remove
                        </Button>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}

          {tabValue === 3 && (
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active Template"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={openPreviewDialog} onClose={() => setOpenPreviewDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Preview Email Template</DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedTemplate.displayName}
              </Typography>
              
              {/* Variable inputs for preview */}
              {selectedTemplate.variables?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Preview Variables:
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedTemplate.variables.map((variable) => (
                      <Grid item xs={12} md={6} key={variable.name}>
                        <TextField
                          fullWidth
                          label={variable.description || variable.name}
                          value={previewVariables[variable.name] || ''}
                          onChange={(e) => {
                            const newVariables = { 
                              ...previewVariables, 
                              [variable.name]: e.target.value 
                            };
                            setPreviewVariables(newVariables);
                            generatePreview(selectedTemplate, newVariables);
                          }}
                          size="small"
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {previewData && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Subject: {previewData.subject}
                  </Typography>
                  
                  <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                    <div dangerouslySetInnerHTML={{ __html: previewData.htmlContent }} />
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailTemplates; 