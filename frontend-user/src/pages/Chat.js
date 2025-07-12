import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Divider,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  MoreVert as MoreIcon,
  Send as SendIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../components/NotificationSystem';
import ChatInterface from '../components/ChatInterface';
import { format } from 'date-fns';

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatData, setNewChatData] = useState({
    name: '',
    type: 'direct',
    participants: [],
  });
  const [availableUsers, setAvailableUsers] = useState([]);
  const [creatingChat, setCreatingChat] = useState(false);

  const { socket, isConnected, onChatCreated, onChatUpdated, onChatDeleted, onNewMessage, onUserStatusChange } = useWebSocket();
  const { user } = useAuth();
  const { success, error } = useNotifications();

  // Load chats
  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      } else {
        throw new Error('Failed to load chats');
      }
    } catch (err) {
      error('Failed to load chats');
      console.error('Error loading chats:', err);
    } finally {
      setLoading(false);
    }
  }, [error]);

  // Load available users for new chat
  const loadAvailableUsers = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }, []);

  // Create new chat
  const handleCreateChat = async () => {
    try {
      setCreatingChat(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newChatData),
      });

      if (response.ok) {
        const data = await response.json();
        success('Chat created successfully');
        setShowNewChatDialog(false);
        setNewChatData({ name: '', type: 'direct', participants: [] });
        loadChats();
      } else {
        throw new Error('Failed to create chat');
      }
    } catch (err) {
      error('Failed to create chat');
      console.error('Error creating chat:', err);
    } finally {
      setCreatingChat(false);
    }
  };

  // Filter chats
  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.participants.some(p => p.user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || chat.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // Get last message preview
  const getLastMessagePreview = (chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    
    const content = chat.lastMessage.content;
    return content.length > 50 ? `${content.substring(0, 50)}...` : content;
  };

  // Get unread count
  const getUnreadCount = (chat) => {
    return chat.unreadCount || 0;
  };

  // Initialize
  useEffect(() => {
    loadChats();
    loadAvailableUsers();
  }, [loadChats, loadAvailableUsers]);

  // WebSocket event listeners
  useEffect(() => {
    if (!socket) return;

    const unsubscribeChatCreated = onChatCreated((data) => {
      if (data.createdBy === user._id) {
        loadChats();
      }
    });

    const unsubscribeChatUpdated = onChatUpdated((data) => {
      setChats(prev => prev.map(chat => 
        chat._id === data.chatId ? { ...chat, ...data.updates } : chat
      ));
    });

    const unsubscribeChatDeleted = onChatDeleted((data) => {
      setChats(prev => prev.filter(chat => chat._id !== data.chatId));
      if (selectedChat?._id === data.chatId) {
        setSelectedChat(null);
      }
    });

    const unsubscribeNewMessage = onNewMessage((message) => {
      setChats(prev => prev.map(chat => {
        if (chat._id === message.chatId) {
          return {
            ...chat,
            lastMessage: message,
            lastActivity: message.timestamp,
            unreadCount: (chat.unreadCount || 0) + (message.sender.id !== user._id ? 1 : 0)
          };
        }
        return chat;
      }));
    });

    const unsubscribeUserStatusChange = onUserStatusChange((data) => {
      setChats(prev => prev.map(chat => ({
        ...chat,
        participants: chat.participants.map(p => 
          p.user._id === data.userId 
            ? { ...p, isOnline: data.isOnline, lastSeen: data.lastSeen }
            : p
        )
      })));
    });

    return () => {
      unsubscribeChatCreated();
      unsubscribeChatUpdated();
      unsubscribeChatDeleted();
      unsubscribeNewMessage();
      unsubscribeUserStatusChange();
    };
  }, [socket, user._id, selectedChat, onChatCreated, onChatUpdated, onChatDeleted, onNewMessage, onUserStatusChange, loadChats]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      {/* Chat List Sidebar */}
      <Paper sx={{ width: 350, display: 'flex', flexDirection: 'column', borderRight: 1, borderColor: 'divider' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Messages</Typography>
          
          {/* Search */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {/* Filter */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FilterIcon fontSize="small" />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                displayEmpty
              >
                <MenuItem value="all">All Chats</MenuItem>
                <MenuItem value="direct">Direct</MenuItem>
                <MenuItem value="group">Group</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Chat List */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {filteredChats.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {searchTerm ? 'No chats found' : 'No chats yet'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredChats.map((chat) => (
                <ListItem
                  key={chat._id}
                  button
                  selected={selectedChat?._id === chat._id}
                  onClick={() => setSelectedChat(chat)}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      color="success"
                      variant="dot"
                      invisible={!chat.participants.some(p => p.isOnline)}
                    >
                      <Avatar>
                        {chat.type === 'group' ? <GroupIcon /> : <PersonIcon />}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" noWrap>
                          {chat.name}
                        </Typography>
                        {getUnreadCount(chat) > 0 && (
                          <Chip
                            label={getUnreadCount(chat)}
                            size="small"
                            color="primary"
                            sx={{ minWidth: 20, height: 20 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {getLastMessagePreview(chat)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {chat.lastActivity ? format(new Date(chat.lastActivity), { addSuffix: true }) : ''}
                        </Typography>
                      </Box>
                    }
                  />
                  <IconButton size="small">
                    <MoreIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* New Chat FAB */}
        <Box sx={{ p: 2 }}>
          <Fab
            color="primary"
            size="medium"
            onClick={() => setShowNewChatDialog(true)}
            sx={{ width: '100%' }}
          >
            <AddIcon />
            <Typography variant="body2" sx={{ ml: 1 }}>
              New Chat
            </Typography>
          </Fab>
        </Box>
      </Paper>

      {/* Chat Interface */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedChat ? (
          <ChatInterface
            chatId={selectedChat._id}
            onClose={() => setSelectedChat(null)}
          />
        ) : (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            flexDirection="column"
            gap={2}
          >
            <Typography variant="h5" color="text.secondary">
              Select a chat to start messaging
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose from your existing conversations or create a new one
            </Typography>
          </Box>
        )}
      </Box>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onClose={() => setShowNewChatDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Chat</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Chat Name"
            value={newChatData.name}
            onChange={(e) => setNewChatData(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mb: 2, mt: 1 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Chat Type</InputLabel>
            <Select
              value={newChatData.type}
              onChange={(e) => setNewChatData(prev => ({ ...prev, type: e.target.value }))}
              label="Chat Type"
            >
              <MenuItem value="direct">Direct Chat</MenuItem>
              <MenuItem value="group">Group Chat</MenuItem>
            </Select>
          </FormControl>

          {newChatData.type === 'group' && (
            <FormControl fullWidth>
              <InputLabel>Participants</InputLabel>
              <Select
                multiple
                value={newChatData.participants}
                onChange={(e) => setNewChatData(prev => ({ ...prev, participants: e.target.value }))}
                label="Participants"
              >
                {availableUsers
                  .filter(u => u._id !== user._id)
                  .map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.email}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewChatDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateChat}
            variant="contained"
            disabled={!newChatData.name.trim() || creatingChat}
          >
            {creatingChat ? <CircularProgress size={20} /> : 'Create Chat'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Chat; 