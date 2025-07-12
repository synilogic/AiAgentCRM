import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Alert, TextField, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem,
  FormControl, InputLabel, Chip, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Tabs, Tab, CircularProgress,
  Snackbar, Menu, ListItemText, ListItemIcon, Divider, Fab, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Upload as UploadIcon,
  Search as SearchIcon, Category as CategoryIcon, Label as LabelIcon,
  Psychology as PsychologyIcon, School as SchoolIcon, AutoFixHigh as AutoFixHighIcon,
  MoreVert as MoreVertIcon, Download as DownloadIcon, Refresh as RefreshIcon,
  FilterList as FilterListIcon, ViewList as ViewListIcon, ViewModule as ViewModuleIcon
} from '@mui/icons-material';
import apiService from '../services/api';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`knowledge-tabpanel-${index}`}
      aria-labelledby={`knowledge-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AIKnowledgeBase = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'cards'
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    category: 'general',
    type: 'text',
    tags: [],
    language: 'en',
    priority: 5
  });

  const [uploadFile, setUploadFile] = useState(null);
  const [newTag, setNewTag] = useState('');

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'product', label: 'Product' },
    { value: 'support', label: 'Support' },
    { value: 'sales', label: 'Sales' },
    { value: 'technical', label: 'Technical' },
    { value: 'policy', label: 'Policy' },
    { value: 'faq', label: 'FAQ' },
    { value: 'training', label: 'Training' },
    { value: 'other', label: 'Other' }
  ];

  const types = [
    { value: 'text', label: 'Text' },
    { value: 'document', label: 'Document' },
    { value: 'faq', label: 'FAQ' },
    { value: 'conversation', label: 'Conversation' },
    { value: 'script', label: 'Script' },
    { value: 'template', label: 'Template' }
  ];

  useEffect(() => {
    loadKnowledgeData();
  }, []);

  const loadKnowledgeData = async () => {
    try {
      setLoading(true);
      const [itemsResponse, statsResponse] = await Promise.all([
        apiService.getKnowledgeItems(1, 50, { 
          category: filterCategory, 
          type: filterType, 
          search: searchQuery 
        }),
        apiService.getKnowledgeStats()
      ]);

      if (itemsResponse.success) {
        setItems(itemsResponse.items || []);
      }

      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }
    } catch (error) {
      console.error('Failed to load knowledge data:', error);
      setError('Failed to load knowledge base data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async () => {
    try {
      const response = await apiService.createKnowledgeItem(formData);
      
      if (response.success) {
        setSuccess('Knowledge item created successfully');
        setCreateDialogOpen(false);
        resetForm();
        loadKnowledgeData();
      }
    } catch (error) {
      console.error('Failed to create knowledge item:', error);
      setError('Failed to create knowledge item');
    }
  };

  const handleUpdateItem = async () => {
    try {
      const response = await apiService.updateKnowledgeItem(selectedItem._id, formData);
      
      if (response.success) {
        setSuccess('Knowledge item updated successfully');
        setEditDialogOpen(false);
        setSelectedItem(null);
        resetForm();
        loadKnowledgeData();
      }
    } catch (error) {
      console.error('Failed to update knowledge item:', error);
      setError('Failed to update knowledge item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this knowledge item?')) {
      try {
        const response = await apiService.deleteKnowledgeItem(itemId);
        
        if (response.success) {
          setSuccess('Knowledge item deleted successfully');
          loadKnowledgeData();
        }
      } catch (error) {
        console.error('Failed to delete knowledge item:', error);
        setError('Failed to delete knowledge item');
      }
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadFile.name);
      formData.append('category', 'document');
      formData.append('type', 'document');

      const response = await apiService.uploadKnowledgeFile(formData);
      
      if (response.success) {
        setSuccess('File uploaded successfully');
        setUploadDialogOpen(false);
        setUploadFile(null);
        loadKnowledgeData();
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      setError('Failed to upload file');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadKnowledgeData();
      return;
    }

    try {
      const response = await apiService.searchKnowledge(searchQuery, {
        category: filterCategory,
        type: filterType
      });
      
      if (response.success) {
        setItems(response.items || []);
      }
    } catch (error) {
      console.error('Failed to search knowledge items:', error);
      setError('Failed to search knowledge items');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      summary: '',
      category: 'general',
      type: 'text',
      tags: [],
      language: 'en',
      priority: 5
    });
  };

  const openEditDialog = (item) => {
    setSelectedItem(item);
    setFormData({
      title: item.title || '',
      content: item.content || '',
      summary: item.summary || '',
      category: item.category || 'general',
      type: item.type || 'text',
      tags: item.tags || [],
      language: item.language || 'en',
      priority: item.priority || 5
    });
    setEditDialogOpen(true);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const renderStatsCards = () => {
    if (!stats) return null;

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {stats.totalItems}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {stats.activeItems}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main">
                {Object.keys(stats.categoryCounts || {}).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Categories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {stats.recentItems?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recent Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderKnowledgeList = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      );
    }

    if (items.length === 0) {
      return (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <PsychologyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Knowledge Items Found
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Start building your AI knowledge base by adding your first item.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{ mt: 2 }}
              >
                Add Knowledge Item
              </Button>
            </Box>
          </CardContent>
        </Card>
      );
    }

    if (viewMode === 'cards') {
      return (
        <Grid container spacing={2}>
          {items.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" gutterBottom noWrap>
                      {item.title}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setMenuAnchor(e.currentTarget);
                        setSelectedItem(item);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {item.contentPreview || item.content?.substring(0, 100) + '...'}
                  </Typography>
                  
                  <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                    <Chip label={item.category} size="small" color="primary" />
                    <Chip label={item.type} size="small" color="secondary" />
                  </Box>
                  
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {item.tags?.slice(0, 3).map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                    {item.tags?.length > 3 && (
                      <Chip label={`+${item.tags.length - 3}`} size="small" variant="outlined" />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell>
                  <Typography variant="subtitle2">{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.summary || item.contentPreview}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={item.category} size="small" color="primary" />
                </TableCell>
                <TableCell>
                  <Chip label={item.type} size="small" color="secondary" />
                </TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {item.tags?.slice(0, 2).map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                    {item.tags?.length > 2 && (
                      <Chip label={`+${item.tags.length - 2}`} size="small" variant="outlined" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(item.updatedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => openEditDialog(item)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteItem(item._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            AI Knowledge Base
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your AI assistant's knowledge and training data
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadKnowledgeData}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={viewMode === 'list' ? 'Card View' : 'List View'}>
            <IconButton onClick={() => setViewMode(viewMode === 'list' ? 'cards' : 'list')}>
              {viewMode === 'list' ? <ViewModuleIcon /> : <ViewListIcon />}
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add Knowledge
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      {renderStatsCards()}

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search knowledge items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filterCategory}
                  label="Category"
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  label="Type"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {types.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={loadKnowledgeData}
              >
                Filter
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Knowledge Items */}
      {renderKnowledgeList()}

      {/* Create/Edit Dialog */}
      <Dialog 
        open={createDialogOpen || editDialogOpen} 
        onClose={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
          resetForm();
          setSelectedItem(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {createDialogOpen ? 'Add Knowledge Item' : 'Edit Knowledge Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {types.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                multiline
                rows={6}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                <TextField
                  label="Add Tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  size="small"
                />
                <Button onClick={addTag} variant="outlined" size="small">
                  Add
                </Button>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => removeTag(tag)}
                    size="small"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            resetForm();
            setSelectedItem(null);
          }}>
            Cancel
          </Button>
          <Button 
            onClick={createDialogOpen ? handleCreateItem : handleUpdateItem}
            variant="contained"
            disabled={!formData.title || !formData.content}
          >
            {createDialogOpen ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
        <DialogTitle>Upload Knowledge File</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              accept=".txt,.pdf,.doc,.docx,.md,.json"
              onChange={(e) => setUploadFile(e.target.files[0])}
              style={{ marginBottom: 16 }}
            />
            <Typography variant="body2" color="text.secondary">
              Supported formats: TXT, PDF, DOC, DOCX, MD, JSON
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleFileUpload} variant="contained" disabled={!uploadFile}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          openEditDialog(selectedItem);
          setMenuAnchor(null);
        }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleDeleteItem(selectedItem._id);
          setMenuAnchor(null);
        }}>
          <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        message={success}
      />
    </Box>
  );
};

export default AIKnowledgeBase; 