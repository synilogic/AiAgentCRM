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
  IconButton,
  useToast,
  Card,
  CardBody,
  Avatar,
  Badge,
  Flex,
  Divider,
  Textarea,
  Select,
  Switch,
  FormControl,
  FormLabel,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  List,
  ListItem,
  ListIcon,
  Code,
  Link,
  Alert,
  AlertIcon,
  Progress,
  Spinner
} from '@chakra-ui/react';
import {
  FiSend,
  FiMic,
  FiMicOff,
  FiSettings,
  FiBrain,
  FiMessageSquare,
  FiUser,
  FiBot,
  FiRefreshCw,
  FiDownload,
  FiUpload,
  FiEdit,
  FiTrash2,
  FiCopy,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiInfo,
  FiActivity,
  FiBarChart3,
  FiPieChart,
  FiGrid,
  FiList,
  FiCalendar,
  FiClock,
  FiShield,
  FiDatabase,
  FiCode,
  FiExternalLink,
  FiQrCode,
  FiStar,
  FiBookmark,
  FiShare2,
  FiMoreVertical
} from 'react-icons/fi';

const AIAssistant = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiContext, setAiContext] = useState({});
  const [assistantSettings, setAssistantSettings] = useState({});
  const [conversationHistory, setConversationHistory] = useState([]);
  const [selectedContext, setSelectedContext] = useState('general');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadAssistantSettings();
    loadConversationHistory();
    initializeAI();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadAssistantSettings = async () => {
    try {
      const response = await apiService.get('/ai/assistant/settings');
      if (response.success) {
        setAssistantSettings(response.settings);
      }
    } catch (error) {
      console.error('Error loading assistant settings:', error);
    }
  };

  const loadConversationHistory = async () => {
    try {
      const response = await apiService.get('/ai/conversations');
      if (response.success) {
        setConversationHistory(response.conversations);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  const initializeAI = async () => {
    try {
      const response = await apiService.post('/ai/assistant/initialize', {
        userId: user.id,
        context: selectedContext
      });
      
      if (response.success) {
        setAiContext(response.context);
        
        // Add welcome message
        setMessages([{
          id: 'welcome',
          type: 'ai',
          content: response.welcomeMessage || 'Hello! I\'m your AI assistant. How can I help you with your CRM today?',
          timestamp: new Date(),
          context: selectedContext
        }]);
      }
    } catch (error) {
      console.error('Error initializing AI:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      context: selectedContext
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setIsProcessing(true);

    try {
      const response = await apiService.post('/ai/assistant/chat', {
        message: inputMessage,
        context: selectedContext,
        userId: user.id,
        conversationId: aiContext.conversationId
      });

      if (response.success) {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: response.response,
          timestamp: new Date(),
          context: selectedContext,
          actions: response.actions || [],
          suggestions: response.suggestions || []
        };

        setMessages(prev => [...prev, aiMessage]);
        setSuggestions(response.suggestions || []);
        
        // Update context
        if (response.context) {
          setAiContext(prev => ({ ...prev, ...response.context }));
        }
      }
    } catch (error) {
      toast({
        title: 'Error sending message',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsTyping(false);
      setIsProcessing(false);
    }
  };

  const handleVoiceInput = () => {
    if (!isListening) {
      // Start voice recognition
      setIsListening(true);
      // Implementation for voice recognition would go here
    } else {
      setIsListening(false);
    }
  };

  const executeAction = async (action) => {
    try {
      const response = await apiService.post('/ai/assistant/execute', {
        action: action.type,
        parameters: action.parameters,
        userId: user.id
      });

      if (response.success) {
        toast({
          title: 'Action executed',
          description: response.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Add action result to conversation
        const actionMessage = {
          id: Date.now().toString(),
          type: 'action',
          content: response.result,
          timestamp: new Date(),
          action: action
        };

        setMessages(prev => [...prev, actionMessage]);
      }
    } catch (error) {
      toast({
        title: 'Action failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const changeContext = (newContext) => {
    setSelectedContext(newContext);
    setMessages([]);
    initializeAI();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    const isAI = message.type === 'ai';
    const isAction = message.type === 'action';

    return (
      <Box
        key={message.id}
        alignSelf={isUser ? 'flex-end' : 'flex-start'}
        maxW="80%"
        mb={4}
      >
        <HStack spacing={3} align="start">
          {!isUser && (
            <Avatar
              size="sm"
              icon={<FiBot />}
              bg="blue.500"
              color="white"
            />
          )}
          
          <VStack align={isUser ? 'flex-end' : 'flex-start'} spacing={2}>
            <Box
              bg={isUser ? 'blue.500' : 'gray.100'}
              color={isUser ? 'white' : 'black'}
              p={3}
              borderRadius="lg"
              maxW="100%"
            >
              <Text>{message.content}</Text>
              
              {isAI && message.actions && message.actions.length > 0 && (
                <VStack spacing={2} mt={3} align="stretch">
                  {message.actions.map((action, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      onClick={() => executeAction(action)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </VStack>
              )}
            </Box>
            
            <HStack spacing={2} fontSize="xs" color="gray.500">
              <Text>{new Date(message.timestamp).toLocaleTimeString()}</Text>
              
              {isAI && (
                <HStack spacing={1}>
                  <IconButton
                    size="xs"
                    icon={<FiCopy />}
                    onClick={() => copyToClipboard(message.content)}
                  />
                  <IconButton
                    size="xs"
                    icon={<FiStar />}
                    onClick={() => {/* Bookmark message */}}
                  />
                </HStack>
              )}
            </HStack>
          </VStack>
          
          {isUser && (
            <Avatar
              size="sm"
              name={user.name}
              src={user.avatar}
            />
          )}
        </HStack>
      </Box>
    );
  };

  const renderSuggestions = () => {
    if (!suggestions.length) return null;

    return (
      <Box mb={4}>
        <Text fontSize="sm" color="gray.600" mb={2}>Suggested actions:</Text>
        <HStack spacing={2} flexWrap="wrap">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              size="sm"
              variant="outline"
              onClick={() => setInputMessage(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </HStack>
      </Box>
    );
  };

  const renderContextSelector = () => (
    <Box mb={4}>
      <Select
        value={selectedContext}
        onChange={(e) => changeContext(e.target.value)}
        size="sm"
      >
        <option value="general">General CRM</option>
        <option value="leads">Lead Management</option>
        <option value="messages">WhatsApp Messages</option>
        <option value="analytics">Analytics & Reports</option>
        <option value="automation">Automation</option>
        <option value="integrations">Integrations</option>
        <option value="billing">Billing & Payments</option>
      </Select>
    </Box>
  );

  return (
    <Box h="100vh" display="flex" flexDirection="column">
      {/* Header */}
      <Box p={4} borderBottom="1px" borderColor="gray.200" bg="white">
        <HStack justify="space-between">
          <HStack>
            <Avatar icon={<FiBrain />} bg="purple.500" color="white" />
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold">AI Assistant</Text>
              <Text fontSize="sm" color="gray.600">Powered by GPT-4</Text>
            </VStack>
          </HStack>
          
          <HStack spacing={2}>
            <IconButton
              icon={<FiSettings />}
              onClick={onOpen}
              variant="ghost"
              size="sm"
            />
            <IconButton
              icon={<FiRefreshCw />}
              onClick={initializeAI}
              variant="ghost"
              size="sm"
            />
          </HStack>
        </HStack>
        
        {renderContextSelector()}
      </Box>

      {/* Messages */}
      <VStack
        flex={1}
        overflowY="auto"
        p={4}
        spacing={4}
        align="stretch"
        bg="gray.50"
      >
        {messages.map(renderMessage)}
        
        {isTyping && (
          <Box alignSelf="flex-start">
            <HStack spacing={3}>
              <Avatar size="sm" icon={<FiBot />} bg="blue.500" color="white" />
              <Box bg="gray.100" p={3} borderRadius="lg">
                <HStack spacing={1}>
                  <Spinner size="sm" />
                  <Text fontSize="sm">AI is thinking...</Text>
                </HStack>
              </Box>
            </HStack>
          </Box>
        )}
        
        {renderSuggestions()}
        
        <div ref={messagesEndRef} />
      </VStack>

      {/* Input Area */}
      <Box p={4} borderTop="1px" borderColor="gray.200" bg="white">
        <VStack spacing={3}>
          <HStack w="100%" spacing={3}>
            <Input
              ref={inputRef}
              placeholder="Ask me anything about your CRM..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              isDisabled={isProcessing}
            />
            
            <IconButton
              icon={isListening ? <FiMicOff /> : <FiMic />}
              onClick={handleVoiceInput}
              colorScheme={isListening ? 'red' : 'gray'}
              isDisabled={isProcessing}
            />
            
            <Button
              colorScheme="blue"
              onClick={sendMessage}
              isDisabled={!inputMessage.trim() || isProcessing}
              isLoading={isProcessing}
            >
              <FiSend />
            </Button>
          </HStack>
          
          <Text fontSize="xs" color="gray.500" textAlign="center">
            I can help you with lead management, message automation, analytics, and more
          </Text>
        </VStack>
      </Box>

      {/* Settings Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>AI Assistant Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} pb={6}>
              {/* Personality Settings */}
              <Box w="100%">
                <Text fontWeight="medium" mb={3}>Assistant Personality</Text>
                <Select
                  value={assistantSettings.personality || 'professional'}
                  onChange={(e) => setAssistantSettings({
                    ...assistantSettings,
                    personality: e.target.value
                  })}
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="technical">Technical</option>
                </Select>
              </Box>

              {/* Response Settings */}
              <Box w="100%">
                <Text fontWeight="medium" mb={3}>Response Settings</Text>
                <VStack spacing={3} align="stretch">
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="detailed-responses" mb="0">
                      Detailed Responses
                    </FormLabel>
                    <Switch
                      id="detailed-responses"
                      isChecked={assistantSettings.detailedResponses}
                      onChange={(e) => setAssistantSettings({
                        ...assistantSettings,
                        detailedResponses: e.target.checked
                      })}
                    />
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="suggest-actions" mb="0">
                      Suggest Actions
                    </FormLabel>
                    <Switch
                      id="suggest-actions"
                      isChecked={assistantSettings.suggestActions}
                      onChange={(e) => setAssistantSettings({
                        ...assistantSettings,
                        suggestActions: e.target.checked
                      })}
                    />
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="voice-input" mb="0">
                      Enable Voice Input
                    </FormLabel>
                    <Switch
                      id="voice-input"
                      isChecked={assistantSettings.voiceInput}
                      onChange={(e) => setAssistantSettings({
                        ...assistantSettings,
                        voiceInput: e.target.checked
                      })}
                    />
                  </FormControl>
                </VStack>
              </Box>

              {/* Context Awareness */}
              <Box w="100%">
                <Text fontWeight="medium" mb={3}>Context Awareness</Text>
                <VStack spacing={3} align="stretch">
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="remember-context" mb="0">
                      Remember Conversation Context
                    </FormLabel>
                    <Switch
                      id="remember-context"
                      isChecked={assistantSettings.rememberContext}
                      onChange={(e) => setAssistantSettings({
                        ...assistantSettings,
                        rememberContext: e.target.checked
                      })}
                    />
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="auto-suggest" mb="0">
                      Auto-suggest Based on Context
                    </FormLabel>
                    <Switch
                      id="auto-suggest"
                      isChecked={assistantSettings.autoSuggest}
                      onChange={(e) => setAssistantSettings({
                        ...assistantSettings,
                        autoSuggest: e.target.checked
                      })}
                    />
                  </FormControl>
                </VStack>
              </Box>

              <HStack w="100%" justify="flex-end">
                <Button onClick={onClose}>Cancel</Button>
                <Button
                  colorScheme="blue"
                  onClick={() => {
                    // Save settings
                    onClose();
                  }}
                >
                  Save Settings
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AIAssistant; 