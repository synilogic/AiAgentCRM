import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  LinearProgress,
  Collapse,
  Alert,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Fade,
  Zoom,
  Slide,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  Image as ImageIcon,
  Mic as MicIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Star as StarIcon,
  Share as ShareIcon,
  Phone as PhoneIcon,
  VideoCall as VideoCallIcon,
  Info as InfoIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  InsertDriveFile as FileIcon,
  CloudUpload as CloudUploadIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: theme.palette.background.default,
  borderRadius: 12,
  overflow: 'hidden',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  position: 'sticky',
  top: 0,
  zIndex: 10,
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(1),
  backgroundColor: alpha(theme.palette.grey[50], 0.3),
  scrollBehavior: 'smooth',
  '&::-webkit-scrollbar': {
    width: 6,
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: alpha(theme.palette.grey[300], 0.2),
    borderRadius: 3,
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: alpha(theme.palette.grey[400], 0.5),
    borderRadius: 3,
    '&:hover': {
      backgroundColor: alpha(theme.palette.grey[400], 0.7),
    },
  },
}));

const MessageBubble = styled(Box)(({ theme, isOwnMessage, messageType }) => ({
  maxWidth: '70%',
  margin: theme.spacing(0.5, 0),
  padding: theme.spacing(1.5, 2),
  borderRadius: isOwnMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
  backgroundColor: isOwnMessage ? theme.palette.primary.main : theme.palette.background.paper,
  color: isOwnMessage ? theme.palette.primary.contrastText : theme.palette.text.primary,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  position: 'relative',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  '&::before': messageType === 'system' ? {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.palette.info.main,
    borderRadius: '18px 18px 0 0',
  } : {},
}));

const MessageInputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  gap: theme.spacing(1),
  position: 'sticky',
  bottom: 0,
  zIndex: 10,
}));

const MessageInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 24,
    paddingRight: theme.spacing(1),
    backgroundColor: alpha(theme.palette.grey[50], 0.5),
    '&:hover': {
      backgroundColor: alpha(theme.palette.grey[50], 0.8),
    },
    '&.Mui-focused': {
      backgroundColor: theme.palette.background.paper,
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: theme.spacing(1.5, 2),
    fontSize: '0.95rem',
  },
}));

const TypingIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  color: theme.palette.text.secondary,
  fontStyle: 'italic',
  fontSize: '0.875rem',
  '& .dots': {
    display: 'inline-flex',
    gap: 2,
    marginLeft: theme.spacing(1),
    '& span': {
      width: 4,
      height: 4,
      borderRadius: '50%',
      backgroundColor: theme.palette.text.secondary,
      animation: 'typing 1.4s infinite ease-in-out',
      '&:nth-child(1)': { animationDelay: '0.2s' },
      '&:nth-child(2)': { animationDelay: '0.4s' },
      '&:nth-child(3)': { animationDelay: '0.6s' },
    },
  },
  '@keyframes typing': {
    '0%, 60%, 100%': { transform: 'translateY(0)' },
    '30%': { transform: 'translateY(-8px)' },
  },
}));

const MessageTime = styled('span')(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  marginRight: theme.spacing(1),
}));

const MessageStatus = styled('span')(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.disabled,
  marginLeft: theme.spacing(1),
}));

const ChatInterface = ({ chat, onSendMessage, onMessageUpdate, onTyping, typingUsers = [] }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageMenuAnchor, setMessageMenuAnchor] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachmentDialog, setAttachmentDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!chat) return;
    
    try {
      setLoading(true);
      const response = await apiService.getMessages(1, 50, { chatId: chat.id });
      if (response.success) {
        setMessages(response.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Mock data for development
      setMessages([
        {
          id: 1,
          content: 'Hello! How can I help you today?',
          sender: { id: 'bot', name: 'AI Assistant', avatar: null },
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
          status: 'delivered',
          type: 'text',
        },
        {
          id: 2,
          content: 'I need help with my order',
          sender: { id: user.id, name: user.name, avatar: user.avatar },
          timestamp: new Date(Date.now() - 1 * 60 * 1000),
          status: 'read',
          type: 'text',
        },
        {
          id: 3,
          content: 'Sure! Can you please provide your order number?',
          sender: { id: 'bot', name: 'AI Assistant', avatar: null },
          timestamp: new Date(),
          status: 'delivered',
          type: 'text',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [chat, user]);

  // Handle message send
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageData = {
      content: newMessage,
      type: 'text',
      chatId: chat.id,
      replyTo: replyingTo?.id,
    };

    try {
      setSending(true);
      
      if (editingMessage) {
        // Edit existing message
        await apiService.updateMessage(editingMessage.id, { content: newMessage });
        setEditingMessage(null);
      } else {
        // Send new message
        const response = await apiService.sendMessage(messageData);
        if (response.success) {
          onSendMessage?.(response.message);
        }
      }

      setNewMessage('');
      setReplyingTo(null);
      inputRef.current?.focus();
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    onTyping?.(true);
    
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping?.(false);
    }, 1000);
  };

  // Handle file attachment
  const handleFileAttach = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Handle file upload
      console.log('File selected:', file);
      setAttachmentDialog(false);
    }
  };

  // Handle voice recording
  const handleVoiceRecord = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.start();
        setIsRecording(true);
        
        mediaRecorder.ondataavailable = (event) => {
          const audioBlob = event.data;
          // Handle audio blob
          console.log('Audio recorded:', audioBlob);
        };
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  // Check if messages should be grouped
  const shouldGroupMessages = (current, previous) => {
    if (!previous) return false;
    if (current.sender.id !== previous.sender.id) return false;
    
    const timeDiff = differenceInMinutes(new Date(current.timestamp), new Date(previous.timestamp));
    return timeDiff <= 5;
  };

  // Handle message actions
  const handleMessageAction = (action, message) => {
    switch (action) {
      case 'reply':
        setReplyingTo(message);
        inputRef.current?.focus();
        break;
      case 'edit':
        setEditingMessage(message);
        setNewMessage(message.content);
        inputRef.current?.focus();
        break;
      case 'delete':
        // Handle delete
        break;
      case 'copy':
        navigator.clipboard.writeText(message.content);
        break;
      case 'star':
        // Handle star
        break;
      default:
        break;
    }
    setMessageMenuAnchor(null);
  };

  // Get message status icon
  const getMessageStatusIcon = (status) => {
    switch (status) {
      case 'sending':
        return <ScheduleIcon />;
      case 'sent':
        return <CheckIcon />;
      case 'delivered':
        return <CheckCircleIcon />;
      case 'read':
        return <CheckCircleIcon color="primary" />;
      default:
        return null;
    }
  };

  // Initialize
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!chat) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography variant="h6" color="text.secondary">
          Select a conversation to start messaging
        </Typography>
      </Box>
    );
  }

  return (
    <ChatContainer sx={{ height: fullscreen ? '100vh' : '100%' }}>
      {/* Chat Header */}
      <ChatHeader>
        <Avatar src={chat.avatar} sx={{ mr: 2 }}>
          {chat.name?.charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {chat.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {chat.isOnline ? 'Online' : `Last seen ${formatMessageTime(chat.lastSeen)}`}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Search">
            <IconButton onClick={() => setShowSearch(!showSearch)}>
              <SearchIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Call">
            <IconButton>
              <PhoneIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Video Call">
            <IconButton>
              <VideoCallIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={muted ? 'Unmute' : 'Mute'}>
            <IconButton onClick={() => setMuted(!muted)}>
              {muted ? <NotificationsOffIcon /> : <NotificationsIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            <IconButton onClick={() => setFullscreen(!fullscreen)}>
              {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Chat Info">
            <IconButton onClick={() => setShowInfo(!showInfo)}>
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </ChatHeader>

      {/* Search Bar */}
      <Collapse in={showSearch}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: (
                <IconButton size="small" onClick={() => setShowSearch(false)}>
                  <CloseIcon />
                </IconButton>
              ),
            }}
          />
        </Box>
      </Collapse>

      {/* Messages Container */}
      <MessagesContainer>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ py: 1 }}>
            <AnimatePresence>
              {messages.map((message, index) => {
                const isOwnMessage = message.sender.id === user.id;
                const previousMessage = messages[index - 1];
                const showAvatar = !shouldGroupMessages(message, previousMessage);
                
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ListItem
                      sx={{
                        display: 'flex',
                        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                        alignItems: 'flex-start',
                        py: 0.5,
                        px: 1,
                      }}
                    >
                      {!isOwnMessage && showAvatar && (
                        <Avatar
                          src={message.sender.avatar}
                          sx={{ width: 32, height: 32, mr: 1, mt: 0.5 }}
                        >
                          {message.sender.name?.charAt(0)}
                        </Avatar>
                      )}
                      {!isOwnMessage && !showAvatar && (
                        <Box sx={{ width: 32, mr: 1 }} />
                      )}
                      
                      <Box sx={{ maxWidth: '70%' }}>
                        {replyingTo && message.replyTo === replyingTo.id && (
                          <Box sx={{ mb: 1, p: 1, backgroundColor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Replying to: {replyingTo.content}
                            </Typography>
                          </Box>
                        )}
                        
                        <MessageBubble
                          isOwnMessage={isOwnMessage}
                          messageType={message.type}
                          onClick={(e) => {
                            setSelectedMessage(message);
                            setMessageMenuAnchor(e.currentTarget);
                          }}
                        >
                          {!isOwnMessage && showAvatar && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              {message.sender.name}
                            </Typography>
                          )}
                          
                          <Typography variant="body2">
                            {message.content}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                            <MessageTime>
                              {formatMessageTime(message.timestamp)}
                            </MessageTime>
                            {isOwnMessage && (
                              <MessageStatus>
                                {getMessageStatusIcon(message.status)}
                              </MessageStatus>
                            )}
                          </Box>
                        </MessageBubble>
                      </Box>
                    </ListItem>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {/* Typing Indicator */}
            <AnimatePresence>
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <TypingIndicator>
                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
                    <Box className="dots">
                      <span />
                      <span />
                      <span />
                    </Box>
                  </TypingIndicator>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div ref={messagesEndRef} />
          </List>
        )}
      </MessagesContainer>

      {/* Reply/Edit Bar */}
      <AnimatePresence>
        {(replyingTo || editingMessage) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Box sx={{ p: 2, backgroundColor: 'grey.100', borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {editingMessage ? 'Editing message' : `Replying to ${replyingTo?.sender.name}`}
                </Typography>
                <IconButton size="small" onClick={() => { setReplyingTo(null); setEditingMessage(null); }}>
                  <CloseIcon />
                </IconButton>
              </Box>
              {(replyingTo || editingMessage) && (
                <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                  {(replyingTo || editingMessage)?.content}
                </Typography>
              )}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <MessageInputContainer>
        <Tooltip title="Attach File">
          <IconButton onClick={() => setAttachmentDialog(true)}>
            <AttachFileIcon />
          </IconButton>
        </Tooltip>
        
        <MessageInput
          ref={inputRef}
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={sending}
        />
        
        <Tooltip title="Voice Message">
          <IconButton
            onClick={handleVoiceRecord}
            color={isRecording ? 'error' : 'default'}
          >
            {isRecording ? <MicOffIcon /> : <MicIcon />}
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Send">
          <IconButton
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            color="primary"
          >
            {sending ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Tooltip>
      </MessageInputContainer>

      {/* Message Context Menu */}
      <Menu
        anchorEl={messageMenuAnchor}
        open={Boolean(messageMenuAnchor)}
        onClose={() => setMessageMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleMessageAction('reply', selectedMessage)}>
          <ReplyIcon sx={{ mr: 1 }} />
          Reply
        </MenuItem>
        {selectedMessage?.sender.id === user.id && (
          <MenuItem onClick={() => handleMessageAction('edit', selectedMessage)}>
            <EditIcon sx={{ mr: 1 }} />
            Edit
          </MenuItem>
        )}
        <MenuItem onClick={() => handleMessageAction('copy', selectedMessage)}>
          <CopyIcon sx={{ mr: 1 }} />
          Copy
        </MenuItem>
        <MenuItem onClick={() => handleMessageAction('star', selectedMessage)}>
          <StarIcon sx={{ mr: 1 }} />
          Star
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleMessageAction('delete', selectedMessage)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Attachment Dialog */}
      <Dialog open={attachmentDialog} onClose={() => setAttachmentDialog(false)}>
        <DialogTitle>Attach File</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300 }}>
            <Button
              variant="outlined"
              startIcon={<ImageIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Image
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Document
            </Button>
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Other File
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttachmentDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={handleFileAttach}
        accept="image/*,document/*,*/*"
      />
    </ChatContainer>
  );
};

export default ChatInterface; 