import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Input, 
  Button, 
  Avatar, 
  Badge, 
  IconButton,
  Flex,
  Divider,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  Select,
  Tooltip
} from '@chakra-ui/react';
import { 
  FiSend, 
  FiPaperclip, 
  FiSmile, 
  FiMoreVertical, 
  FiEdit, 
  FiTrash2,
  FiReply,
  FiForward,
  FiEye,
  FiEyeOff,
  FiDownload,
  FiImage,
  FiFile,
  FiVideo,
  FiMic
} from 'react-icons/fi';

const RealTimeChat = ({ roomId, onMessageSent }) => {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [messageType, setMessageType] = useState('text');
  const [fileUpload, setFileUpload] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !roomId) return;

    const connectWebSocket = () => {
      const token = localStorage.getItem('token');
      const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:5000'}/ws?token=${token}`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected');
        
        // Join room
        wsRef.current.send(JSON.stringify({
          type: 'join_room',
          payload: { roomId }
        }));
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
        
        // Attempt to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    };

    connectWebSocket();

    // Load message history
    loadMessages();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, roomId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'chat_message':
        setMessages(prev => [...prev, data.data]);
        if (data.data.userId !== user.id) {
          setUnreadCount(prev => prev + 1);
        }
        break;
        
      case 'user_typing':
        if (data.data.userId !== user.id) {
          setTypingUsers(prev => {
            if (data.data.isTyping) {
              return [...prev.filter(u => u !== data.data.userId), data.data.userId];
            } else {
              return prev.filter(u => u !== data.data.userId);
            }
          });
        }
        break;
        
      case 'read_receipt':
        setMessages(prev => prev.map(msg => 
          msg.messageId === data.data.messageId 
            ? { ...msg, readBy: [...(msg.readBy || []), data.data.userId] }
            : msg
        ));
        break;
        
      case 'message_edited':
        setMessages(prev => prev.map(msg => 
          msg.messageId === data.data.messageId 
            ? { ...msg, content: data.data.content, edited: { isEdited: true, editedAt: data.data.editedAt } }
            : msg
        ));
        break;
        
      case 'message_deleted':
        setMessages(prev => prev.filter(msg => msg.messageId !== data.data.messageId));
        break;
        
      case 'message_reaction':
        setMessages(prev => prev.map(msg => 
          msg.messageId === data.data.messageId 
            ? { 
                ...msg, 
                reactions: [...(msg.reactions || []), {
                  userId: data.data.userId,
                  emoji: data.data.emoji,
                  timestamp: data.data.timestamp
                }]
              }
            : msg
        ));
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  // Load message history
  const loadMessages = async () => {
    try {
      const response = await apiService.get(`/chat/rooms/${roomId}/messages`);
      if (response.success) {
        setMessages(response.messages);
        setUnreadCount(0);
      }
    } catch (error) {
      toast({
        title: 'Error loading messages',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() && !fileUpload) return;

    try {
      const messageData = {
        roomId,
        content: newMessage,
        messageType,
        replyTo: replyTo?.messageId,
        metadata: {}
      };

      // Handle file upload
      if (fileUpload) {
        const formData = new FormData();
        formData.append('file', fileUpload);
        
        const uploadResponse = await apiService.post('/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        messageData.metadata = {
          fileName: fileUpload.name,
          fileSize: fileUpload.size,
          mimeType: fileUpload.type,
          fileUrl: uploadResponse.data.url
        };
        messageData.messageType = getFileType(fileUpload.type);
      }

      // Send via WebSocket
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        payload: messageData
      }));

      // Clear form
      setNewMessage('');
      setFileUpload(null);
      setReplyTo(null);
      setMessageType('text');
      
      // Stop typing indicator
      sendTypingStop();

      if (onMessageSent) {
        onMessageSent(messageData);
      }
    } catch (error) {
      toast({
        title: 'Error sending message',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle typing
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      wsRef.current.send(JSON.stringify({
        type: 'typing_start',
        payload: { roomId }
      }));
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop();
    }, 3000);
  };

  const sendTypingStop = () => {
    setIsTyping(false);
    wsRef.current.send(JSON.stringify({
      type: 'typing_stop',
      payload: { roomId }
    }));
  };

  // Mark message as read
  const markAsRead = async (messageId) => {
    try {
      await apiService.post(`/chat/messages/${messageId}/read`);
      wsRef.current.send(JSON.stringify({
        type: 'read_receipt',
        payload: { messageId, roomId }
      }));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Add reaction
  const addReaction = async (messageId, emoji) => {
    try {
      wsRef.current.send(JSON.stringify({
        type: 'message_reaction',
        payload: { messageId, roomId, emoji }
      }));
    } catch (error) {
      toast({
        title: 'Error adding reaction',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Edit message
  const editMessage = async (messageId, newContent) => {
    try {
      await apiService.put(`/chat/messages/${messageId}`, { content: newContent });
      onClose();
    } catch (error) {
      toast({
        title: 'Error editing message',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    try {
      await apiService.delete(`/chat/messages/${messageId}`);
    } catch (error) {
      toast({
        title: 'Error deleting message',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Forward message
  const forwardMessage = async (message) => {
    // This would open a modal to select target room/contact
    console.log('Forward message:', message);
  };

  // File handling
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileUpload(file);
      setMessageType(getFileType(file.type));
    }
  };

  const getFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'file';
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Render message content
  const renderMessageContent = (message) => {
    switch (message.messageType) {
      case 'image':
        return (
          <Box>
            <img 
              src={message.metadata?.fileUrl} 
              alt={message.metadata?.fileName}
              style={{ maxWidth: '200px', borderRadius: '8px' }}
            />
            {message.content && <Text mt={2}>{message.content}</Text>}
          </Box>
        );
        
      case 'video':
        return (
          <Box>
            <video 
              controls 
              style={{ maxWidth: '200px', borderRadius: '8px' }}
            >
              <source src={message.metadata?.fileUrl} type={message.metadata?.mimeType} />
            </video>
            {message.content && <Text mt={2}>{message.content}</Text>}
          </Box>
        );
        
      case 'audio':
        return (
          <Box>
            <audio controls>
              <source src={message.metadata?.fileUrl} type={message.metadata?.mimeType} />
            </audio>
            {message.content && <Text mt={2}>{message.content}</Text>}
          </Box>
        );
        
      case 'file':
        return (
          <Box>
            <HStack spacing={2} p={2} bg="gray.100" borderRadius="md">
              <FiFile />
              <Text fontSize="sm">{message.metadata?.fileName}</Text>
              <IconButton
                size="sm"
                icon={<FiDownload />}
                onClick={() => window.open(message.metadata?.fileUrl)}
              />
            </HStack>
            {message.content && <Text mt={2}>{message.content}</Text>}
          </Box>
        );
        
      default:
        return <Text>{message.content}</Text>;
    }
  };

  // Render message
  const renderMessage = (message) => {
    const isOwnMessage = message.userId === user.id;
    const isRead = message.readBy?.includes(user.id);

    return (
      <Box
        key={message.messageId}
        alignSelf={isOwnMessage ? 'flex-end' : 'flex-start'}
        maxW="70%"
        mb={4}
      >
        <VStack align={isOwnMessage ? 'flex-end' : 'flex-start'} spacing={1}>
          {!isOwnMessage && (
            <Text fontSize="xs" color="gray.500">
              {message.user?.name || 'Unknown User'}
            </Text>
          )}
          
          <Box
            bg={isOwnMessage ? 'blue.500' : 'gray.200'}
            color={isOwnMessage ? 'white' : 'black'}
            p={3}
            borderRadius="lg"
            position="relative"
          >
            {replyTo && replyTo.messageId === message.messageId && (
              <Box
                bg={isOwnMessage ? 'blue.600' : 'gray.300'}
                p={2}
                borderRadius="md"
                mb={2}
                fontSize="sm"
              >
                <Text fontWeight="bold">Replying to:</Text>
                <Text>{replyTo.content}</Text>
              </Box>
            )}
            
            {renderMessageContent(message)}
            
            {message.edited?.isEdited && (
              <Text fontSize="xs" opacity={0.7} mt={1}>
                (edited)
              </Text>
            )}
          </Box>
          
          <HStack spacing={2} fontSize="xs" color="gray.500">
            <Text>{new Date(message.timestamp).toLocaleTimeString()}</Text>
            
            {isOwnMessage && (
              <HStack spacing={1}>
                {isRead ? <FiEye /> : <FiEyeOff />}
                <Text>{message.readBy?.length || 0}</Text>
              </HStack>
            )}
            
            {message.reactions?.length > 0 && (
              <HStack spacing={1}>
                {message.reactions.map((reaction, index) => (
                  <Badge key={index} size="sm">
                    {reaction.emoji} {reaction.userId === user.id ? '1' : ''}
                  </Badge>
                ))}
              </HStack>
            )}
          </HStack>
          
          <HStack spacing={1} opacity={0} _groupHover={{ opacity: 1 }}>
            <IconButton
              size="xs"
              icon={<FiReply />}
              onClick={() => setReplyTo(message)}
            />
            <IconButton
              size="xs"
              icon={<FiForward />}
              onClick={() => forwardMessage(message)}
            />
            {isOwnMessage && (
              <>
                <IconButton
                  size="xs"
                  icon={<FiEdit />}
                  onClick={() => {
                    setSelectedMessage(message);
                    onOpen();
                  }}
                />
                <IconButton
                  size="xs"
                  icon={<FiTrash2 />}
                  onClick={() => deleteMessage(message.messageId)}
                />
              </>
            )}
          </HStack>
        </VStack>
      </Box>
    );
  };

  return (
    <Box h="100%" display="flex" flexDirection="column">
      {/* Header */}
      <Box p={4} borderBottom="1px" borderColor="gray.200">
        <HStack justify="space-between">
          <HStack>
            <Avatar size="sm" name={roomId} />
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold">{roomId}</Text>
              <HStack spacing={2}>
                <Badge 
                  colorScheme={isConnected ? 'green' : 'red'} 
                  size="sm"
                >
                  {isConnected ? 'Online' : 'Offline'}
                </Badge>
                {unreadCount > 0 && (
                  <Badge colorScheme="red" size="sm">
                    {unreadCount} unread
                  </Badge>
                )}
              </HStack>
            </VStack>
          </HStack>
          
          <IconButton
            icon={<FiMoreVertical />}
            variant="ghost"
            size="sm"
          />
        </HStack>
      </Box>

      {/* Messages */}
      <VStack
        flex={1}
        overflowY="auto"
        p={4}
        spacing={4}
        align="stretch"
      >
        {messages.map(renderMessage)}
        
        {typingUsers.length > 0 && (
          <Box alignSelf="flex-start">
            <Text fontSize="sm" color="gray.500" fontStyle="italic">
              {typingUsers.length === 1 ? 'Someone is typing...' : `${typingUsers.length} people are typing...`}
            </Text>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </VStack>

      {/* Reply preview */}
      {replyTo && (
        <Box p={2} bg="gray.100" borderTop="1px" borderColor="gray.200">
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.600">
              Replying to: {replyTo.content.substring(0, 50)}...
            </Text>
            <IconButton
              size="xs"
              icon={<FiX />}
              onClick={() => setReplyTo(null)}
            />
          </HStack>
        </Box>
      )}

      {/* Input area */}
      <Box p={4} borderTop="1px" borderColor="gray.200">
        <VStack spacing={2}>
          <HStack w="100%" spacing={2}>
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            
            <IconButton
              icon={<FiPaperclip />}
              onClick={() => fileInputRef.current?.click()}
            />
            
            <IconButton
              icon={<FiSmile />}
              onClick={() => {/* Emoji picker */}}
            />
            
            <IconButton
              icon={<FiMic />}
              onClick={() => {/* Voice recording */}}
            />
            
            <Button
              colorScheme="blue"
              onClick={sendMessage}
              isDisabled={!newMessage.trim() && !fileUpload}
            >
              <FiSend />
            </Button>
          </HStack>
          
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />
        </VStack>
      </Box>

      {/* Edit message modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Message</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Textarea
                value={selectedMessage?.content || ''}
                onChange={(e) => setSelectedMessage({
                  ...selectedMessage,
                  content: e.target.value
                })}
                placeholder="Edit your message..."
              />
              <HStack>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                  colorScheme="blue"
                  onClick={() => editMessage(selectedMessage?.messageId, selectedMessage?.content)}
                >
                  Save
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default RealTimeChat; 