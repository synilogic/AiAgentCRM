import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Message as MessageIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AutoFollowup = () => {
  const { user } = useAuth();
  const [sequences, setSequences] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSequence, setEditingSequence] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: 'new_lead',
    delay: 1,
    delayUnit: 'hours',
    message: '',
    isActive: true,
    conditions: [],
  });

  const triggers = [
    { value: 'new_lead', label: 'New Lead Created' },
    { value: 'lead_status_change', label: 'Lead Status Changed' },
    { value: 'no_response', label: 'No Response (24h)' },
    { value: 'follow_up', label: 'Follow-up Reminder' },
    { value: 'custom', label: 'Custom Trigger' },
  ];

  const delayUnits = [
    { value: 'minutes', label: 'Minutes' },
    { value: 'hours', label: 'Hours' },
    { value: 'days', label: 'Days' },
  ];

  useEffect(() => {
    loadSequences();
  }, []);

  const loadSequences = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/followups/sequences');
      setSequences(response.data);
    } catch (err) {
      console.error('Error loading sequences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingSequence) {
        await api.put(`/followups/sequences/${editingSequence._id}`, formData);
      } else {
        await api.post('/followups/sequences', formData);
      }
      setOpenDialog(false);
      setEditingSequence(null);
      resetForm();
      loadSequences();
    } catch (err) {
      console.error('Error saving sequence:', err);
    }
  };

  const handleEdit = (sequence) => {
    setEditingSequence(sequence);
    setFormData({
      name: sequence.name,
      description: sequence.description,
      trigger: sequence.trigger,
      delay: sequence.delay,
      delayUnit: sequence.delayUnit,
      message: sequence.message,
      isActive: sequence.isActive,
      conditions: sequence.conditions || [],
    });
    setOpenDialog(true);
  };

  const handleDelete = async (sequenceId) => {
    if (window.confirm('Are you sure you want to delete this sequence?')) {
      try {
        await api.delete(`/followups/sequences/${sequenceId}`);
        loadSequences();
      } catch (err) {
        console.error('Error deleting sequence:', err);
      }
    }
  };

  const toggleSequenceStatus = async (sequenceId, isActive) => {
    try {
      await api.patch(`/followups/sequences/${sequenceId}`, { isActive: !isActive });
      loadSequences();
    } catch (err) {
      console.error('Error toggling sequence status:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger: 'new_lead',
      delay: 1,
      delayUnit: 'hours',
      message: '',
      isActive: true,
      conditions: [],
    });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSequence(null);
    resetForm();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Auto Follow-up Sequences
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Create Sequence
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {sequences.map((sequence) => (
            <Grid item xs={12} md={6} key={sequence._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {sequence.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        {sequence.description}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => toggleSequenceStatus(sequence._id, sequence.isActive)}
                        color={sequence.isActive ? 'success' : 'default'}
                      >
                        {sequence.isActive ? <PlayIcon /> : <PauseIcon />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(sequence)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(sequence._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<ScheduleIcon />}
                      label={`${sequence.delay} ${sequence.delayUnit}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<MessageIcon />}
                      label={triggers.find(t => t.value === sequence.trigger)?.label}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={sequence.isActive ? 'Active' : 'Inactive'}
                      color={sequence.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {sequence.message.length > 100
                      ? `${sequence.message.substring(0, 100)}...`
                      : sequence.message}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {sequences.length === 0 && !isLoading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <MessageIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No Follow-up Sequences
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Create your first automated follow-up sequence to engage with leads automatically.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Create First Sequence
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSequence ? 'Edit Sequence' : 'Create New Sequence'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Sequence Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Trigger</InputLabel>
                <Select
                  value={formData.trigger}
                  onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                  label="Trigger"
                >
                  {triggers.map((trigger) => (
                    <MenuItem key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Delay"
                value={formData.delay}
                onChange={(e) => setFormData({ ...formData, delay: parseInt(e.target.value) })}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={formData.delayUnit}
                  onChange={(e) => setFormData({ ...formData, delayUnit: e.target.value })}
                  label="Unit"
                >
                  {delayUnits.map((unit) => (
                    <MenuItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message"
                multiline
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter your automated message here..."
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingSequence ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AutoFollowup; 