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
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react';
import {
  FiShield,
  FiShieldCheck,
  FiShieldX,
  FiLock,
  FiUnlock,
  FiEye,
  FiEyeOff,
  FiKey,
  FiUserCheck,
  FiUserX,
  FiAlertTriangle,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiMonitor,
  FiActivity,
  FiSettings,
  FiRefreshCw,
  FiDownload,
  FiUpload,
  FiEdit,
  FiTrash2,
  FiCopy,
  FiExternalLink,
  FiMoreVertical,
  FiFilter,
  FiSearch,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiPlus,
  FiArrowRight,
  FiArrowDown,
  FiArrowUp,
  FiZap,
  FiDatabase,
  FiServer,
  FiWifi,
  FiWifiOff,
  FiSmartphone,
  FiTablet,
  FiLaptop,
  FiGlobe,
  FiHome,
  FiMail,
  FiPhone,
  FiMessageSquare,
  FiCalendar,
  FiClock,
  FiStar,
  FiBookmark,
  FiShare2,
  FiInfo,
  FiHelpCircle
} from 'react-icons/fi';

const SecurityCenter = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, action: null });
  
  const [securityData, setSecurityData] = useState({});
  const [securitySettings, setSecuritySettings] = useState({});
  const [securityEvents, setSecurityEvents] = useState([]);
  const [threats, setThreats] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [securityScore, setSecurityScore] = useState(0);

  useEffect(() => {
    loadSecurityData();
    loadSecuritySettings();
    loadSecurityEvents();
    loadThreats();
    calculateSecurityScore();
  }, []);

  const loadSecurityData = async () => {
    try {
      const response = await apiService.get('/security/overview');
      if (response.success) {
        setSecurityData(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error loading security data',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const loadSecuritySettings = async () => {
    try {
      const response = await apiService.get('/security/settings');
      if (response.success) {
        setSecuritySettings(response.settings);
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  };

  const loadSecurityEvents = async () => {
    try {
      const response = await apiService.get('/security/events');
      if (response.success) {
        setSecurityEvents(response.events);
      }
    } catch (error) {
      console.error('Error loading security events:', error);
    }
  };

  const loadThreats = async () => {
    try {
      const response = await apiService.get('/security/threats');
      if (response.success) {
        setThreats(response.threats);
      }
    } catch (error) {
      console.error('Error loading threats:', error);
    }
  };

  const calculateSecurityScore = () => {
    // Calculate security score based on various factors
    let score = 100;
    
    // Deduct points for security issues
    if (!securitySettings.twoFactorAuth) score -= 20;
    if (!securitySettings.strongPasswords) score -= 15;
    if (!securitySettings.sessionTimeout) score -= 10;
    if (threats.length > 0) score -= threats.length * 5;
    
    setSecurityScore(Math.max(0, score));
  };

  const updateSecuritySettings = async (settings) => {
    try {
      const response = await apiService.put('/security/settings', settings);
      
      if (response.success) {
        toast({
          title: 'Security settings updated',
          description: 'Security settings have been updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        setSecuritySettings(settings);
        calculateSecurityScore();
      }
    } catch (error) {
      toast({
        title: 'Error updating security settings',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const enableTwoFactorAuth = async () => {
    try {
      const response = await apiService.post('/security/2fa/enable');
      
      if (response.success) {
        toast({
          title: 'Two-factor authentication enabled',
          description: 'Please scan the QR code with your authenticator app',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Show QR code modal
        setSelectedEvent({ type: '2fa_setup', qrCode: response.qrCode });
        onOpen();
      }
    } catch (error) {
      toast({
        title: 'Error enabling 2FA',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const disableTwoFactorAuth = () => {
    setAlertDialog({
      isOpen: true,
      action: 'disable_2fa',
      title: 'Disable Two-Factor Authentication',
      message: 'Are you sure you want to disable two-factor authentication? This will make your account less secure.'
    });
  };

  const handleSecurityAction = async (action) => {
    switch (action) {
      case 'disable_2fa':
        try {
          const response = await apiService.post('/security/2fa/disable');
          if (response.success) {
            toast({
              title: 'Two-factor authentication disabled',
              description: '2FA has been disabled for your account',
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
            loadSecuritySettings();
          }
        } catch (error) {
          toast({
            title: 'Error disabling 2FA',
            description: error.message,
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
        break;
      default:
        break;
    }
    setAlertDialog({ isOpen: false, action: null });
  };

  const getThreatLevelColor = (level) => {
    switch (level) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getEventIcon = (eventType) => {
    const icons = {
      login: FiUserCheck,
      logout: FiUserX,
      failed_login: FiAlertTriangle,
      password_change: FiKey,
      settings_change: FiSettings,
      suspicious_activity: FiAlertCircle,
      threat_detected: FiShieldX
    };
    return icons[eventType] || FiActivity;
  };

  const renderOverviewTab = () => (
    <VStack spacing={6} align="stretch">
      {/* Security Score */}
      <Card>
        <CardHeader>
          <HStack justify="space-between">
            <Heading size="md">Security Score</Heading>
            <Badge
              colorScheme={securityScore >= 80 ? 'green' : securityScore >= 60 ? 'yellow' : 'red'}
              fontSize="lg"
              p={2}
            >
              {securityScore}/100
            </Badge>
          </HStack>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Progress
              value={securityScore}
              colorScheme={securityScore >= 80 ? 'green' : securityScore >= 60 ? 'yellow' : 'red'}
              size="lg"
            />
            
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
              <Stat>
                <StatLabel>Two-Factor Auth</StatLabel>
                <StatNumber>
                  <Icon
                    as={securitySettings.twoFactorAuth ? FiShieldCheck : FiShieldX}
                    color={securitySettings.twoFactorAuth ? 'green.500' : 'red.500'}
                  />
                </StatNumber>
                <StatHelpText>
                  {securitySettings.twoFactorAuth ? 'Enabled' : 'Disabled'}
                </StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel>Strong Passwords</StatLabel>
                <StatNumber>
                  <Icon
                    as={securitySettings.strongPasswords ? FiShieldCheck : FiShieldX}
                    color={securitySettings.strongPasswords ? 'green.500' : 'red.500'}
                  />
                </StatNumber>
                <StatHelpText>
                  {securitySettings.strongPasswords ? 'Enforced' : 'Not enforced'}
                </StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel>Session Timeout</StatLabel>
                <StatNumber>
                  <Icon
                    as={securitySettings.sessionTimeout ? FiShieldCheck : FiShieldX}
                    color={securitySettings.sessionTimeout ? 'green.500' : 'red.500'}
                  />
                </StatNumber>
                <StatHelpText>
                  {securitySettings.sessionTimeout ? 'Configured' : 'Not configured'}
                </StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel>Active Threats</StatLabel>
                <StatNumber color="red.500">{threats.length}</StatNumber>
                <StatHelpText>Requires attention</StatHelpText>
              </Stat>
            </Grid>
          </VStack>
        </CardBody>
      </Card>

      {/* Security Stats */}
      <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Login Attempts</StatLabel>
              <StatNumber>{securityData.loginAttempts || 0}</StatNumber>
              <StatHelpText>Last 24 hours</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Failed Logins</StatLabel>
              <StatNumber color="red.500">{securityData.failedLogins || 0}</StatNumber>
              <StatHelpText>Last 24 hours</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Active Sessions</StatLabel>
              <StatNumber>{securityData.activeSessions || 0}</StatNumber>
              <StatHelpText>Current sessions</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Last Security Scan</StatLabel>
              <StatNumber>
                {securityData.lastScan ? new Date(securityData.lastScan).toLocaleDateString() : 'Never'}
              </StatNumber>
              <StatHelpText>System security scan</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <Heading size="md">Recent Security Events</Heading>
        </CardHeader>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Event</Th>
                <Th>User</Th>
                <Th>IP Address</Th>
                <Th>Location</Th>
                <Th>Time</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {securityEvents.slice(0, 10).map((event, index) => (
                <Tr key={index}>
                  <Td>
                    <HStack>
                      <Icon as={getEventIcon(event.type)} color="blue.500" />
                      <Text textTransform="capitalize">
                        {event.type.replace(/_/g, ' ')}
                      </Text>
                    </HStack>
                  </Td>
                  <Td>{event.user}</Td>
                  <Td>{event.ipAddress}</Td>
                  <Td>{event.location}</Td>
                  <Td>{new Date(event.timestamp).toLocaleString()}</Td>
                  <Td>
                    <Badge colorScheme={event.status === 'success' ? 'green' : 'red'}>
                      {event.status}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </VStack>
  );

  const renderSettingsTab = () => (
    <VStack spacing={6} align="stretch">
      {/* Authentication Settings */}
      <Card>
        <CardHeader>
          <Heading size="md">Authentication Settings</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">Two-Factor Authentication</Text>
                <Text fontSize="sm" color="gray.600">
                  Add an extra layer of security to your account
                </Text>
              </VStack>
              <HStack spacing={3}>
                <Badge colorScheme={securitySettings.twoFactorAuth ? 'green' : 'red'}>
                  {securitySettings.twoFactorAuth ? 'Enabled' : 'Disabled'}
                </Badge>
                <Button
                  size="sm"
                  colorScheme={securitySettings.twoFactorAuth ? 'red' : 'green'}
                  onClick={securitySettings.twoFactorAuth ? disableTwoFactorAuth : enableTwoFactorAuth}
                >
                  {securitySettings.twoFactorAuth ? 'Disable' : 'Enable'}
                </Button>
              </HStack>
            </HStack>
            
            <Divider />
            
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">Strong Password Policy</Text>
                <Text fontSize="sm" color="gray.600">
                  Enforce strong password requirements
                </Text>
              </VStack>
              <Switch
                isChecked={securitySettings.strongPasswords}
                onChange={(e) => updateSecuritySettings({
                  ...securitySettings,
                  strongPasswords: e.target.checked
                })}
              />
            </HStack>
            
            <Divider />
            
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">Session Timeout</Text>
                <Text fontSize="sm" color="gray.600">
                  Automatically log out inactive sessions
                </Text>
              </VStack>
              <Switch
                isChecked={securitySettings.sessionTimeout}
                onChange={(e) => updateSecuritySettings({
                  ...securitySettings,
                  sessionTimeout: e.target.checked
                })}
              />
            </HStack>
            
            {securitySettings.sessionTimeout && (
              <FormControl>
                <FormLabel>Timeout Duration (minutes)</FormLabel>
                <NumberInput
                  value={securitySettings.sessionTimeoutMinutes || 30}
                  min={5}
                  max={480}
                  onChange={(value) => updateSecuritySettings({
                    ...securitySettings,
                    sessionTimeoutMinutes: parseInt(value)
                  })}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* Access Control */}
      <Card>
        <CardHeader>
          <Heading size="md">Access Control</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">IP Whitelist</Text>
                <Text fontSize="sm" color="gray.600">
                  Restrict access to specific IP addresses
                </Text>
              </VStack>
              <Switch
                isChecked={securitySettings.ipWhitelist}
                onChange={(e) => updateSecuritySettings({
                  ...securitySettings,
                  ipWhitelist: e.target.checked
                })}
              />
            </HStack>
            
            {securitySettings.ipWhitelist && (
              <FormControl>
                <FormLabel>Allowed IP Addresses</FormLabel>
                <Textarea
                  placeholder="Enter IP addresses (one per line)"
                  value={securitySettings.allowedIPs || ''}
                  onChange={(e) => updateSecuritySettings({
                    ...securitySettings,
                    allowedIPs: e.target.value
                  })}
                />
              </FormControl>
            )}
            
            <Divider />
            
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">Device Management</Text>
                <Text fontSize="sm" color="gray.600">
                  Manage trusted devices
                </Text>
              </VStack>
              <Button size="sm" onClick={() => {/* Open device management */}}>
                Manage Devices
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <Heading size="md">Privacy Settings</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">Data Collection</Text>
                <Text fontSize="sm" color="gray.600">
                  Allow collection of usage analytics
                </Text>
              </VStack>
              <Switch
                isChecked={securitySettings.dataCollection}
                onChange={(e) => updateSecuritySettings({
                  ...securitySettings,
                  dataCollection: e.target.checked
                })}
              />
            </HStack>
            
            <Divider />
            
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">Location Tracking</Text>
                <Text fontSize="sm" color="gray.600">
                  Track login locations for security
                </Text>
              </VStack>
              <Switch
                isChecked={securitySettings.locationTracking}
                onChange={(e) => updateSecuritySettings({
                  ...securitySettings,
                  locationTracking: e.target.checked
                })}
              />
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );

  const renderThreatsTab = () => (
    <VStack spacing={6} align="stretch">
      {/* Active Threats */}
      <Card>
        <CardHeader>
          <Heading size="md">Active Threats</Heading>
        </CardHeader>
        <CardBody>
          {threats.length === 0 ? (
            <Alert status="success">
              <AlertIcon />
              No active threats detected. Your account is secure!
            </Alert>
          ) : (
            <VStack spacing={4} align="stretch">
              {threats.map((threat, index) => (
                <Box
                  key={index}
                  p={4}
                  border="1px"
                  borderColor={`${getThreatLevelColor(threat.level)}.200`}
                  borderRadius="md"
                  bg={`${getThreatLevelColor(threat.level)}.50`}
                >
                  <HStack justify="space-between" mb={2}>
                    <HStack>
                      <Icon
                        as={FiAlertTriangle}
                        color={`${getThreatLevelColor(threat.level)}.500`}
                      />
                      <Text fontWeight="medium">{threat.title}</Text>
                    </HStack>
                    <Badge colorScheme={getThreatLevelColor(threat.level)}>
                      {threat.level}
                    </Badge>
                  </HStack>
                  
                  <Text fontSize="sm" color="gray.600" mb={3}>
                    {threat.description}
                  </Text>
                  
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      colorScheme={getThreatLevelColor(threat.level)}
                      onClick={() => {/* Handle threat */}}
                    >
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {/* Ignore threat */}}
                    >
                      Ignore
                    </Button>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </CardBody>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <Heading size="md">Security Recommendations</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            {!securitySettings.twoFactorAuth && (
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <Text fontWeight="medium">Enable Two-Factor Authentication</Text>
                  <Text fontSize="sm">
                    Add an extra layer of security to protect your account from unauthorized access.
                  </Text>
                </Box>
              </Alert>
            )}
            
            {!securitySettings.strongPasswords && (
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <Text fontWeight="medium">Enforce Strong Passwords</Text>
                  <Text fontSize="sm">
                    Require users to create strong passwords that are harder to crack.
                  </Text>
                </Box>
              </Alert>
            )}
            
            {!securitySettings.sessionTimeout && (
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <Text fontWeight="medium">Configure Session Timeout</Text>
                  <Text fontSize="sm">
                    Automatically log out inactive sessions to prevent unauthorized access.
                  </Text>
                </Box>
              </Alert>
            )}
            
            {threats.length > 0 && (
              <Alert status="error">
                <AlertIcon />
                <Box>
                  <Text fontWeight="medium">Address Active Threats</Text>
                  <Text fontSize="sm">
                    Review and resolve the active threats to improve your security score.
                  </Text>
                </Box>
              </Alert>
            )}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <Heading size="lg">Security Center</Heading>
              <Text color="gray.600">
                Monitor and manage your account security settings
              </Text>
            </VStack>
            
            <HStack spacing={3}>
              <Button
                leftIcon={<FiRefreshCw />}
                onClick={loadSecurityData}
                size="sm"
              >
                Refresh
              </Button>
            </HStack>
          </HStack>
        </Box>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab>Overview</Tab>
            <Tab>Settings</Tab>
            <Tab>Threats</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>{renderOverviewTab()}</TabPanel>
            <TabPanel>{renderSettingsTab()}</TabPanel>
            <TabPanel>{renderThreatsTab()}</TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* 2FA Setup Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Two-Factor Authentication Setup</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} pb={6}>
              <Text>
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </Text>
              
              {selectedEvent?.qrCode && (
                <Box textAlign="center">
                  <img src={selectedEvent.qrCode} alt="QR Code" style={{ maxWidth: '200px' }} />
                </Box>
              )}
              
              <Text fontSize="sm" color="gray.600">
                After scanning, enter the 6-digit code from your authenticator app to complete setup.
              </Text>
              
              <FormControl>
                <FormLabel>Verification Code</FormLabel>
                <Input placeholder="Enter 6-digit code" maxLength={6} />
              </FormControl>
              
              <HStack w="100%" justify="flex-end">
                <Button onClick={onClose}>Cancel</Button>
                <Button colorScheme="blue">
                  Verify & Enable
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ isOpen: false, action: null })}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>
              {alertDialog.title}
            </AlertDialogHeader>
            <AlertDialogBody>
              {alertDialog.message}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={() => setAlertDialog({ isOpen: false, action: null })}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => handleSecurityAction(alertDialog.action)}
              >
                Confirm
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default SecurityCenter; 