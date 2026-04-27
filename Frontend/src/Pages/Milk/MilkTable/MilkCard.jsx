import React from 'react';
import {
  Box,
  Card,
  CardBody,
  Stack,
  Text,
  Badge,
  HStack,
  VStack,
  IconButton,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';
import {
  FiCalendar,
  FiClock,
  FiDroplet,
  FiActivity,
  FiDollarSign,
  FiMoreVertical,
  FiTrash2,
  FiEye,
  FiEdit2,
} from 'react-icons/fi';

const MilkCard = ({ 
  milkEntry, 
  onView, 
  onEdit, 
  onDelete,
  farmerName 
}) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const getCategoryColor = (category) => {
    switch(category) {
      case 'cow': return 'orange';
      case 'buffalo': return 'gray';
      case 'goat': return 'purple';
      default: return 'blue';
    }
  };

  const getShiftBadge = (shift) => {
    if (shift === 'morning') {
      return { color: 'orange', text: '🌅 Morning' };
    }
    return { color: 'purple', text: '🌆 Evening' };
  };

  const shiftInfo = getShiftBadge(milkEntry.shift);

  return (
    <Card
      bg={cardBg}
      borderColor={borderColor}
      borderWidth="1px"
      rounded="xl"
      shadow="sm"
      _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
      transition="all 0.2s"
    >
      <CardBody p={4}>
        <Stack spacing={3}>
          {/* Header with Category and Actions */}
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing={2}>
              <Badge 
                colorScheme={getCategoryColor(milkEntry.category)} 
                fontSize="sm" 
                px={2} 
                py={1} 
                rounded="full"
                textTransform="capitalize"
              >
                {milkEntry.category}
              </Badge>
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                {farmerName || 'Unknown Farmer'}
              </Text>
            </VStack>
            
            {/* Action Buttons */}
            <HStack spacing={1}>
              <IconButton
                icon={<FiEye />}
                size="sm"
                variant="ghost"
                aria-label="View details"
                onClick={() => onView(milkEntry)}
              />
              <IconButton
                icon={<FiEdit2 />}
                size="sm"
                variant="ghost"
                aria-label="Edit entry"
                onClick={() => onEdit(milkEntry)}
              />
              <IconButton
                icon={<FiTrash2 />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                aria-label="Delete entry"
                onClick={() => onDelete(milkEntry)}
              />
            </HStack>
          </HStack>

          <Divider />

          {/* Date and Shift */}
          <HStack justify="space-between">
            <HStack spacing={2}>
              <FiCalendar color="gray" />
              <Text fontSize="sm" color="gray.600">
                {milkEntry.date}
              </Text>
            </HStack>
            <Badge colorScheme={shiftInfo.color} fontSize="xs">
              {shiftInfo.text}
            </Badge>
          </HStack>

          {/* Milk Details Grid */}
          <Box
            display="grid"
            gridTemplateColumns="repeat(2, 1fr)"
            gap={3}
            mt={2}
          >
            {/* Liters */}
            <Box p={3} bg={useColorModeValue('blue.50', 'blue.900')} rounded="lg">
              <HStack spacing={2}>
                <FiDroplet color="#3182ce" />
                <VStack align="start" spacing={0}>
                  <Text fontSize="xs" color="gray.600">Quantity</Text>
                  <Text fontSize="lg" fontWeight="bold" color="blue.600">
                    {milkEntry.litter || 0} L
                  </Text>
                </VStack>
              </HStack>
            </Box>

            {/* FAT */}
            <Box p={3} bg={useColorModeValue('green.50', 'green.900')} rounded="lg">
              <HStack spacing={2}>
                <FiActivity color="#38a169" />
                <VStack align="start" spacing={0}>
                  <Text fontSize="xs" color="gray.600">FAT</Text>
                  <Text fontSize="lg" fontWeight="bold" color="green.600">
                    {milkEntry.fat || 0}%
                  </Text>
                </VStack>
              </HStack>
            </Box>

            {/* SNF */}
            <Box p={3} bg={useColorModeValue('purple.50', 'purple.900')} rounded="lg">
              <VStack align="start" spacing={0}>
                <Text fontSize="xs" color="gray.600">SNF</Text>
                <Text fontSize="lg" fontWeight="bold" color="purple.600">
                  {milkEntry.snf || 0}%
                </Text>
              </VStack>
            </Box>

            {/* Rate */}
            <Box p={3} bg={useColorModeValue('orange.50', 'orange.900')} rounded="lg">
              <VStack align="start" spacing={0}>
                <Text fontSize="xs" color="gray.600">Rate/L</Text>
                <Text fontSize="lg" fontWeight="bold" color="orange.600">
                  ₹{milkEntry.rate || 0}
                </Text>
              </VStack>
            </Box>
          </Box>

          {/* Total Amount */}
          <Box
            p={4}
            bg={useColorModeValue('green.50', 'green.900')}
            rounded="xl"
            mt={2}
          >
            <HStack justify="space-between">
              <HStack spacing={2}>
                <FiDollarSign color="#38a169" />
                <Text fontSize="md" fontWeight="semibold" color="gray.700">
                  Total Amount
                </Text>
              </HStack>
              <Text fontSize="2xl" fontWeight="bold" color="green.600">
                ₹{milkEntry.calculatedAmount || 0}
              </Text>
            </HStack>
          </Box>
        </Stack>
      </CardBody>
    </Card>
  );
};

export default MilkCard;
