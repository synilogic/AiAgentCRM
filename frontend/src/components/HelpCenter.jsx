import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Badge,
  Icon,
  useToast,
  Select,
  Input,
  Grid,
  GridItem,
  Flex,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  ListIcon,
  Code,
  Link,
  Switch,
  FormControl,
  FormLabel,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Stack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Image,
  AspectRatio,
  SimpleGrid
} from '@chakra-ui/react';
import {
  FiHelpCircle,
  FiBook,
  FiFileText,
  FiVideo,
  FiMessageSquare,
  FiMail,
  FiPhone,
  FiSearch,
  FiFilter,
  FiStar,
  FiThumbsUp,
  FiThumbsDown,
  FiShare2,
  FiBookmark,
  FiDownload,
  FiExternalLink,
  FiArrowRight,
  FiArrowLeft,
  FiHome,
  FiSettings,
  FiRefreshCw,
  FiEdit,
  FiTrash2,
  FiCopy,
  FiMoreVertical,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiPlus,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiInfo,
  FiActivity,
  FiUsers,
  FiDollarSign,
  FiMessageSquare,
  FiTarget,
  FiAward,
  FiClock,
  FiCalendar,
  FiMapPin,
  FiGlobe,
  FiMail,
  FiSmartphone,
  FiTablet,
  FiLaptop,
  FiMonitor,
  FiDatabase,
  FiServer,
  FiShield,
  FiLock,
  FiUnlock,
  FiEye,
  FiEyeOff,
  FiKey,
  FiUserCheck,
  FiUserX,
  FiAlertTriangle,
  FiCheckCircle,
  FiZap,
  FiWorkflow,
  FiGitBranch,
  FiGitCommit,
  FiGitPullRequest,
  FiCode,
  FiTerminal,
  FiCommand,
  FiPlay,
  FiPause,
  FiStop,
  FiSkipBack,
  FiSkipForward,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
  FiMinimize,
  FiRotateCcw,
  FiRotateCw,
  FiZoomIn,
  FiZoomOut,
  FiGrid,
  FiList,
  FiMenu,
  FiX as FiClose,
  FiChevronRight,
  FiChevronLeft,
  FiChevronUp,
  FiChevronDown
} from 'react-icons/fi';

const HelpCenter = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [helpData, setHelpData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('articles');
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    loadHelpData();
    loadTickets();
  }, []);

  const loadHelpData = async () => {
    try {
      const response = await apiService.get('/help/articles');
      if (response.success) {
        setHelpData(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error loading help data',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const loadTickets = async () => {
    try {
      const response = await apiService.get('/help/tickets');
      if (response.success) {
        setTickets(response.tickets);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const createTicket = async (ticketData) => {
    setIsLoading(true);
    try {
      const response = await apiService.post('/help/tickets', ticketData);
      
      if (response.success) {
        toast({
          title: 'Support ticket created',
          description: 'Your ticket has been submitted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        loadTickets();
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Error creating ticket',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitFeedback = async (articleId, feedbackData) => {
    try {
      const response = await apiService.post(`/help/articles/${articleId}/feedback`, feedbackData);
      
      if (response.success) {
        toast({
          title: 'Feedback submitted',
          description: 'Thank you for your feedback!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error submitting feedback',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const searchArticles = (query) => {
    setSearchQuery(query);
    // Filter articles based on search query
  };

  const getCategoryIcon = (category) => {
    const icons = {
      getting_started: FiHome,
      features: FiSettings,
      integrations: FiDatabase,
      troubleshooting: FiAlertCircle,
      api: FiCode,
      billing: FiDollarSign,
      security: FiShield
    };
    return icons[category] || FiHelpCircle;
  };

  const getTicketStatusColor = (status) => {
    switch (status) {
      case 'open': return 'red';
      case 'in_progress': return 'yellow';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      default: return 'gray';
    }
  };

  const renderArticlesTab = () => (
    <VStack spacing={6} align="stretch">
      {/* Search and Filter */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack>
              <Input
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => searchArticles(e.target.value)}
                leftIcon={<FiSearch />}
              />
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                w="200px"
              >
                <option value="all">All Categories</option>
                <option value="getting_started">Getting Started</option>
                <option value="features">Features</option>
                <option value="integrations">Integrations</option>
                <option value="troubleshooting">Troubleshooting</option>
                <option value="api">API</option>
                <option value="billing">Billing</option>
                <option value="security">Security</option>
              </Select>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Popular Articles */}
      <Card>
        <CardHeader>
          <Heading size="md">Popular Articles</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {(helpData.popularArticles || []).map((article) => (
              <Card key={article.id} variant="outline" cursor="pointer" onClick={() => setSelectedArticle(article)}>
                <CardBody>
                  <VStack align="start" spacing={3}>
                    <HStack>
                      <Icon as={getCategoryIcon(article.category)} color="blue.500" />
                      <Badge colorScheme="blue" size="sm">
                        {article.category.replace(/_/g, ' ')}
                      </Badge>
                    </HStack>
                    
                    <Text fontWeight="medium">{article.title}</Text>
                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                      {article.excerpt}
                    </Text>
                    
                    <HStack justify="space-between" w="100%" fontSize="sm" color="gray.500">
                      <Text>{article.readTime} min read</Text>
                      <HStack spacing={1}>
                        <FiThumbsUp />
                        <Text>{article.helpfulCount}</Text>
                      </HStack>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <Heading size="md">Browse by Category</Heading>
        </CardHeader>
        <CardBody>
          <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
            {Object.entries(helpData.categories || {}).map(([category, data]) => (
              <Card key={category} variant="outline" cursor="pointer">
                <CardBody>
                  <VStack align="start" spacing={3}>
                    <HStack>
                      <Icon as={getCategoryIcon(category)} color="blue.500" />
                      <Text fontWeight="medium" textTransform="capitalize">
                        {category.replace(/_/g, ' ')}
                      </Text>
                    </HStack>
                    
                    <Text fontSize="sm" color="gray.600">
                      {data.description}
                    </Text>
                    
                    <HStack justify="space-between" w="100%">
                      <Text fontSize="sm" color="gray.500">
                        {data.articleCount} articles
                      </Text>
                      <Icon as={FiArrowRight} color="blue.500" />
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </CardBody>
      </Card>
    </VStack>
  );

  const renderTutorialsTab = () => (
    <VStack spacing={6} align="stretch">
      {/* Video Tutorials */}
      <Card>
        <CardHeader>
          <Heading size="md">Video Tutorials</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {(helpData.tutorials || []).map((tutorial) => (
              <Card key={tutorial.id} variant="outline">
                <CardBody>
                  <VStack align="start" spacing={3}>
                    <AspectRatio ratio={16 / 9} w="100%">
                      <Box bg="gray.100" borderRadius="md" position="relative">
                        <Icon
                          as={FiPlay}
                          position="absolute"
                          top="50%"
                          left="50%"
                          transform="translate(-50%, -50%)"
                          color="white"
                          fontSize="2xl"
                        />
                      </Box>
                    </AspectRatio>
                    
                    <Text fontWeight="medium">{tutorial.title}</Text>
                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                      {tutorial.description}
                    </Text>
                    
                    <HStack justify="space-between" w="100%" fontSize="sm" color="gray.500">
                      <Text>{tutorial.duration}</Text>
                      <Text>{tutorial.level}</Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Step-by-Step Guides */}
      <Card>
        <CardHeader>
          <Heading size="md">Step-by-Step Guides</Heading>
        </CardHeader>
        <CardBody>
          <Accordion allowMultiple>
            {(helpData.guides || []).map((guide, index) => (
              <AccordionItem key={index}>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Text fontWeight="medium">{guide.title}</Text>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel>
                  <VStack align="start" spacing={3}>
                    <Text fontSize="sm" color="gray.600">
                      {guide.description}
                    </Text>
                    
                    <List spacing={2}>
                      {guide.steps.map((step, stepIndex) => (
                        <ListItem key={stepIndex}>
                          <ListIcon as={FiCheck} color="green.500" />
                          <Text fontSize="sm">{step}</Text>
                        </ListItem>
                      ))}
                    </List>
                    
                    <Button size="sm" colorScheme="blue">
                      View Full Guide
                    </Button>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </CardBody>
      </Card>
    </VStack>
  );

  const renderSupportTab = () => (
    <VStack spacing={6} align="stretch">
      {/* Contact Options */}
      <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
        <Card>
          <CardHeader>
            <HStack>
              <Icon as={FiMessageSquare} color="blue.500" />
              <Heading size="md">Live Chat</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Get instant help from our support team
              </Text>
              <Text fontSize="sm" color="gray.500">
                Available: Mon-Fri 9AM-6PM EST
              </Text>
              <Button colorScheme="blue" leftIcon={<FiMessageSquare />}>
                Start Chat
              </Button>
            </VStack>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>
            <HStack>
              <Icon as={FiMail} color="green.500" />
              <Heading size="md">Email Support</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Send us a detailed message
              </Text>
              <Text fontSize="sm" color="gray.500">
                Response within 24 hours
              </Text>
              <Button colorScheme="green" leftIcon={<FiMail />} onClick={onOpen}>
                Send Email
              </Button>
            </VStack>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>
            <HStack>
              <Icon as={FiPhone} color="purple.500" />
              <Heading size="md">Phone Support</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Speak directly with our team
              </Text>
              <Text fontSize="sm" color="gray.500">
                Available: Mon-Fri 9AM-6PM EST
              </Text>
              <Button colorScheme="purple" leftIcon={<FiPhone />}>
                Call Now
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Grid>

      {/* Support Tickets */}
      <Card>
        <CardHeader>
          <HStack justify="space-between">
            <Heading size="md">My Support Tickets</Heading>
            <Button leftIcon={<FiPlus />} onClick={onOpen}>
              New Ticket
            </Button>
          </HStack>
        </CardHeader>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Ticket ID</Th>
                <Th>Subject</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Last Updated</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {tickets.map((ticket) => (
                <Tr key={ticket.id}>
                  <Td>#{ticket.id}</Td>
                  <Td>{ticket.subject}</Td>
                  <Td>
                    <Badge colorScheme={getTicketStatusColor(ticket.status)}>
                      {ticket.status.replace(/_/g, ' ')}
                    </Badge>
                  </Td>
                  <Td>{new Date(ticket.createdAt).toLocaleDateString()}</Td>
                  <Td>{new Date(ticket.updatedAt).toLocaleDateString()}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        size="sm"
                        icon={<FiEye />}
                        onClick={() => {/* View ticket */}}
                      />
                      <IconButton
                        size="sm"
                        icon={<FiEdit />}
                        onClick={() => {/* Edit ticket */}}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </VStack>
  );

  const renderFAQsTab = () => (
    <VStack spacing={6} align="stretch">
      {/* FAQ Categories */}
      <Card>
        <CardHeader>
          <Heading size="md">Frequently Asked Questions</Heading>
        </CardHeader>
        <CardBody>
          <Accordion allowMultiple>
            {(helpData.faqs || []).map((faq, index) => (
              <AccordionItem key={index}>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Text fontWeight="medium">{faq.question}</Text>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel>
                  <VStack align="start" spacing={3}>
                    <Text fontSize="sm">{faq.answer}</Text>
                    
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<FiThumbsUp />}
                        onClick={() => submitFeedback(faq.id, { helpful: true })}
                      >
                        Helpful
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<FiThumbsDown />}
                        onClick={() => submitFeedback(faq.id, { helpful: false })}
                      >
                        Not Helpful
                      </Button>
                    </HStack>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </CardBody>
      </Card>
    </VStack>
  );

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <VStack align="start" spacing={1}>
            <Heading size="lg">Help Center</Heading>
            <Text color="gray.600">
              Find answers, tutorials, and get support for Ai Agentic CRM
            </Text>
          </VStack>
        </Box>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab>Articles</Tab>
            <Tab>Tutorials</Tab>
            <Tab>Support</Tab>
            <Tab>FAQs</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>{renderArticlesTab()}</TabPanel>
            <TabPanel>{renderTutorialsTab()}</TabPanel>
            <TabPanel>{renderSupportTab()}</TabPanel>
            <TabPanel>{renderFAQsTab()}</TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Article Detail Modal */}
      <Modal isOpen={!!selectedArticle} onClose={() => setSelectedArticle(null)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <VStack align="start" spacing={2}>
              <HStack>
                <Icon as={getCategoryIcon(selectedArticle?.category)} color="blue.500" />
                <Badge colorScheme="blue">
                  {selectedArticle?.category?.replace(/_/g, ' ')}
                </Badge>
              </HStack>
              <Text>{selectedArticle?.title}</Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} pb={6}>
              <Text>{selectedArticle?.content}</Text>
              
              <Divider />
              
              <HStack justify="space-between" w="100%">
                <Text fontSize="sm" color="gray.500">
                  Last updated: {selectedArticle?.updatedAt ? new Date(selectedArticle.updatedAt).toLocaleDateString() : 'Unknown'}
                </Text>
                
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<FiThumbsUp />}
                    onClick={() => submitFeedback(selectedArticle?.id, { helpful: true })}
                  >
                    Helpful
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<FiThumbsDown />}
                    onClick={() => submitFeedback(selectedArticle?.id, { helpful: false })}
                  >
                    Not Helpful
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<FiShare2 />}
                  >
                    Share
                  </Button>
                </HStack>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Support Ticket Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Support Ticket</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} pb={6}>
              <FormControl isRequired>
                <FormLabel>Subject</FormLabel>
                <Input placeholder="Brief description of your issue" />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Category</FormLabel>
                <Select placeholder="Select category">
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="general">General Inquiry</option>
                </Select>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Priority</FormLabel>
                <Select placeholder="Select priority">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </Select>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Please provide detailed information about your issue..."
                  rows={6}
                />
              </FormControl>
              
              <HStack w="100%" justify="flex-end">
                <Button onClick={onClose}>Cancel</Button>
                <Button
                  colorScheme="blue"
                  onClick={() => createTicket({})}
                  isLoading={isLoading}
                >
                  Submit Ticket
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default HelpCenter; 