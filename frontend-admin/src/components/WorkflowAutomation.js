import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fab,
  Alert,
  Tab,
  Tabs,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  PlayArrow,
  Pause,
  Stop,
  Edit,
  Delete,
  Save,
  Visibility,
  Timeline,
  AutoAwesome,
  Email,
  Sms,
  WhatsApp,
  Assignment,
  Schedule,
  Notifications,
  Share,
  FilterList,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const WorkflowCanvas = styled(Paper)(({ theme }) => ({
  minHeight: '600px',
  padding: theme.spacing(2),
  position: 'relative',
  background: `repeating-linear-gradient(
    0deg,
    transparent,
    transparent 20px,
    ${theme.palette.grey[100]} 20px,
    ${theme.palette.grey[100]} 22px
  ), repeating-linear-gradient(
    90deg,
    transparent,
    transparent 20px,
    ${theme.palette.grey[100]} 20px,
    ${theme.palette.grey[100]} 22px
  )`,
}));

const WorkflowNode = styled(Card)(({ theme, nodeType }) => ({
  width: '200px',
  minHeight: '80px',
  position: 'absolute',
  cursor: 'pointer',
  border: `2px solid ${
    nodeType === 'trigger' ? theme.palette.success.main :
    nodeType === 'action' ? theme.palette.primary.main :
    nodeType === 'condition' ? theme.palette.warning.main :
    theme.palette.grey[300]
  }`,
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
}));

const WorkflowSidebar = styled(Paper)(({ theme }) => ({
  width: '300px',
  height: '600px',
  padding: theme.spacing(2),
  overflow: 'auto',
}));

const NodePalette = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const WorkflowAutomation = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [canvasNodes, setCanvasNodes] = useState([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [newNode, setNewNode] = useState({
    type: 'trigger',
    name: '',
    config: {},
    position: { x: 100, y: 100 },
  });

  // Available node types
  const nodeTypes = {
    trigger: [
      { id: 'new_lead', name: 'New Lead Created', icon: <Assignment />, description: 'Triggers when a new lead is created' },
      { id: 'user_signup', name: 'User Signup', icon: <Add />, description: 'Triggers when a user signs up' },
      { id: 'payment_received', name: 'Payment Received', icon: <Notifications />, description: 'Triggers when payment is received' },
      { id: 'schedule', name: 'Scheduled Time', icon: <Schedule />, description: 'Triggers at scheduled time' },
    ],
    action: [
      { id: 'send_email', name: 'Send Email', icon: <Email />, description: 'Send an email to user' },
      { id: 'send_sms', name: 'Send SMS', icon: <Sms />, description: 'Send SMS to user' },
      { id: 'send_whatsapp', name: 'Send WhatsApp', icon: <WhatsApp />, description: 'Send WhatsApp message' },
      { id: 'assign_lead', name: 'Assign Lead', icon: <Assignment />, description: 'Assign lead to team member' },
      { id: 'update_status', name: 'Update Status', icon: <Edit />, description: 'Update lead or user status' },
      { id: 'create_task', name: 'Create Task', icon: <Add />, description: 'Create a follow-up task' },
    ],
    condition: [
      { id: 'if_condition', name: 'If Condition', icon: <FilterList />, description: 'Conditional logic branch' },
      { id: 'user_plan', name: 'User Plan Check', icon: <Share />, description: 'Check user subscription plan' },
      { id: 'lead_score', name: 'Lead Score Check', icon: <Timeline />, description: 'Check lead score threshold' },
    ],
  };

  // Mock workflows
  const mockWorkflows = [
    {
      id: '1',
      name: 'New Lead Nurturing',
      description: 'Automatically nurture new leads with email sequence',
      status: 'active',
      triggers: 145,
      lastRun: '2024-01-15T10:30:00Z',
      createdAt: '2024-01-10T09:00:00Z',
      nodes: [
        { id: 'trigger1', type: 'trigger', name: 'New Lead Created', position: { x: 50, y: 50 } },
        { id: 'action1', type: 'action', name: 'Send Welcome Email', position: { x: 300, y: 50 } },
        { id: 'action2', type: 'action', name: 'Assign to Sales Rep', position: { x: 550, y: 50 } },
      ],
    },
    {
      id: '2',
      name: 'Payment Follow-up',
      description: 'Follow up on overdue payments',
      status: 'active',
      triggers: 23,
      lastRun: '2024-01-15T08:15:00Z',
      createdAt: '2024-01-12T14:30:00Z',
      nodes: [],
    },
    {
      id: '3',
      name: 'User Onboarding',
      description: 'Comprehensive user onboarding sequence',
      status: 'draft',
      triggers: 0,
      lastRun: null,
      createdAt: '2024-01-14T16:45:00Z',
      nodes: [],
    },
  ];

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/admin/workflows', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || mockWorkflows);
      } else {
        setWorkflows(mockWorkflows);
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
      setWorkflows(mockWorkflows);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCreateWorkflow = () => {
    const newWorkflow = {
      id: Date.now().toString(),
      name: 'New Workflow',
      description: 'Description for new workflow',
      status: 'draft',
      triggers: 0,
      lastRun: null,
      createdAt: new Date().toISOString(),
      nodes: [],
    };
    
    setWorkflows([newWorkflow, ...workflows]);
    setSelectedWorkflow(newWorkflow);
    setCanvasNodes([]);
    setIsBuilding(true);
    setActiveTab(1);
  };

  const handleEditWorkflow = (workflow) => {
    setSelectedWorkflow(workflow);
    setCanvasNodes(workflow.nodes || []);
    setIsBuilding(true);
    setActiveTab(1);
  };

  const handleSaveWorkflow = async () => {
    if (!selectedWorkflow) return;

    try {
      const updatedWorkflow = {
        ...selectedWorkflow,
        nodes: canvasNodes,
      };

      const response = await fetch(`/api/admin/workflows/${selectedWorkflow.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updatedWorkflow),
      });

      if (response.ok) {
        setWorkflows(workflows.map(w => w.id === selectedWorkflow.id ? updatedWorkflow : w));
        alert('Workflow saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Failed to save workflow');
    }
  };

  const handleToggleWorkflow = async (workflowId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const response = await fetch(`/api/admin/workflows/${workflowId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setWorkflows(workflows.map(w => 
          w.id === workflowId ? { ...w, status: newStatus } : w
        ));
      }
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
    }
  };

  const handleAddNode = (nodeType, nodeConfig) => {
    const newNodeId = `node_${Date.now()}`;
    const node = {
      id: newNodeId,
      type: nodeType.split('_')[0], // trigger, action, condition
      name: nodeConfig.name,
      config: nodeConfig,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
    };

    setCanvasNodes([...canvasNodes, node]);
    setNodeDialogOpen(false);
    setNewNode({ type: 'trigger', name: '', config: {}, position: { x: 100, y: 100 } });
  };

  const handleDeleteNode = (nodeId) => {
    setCanvasNodes(canvasNodes.filter(node => node.id !== nodeId));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'draft': return 'default';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getNodeIcon = (nodeType, configType) => {
    const type = `${nodeType}_${configType}`;
    const allNodes = [...nodeTypes.trigger, ...nodeTypes.action, ...nodeTypes.condition];
    const node = allNodes.find(n => n.id === configType);
    return node?.icon || <AutoAwesome />;
  };

  const renderWorkflowList = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Workflow Automation</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateWorkflow}
        >
          Create Workflow
        </Button>
      </Box>

      <Grid container spacing={3}>
        {workflows.map((workflow) => (
          <Grid item xs={12} md={6} lg={4} key={workflow.id}>
            <Card>
              <CardHeader
                title={workflow.name}
                subheader={workflow.description}
                action={
                  <Chip
                    label={workflow.status}
                    color={getStatusColor(workflow.status)}
                    size="small"
                  />
                }
              />
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Triggers: {workflow.triggers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(workflow.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                
                {workflow.lastRun && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Last run: {new Date(workflow.lastRun).toLocaleString()}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleEditWorkflow(workflow)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={workflow.status === 'active' ? <Pause /> : <PlayArrow />}
                    onClick={() => handleToggleWorkflow(workflow.id, workflow.status)}
                    color={workflow.status === 'active' ? 'warning' : 'success'}
                  >
                    {workflow.status === 'active' ? 'Pause' : 'Activate'}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => handleEditWorkflow(workflow)}
                  >
                    View
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderWorkflowBuilder = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {selectedWorkflow ? `Editing: ${selectedWorkflow.name}` : 'Workflow Builder'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Save />}
            onClick={handleSaveWorkflow}
            disabled={!selectedWorkflow}
          >
            Save Workflow
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setNodeDialogOpen(true)}
          >
            Add Node
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={9}>
          <WorkflowCanvas>
            {canvasNodes.map((node) => (
              <WorkflowNode
                key={node.id}
                nodeType={node.type}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {getNodeIcon(node.type, node.config.type)}
                    <Typography variant="subtitle2" sx={{ ml: 1, flexGrow: 1 }}>
                      {node.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteNode(node.id)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                  <Chip
                    label={node.type}
                    size="small"
                    color={
                      node.type === 'trigger' ? 'success' :
                      node.type === 'action' ? 'primary' :
                      'warning'
                    }
                    variant="outlined"
                  />
                </CardContent>
              </WorkflowNode>
            ))}
            
            {canvasNodes.length === 0 && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'text.secondary',
                }}
              >
                <AutoAwesome sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Start Building Your Workflow
                </Typography>
                <Typography variant="body2" textAlign="center">
                  Add nodes to create an automated workflow. Start with a trigger,
                  then add actions and conditions.
                </Typography>
              </Box>
            )}
          </WorkflowCanvas>
        </Grid>

        <Grid item xs={12} md={3}>
          <WorkflowSidebar>
            <Typography variant="h6" gutterBottom>
              Node Palette
            </Typography>
            
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Triggers
            </Typography>
            <NodePalette>
              {nodeTypes.trigger.map((nodeType) => (
                <Card key={nodeType.id} sx={{ cursor: 'pointer', mb: 1 }} onClick={() => {
                  setNewNode({ ...newNode, type: 'trigger', config: { type: nodeType.id, name: nodeType.name } });
                  setNodeDialogOpen(true);
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {nodeType.icon}
                      <Box sx={{ ml: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {nodeType.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {nodeType.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </NodePalette>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="primary" gutterBottom>
              Actions
            </Typography>
            <NodePalette>
              {nodeTypes.action.map((nodeType) => (
                <Card key={nodeType.id} sx={{ cursor: 'pointer', mb: 1 }} onClick={() => {
                  setNewNode({ ...newNode, type: 'action', config: { type: nodeType.id, name: nodeType.name } });
                  setNodeDialogOpen(true);
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {nodeType.icon}
                      <Box sx={{ ml: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {nodeType.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {nodeType.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </NodePalette>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="primary" gutterBottom>
              Conditions
            </Typography>
            <NodePalette>
              {nodeTypes.condition.map((nodeType) => (
                <Card key={nodeType.id} sx={{ cursor: 'pointer', mb: 1 }} onClick={() => {
                  setNewNode({ ...newNode, type: 'condition', config: { type: nodeType.id, name: nodeType.name } });
                  setNodeDialogOpen(true);
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {nodeType.icon}
                      <Box sx={{ ml: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {nodeType.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {nodeType.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </NodePalette>
          </WorkflowSidebar>
        </Grid>
      </Grid>

      {/* Add Node Dialog */}
      <Dialog open={nodeDialogOpen} onClose={() => setNodeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configure Node</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Node Name"
            value={newNode.config.name || ''}
            onChange={(e) => setNewNode({
              ...newNode,
              config: { ...newNode.config, name: e.target.value }
            })}
            sx={{ mb: 2, mt: 1 }}
          />

          {newNode.config.type === 'send_email' && (
            <>
              <TextField
                fullWidth
                label="Email Template"
                value={newNode.config.template || ''}
                onChange={(e) => setNewNode({
                  ...newNode,
                  config: { ...newNode.config, template: e.target.value }
                })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Email Content"
                value={newNode.config.content || ''}
                onChange={(e) => setNewNode({
                  ...newNode,
                  config: { ...newNode.config, content: e.target.value }
                })}
                sx={{ mb: 2 }}
              />
            </>
          )}

          {newNode.config.type === 'schedule' && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Schedule Type</InputLabel>
              <Select
                value={newNode.config.scheduleType || ''}
                label="Schedule Type"
                onChange={(e) => setNewNode({
                  ...newNode,
                  config: { ...newNode.config, scheduleType: e.target.value }
                })}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
          )}

          {newNode.config.type === 'if_condition' && (
            <>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Condition Field</InputLabel>
                <Select
                  value={newNode.config.field || ''}
                  label="Condition Field"
                  onChange={(e) => setNewNode({
                    ...newNode,
                    config: { ...newNode.config, field: e.target.value }
                  })}
                >
                  <MenuItem value="lead_score">Lead Score</MenuItem>
                  <MenuItem value="user_plan">User Plan</MenuItem>
                  <MenuItem value="user_status">User Status</MenuItem>
                  <MenuItem value="lead_source">Lead Source</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Operator</InputLabel>
                <Select
                  value={newNode.config.operator || ''}
                  label="Operator"
                  onChange={(e) => setNewNode({
                    ...newNode,
                    config: { ...newNode.config, operator: e.target.value }
                  })}
                >
                  <MenuItem value="equals">Equals</MenuItem>
                  <MenuItem value="greater_than">Greater Than</MenuItem>
                  <MenuItem value="less_than">Less Than</MenuItem>
                  <MenuItem value="contains">Contains</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Value"
                value={newNode.config.value || ''}
                onChange={(e) => setNewNode({
                  ...newNode,
                  config: { ...newNode.config, value: e.target.value }
                })}
                sx={{ mb: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNodeDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => handleAddNode(newNode.config.type, newNode.config)}
            disabled={!newNode.config.name}
          >
            Add Node
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="My Workflows" icon={<Timeline />} iconPosition="start" />
        <Tab label="Workflow Builder" icon={<AutoAwesome />} iconPosition="start" />
      </Tabs>

      {activeTab === 0 && renderWorkflowList()}
      {activeTab === 1 && renderWorkflowBuilder()}
    </Box>
  );
};

export default WorkflowAutomation; 