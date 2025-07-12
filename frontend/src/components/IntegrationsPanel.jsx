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
  Input,
  Textarea,
  Select,
  FormControl,
  FormLabel,
  FormHelperText,
  Alert,
  AlertIcon,
  Progress,
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
  GridItem
} from '@chakra-ui/react';
import {
  FiPlus,
  FiSettings,
  FiRefreshCw,
  FiDownload,
  FiUpload,
  FiTrash2,
  FiExternalLink,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiDatabase,
  FiFileText,
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiActivity
} from 'react-icons/fi';

const IntegrationsPanel = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [integrations, setIntegrations] = useState({});
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [importData, setImportData] = useState({});
  const [syncHistory, setSyncHistory] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadIntegrations();
    loadSyncHistory();
    loadStats();
  }, []);

  const loadIntegrations = async () => {
    try {
      const response = await apiService.get('/integrations/status');
      if (response.success) {
        setIntegrations(response.integrations);
      }
    } catch (error) {
      toast({
        title: 'Error loading integrations',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const loadSyncHistory = async () => {
    try {
      const response = await apiService.get('/integrations/sync-history');
      if (response.success) {
        setSyncHistory(response.history);
      }
    } catch (error) {
      console.error('Error loading sync history:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.get('/integrations/stats');
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const connectIntegration = async (integrationType, credentials) => {
    setIsLoading(true);
    try {
      const response = await apiService.post(`/integrations/${integrationType}/setup`, credentials);
      
      if (response.success) {
        toast({
          title: 'Integration connected',
          description: `${integrationType} has been successfully connected`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        loadIntegrations();
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Connection failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectIntegration = async (integrationType) => {
    try {
      const response = await apiService.delete(`/integrations/${integrationType}`);
      
      if (response.success) {
        toast({
          title: 'Integration disconnected',
          description: `${integrationType} has been disconnected`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        loadIntegrations();
      }
    } catch (error) {
      toast({
        title: 'Disconnection failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const importData = async (integrationType, importConfig) => {
    setIsLoading(true);
    setSyncProgress(0);
    
    try {
      const response = await apiService.post(`/integrations/${integrationType}/import`, importConfig);
      
      if (response.success) {
        toast({
          title: 'Data import started',
          description: `Importing ${response.leadsCount} leads from ${integrationType}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Simulate progress updates
        const interval = setInterval(() => {
          setSyncProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              loadSyncHistory();
              return 100;
            }
            return prev + 10;
          });
        }, 500);
      }
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getIntegrationIcon = (type) => {
    const icons = {
      googleSheets: '📊',
      facebookAds: '📱',
      hubspot: '🟠',
      salesforce: '🔵',
      zapier: '⚡',
      webhook: '🔗'
    };
    return icons[type] || '🔌';
  };

  const getIntegrationColor = (type) => {
    const colors = {
      googleSheets: 'green',
      facebookAds: 'blue',
      hubspot: 'orange',
      salesforce: 'cyan',
      zapier: 'purple',
      webhook: 'gray'
    };
    return colors[type] || 'gray';
  };

  const renderIntegrationCard = (type, isConnected) => {
    const integrationConfig = {
      googleSheets: {
        name: 'Google Sheets',
        description: 'Import leads from Google Sheets',
        features: ['Import', 'Export', 'Sync'],
        setupRequired: true
      },
      facebookAds: {
        name: 'Facebook Ads',
        description: 'Import leads from Facebook Lead Ads',
        features: ['Import', 'Lead Ads'],
        setupRequired: true
      },
      hubspot: {
        name: 'HubSpot',
        description: 'Sync with HubSpot CRM',
        features: ['Import', 'Export', 'Two-way Sync'],
        setupRequired: true
      },
      salesforce: {
        name: 'Salesforce',
        description: 'Sync with Salesforce CRM',
        features: ['Import', 'Export', 'Two-way Sync'],
        setupRequired: true
      },
      zapier: {
        name: 'Zapier',
        description: 'Connect with 5000+ apps via Zapier',
        features: ['Webhooks', 'Automation'],
        setupRequired: true
      },
      webhook: {
        name: 'Custom Webhook',
        description: 'Send data to custom webhook endpoints',
        features: ['Webhooks', 'Custom Events'],
        setupRequired: true
      }
    };

    const config = integrationConfig[type];

    return (
      <Card key={type} variant="outline">
        <CardHeader>
          <HStack justify="space-between">
            <HStack>
              <Text fontSize="2xl">{getIntegrationIcon(type)}</Text>
              <VStack align="start" spacing={0}>
                <Heading size="md">{config.name}</Heading>
                <Text fontSize="sm" color="gray.600">{config.description}</Text>
              </VStack>
            </HStack>
            <Badge colorScheme={isConnected ? 'green' : 'gray'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </HStack>
        </CardHeader>
        
        <CardBody>
          <VStack align="stretch" spacing={4}>
            <HStack justify="space-between">
              <HStack spacing={2}>
                {config.features.map(feature => (
                  <Badge key={feature} size="sm" colorScheme={getIntegrationColor(type)}>
                    {feature}
                  </Badge>
                ))}
              </HStack>
              
              <HStack>
                {isConnected ? (
                  <>
                    <Button
                      size="sm"
                      leftIcon={<FiRefreshCw />}
                      onClick={() => handleImport(type)}
                    >
                      Import
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<FiSettings />}
                      onClick={() => handleSettings(type)}
                    >
                      Settings
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      leftIcon={<FiTrash2 />}
                      onClick={() => disconnectIntegration(type)}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    colorScheme={getIntegrationColor(type)}
                    leftIcon={<FiPlus />}
                    onClick={() => handleConnect(type)}
                  >
                    Connect
                  </Button>
                )}
              </HStack>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  const handleConnect = (type) => {
    setSelectedIntegration(type);
    onOpen();
  };

  const handleImport = (type) => {
    setSelectedIntegration(type);
    // Open import modal
  };

  const handleSettings = (type) => {
    setSelectedIntegration(type);
    // Open settings modal
  };

  const renderConnectionModal = () => {
    if (!selectedIntegration) return null;

    const modalConfig = {
      googleSheets: {
        title: 'Connect Google Sheets',
        fields: [
          { name: 'credentials', label: 'Service Account Credentials', type: 'textarea', required: true }
        ]
      },
      facebookAds: {
        title: 'Connect Facebook Ads',
        fields: [
          { name: 'accessToken', label: 'Access Token', type: 'input', required: true }
        ]
      },
      hubspot: {
        title: 'Connect HubSpot',
        fields: [
          { name: 'apiKey', label: 'API Key', type: 'input', required: true }
        ]
      },
      salesforce: {
        title: 'Connect Salesforce',
        fields: [
          { name: 'username', label: 'Username', type: 'input', required: true },
          { name: 'password', label: 'Password', type: 'input', required: true },
          { name: 'securityToken', label: 'Security Token', type: 'input', required: true },
          { name: 'instanceUrl', label: 'Instance URL', type: 'input', required: true }
        ]
      },
      zapier: {
        title: 'Connect Zapier',
        fields: [
          { name: 'webhookUrl', label: 'Webhook URL', type: 'input', required: true }
        ]
      },
      webhook: {
        title: 'Configure Webhook',
        fields: [
          { name: 'url', label: 'Webhook URL', type: 'input', required: true },
          { name: 'events', label: 'Events', type: 'select', options: ['all', 'leads', 'messages', 'payments'], required: true },
          { name: 'headers', label: 'Headers (JSON)', type: 'textarea', required: false }
        ]
      }
    };

    const config = modalConfig[selectedIntegration];

    return (
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{config.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} pb={6}>
              {config.fields.map(field => (
                <FormControl key={field.name} isRequired={field.required}>
                  <FormLabel>{field.label}</FormLabel>
                  {field.type === 'input' && (
                    <Input
                      type={field.name.includes('password') ? 'password' : 'text'}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      value={importData[field.name] || ''}
                      onChange={(e) => setImportData({
                        ...importData,
                        [field.name]: e.target.value
                      })}
                    />
                  )}
                  {field.type === 'textarea' && (
                    <Textarea
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      value={importData[field.name] || ''}
                      onChange={(e) => setImportData({
                        ...importData,
                        [field.name]: e.target.value
                      })}
                    />
                  )}
                  {field.type === 'select' && (
                    <Select
                      placeholder={`Select ${field.label.toLowerCase()}`}
                      value={importData[field.name] || ''}
                      onChange={(e) => setImportData({
                        ...importData,
                        [field.name]: e.target.value
                      })}
                    >
                      {field.options.map(option => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                    </Select>
                  )}
                  <FormHelperText>
                    {field.name === 'credentials' && 'Paste your Google Service Account JSON credentials'}
                    {field.name === 'accessToken' && 'Get this from Facebook Developers Console'}
                    {field.name === 'apiKey' && 'Find this in your HubSpot account settings'}
                    {field.name === 'webhookUrl' && 'Your Zapier webhook URL'}
                  </FormHelperText>
                </FormControl>
              ))}
              
              <HStack w="100%" justify="flex-end">
                <Button onClick={onClose}>Cancel</Button>
                <Button
                  colorScheme={getIntegrationColor(selectedIntegration)}
                  onClick={() => connectIntegration(selectedIntegration, importData)}
                  isLoading={isLoading}
                >
                  Connect
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>Integrations</Heading>
          <Text color="gray.600">
            Connect your CRM with external platforms and automate data synchronization
          </Text>
        </Box>

        {/* Stats */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
          <Stat>
            <StatLabel>Connected Integrations</StatLabel>
            <StatNumber>{Object.values(integrations).filter(Boolean).length}</StatNumber>
            <StatHelpText>Active connections</StatHelpText>
          </Stat>
          
          <Stat>
            <StatLabel>Total Imports</StatLabel>
            <StatNumber>{stats.totalImports || 0}</StatNumber>
            <StatHelpText>This month</StatHelpText>
          </Stat>
          
          <Stat>
            <StatLabel>Synced Leads</StatLabel>
            <StatNumber>{stats.syncedLeads || 0}</StatNumber>
            <StatHelpText>Total imported</StatHelpText>
          </Stat>
          
          <Stat>
            <StatLabel>Last Sync</StatLabel>
            <StatNumber>{stats.lastSync ? new Date(stats.lastSync).toLocaleDateString() : 'Never'}</StatNumber>
            <StatHelpText>Most recent sync</StatHelpText>
          </Stat>
        </Grid>

        {/* Sync Progress */}
        {syncProgress > 0 && syncProgress < 100 && (
          <Box>
            <Text mb={2}>Syncing data...</Text>
            <Progress value={syncProgress} colorScheme="blue" />
          </Box>
        )}

        {/* Integration Cards */}
        <Grid templateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={6}>
          {Object.keys({
            googleSheets: true,
            facebookAds: true,
            hubspot: true,
            salesforce: true,
            zapier: true,
            webhook: true
          }).map(type => renderIntegrationCard(type, integrations[type]))}
        </Grid>

        {/* Sync History */}
        <Box>
          <Heading size="md" mb={4}>Sync History</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Integration</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th>Records</Th>
                <Th>Date</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {syncHistory.map((sync, index) => (
                <Tr key={index}>
                  <Td>
                    <HStack>
                      <Text>{getIntegrationIcon(sync.integration)}</Text>
                      <Text>{sync.integration}</Text>
                    </HStack>
                  </Td>
                  <Td>{sync.type}</Td>
                  <Td>
                    <Badge colorScheme={sync.status === 'success' ? 'green' : 'red'}>
                      {sync.status}
                    </Badge>
                  </Td>
                  <Td>{sync.recordsCount || 0}</Td>
                  <Td>{new Date(sync.timestamp).toLocaleString()}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        size="sm"
                        icon={<FiRefreshCw />}
                        onClick={() => handleImport(sync.integration)}
                      />
                      <IconButton
                        size="sm"
                        icon={<FiExternalLink />}
                        onClick={() => window.open(sync.detailsUrl)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>

      {renderConnectionModal()}
    </Box>
  );
};

export default IntegrationsPanel; 