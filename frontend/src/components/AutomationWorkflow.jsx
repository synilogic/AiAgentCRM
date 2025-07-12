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
  Stack
} from '@chakra-ui/react';
import {
  FiPlay,
  FiPause,
  FiStop,
  FiEdit,
  FiTrash2,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiSettings,
  FiPlus,
  FiRefreshCw,
  FiDownload,
  FiUpload,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiInfo,
  FiActivity,
  FiClock,
  FiCalendar,
  FiTarget,
  FiUsers,
  FiMessageSquare,
  FiMail,
  FiBell,
  FiDatabase,
  FiCode,
  FiExternalLink,
  FiShare2,
  FiBookmark,
  FiStar,
  FiMoreVertical,
  FiFilter,
  FiSearch,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiArrowRight,
  FiArrowDown,
  FiArrowUp,
  FiZap,
  FiWorkflow,
  FiGitBranch,
  FiGitCommit,
  FiGitPullRequest
} from 'react-icons/fi';

const AutomationWorkflow = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [workflows, setWorkflows] = useState([]);
  const [automationStats, setAutomationStats] = useState({});
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('workflows');
  const [workflowBuilder, setWorkflowBuilder] = useState({
    name: '',
    description: '',
    triggers: [],
    actions: [],
    conditions: [],
    schedule: null
  });

  useEffect(() => {
    loadWorkflows();
    loadAutomationStats();
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await apiService.get('/automation/workflows');
      if (response.success) {
        setWorkflows(response.workflows);
      }
    } catch (error) {
      toast({
        title: 'Error loading workflows',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const loadAutomationStats = async () => {
    try {
      const response = await apiService.get('/automation/stats');
      if (response.success) {
        setAutomationStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading automation stats:', error);
    }
  };

  const createWorkflow = async (workflowData) => {
    setIsLoading(true);
    try {
      const response = await apiService.post('/automation/workflows', workflowData);
      
      if (response.success) {
        toast({
          title: 'Workflow created',
          description: 'Automation workflow has been created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        loadWorkflows();
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Workflow creation failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateWorkflow = async (workflowId, workflowData) => {
    try {
      const response = await apiService.put(`/automation/workflows/${workflowId}`, workflowData);
      
      if (response.success) {
        toast({
          title: 'Workflow updated',
          description: 'Automation workflow has been updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        loadWorkflows();
      }
    } catch (error) {
      toast({
        title: 'Workflow update failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const deleteWorkflow = async (workflowId) => {
    try {
      const response = await apiService.delete(`/automation/workflows/${workflowId}`);
      
      if (response.success) {
        toast({
          title: 'Workflow deleted',
          description: 'Automation workflow has been deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        loadWorkflows();
      }
    } catch (error) {
      toast({
        title: 'Workflow deletion failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const toggleWorkflow = async (workflowId, isActive) => {
    try {
      const response = await apiService.put(`/automation/workflows/${workflowId}/toggle`, {
        isActive
      });
      
      if (response.success) {
        toast({
          title: `Workflow ${isActive ? 'activated' : 'deactivated'}`,
          description: `Workflow has been ${isActive ? 'activated' : 'deactivated'}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        loadWorkflows();
      }
    } catch (error) {
      toast({
        title: 'Workflow toggle failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const duplicateWorkflow = async (workflowId) => {
    try {
      const response = await apiService.post(`/automation/workflows/${workflowId}/duplicate`);
      
      if (response.success) {
        toast({
          title: 'Workflow duplicated',
          description: 'Workflow has been duplicated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        loadWorkflows();
      }
    } catch (error) {
      toast({
        title: 'Workflow duplication failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getWorkflowStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'gray';
      case 'error': return 'red';
      case 'running': return 'blue';
      default: return 'gray';
    }
  };

  const getTriggerIcon = (triggerType) => {
    const icons = {
      lead_created: FiUsers,
      message_received: FiMessageSquare,
      payment_received: FiDollarSign,
      time_based: FiClock,
      webhook: FiCode,
      manual: FiPlay
    };
    return icons[triggerType] || FiZap;
  };

  const getActionIcon = (actionType) => {
    const icons = {
      send_message: FiMessageSquare,
      send_email: FiMail,
      create_task: FiTarget,
      update_lead: FiUsers,
      send_notification: FiBell,
      webhook: FiCode
    };
    return icons[actionType] || FiZap;
  };

  const renderWorkflowsTab = () => (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <Heading size="md">Automation Workflows</Heading>
        <Button leftIcon={<FiPlus />} onClick={onOpen}>
          Create Workflow
        </Button>
      </HStack>

      <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={6}>
        {workflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Heading size="sm">{workflow.name}</Heading>
                  <Text fontSize="sm" color="gray.600">{workflow.description}</Text>
                </VStack>
                <Badge colorScheme={getWorkflowStatusColor(workflow.status)}>
                  {workflow.status}
                </Badge>
              </HStack>
            </CardHeader>
            
            <CardBody>
              <VStack spacing={4} align="stretch">
                {/* Triggers */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>Triggers</Text>
                  <VStack spacing={2} align="stretch">
                    {workflow.triggers.map((trigger, index) => (
                      <HStack key={index} p={2} bg="gray.50" borderRadius="md">
                        <Icon as={getTriggerIcon(trigger.type)} color="blue.500" />
                        <Text fontSize="sm">{trigger.name}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>

                {/* Actions */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>Actions</Text>
                  <VStack spacing={2} align="stretch">
                    {workflow.actions.map((action, index) => (
                      <HStack key={index} p={2} bg="green.50" borderRadius="md">
                        <Icon as={getActionIcon(action.type)} color="green.500" />
                        <Text fontSize="sm">{action.name}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>

                {/* Stats */}
                <HStack justify="space-between" fontSize="sm" color="gray.600">
                  <Text>Executions: {workflow.stats?.executions || 0}</Text>
                  <Text>Last Run: {workflow.lastRun ? new Date(workflow.lastRun).toLocaleDateString() : 'Never'}</Text>
                </HStack>

                <Divider />

                {/* Actions */}
                <HStack spacing={2}>
                  <IconButton
                    size="sm"
                    icon={workflow.status === 'active' ? <FiPause /> : <FiPlay />}
                    onClick={() => toggleWorkflow(workflow.id, workflow.status !== 'active')}
                    colorScheme={workflow.status === 'active' ? 'orange' : 'green'}
                  />
                  <IconButton
                    size="sm"
                    icon={<FiEye />}
                    onClick={() => setSelectedWorkflow(workflow)}
                  />
                  <IconButton
                    size="sm"
                    icon={<FiEdit />}
                    onClick={() => {
                      setWorkflowBuilder(workflow);
                      onOpen();
                    }}
                  />
                  <IconButton
                    size="sm"
                    icon={<FiCopy />}
                    onClick={() => duplicateWorkflow(workflow.id)}
                  />
                  <IconButton
                    size="sm"
                    icon={<FiTrash2 />}
                    colorScheme="red"
                    onClick={() => deleteWorkflow(workflow.id)}
                  />
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </Grid>
    </VStack>
  );

  const renderBuilderTab = () => (
    <VStack spacing={6} align="stretch">
      <Heading size="md">Workflow Builder</Heading>
      
      <Card>
        <CardHeader>
          <Heading size="sm">Workflow Configuration</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Workflow Name</FormLabel>
              <Input
                placeholder="Enter workflow name"
                value={workflowBuilder.name}
                onChange={(e) => setWorkflowBuilder({
                  ...workflowBuilder,
                  name: e.target.value
                })}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                placeholder="Enter workflow description"
                value={workflowBuilder.description}
                onChange={(e) => setWorkflowBuilder({
                  ...workflowBuilder,
                  description: e.target.value
                })}
              />
            </FormControl>
          </VStack>
        </CardBody>
      </Card>

      {/* Trigger Configuration */}
      <Card>
        <CardHeader>
          <Heading size="sm">Triggers</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Trigger Type</FormLabel>
              <Select
                placeholder="Select trigger type"
                value={workflowBuilder.triggers[0]?.type || ''}
                onChange={(e) => setWorkflowBuilder({
                  ...workflowBuilder,
                  triggers: [{
                    type: e.target.value,
                    name: e.target.options[e.target.selectedIndex].text,
                    config: {}
                  }]
                })}
              >
                <option value="lead_created">Lead Created</option>
                <option value="message_received">Message Received</option>
                <option value="payment_received">Payment Received</option>
                <option value="time_based">Time Based</option>
                <option value="webhook">Webhook</option>
                <option value="manual">Manual Trigger</option>
              </Select>
            </FormControl>
            
            {workflowBuilder.triggers[0]?.type === 'time_based' && (
              <FormControl>
                <FormLabel>Schedule</FormLabel>
                <Select
                  placeholder="Select schedule"
                  value={workflowBuilder.schedule || ''}
                  onChange={(e) => setWorkflowBuilder({
                    ...workflowBuilder,
                    schedule: e.target.value
                  })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </Select>
              </FormControl>
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* Conditions */}
      <Card>
        <CardHeader>
          <Heading size="sm">Conditions (Optional)</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Condition Type</FormLabel>
              <Select placeholder="Select condition type">
                <option value="lead_score">Lead Score</option>
                <option value="lead_source">Lead Source</option>
                <option value="message_content">Message Content</option>
                <option value="payment_amount">Payment Amount</option>
                <option value="time_of_day">Time of Day</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>Operator</FormLabel>
              <Select placeholder="Select operator">
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="contains">Contains</option>
                <option value="not_contains">Not Contains</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>Value</FormLabel>
              <Input placeholder="Enter condition value" />
            </FormControl>
          </VStack>
        </CardBody>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <Heading size="sm">Actions</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Action Type</FormLabel>
              <Select
                placeholder="Select action type"
                onChange={(e) => setWorkflowBuilder({
                  ...workflowBuilder,
                  actions: [...workflowBuilder.actions, {
                    type: e.target.value,
                    name: e.target.options[e.target.selectedIndex].text,
                    config: {}
                  }]
                })}
              >
                <option value="send_message">Send WhatsApp Message</option>
                <option value="send_email">Send Email</option>
                <option value="create_task">Create Task</option>
                <option value="update_lead">Update Lead</option>
                <option value="send_notification">Send Notification</option>
                <option value="webhook">Call Webhook</option>
              </Select>
            </FormControl>
            
            {workflowBuilder.actions.map((action, index) => (
              <Box key={index} p={3} border="1px" borderColor="gray.200" borderRadius="md">
                <HStack justify="space-between">
                  <HStack>
                    <Icon as={getActionIcon(action.type)} color="green.500" />
                    <Text>{action.name}</Text>
                  </HStack>
                  <IconButton
                    size="sm"
                    icon={<FiTrash2 />}
                    onClick={() => setWorkflowBuilder({
                      ...workflowBuilder,
                      actions: workflowBuilder.actions.filter((_, i) => i !== index)
                    })}
                  />
                </HStack>
              </Box>
            ))}
          </VStack>
        </CardBody>
      </Card>

      <HStack justify="flex-end">
        <Button onClick={() => setWorkflowBuilder({
          name: '',
          description: '',
          triggers: [],
          actions: [],
          conditions: [],
          schedule: null
        })}>
          Reset
        </Button>
        <Button
          colorScheme="blue"
          onClick={() => createWorkflow(workflowBuilder)}
          isLoading={isLoading}
        >
          Create Workflow
        </Button>
      </HStack>
    </VStack>
  );

  const renderAnalyticsTab = () => (
    <VStack spacing={6} align="stretch">
      {/* Automation Stats */}
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Workflows</StatLabel>
              <StatNumber>{automationStats.totalWorkflows || 0}</StatNumber>
              <StatHelpText>Active automations</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Executions</StatLabel>
              <StatNumber>{automationStats.totalExecutions || 0}</StatNumber>
              <StatHelpText>This month</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Success Rate</StatLabel>
              <StatNumber>{(automationStats.successRate || 0).toFixed(1)}%</StatNumber>
              <StatHelpText>Successful executions</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Time Saved</StatLabel>
              <StatNumber>{automationStats.timeSaved || 0}h</StatNumber>
              <StatHelpText>This month</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Execution History */}
      <Card>
        <CardHeader>
          <Heading size="md">Recent Executions</Heading>
        </CardHeader>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Workflow</Th>
                <Th>Trigger</Th>
                <Th>Status</Th>
                <Th>Duration</Th>
                <Th>Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {(automationStats.executions || []).map((execution, index) => (
                <Tr key={index}>
                  <Td>{execution.workflowName}</Td>
                  <Td>{execution.trigger}</Td>
                  <Td>
                    <Badge colorScheme={execution.status === 'success' ? 'green' : 'red'}>
                      {execution.status}
                    </Badge>
                  </Td>
                  <Td>{execution.duration}ms</Td>
                  <Td>{new Date(execution.timestamp).toLocaleString()}</Td>
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
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <Heading size="lg">Automation Workflows</Heading>
              <Text color="gray.600">
                Create and manage automated processes for your CRM
              </Text>
            </VStack>
            
            <HStack spacing={3}>
              <Button
                leftIcon={<FiRefreshCw />}
                onClick={loadWorkflows}
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
            <Tab>Workflows</Tab>
            <Tab>Builder</Tab>
            <Tab>Analytics</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>{renderWorkflowsTab()}</TabPanel>
            <TabPanel>{renderBuilderTab()}</TabPanel>
            <TabPanel>{renderAnalyticsTab()}</TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Create/Edit Workflow Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} pb={6}>
              <FormControl isRequired>
                <FormLabel>Workflow Name</FormLabel>
                <Input
                  placeholder="Enter workflow name"
                  value={workflowBuilder.name}
                  onChange={(e) => setWorkflowBuilder({
                    ...workflowBuilder,
                    name: e.target.value
                  })}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Enter workflow description"
                  value={workflowBuilder.description}
                  onChange={(e) => setWorkflowBuilder({
                    ...workflowBuilder,
                    description: e.target.value
                  })}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Trigger Type</FormLabel>
                <Select
                  placeholder="Select trigger type"
                  value={workflowBuilder.triggers[0]?.type || ''}
                  onChange={(e) => setWorkflowBuilder({
                    ...workflowBuilder,
                    triggers: [{
                      type: e.target.value,
                      name: e.target.options[e.target.selectedIndex].text,
                      config: {}
                    }]
                  })}
                >
                  <option value="lead_created">Lead Created</option>
                  <option value="message_received">Message Received</option>
                  <option value="payment_received">Payment Received</option>
                  <option value="time_based">Time Based</option>
                  <option value="webhook">Webhook</option>
                  <option value="manual">Manual Trigger</option>
                </Select>
              </FormControl>
              
              <HStack w="100%" justify="flex-end">
                <Button onClick={onClose}>Cancel</Button>
                <Button
                  colorScheme="blue"
                  onClick={() => {
                    if (selectedWorkflow) {
                      updateWorkflow(selectedWorkflow.id, workflowBuilder);
                    } else {
                      createWorkflow(workflowBuilder);
                    }
                  }}
                  isLoading={isLoading}
                >
                  {selectedWorkflow ? 'Update' : 'Create'} Workflow
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AutomationWorkflow; 