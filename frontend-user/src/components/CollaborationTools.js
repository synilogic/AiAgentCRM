import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  Avatar,
  AvatarGroup,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Chip,
  Badge,
  Stack,
  Divider,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Tooltip,
  Alert,
  Snackbar,
  LinearProgress,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Fab
} from '@mui/material';
import {
  Group as GroupIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Chat as ChatIcon,
  VideoCall as VideoCallIcon,
  Phone as PhoneIcon,
  Assignment as TaskIcon,
  Folder as FolderIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  AttachFile as AttachIcon,
  Send as SendIcon,
  MoreVert as MoreIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
  Comment as CommentIcon,
  ThumbUp as LikeIcon,
  Visibility as ViewIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  History as HistoryIcon,
  AccessTime as TimeIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Flag as FlagIcon,
  Label as LabelIcon,
  Link as LinkIcon,
  FileCopy as CopyIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { styled, alpha } from '@mui/material/styles';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

// Styled components
const WorkspaceCard = styled(Card)(({ theme, isActive }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: isActive ? `2px solid ${theme.palette.primary.main}` : `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const TeamMemberCard = styled(Card)(({ theme, isOnline }) => ({
  position: 'relative',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: '50%',
    backgroundColor: isOnline ? theme.palette.success.main : theme.palette.grey[400],
    border: `2px solid ${theme.palette.background.paper}`,
  },
}));

const ChatMessage = styled(Paper)(({ theme, isOwn }) => ({
  padding: theme.spacing(1, 2),
  marginBottom: theme.spacing(1),
  maxWidth: '70%',
  alignSelf: isOwn ? 'flex-end' : 'flex-start',
  backgroundColor: isOwn ? theme.palette.primary.main : theme.palette.grey[100],
  color: isOwn ? theme.palette.primary.contrastText : theme.palette.text.primary,
  borderRadius: theme.spacing(2),
  borderBottomRightRadius: isOwn ? theme.spacing(0.5) : theme.spacing(2),
  borderBottomLeftRadius: isOwn ? theme.spacing(2) : theme.spacing(0.5),
}));

const FileItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    transform: 'translateX(4px)',
  },
}));

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`collaboration-tabpanel-${index}`}
      aria-labelledby={`collaboration-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const CollaborationTools = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const chatEndRef = useRef(null);

  // State
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [workspaceDialog, setWorkspaceDialog] = useState(false);
  const [teamMemberDialog, setTeamMemberDialog] = useState(false);
  const [taskDialog, setTaskDialog] = useState(false);
  const [fileDialog, setFileDialog] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [fileUpload, setFileUpload] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Form states
  const [workspaceForm, setWorkspaceForm] = useState({
    name: '',
    description: '',
    visibility: 'private',
    color: '#1976d2'
  });

  const [teamMemberForm, setTeamMemberForm] = useState({
    email: '',
    role: 'member',
    permissions: []
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
    tags: []
  });

  // API Queries
  const {
    data: workspaces,
    isLoading: workspacesLoading,
    refetch: refetchWorkspaces
  } = useQuery(
    ['workspaces'],
    () => apiService.getWorkspaces(),
    {
      refetchInterval: 30000,
    }
  );

  const {
    data: teamMembers,
    isLoading: teamMembersLoading
  } = useQuery(
    ['team-members', selectedWorkspace?.id],
    () => selectedWorkspace ? apiService.getTeamMembers(selectedWorkspace.id) : Promise.resolve([]),
    {
      enabled: !!selectedWorkspace,
      refetchInterval: 60000,
    }
  );

  const {
    data: sharedTasks,
    isLoading: tasksLoading
  } = useQuery(
    ['shared-tasks', selectedWorkspace?.id],
    () => selectedWorkspace ? apiService.getSharedTasks(selectedWorkspace.id) : Promise.resolve([]),
    {
      enabled: !!selectedWorkspace,
      refetchInterval: 30000,
    }
  );

  const {
    data: chatMessages,
    isLoading: chatLoading
  } = useQuery(
    ['chat-messages', selectedWorkspace?.id],
    () => selectedWorkspace ? apiService.getChatMessages(selectedWorkspace.id) : Promise.resolve([]),
    {
      enabled: !!selectedWorkspace,
      refetchInterval: 5000, // More frequent for real-time feel
    }
  );

  const {
    data: sharedFiles,
    isLoading: filesLoading
  } = useQuery(
    ['shared-files', selectedWorkspace?.id],
    () => selectedWorkspace ? apiService.getSharedFiles(selectedWorkspace.id) : Promise.resolve([]),
    {
      enabled: !!selectedWorkspace,
      refetchInterval: 60000,
    }
  );

  const {
    data: activityFeed,
    isLoading: activityLoading
  } = useQuery(
    ['activity-feed', selectedWorkspace?.id],
    () => selectedWorkspace ? apiService.getActivityFeed(selectedWorkspace.id) : Promise.resolve([]),
    {
      enabled: !!selectedWorkspace,
      refetchInterval: 30000,
    }
  );

  // Mutations
  const createWorkspaceMutation = useMutation(
    (data) => apiService.createWorkspace(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['workspaces']);
        setWorkspaceDialog(false);
        setWorkspaceForm({ name: '', description: '', visibility: 'private', color: '#1976d2' });
        setSnackbar({ open: true, message: 'Workspace created successfully!', severity: 'success' });
      }
    }
  );

  const inviteTeamMemberMutation = useMutation(
    (data) => apiService.inviteTeamMember(selectedWorkspace.id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['team-members']);
        setTeamMemberDialog(false);
        setTeamMemberForm({ email: '', role: 'member', permissions: [] });
        setSnackbar({ open: true, message: 'Team member invited successfully!', severity: 'success' });
      }
    }
  );

  const createSharedTaskMutation = useMutation(
    (data) => apiService.createSharedTask(selectedWorkspace.id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['shared-tasks']);
        queryClient.invalidateQueries(['activity-feed']);
        setTaskDialog(false);
        setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', tags: [] });
        setSnackbar({ open: true, message: 'Task created successfully!', severity: 'success' });
      }
    }
  );

  const sendChatMessageMutation = useMutation(
    (message) => apiService.sendChatMessage(selectedWorkspace.id, { message }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['chat-messages']);
        queryClient.invalidateQueries(['activity-feed']);
        setChatMessage('');
      }
    }
  );

  const uploadFileMutation = useMutation(
    (file) => apiService.uploadSharedFile(selectedWorkspace.id, file),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['shared-files']);
        queryClient.invalidateQueries(['activity-feed']);
        setFileDialog(false);
        setFileUpload(null);
        setSnackbar({ open: true, message: 'File uploaded successfully!', severity: 'success' });
      }
    }
  );

  // Effects
  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !selectedWorkspace) {
      setSelectedWorkspace(workspaces[0]);
    }
  }, [workspaces, selectedWorkspace]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Handlers
  const handleCreateWorkspace = () => {
    createWorkspaceMutation.mutate(workspaceForm);
  };

  const handleInviteTeamMember = () => {
    inviteTeamMemberMutation.mutate(teamMemberForm);
  };

  const handleCreateTask = () => {
    createSharedTaskMutation.mutate(taskForm);
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      sendChatMessageMutation.mutate(chatMessage);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileUpload(file);
      setFileDialog(true);
    }
  };

  const handleUploadFile = () => {
    if (fileUpload) {
      uploadFileMutation.mutate(fileUpload);
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const iconMap = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      ppt: '📊',
      pptx: '📊',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      mp4: '🎥',
      mp3: '🎵',
      zip: '📦',
      rar: '📦'
    };
    return iconMap[extension] || '📄';
  };

  const getTaskPriorityColor = (priority) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'error',
      urgent: 'error'
    };
    return colors[priority] || 'default';
  };

  const getRoleColor = (role) => {
    const colors = {
      owner: 'error',
      admin: 'warning',
      member: 'primary',
      viewer: 'info'
    };
    return colors[role] || 'default';
  };

  const speedDialActions = [
    { icon: <AddIcon />, name: 'New Workspace', onClick: () => setWorkspaceDialog(true) },
    { icon: <PersonAddIcon />, name: 'Invite Member', onClick: () => setTeamMemberDialog(true) },
    { icon: <TaskIcon />, name: 'Create Task', onClick: () => setTaskDialog(true) },
    { icon: <UploadIcon />, name: 'Upload File', onClick: () => document.getElementById('file-upload').click() }
  ];

  if (workspacesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Team Collaboration
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Work together efficiently with shared workspaces and tools
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refetchWorkspaces}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setWorkspaceDialog(true)}
            >
              New Workspace
            </Button>
          </Stack>
        </Stack>

        {/* Workspace Selector */}
        <Grid container spacing={2} mb={3}>
          {workspaces?.map((workspace) => (
            <Grid item xs={12} sm={6} md={4} key={workspace.id}>
              <WorkspaceCard
                isActive={selectedWorkspace?.id === workspace.id}
                onClick={() => setSelectedWorkspace(workspace)}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {workspace.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {workspace.description}
                      </Typography>
                    </Box>
                    <Chip
                      icon={workspace.visibility === 'private' ? <LockIcon /> : <PublicIcon />}
                      label={workspace.visibility}
                      size="small"
                      color={workspace.visibility === 'private' ? 'warning' : 'success'}
                    />
                  </Stack>
                  
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 24, height: 24 } }}>
                      {workspace.members?.map((member, index) => (
                        <Avatar key={index} src={member.avatar}>
                          {member.name.charAt(0)}
                        </Avatar>
                      ))}
                    </AvatarGroup>
                    <Stack direction="row" spacing={1}>
                      <Chip size="small" label={`${workspace.taskCount || 0} tasks`} />
                      <Chip size="small" label={`${workspace.fileCount || 0} files`} />
                    </Stack>
                  </Stack>
                </CardContent>
              </WorkspaceCard>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Main Content */}
      {selectedWorkspace && (
        <Box>
          {/* Tabs */}
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
            <Tab label="Overview" icon={<GroupIcon />} />
            <Tab label="Team" icon={<PersonIcon />} />
            <Tab label="Tasks" icon={<TaskIcon />} />
            <Tab label="Chat" icon={<ChatIcon />} />
            <Tab label="Files" icon={<FolderIcon />} />
            <Tab label="Activity" icon={<HistoryIcon />} />
          </Tabs>

          {/* Overview Tab */}
          <TabPanel value={selectedTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Workspace Overview
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {selectedWorkspace.description}
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {teamMembers?.length || 0}
                          </Typography>
                          <Typography variant="body2">Team Members</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="warning.main">
                            {sharedTasks?.length || 0}
                          </Typography>
                          <Typography variant="body2">Active Tasks</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="info.main">
                            {sharedFiles?.length || 0}
                          </Typography>
                          <Typography variant="body2">Shared Files</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            {chatMessages?.length || 0}
                          </Typography>
                          <Typography variant="body2">Messages</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Quick Actions
                    </Typography>
                    <Stack spacing={1}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<PersonAddIcon />}
                        onClick={() => setTeamMemberDialog(true)}
                      >
                        Invite Team Member
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<TaskIcon />}
                        onClick={() => setTaskDialog(true)}
                      >
                        Create Task
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<VideoCallIcon />}
                      >
                        Start Video Call
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<ShareIcon />}
                      >
                        Share Workspace
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Team Tab */}
          <TabPanel value={selectedTab} index={1}>
            <Grid container spacing={3}>
              {teamMembers?.map((member) => (
                <Grid item xs={12} sm={6} md={4} key={member.id}>
                  <TeamMemberCard isOnline={member.isOnline}>
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                        <Avatar src={member.avatar} sx={{ width: 48, height: 48 }}>
                          {member.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {member.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {member.email}
                          </Typography>
                        </Box>
                      </Stack>
                      
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Chip
                          label={member.role}
                          color={getRoleColor(member.role)}
                          size="small"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {member.isOnline ? 'Online' : `Last seen ${formatDistanceToNow(new Date(member.lastSeen))} ago`}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1}>
                        <Button size="small" startIcon={<ChatIcon />}>
                          Message
                        </Button>
                        <Button size="small" startIcon={<PhoneIcon />}>
                          Call
                        </Button>
                        <IconButton size="small">
                          <MoreIcon />
                        </IconButton>
                      </Stack>
                    </CardContent>
                  </TeamMemberCard>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* Tasks Tab */}
          <TabPanel value={selectedTab} index={2}>
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Shared Tasks ({sharedTasks?.length || 0})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setTaskDialog(true)}
                >
                  New Task
                </Button>
              </Stack>
            </Box>

            <Grid container spacing={2}>
              {sharedTasks?.map((task) => (
                <Grid item xs={12} key={task.id}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {task.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {task.description}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={task.priority}
                            color={getTaskPriorityColor(task.priority)}
                            size="small"
                          />
                          <Chip
                            label={task.status}
                            color={task.status === 'completed' ? 'success' : 'default'}
                            size="small"
                          />
                        </Stack>
                      </Stack>

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar src={task.assignedTo?.avatar} sx={{ width: 32, height: 32 }}>
                            {task.assignedTo?.name?.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">
                            Assigned to {task.assignedTo?.name}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* Chat Tab */}
          <TabPanel value={selectedTab} index={3}>
            <Card sx={{ height: 500, display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                {chatMessages?.map((message) => (
                  <ChatMessage key={message.id} isOwn={message.sender.id === user.id}>
                    <Stack direction="row" spacing={1} alignItems="flex-start" mb={1}>
                      <Avatar src={message.sender.avatar} sx={{ width: 24, height: 24 }}>
                        {message.sender.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {message.sender.name}
                        </Typography>
                        <Typography variant="body2">
                          {message.content}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography variant="caption" sx={{ opacity: 0.6 }}>
                      {format(new Date(message.createdAt), 'HH:mm')}
                    </Typography>
                  </ChatMessage>
                ))}
                <div ref={chatEndRef} />
              </CardContent>
              
              <CardActions>
                <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                  <TextField
                    fullWidth
                    placeholder="Type a message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    size="small"
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim()}
                  >
                    <SendIcon />
                  </IconButton>
                </Stack>
              </CardActions>
            </Card>
          </TabPanel>

          {/* Files Tab */}
          <TabPanel value={selectedTab} index={4}>
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Shared Files ({sharedFiles?.length || 0})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  Upload File
                </Button>
              </Stack>
            </Box>

            <Grid container spacing={2}>
              {sharedFiles?.map((file) => (
                <Grid item xs={12} key={file.id}>
                  <FileItem>
                    <Box sx={{ fontSize: '2rem' }}>
                      {getFileIcon(file.name)}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {file.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {file.size} • Uploaded by {file.uploadedBy.name} • {formatDistanceToNow(new Date(file.createdAt))} ago
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <IconButton size="small">
                        <DownloadIcon />
                      </IconButton>
                      <IconButton size="small">
                        <ShareIcon />
                      </IconButton>
                      <IconButton size="small">
                        <MoreIcon />
                      </IconButton>
                    </Stack>
                  </FileItem>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* Activity Tab */}
          <TabPanel value={selectedTab} index={5}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            
            <Timeline>
              {activityFeed?.map((activity, index) => (
                <TimelineItem key={activity.id}>
                  <TimelineSeparator>
                    <TimelineDot color={activity.type === 'task' ? 'primary' : activity.type === 'file' ? 'secondary' : 'info'}>
                      {activity.type === 'task' && <TaskIcon />}
                      {activity.type === 'file' && <FolderIcon />}
                      {activity.type === 'chat' && <ChatIcon />}
                      {activity.type === 'member' && <PersonIcon />}
                    </TimelineDot>
                    {index < activityFeed.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="body1" fontWeight="bold">
                        {activity.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(activity.createdAt))} ago by {activity.user.name}
                      </Typography>
                    </Paper>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </TabPanel>
        </Box>
      )}

      {/* Speed Dial */}
      <SpeedDial
        ariaLabel="Collaboration Actions"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        icon={<SpeedDialIcon />}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.onClick}
          />
        ))}
      </SpeedDial>

      {/* Hidden file input */}
      <input
        id="file-upload"
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Workspace Dialog */}
      <Dialog open={workspaceDialog} onClose={() => setWorkspaceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Workspace</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Workspace Name"
              value={workspaceForm.name}
              onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={workspaceForm.description}
              onChange={(e) => setWorkspaceForm({ ...workspaceForm, description: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Visibility</InputLabel>
              <Select
                value={workspaceForm.visibility}
                onChange={(e) => setWorkspaceForm({ ...workspaceForm, visibility: e.target.value })}
              >
                <MenuItem value="private">Private</MenuItem>
                <MenuItem value="public">Public</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkspaceDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateWorkspace}
            disabled={createWorkspaceMutation.isLoading}
          >
            Create Workspace
          </Button>
        </DialogActions>
      </Dialog>

      {/* Team Member Dialog */}
      <Dialog open={teamMemberDialog} onClose={() => setTeamMemberDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={teamMemberForm.email}
              onChange={(e) => setTeamMemberForm({ ...teamMemberForm, email: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={teamMemberForm.role}
                onChange={(e) => setTeamMemberForm({ ...teamMemberForm, role: e.target.value })}
              >
                <MenuItem value="viewer">Viewer</MenuItem>
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamMemberDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleInviteTeamMember}
            disabled={inviteTeamMemberMutation.isLoading}
          >
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={taskDialog} onClose={() => setTaskDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Shared Task</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Task Title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assign To</InputLabel>
                <Select
                  value={taskForm.assignedTo}
                  onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                >
                  {teamMembers?.map((member) => (
                    <MenuItem key={member.id} value={member.id}>
                      {member.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateTask}
            disabled={createSharedTaskMutation.isLoading}
          >
            Create Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Upload Dialog */}
      <Dialog open={fileDialog} onClose={() => setFileDialog(false)}>
        <DialogTitle>Upload File</DialogTitle>
        <DialogContent>
          {fileUpload && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body1">
                Ready to upload: {fileUpload.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Size: {Math.round(fileUpload.size / 1024)} KB
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFileDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUploadFile}
            disabled={uploadFileMutation.isLoading}
          >
            Upload
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

export default CollaborationTools; 