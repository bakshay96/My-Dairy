import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Text,
  Heading,
  useColorModeValue,
  Spinner,
  HStack,
  VStack,
  Icon,
  Badge,
} from '@chakra-ui/react';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiUsers,
  FiDroplet,
  FiActivity,
  FiCalendar,
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useSelector, useDispatch } from 'react-redux';
import { getMilkDetails } from '../../Redux/Slices/milkSlice';

const AnalyticsDashboard = () => {
  const dispatch = useDispatch();
  const { data: milkData, loading } = useSelector((state) => state.milk);
  const { farmerData } = useSelector((state) => state.farmer);
  const { token } = useSelector((state) => state.auth);

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!milkData || milkData.length === 0) {
      return {
        totalLiters: 0,
        totalAmount: 0,
        avgFat: 0,
        avgSnf: 0,
        totalEntries: 0,
        activeFarmers: 0,
        categoryWise: [],
        dailyTrends: [],
        topFarmers: [],
      };
    }

    const totalLiters = milkData.reduce((sum, item) => sum + (item.litter || 0), 0);
    const totalAmount = milkData.reduce((sum, item) => sum + (item.calculatedAmount || 0), 0);
    const avgFat = milkData.reduce((sum, item) => sum + (item.fat || 0), 0) / milkData.length;
    const avgSnf = milkData.reduce((sum, item) => sum + (item.snf || 0), 0) / milkData.length;

    // Category-wise distribution
    const categoryMap = {};
    milkData.forEach(item => {
      const category = item.category || 'cow';
      if (!categoryMap[category]) {
        categoryMap[category] = { name: category, liters: 0, amount: 0, count: 0 };
      }
      categoryMap[category].liters += item.litter || 0;
      categoryMap[category].amount += item.calculatedAmount || 0;
      categoryMap[category].count += 1;
    });

    const categoryWise = Object.values(categoryMap);

    // Daily trends (last 7 days)
    const last7Days = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      last7Days[dateStr] = { date: dateStr, liters: 0, amount: 0 };
    }

    milkData.forEach(item => {
      if (item.createdAt) {
        const date = new Date(item.createdAt);
        const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        if (last7Days[dateStr]) {
          last7Days[dateStr].liters += item.litter || 0;
          last7Days[dateStr].amount += item.calculatedAmount || 0;
        }
      }
    });

    const dailyTrends = Object.values(last7Days);

    // Top farmers by amount
    const farmerMap = {};
    milkData.forEach(item => {
      const farmerId = item.farmerId?._id || item.farmerId;
      const farmerName = item.farmerId?.name || 'Unknown';
      if (!farmerMap[farmerId]) {
        farmerMap[farmerId] = { name: farmerName, liters: 0, amount: 0 };
      }
      farmerMap[farmerId].liters += item.litter || 0;
      farmerMap[farmerId].amount += item.calculatedAmount || 0;
    });

    const topFarmers = Object.values(farmerMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalLiters: totalLiters.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      avgFat: avgFat.toFixed(2),
      avgSnf: avgSnf.toFixed(2),
      totalEntries: milkData.length,
      activeFarmers: new Set(milkData.map(item => item.farmerId?._id || item.farmerId)).size,
      categoryWise,
      dailyTrends,
      topFarmers,
    };
  }, [milkData]);

  // Chart colors
  const COLORS = ['#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#805ad5'];

  useEffect(() => {
    if (token) {
      // Fetch all milk data for analytics
      dispatch(getMilkDetails({ value: '', token }));
    }
  }, [token, dispatch]);

  if (loading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" thickness="4px" color="blue.500" />
        <Text mt={4}>Loading analytics...</Text>
      </Box>
    );
  }

  return (
    <Box p={{ base: 2, md: 6 }}>
      {/* Header */}
      <Box mb={6}>
        <Heading size={{ base: "lg", md: "xl" }} mb={2}>
          Analytics Dashboard
        </Heading>
        <Text color="gray.600">
          Comprehensive insights into your milk collection operations
        </Text>
      </Box>

      {/* Stats Cards */}
      <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={4} mb={6}>
        {/* Total Liters */}
        <GridItem>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <StatLabel fontSize="sm" color="gray.600">Total Liters</StatLabel>
                  <Icon as={FiDroplet} color="blue.500" boxSize={5} />
                </HStack>
                <StatNumber fontSize={{ base: "2xl", md: "3xl" }} color="blue.600">
                  {analytics.totalLiters}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  {analytics.totalEntries} entries
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>

        {/* Total Amount */}
        <GridItem>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <StatLabel fontSize="sm" color="gray.600">Total Amount</StatLabel>
                  <Icon as={FiDollarSign} color="green.500" boxSize={5} />
                </HStack>
                <StatNumber fontSize={{ base: "2xl", md: "3xl" }} color="green.600">
                  ₹{analytics.totalAmount}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Revenue generated
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>

        {/* Average FAT */}
        <GridItem>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <StatLabel fontSize="sm" color="gray.600">Avg FAT</StatLabel>
                  <Icon as={FiActivity} color="orange.500" boxSize={5} />
                </HStack>
                <StatNumber fontSize={{ base: "2xl", md: "3xl" }} color="orange.600">
                  {analytics.avgFat}%
                </StatNumber>
                <StatHelpText>
                  Milk quality indicator
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>

        {/* Active Farmers */}
        <GridItem>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <StatLabel fontSize="sm" color="gray.600">Active Farmers</StatLabel>
                  <Icon as={FiUsers} color="purple.500" boxSize={5} />
                </HStack>
                <StatNumber fontSize={{ base: "2xl", md: "3xl" }} color="purple.600">
                  {analytics.activeFarmers}
                </StatNumber>
                <StatHelpText>
                  Contributing farmers
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Charts */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6} mb={6}>
        {/* Daily Trends Chart */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Heading size="md" mb={4}>
              <Icon as={FiCalendar} mr={2} />
              7-Day Collection Trend
            </Heading>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="liters" stroke="#3182ce" strokeWidth={2} name="Liters" />
                <Line type="monotone" dataKey="amount" stroke="#38a169" strokeWidth={2} name="Amount (₹)" />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Category Distribution */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Heading size="md" mb={4}>
              Milk Category Distribution
            </Heading>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoryWise}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="liters"
                >
                  {analytics.categoryWise.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </Grid>

      {/* Top Farmers & Category Stats */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
        {/* Top Farmers */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Heading size="md" mb={4}>
              Top Performing Farmers
            </Heading>
            <VStack spacing={3} align="stretch">
              {analytics.topFarmers.map((farmer, index) => (
                <HStack key={index} justify="space-between" p={3} bg={useColorModeValue('gray.50', 'gray.600')} rounded="lg">
                  <HStack>
                    <Badge colorScheme={index === 0 ? 'yellow' : index === 1 ? 'gray' : index === 2 ? 'orange' : 'blue'} rounded="full" px={2}>
                      #{index + 1}
                    </Badge>
                    <Text fontWeight="md">{farmer.name}</Text>
                  </HStack>
                  <Text fontWeight="bold" color="green.600">
                    ₹{farmer.amount.toFixed(2)}
                  </Text>
                </HStack>
              ))}
              {analytics.topFarmers.length === 0 && (
                <Text textAlign="center" color="gray.500" py={10}>
                  No data available
                </Text>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Category-wise Stats */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Heading size="md" mb={4}>
              Category-wise Statistics
            </Heading>
            <VStack spacing={3} align="stretch">
              {analytics.categoryWise.map((category, index) => (
                <Card key={index} p={3} bg={useColorModeValue('gray.50', 'gray.600')} rounded="lg">
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="bold" textTransform="capitalize">
                      {category.name}
                    </Text>
                    <Badge colorScheme="blue">{category.count} entries</Badge>
                  </HStack>
                  <HStack justify="space-between" fontSize="sm">
                    <Text color="gray.600">
                      <FiDroplet style={{ display: 'inline', marginRight: '4px' }} />
                      {category.liters.toFixed(2)} L
                    </Text>
                    <Text color="green.600" fontWeight="bold">
                      ₹{category.amount.toFixed(2)}
                    </Text>
                  </HStack>
                </Card>
              ))}
              {analytics.categoryWise.length === 0 && (
                <Text textAlign="center" color="gray.500" py={10}>
                  No data available
                </Text>
              )}
            </VStack>
          </CardBody>
        </Card>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;
