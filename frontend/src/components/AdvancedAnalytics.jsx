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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart3,
  FiPieChart,
  FiGrid,
  FiList,
  FiCalendar,
  FiClock,
  FiDownload,
  FiUpload,
  FiRefreshCw,
  FiSettings,
  FiEye,
  FiEyeOff,
  FiFilter,
  FiSearch,
  FiShare2,
  FiBookmark,
  FiStar,
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
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiPlus,
  FiMoreVertical,
  FiExternalLink,
  FiCopy,
  FiEdit,
  FiTrash2
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
  ResponsiveContainer,
  ComposedChart,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  FunnelChart,
  Funnel,
  FunnelItem
} from 'recharts';

const AdvancedAnalytics = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [analyticsData, setAnalyticsData] = useState({});
  const [dateRange, setDateRange] = useState('30d');
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [customReports, setCustomReports] = useState([]);
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadAnalyticsData();
    loadCustomReports();
    loadInsights();
  }, [dateRange, filters]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.get('/analytics/advanced', {
        params: { dateRange, ...filters }
      });
      
      if (response.success) {
        setAnalyticsData(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error loading analytics',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomReports = async () => {
    try {
      const response = await apiService.get('/analytics/reports');
      if (response.success) {
        setCustomReports(response.reports);
      }
    } catch (error) {
      console.error('Error loading custom reports:', error);
    }
  };

  const loadInsights = async () => {
    try {
      const response = await apiService.get('/analytics/insights');
      if (response.success) {
        setInsights(response.insights);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const generateReport = async (reportConfig) => {
    setIsLoading(true);
    try {
      const response = await apiService.post('/analytics/reports/generate', reportConfig);
      
      if (response.success) {
        toast({
          title: 'Report generated',
          description: 'Your custom report has been generated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        loadCustomReports();
      }
    } catch (error) {
      toast({
        title: 'Report generation failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async (format, data) => {
    try {
      const response = await apiService.post('/analytics/export', {
        format,
        data,
        dateRange,
        filters
      });
      
      if (response.success) {
        // Download file
        const link = document.createElement('a');
        link.href = response.downloadUrl;
        link.download = `analytics-${format}-${new Date().toISOString().split('T')[0]}.${format}`;
        link.click();
        
        toast({
          title: 'Data exported',
          description: `Analytics data exported as ${format.toUpperCase()}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getMetricColor = (metric) => {
    const colors = {
      revenue: 'green',
      leads: 'blue',
      conversions: 'purple',
      engagement: 'orange',
      retention: 'teal'
    };
    return colors[metric] || 'gray';
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <FiTrendingUp color="green" />;
    if (trend < 0) return <FiTrendingDown color="red" />;
    return <FiMinus color="gray" />;
  };

  const renderOverviewTab = () => (
    <VStack spacing={6} align="stretch">
      {/* Key Performance Indicators */}
      <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
        {Object.entries(analyticsData.kpis || {}).map(([metric, data]) => (
          <Card key={metric}>
            <CardBody>
              <Stat>
                <StatLabel textTransform="capitalize">{metric.replace(/([A-Z])/g, ' $1').trim()}</StatLabel>
                <StatNumber color={`${getMetricColor(metric)}.500`}>
                  {data.value?.toLocaleString()}
                </StatNumber>
                <StatHelpText>
                  <HStack spacing={1}>
                    {getTrendIcon(data.trend)}
                    <Text>{Math.abs(data.trend)}% from last period</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        ))}
      </Grid>

      {/* Revenue Analytics */}
      <Card>
        <CardHeader>
          <Heading size="md">Revenue Analytics</Heading>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={analyticsData.revenueData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Area type="monotone" dataKey="revenue" fill="#82ca9d" stroke="#82ca9d" />
              <Bar dataKey="leads" fill="#8884d8" />
              <Line type="monotone" dataKey="conversions" stroke="#ff7300" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Lead Performance */}
      <Grid templateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={6}>
        <Card>
          <CardHeader>
            <Heading size="md">Lead Sources</Heading>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.leadSources || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(analyticsData.leadSources || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>
            <Heading size="md">Lead Conversion Funnel</Heading>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <RechartsTooltip />
                <Funnel
                  dataKey="value"
                  data={analyticsData.conversionFunnel || []}
                  isAnimationActive
                >
                  {(analyticsData.conversionFunnel || []).map((entry, index) => (
                    <FunnelItem key={`funnel-${index}`} fill={['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d'][index % 4]} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </Grid>
    </VStack>
  );

  const renderPerformanceTab = () => (
    <VStack spacing={6} align="stretch">
      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <Heading size="md">Performance Metrics</Heading>
        </CardHeader>
        <CardBody>
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
            {Object.entries(analyticsData.performanceMetrics || {}).map(([metric, data]) => (
              <Box key={metric}>
                <Text fontSize="sm" color="gray.600" textTransform="capitalize">
                  {metric.replace(/([A-Z])/g, ' $1').trim()}
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color={`${getMetricColor(metric)}.500`}>
                  {data.value}
                </Text>
                <Progress
                  value={data.percentage}
                  colorScheme={getMetricColor(metric)}
                  size="sm"
                  mt={2}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Target: {data.target}
                </Text>
              </Box>
            ))}
          </Grid>
        </CardBody>
      </Card>

      {/* Engagement Analytics */}
      <Card>
        <CardHeader>
          <Heading size="md">Engagement Analytics</Heading>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={analyticsData.engagementData || []}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis />
              <Radar
                name="Current Period"
                dataKey="current"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Radar
                name="Previous Period"
                dataKey="previous"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.6}
              />
              <RechartsTooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </VStack>
  );

  const renderInsightsTab = () => (
    <VStack spacing={6} align="stretch">
      {/* AI Insights */}
      <Card>
        <CardHeader>
          <Heading size="md">AI-Powered Insights</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            {insights.map((insight, index) => (
              <Box
                key={index}
                p={4}
                border="1px"
                borderColor="gray.200"
                borderRadius="md"
                bg={insight.priority === 'high' ? 'red.50' : 'blue.50'}
              >
                <HStack justify="space-between" mb={2}>
                  <HStack>
                    <Icon
                      as={insight.type === 'trend' ? FiTrendingUp : FiAlertCircle}
                      color={insight.priority === 'high' ? 'red.500' : 'blue.500'}
                    />
                    <Text fontWeight="medium">{insight.title}</Text>
                  </HStack>
                  <Badge colorScheme={insight.priority === 'high' ? 'red' : 'blue'}>
                    {insight.priority}
                  </Badge>
                </HStack>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  {insight.description}
                </Text>
                {insight.recommendation && (
                  <Box bg="white" p={3} borderRadius="md">
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Recommendation:
                    </Text>
                    <Text fontSize="sm">{insight.recommendation}</Text>
                  </Box>
                )}
              </Box>
            ))}
          </VStack>
        </CardBody>
      </Card>

      {/* Predictive Analytics */}
      <Card>
        <CardHeader>
          <Heading size="md">Predictive Analytics</Heading>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={analyticsData.predictiveData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ fill: '#8884d8' }}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#82ca9d"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#82ca9d' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </VStack>
  );

  const renderReportsTab = () => (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <Heading size="md">Custom Reports</Heading>
        <Button leftIcon={<FiPlus />} onClick={onOpen}>
          Create Report
        </Button>
      </HStack>

      <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
        {customReports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="sm">{report.name}</Heading>
                <Badge colorScheme={report.status === 'active' ? 'green' : 'gray'}>
                  {report.status}
                </Badge>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <Text fontSize="sm" color="gray.600">
                  {report.description}
                </Text>
                
                <HStack justify="space-between" fontSize="sm">
                  <Text>Last Generated:</Text>
                  <Text>{new Date(report.lastGenerated).toLocaleDateString()}</Text>
                </HStack>
                
                <HStack justify="space-between" fontSize="sm">
                  <Text>Schedule:</Text>
                  <Text>{report.schedule}</Text>
                </HStack>
                
                <Divider />
                
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    leftIcon={<FiEye />}
                    onClick={() => setSelectedReport(report)}
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    leftIcon={<FiDownload />}
                    onClick={() => exportData('pdf', report.data)}
                  >
                    Export
                  </Button>
                  <IconButton
                    size="sm"
                    icon={<FiEdit />}
                    onClick={() => {/* Edit report */}}
                  />
                  <IconButton
                    size="sm"
                    icon={<FiTrash2 />}
                    colorScheme="red"
                    onClick={() => {/* Delete report */}}
                  />
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </Grid>
    </VStack>
  );

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <Heading size="lg">Advanced Analytics</Heading>
              <Text color="gray.600">
                Comprehensive business intelligence and performance insights
              </Text>
            </VStack>
            
            <HStack spacing={3}>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                size="sm"
                w="150px"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </Select>
              
              <Button
                leftIcon={<FiDownload />}
                onClick={() => exportData('csv', analyticsData)}
                size="sm"
              >
                Export
              </Button>
              
              <Button
                leftIcon={<FiRefreshCw />}
                onClick={loadAnalyticsData}
                isLoading={isLoading}
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
            <Tab>Performance</Tab>
            <Tab>Insights</Tab>
            <Tab>Reports</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>{renderOverviewTab()}</TabPanel>
            <TabPanel>{renderPerformanceTab()}</TabPanel>
            <TabPanel>{renderInsightsTab()}</TabPanel>
            <TabPanel>{renderReportsTab()}</TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Create Report Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Custom Report</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} pb={6}>
              <FormControl isRequired>
                <FormLabel>Report Name</FormLabel>
                <Input placeholder="Enter report name" />
              </FormControl>
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea placeholder="Enter report description" />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Metrics</FormLabel>
                <Select placeholder="Select metrics" multiple>
                  <option value="revenue">Revenue</option>
                  <option value="leads">Leads</option>
                  <option value="conversions">Conversions</option>
                  <option value="engagement">Engagement</option>
                  <option value="retention">Retention</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Schedule</FormLabel>
                <Select placeholder="Select schedule">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </Select>
              </FormControl>
              
              <HStack w="100%" justify="flex-end">
                <Button onClick={onClose}>Cancel</Button>
                <Button
                  colorScheme="blue"
                  onClick={() => {
                    generateReport({});
                    onClose();
                  }}
                >
                  Create Report
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdvancedAnalytics; 