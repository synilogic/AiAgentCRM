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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Tooltip,
  Flex,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  Progress,
  Alert,
  AlertIcon,
  Select,
  Input,
  Switch,
  FormControl,
  FormLabel,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Code,
  Link,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react';
import {
  FiSmartphone,
  FiTablet,
  FiWifi,
  FiWifiOff,
  FiBell,
  FiBellOff,
  FiDownload,
  FiUpload,
  FiRefreshCw,
  FiTrash2,
  FiSettings,
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
  FiUser,
  FiShield,
  FiDatabase,
  FiCode,
  FiExternalLink,
  FiCopy,
  FiQrCode
} from 'react-icons/fi';

const MobileApp = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [devices, setDevices] = useState([]);
  const [mobileStats, setMobileStats] = useState({});
  const [crashReports, setCrashReports] = useState([]);
  const [notificationPreferences, setNotificationPreferences] = useState({});
  const [appConfig, setAppConfig] = useState({});
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('devices');

  useEffect(() => {
    loadDevices();
    loadMobileStats();
    loadCrashReports();
    loadNotificationPreferences();
    loadAppConfig();
  }, []);

  const loadDevices = async () => {
    try {
      const response = await apiService.get('/mobile/devices');
      if (response.success) {
        setDevices(response.devices);
      }
    } catch (error) {
      toast({
        title: 'Error loading devices',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const loadMobileStats = async () => {
    try {
      const response = await apiService.get('/mobile/stats');
      if (response.success) {
        setMobileStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading mobile stats:', error);
    }
  };

  const loadCrashReports = async () => {
    try {
      const response = await apiService.get('/mobile/crashes');
      if (response.success) {
        setCrashReports(response.crashes);
      }
    } catch (error) {
      console.error('Error loading crash reports:', error);
    }
  };

  const loadNotificationPreferences = async () => {
    try {
      const response = await apiService.get('/mobile/notifications/preferences');
      if (response.success) {
        setNotificationPreferences(response.preferences);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const loadAppConfig = async () => {
    try {
      const response = await apiService.get('/mobile/config');
      if (response.success) {
        setAppConfig(response.config);
      }
    } catch (error) {
      console.error('Error loading app config:', error);
    }
  };

  const registerDevice = async (deviceData) => {
    setIsLoading(true);
    try {
      const response = await apiService.post('/mobile/devices/register', deviceData);
      
      if (response.success) {
        toast({
          title: 'Device registered',
          description: 'Mobile device has been registered successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        loadDevices();
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unregisterDevice = async (deviceId) => {
    try {
      const response = await apiService.delete(`/mobile/devices/${deviceId}`);
      
      if (response.success) {
        toast({
          title: 'Device unregistered',
          description: 'Mobile device has been unregistered',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        loadDevices();
      }
    } catch (error) {
      toast({
        title: 'Unregistration failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const sendTestNotification = async (deviceId) => {
    try {
      const response = await apiService.post('/mobile/test-push', {
        deviceId,
        message: 'This is a test notification from Ai Agentic CRM'
      });
      
      if (response.success) {
        toast({
          title: 'Test notification sent',
          description: 'Test notification has been sent to the device',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to send test notification',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const updateNotificationPreferences = async (preferences) => {
    try {
      const response = await apiService.put('/mobile/notifications/preferences', { preferences });
      
      if (response.success) {
        toast({
          title: 'Preferences updated',
          description: 'Notification preferences have been updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        setNotificationPreferences(preferences);
      }
    } catch (error) {
      toast({
        title: 'Error updating preferences',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getPlatformIcon = (platform) => {
    return platform === 'ios' ? '🍎' : '🤖';
  };

  const getDeviceIcon = (platform) => {
    return platform === 'ios' ? <FiSmartphone /> : <FiTablet />;
  };

  const renderDevicesTab = () => (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <Heading size="md">Registered Devices</Heading>
        <Button leftIcon={<FiPlus />} onClick={onOpen}>
          Register Device
        </Button>
      </HStack>
      
      <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
        {devices.map((device) => (
          <Card key={device.deviceId}>
            <CardHeader>
              <HStack justify="space-between">
                <HStack>
                  <Icon as={getDeviceIcon(device.platform)} />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">{device.deviceModel}</Text>
                    <Text fontSize="sm" color="gray.600">{device.platform}</Text>
                  </VStack>
                </HStack>
                <Badge colorScheme={device.isActive ? 'green' : 'red'}>
                  {device.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </HStack>
            </CardHeader>
            
            <CardBody>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm">App Version</Text>
                  <Text fontSize="sm" fontWeight="medium">{device.appVersion}</Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontSize="sm">Last Seen</Text>
                  <Text fontSize="sm" color="gray.600">
                    {new Date(device.lastSeen).toLocaleString()}
                  </Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontSize="sm">Registered</Text>
                  <Text fontSize="sm" color="gray.600">
                    {new Date(device.registeredAt).toLocaleDateString()}
                  </Text>
                </HStack>
                
                <Divider />
                
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    leftIcon={<FiBell />}
                    onClick={() => sendTestNotification(device.deviceId)}
                  >
                    Test Push
                  </Button>
                  <Button
                    size="sm"
                    leftIcon={<FiSettings />}
                    onClick={() => {
                      setSelectedDevice(device);
                      // Open device settings
                    }}
                  >
                    Settings
                  </Button>
                  <IconButton
                    size="sm"
                    colorScheme="red"
                    icon={<FiTrash2 />}
                    onClick={() => unregisterDevice(device.deviceId)}
                  />
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </Grid>
    </VStack>
  );

  const renderAnalyticsTab = () => (
    <VStack spacing={6} align="stretch">
      {/* Mobile Stats */}
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Devices</StatLabel>
              <StatNumber>{mobileStats.totalDevices || 0}</StatNumber>
              <StatHelpText>Registered devices</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Active Devices</StatLabel>
              <StatNumber>{mobileStats.activeDevices || 0}</StatNumber>
              <StatHelpText>Currently online</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Platform Distribution</StatLabel>
              <StatNumber>{mobileStats.platforms?.ios || 0} / {mobileStats.platforms?.android || 0}</StatNumber>
              <StatHelpText>iOS / Android</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Last Activity</StatLabel>
              <StatNumber>
                {mobileStats.lastSeen ? new Date(mobileStats.lastSeen).toLocaleDateString() : 'Never'}
              </StatNumber>
              <StatHelpText>Most recent activity</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Crash Reports */}
      <Card>
        <CardHeader>
          <Heading size="md">Recent Crash Reports</Heading>
        </CardHeader>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Device</Th>
                <Th>Platform</Th>
                <Th>App Version</Th>
                <Th>Severity</Th>
                <Th>Date</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {crashReports.slice(0, 10).map((crash, index) => (
                <Tr key={index}>
                  <Td>{crash.deviceModel}</Td>
                  <Td>
                    <HStack>
                      <Text>{getPlatformIcon(crash.platform)}</Text>
                      <Text>{crash.platform}</Text>
                    </HStack>
                  </Td>
                  <Td>{crash.appVersion}</Td>
                  <Td>
                    <Badge colorScheme={
                      crash.severity === 'critical' ? 'red' : 
                      crash.severity === 'high' ? 'orange' : 
                      crash.severity === 'medium' ? 'yellow' : 'green'
                    }>
                      {crash.severity}
                    </Badge>
                  </Td>
                  <Td>{new Date(crash.timestamp).toLocaleString()}</Td>
                  <Td>
                    <Badge colorScheme={crash.resolved ? 'green' : 'red'}>
                      {crash.resolved ? 'Resolved' : 'Open'}
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
      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <Heading size="md">Notification Preferences</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="push-notifications" mb="0">
                Push Notifications
              </FormLabel>
              <Switch
                id="push-notifications"
                isChecked={notificationPreferences.pushNotifications}
                onChange={(e) => updateNotificationPreferences({
                  ...notificationPreferences,
                  pushNotifications: e.target.checked
                })}
              />
            </FormControl>
            
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="lead-notifications" mb="0">
                Lead Notifications
              </FormLabel>
              <Switch
                id="lead-notifications"
                isChecked={notificationPreferences.leads}
                onChange={(e) => updateNotificationPreferences({
                  ...notificationPreferences,
                  leads: e.target.checked
                })}
              />
            </FormControl>
            
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="message-notifications" mb="0">
                Message Notifications
              </FormLabel>
              <Switch
                id="message-notifications"
                isChecked={notificationPreferences.messages}
                onChange={(e) => updateNotificationPreferences({
                  ...notificationPreferences,
                  messages: e.target.checked
                })}
              />
            </FormControl>
            
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="payment-notifications" mb="0">
                Payment Notifications
              </FormLabel>
              <Switch
                id="payment-notifications"
                isChecked={notificationPreferences.payments}
                onChange={(e) => updateNotificationPreferences({
                  ...notificationPreferences,
                  payments: e.target.checked
                })}
              />
            </FormControl>
          </VStack>
        </CardBody>
      </Card>

      {/* App Configuration */}
      <Card>
        <CardHeader>
          <Heading size="md">App Configuration</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontWeight="medium" mb={2}>API Configuration</Text>
              <Code p={2} borderRadius="md" display="block">
                Base URL: {appConfig.api?.baseUrl || 'https://api.aiagentcrm.com'}
              </Code>
            </Box>
            
            <Box>
              <Text fontWeight="medium" mb={2}>Features</Text>
              <List spacing={2}>
                {Object.entries(appConfig.features || {}).map(([feature, enabled]) => (
                  <ListItem key={feature}>
                    <ListIcon as={enabled ? FiCheck : FiX} color={enabled ? 'green.500' : 'red.500'} />
                    {feature.replace(/([A-Z])/g, ' $1').trim()}
                  </ListItem>
                ))}
              </List>
            </Box>
            
            <Box>
              <Text fontWeight="medium" mb={2}>Limits</Text>
              <VStack spacing={2} align="stretch">
                <HStack justify="space-between">
                  <Text>Max File Size</Text>
                  <Text>{(appConfig.limits?.maxFileSize / 1024 / 1024).toFixed(1)} MB</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text>Max Message Length</Text>
                  <Text>{appConfig.limits?.maxMessageLength} characters</Text>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </CardBody>
      </Card>

      {/* Download Links */}
      <Card>
        <CardHeader>
          <Heading size="md">Download Mobile App</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <HStack>
                <Text fontSize="2xl">🍎</Text>
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold">iOS App</Text>
                  <Text fontSize="sm" color="gray.600">Available on App Store</Text>
                </VStack>
              </HStack>
              <Link href="#" color="blue.500">
                <FiExternalLink />
              </Link>
            </HStack>
            
            <HStack justify="space-between">
              <HStack>
                <Text fontSize="2xl">🤖</Text>
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold">Android App</Text>
                  <Text fontSize="sm" color="gray.600">Available on Google Play</Text>
                </VStack>
              </HStack>
              <Link href="#" color="blue.500">
                <FiExternalLink />
              </Link>
            </HStack>
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
          <Heading size="lg" mb={2}>Mobile App Management</Heading>
          <Text color="gray.600">
            Manage mobile devices, configure notifications, and monitor app performance
          </Text>
        </Box>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab>Devices</Tab>
            <Tab>Analytics</Tab>
            <Tab>Settings</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>{renderDevicesTab()}</TabPanel>
            <TabPanel>{renderAnalyticsTab()}</TabPanel>
            <TabPanel>{renderSettingsTab()}</TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Device Registration Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Register Mobile Device</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} pb={6}>
              <FormControl isRequired>
                <FormLabel>Device Token</FormLabel>
                <Input
                  placeholder="Enter device token"
                  value={selectedDevice?.deviceToken || ''}
                  onChange={(e) => setSelectedDevice({
                    ...selectedDevice,
                    deviceToken: e.target.value
                  })}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Device ID</FormLabel>
                <Input
                  placeholder="Enter device ID"
                  value={selectedDevice?.deviceId || ''}
                  onChange={(e) => setSelectedDevice({
                    ...selectedDevice,
                    deviceId: e.target.value
                  })}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Platform</FormLabel>
                <Select
                  placeholder="Select platform"
                  value={selectedDevice?.platform || ''}
                  onChange={(e) => setSelectedDevice({
                    ...selectedDevice,
                    platform: e.target.value
                  })}
                >
                  <option value="ios">iOS</option>
                  <option value="android">Android</option>
                </Select>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>App Version</FormLabel>
                <Input
                  placeholder="Enter app version"
                  value={selectedDevice?.appVersion || ''}
                  onChange={(e) => setSelectedDevice({
                    ...selectedDevice,
                    appVersion: e.target.value
                  })}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Device Model</FormLabel>
                <Input
                  placeholder="Enter device model"
                  value={selectedDevice?.deviceModel || ''}
                  onChange={(e) => setSelectedDevice({
                    ...selectedDevice,
                    deviceModel: e.target.value
                  })}
                />
              </FormControl>
              
              <HStack w="100%" justify="flex-end">
                <Button onClick={onClose}>Cancel</Button>
                <Button
                  colorScheme="blue"
                  onClick={() => registerDevice(selectedDevice)}
                  isLoading={isLoading}
                >
                  Register Device
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MobileApp; 