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
  Textarea,
  FormControl,
  FormLabel,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react';
import {
  FiUsers,
  FiTrendingUp,
  FiDollarSign,
  FiActivity,
  FiSettings,
  FiRefreshCw,
  FiDownload,
  FiUpload,
  FiTrash2,
  FiEdit,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiDatabase,
  FiServer,
  FiCpu,
  FiHardDrive,
  FiWifi,
  FiShield,
  FiClock,
  FiBarChart3,
  FiPieChart,
  FiGrid,
  FiList,
  FiCalendar,
  FiMail,
  FiMessageSquare,
  FiCreditCard,
  FiUserCheck,
  FiUserX
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [dashboardData, setDashboardData] = useState({});
  const [systemHealth, setSystemHealth] = useState({});
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [systemSettings, setSystemSettings] = useState({});
  const [backups, setBackups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
    loadSystemHealth();
    loadPerformanceMetrics();
    loadUsers();
    loadSystemSettings();
    loadBackups();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await apiService.get('/admin/dashboard');
      if (response.success) {
        setDashboardData(response);
      }
    } catch (error) {
      toast({
        title: 'Error loading dashboard',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const loadSystemHealth = async () => {
    try {
      const response = await apiService.get('/admin/health');
      if (response.success) {
        setSystemHealth(response.health);
      }
    } catch (error) {
      console.error('Error loading system health:', error);
    }
  };

  const loadPerformanceMetrics = async () => {
    try {
      const response = await apiService.get('/admin/performance');
      if (response.success) {
        setPerformanceMetrics(response);
      }
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiService.get('/admin/users');
      if (response.success) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadSystemSettings = async () => {
    try {
      const response = await apiService.get('/admin/settings');
      if (response.success) {
        setSystemSettings(response.settings);
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
    }
  };

  const loadBackups = async () => {
    try {
      const response = await apiService.get('/admin/backup/list');
      if (response.success) {
        setBackups(response.backups);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    try {
      const response = await apiService.put(`/admin/users/${userId}/status`, {
        isActive,
        reason: isActive ? 'User activated by admin' : 'User deactivated by admin'
      });
      
      if (response.success) {
        toast({
          title: 'User status updated',
          description: `User has been ${isActive ? 'activated' : 'deactivated'}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        loadUsers();
      }
    } catch (error) {
      toast({
        title: 'Error updating user status',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const createBackup = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.post('/admin/backup/create');
      
      if (response.success) {
        toast({
          title: 'Backup created',
          description: 'System backup has been created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        loadBackups();
      }
    } catch (error) {
      toast({
        title: 'Backup failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSystemSettings = async (settings) => {
    try {
      const response = await apiService.put('/admin/settings', settings);
      
      if (response.success) {
        toast({
          title: 'Settings updated',
          description: 'System settings have been updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        setSystemSettings(settings);
      }
    } catch (error) {
      toast({
        title: 'Error updating settings',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'degraded': return 'yellow';
      case 'unhealthy': return 'red';
      default: return 'gray';
    }
  };

  const renderOverviewTab = () => (
    <VStack spacing={6} align="stretch">
      {/* Key Metrics */}
      <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Users</StatLabel>
              <StatNumber>{dashboardData.stats?.totalUsers || 0}</StatNumber>
              <StatHelpText>
                <Icon as={FiTrendingUp} color="green.500" />
                +12% from last month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Active Users</StatLabel>
              <StatNumber>{dashboardData.stats?.activeUsers || 0}</StatNumber>
              <StatHelpText>
                <Icon as={FiUserCheck} color="blue.500" />
                {((dashboardData.stats?.activeUsers / dashboardData.stats?.totalUsers) * 100 || 0).toFixed(1)}% active rate
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Leads</StatLabel>
              <StatNumber>{dashboardData.stats?.totalLeads || 0}</StatNumber>
              <StatHelpText>
                <Icon as={FiActivity} color="purple.500" />
                +8% from last month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Revenue</StatLabel>
              <StatNumber>${dashboardData.stats?.totalRevenue?.toLocaleString() || 0}</StatNumber>
              <StatHelpText>
                <Icon as={FiDollarSign} color="green.500" />
                +15% from last month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* System Health */}
      <Card>
        <CardHeader>
          <Heading size="md">System Health</Heading>
        </CardHeader>
        <CardBody>
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
            {Object.entries(systemHealth.services || {}).map(([service, status]) => (
              <Box key={service}>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="medium" textTransform="capitalize">
                    {service.replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                  <Badge colorScheme={getHealthStatusColor(status.status)}>
                    {status.status}
                  </Badge>
                </HStack>
                {status.connections && (
                  <Text fontSize="sm" color="gray.600">
                    {status.connections} connections
                  </Text>
                )}
              </Box>
            ))}
          </Grid>
        </CardBody>
      </Card>

      {/* Performance Charts */}
      <Grid templateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={6}>
        <Card>
          <CardHeader>
            <Heading size="md">User Growth</Heading>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceMetrics.userGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>
            <Heading size="md">Revenue Trend</Heading>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceMetrics.revenueTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area type="monotone" dataKey="revenue" fill="#82ca9d" stroke="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </Grid>
    </VStack>
  );

  const renderUsersTab = () => (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <Heading size="md">User Management</Heading>
        <Button leftIcon={<FiRefreshCw />} onClick={loadUsers}>
          Refresh
        </Button>
      </HStack>
      
      <Card>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>User</Th>
                <Th>Email</Th>
                <Th>Plan</Th>
                <Th>Status</Th>
                <Th>Joined</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user._id}>
                  <Td>
                    <HStack>
                      <Text fontWeight="medium">{user.name}</Text>
                    </HStack>
                  </Td>
                  <Td>{user.email}</Td>
                  <Td>
                    <Badge colorScheme="blue">{user.plan}</Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme={user.isActive ? 'green' : 'red'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>{new Date(user.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        size="sm"
                        icon={user.isActive ? <FiEyeOff /> : <FiEye />}
                        onClick={() => updateUserStatus(user._id, !user.isActive)}
                        colorScheme={user.isActive ? 'red' : 'green'}
                      />
                      <IconButton
                        size="sm"
                        icon={<FiEdit />}
                        onClick={() => {
                          setSelectedUser(user);
                          onOpen();
                        }}
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

  const renderSystemTab = () => (
    <VStack spacing={6} align="stretch">
      <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <Heading size="md">Performance Metrics</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontSize="sm" color="gray.600">API Response Time</Text>
                <Progress value={performanceMetrics.apiResponseTime || 0} colorScheme="blue" />
                <Text fontSize="xs" mt={1}>{performanceMetrics.apiResponseTime || 0}ms average</Text>
              </Box>
              
              <Box>
                <Text fontSize="sm" color="gray.600">Database Queries</Text>
                <Progress value={performanceMetrics.dbQueries || 0} colorScheme="green" />
                <Text fontSize="xs" mt={1}>{performanceMetrics.dbQueries || 0} queries/sec</Text>
              </Box>
              
              <Box>
                <Text fontSize="sm" color="gray.600">Memory Usage</Text>
                <Progress value={performanceMetrics.memoryUsage || 0} colorScheme="orange" />
                <Text fontSize="xs" mt={1}>{performanceMetrics.memoryUsage || 0}% used</Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <Heading size="md">System Settings</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="maintenance-mode" mb="0">
                  Maintenance Mode
                </FormLabel>
                <Switch
                  id="maintenance-mode"
                  isChecked={systemSettings.maintenance?.mode}
                  onChange={(e) => updateSystemSettings({
                    ...systemSettings,
                    maintenance: { ...systemSettings.maintenance, mode: e.target.checked }
                  })}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Max Users</FormLabel>
                <NumberInput
                  value={systemSettings.limits?.maxUsers || 1000}
                  onChange={(value) => updateSystemSettings({
                    ...systemSettings,
                    limits: { ...systemSettings.limits, maxUsers: parseInt(value) }
                  })}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              
              <FormControl>
                <FormLabel>Max Leads</FormLabel>
                <NumberInput
                  value={systemSettings.limits?.maxLeads || 10000}
                  onChange={(value) => updateSystemSettings({
                    ...systemSettings,
                    limits: { ...systemSettings.limits, maxLeads: parseInt(value) }
                  })}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>
      </Grid>

      {/* Backup Management */}
      <Card>
        <CardHeader>
          <HStack justify="space-between">
            <Heading size="md">Backup Management</Heading>
            <Button
              leftIcon={<FiDownload />}
              onClick={createBackup}
              isLoading={isLoading}
            >
              Create Backup
            </Button>
          </HStack>
        </CardHeader>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Backup</Th>
                <Th>Type</Th>
                <Th>Size</Th>
                <Th>Created</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {backups.map((backup, index) => (
                <Tr key={index}>
                  <Td>{backup.filename}</Td>
                  <Td>
                    <Badge colorScheme="blue">{backup.type}</Badge>
                  </Td>
                  <Td>{(backup.size / 1024 / 1024).toFixed(2)} MB</Td>
                  <Td>{new Date(backup.created).toLocaleString()}</Td>
                  <Td>
                    <Badge colorScheme="green">Available</Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </VStack>
  );

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>Admin Dashboard</Heading>
          <Text color="gray.600">
            Monitor system health, manage users, and configure platform settings
          </Text>
        </Box>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab>Overview</Tab>
            <Tab>Users</Tab>
            <Tab>System</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>{renderOverviewTab()}</TabPanel>
            <TabPanel>{renderUsersTab()}</TabPanel>
            <TabPanel>{renderSystemTab()}</TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* User Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedUser && (
              <VStack spacing={4} pb={6}>
                <FormControl>
                  <FormLabel>Name</FormLabel>
                  <Input value={selectedUser.name} isReadOnly />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input value={selectedUser.email} isReadOnly />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Plan</FormLabel>
                  <Select value={selectedUser.plan}>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </Select>
                </FormControl>
                
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="user-active" mb="0">
                    Active
                  </FormLabel>
                  <Switch
                    id="user-active"
                    isChecked={selectedUser.isActive}
                    onChange={(e) => updateUserStatus(selectedUser._id, e.target.checked)}
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminDashboard; 