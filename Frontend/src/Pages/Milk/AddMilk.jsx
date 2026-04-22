import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  HStack,
  VStack,
  Stack,
  Button,
  Heading,
  Text,
  useColorModeValue,
  Select,
  Grid,
  GridItem,
  useToast,
  Card,
  CardBody,
  Badge,
  InputRightElement,
  Icon,
  useBreakpointValue,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
} from "@chakra-ui/react";
import {
  GiBuffaloHead,
  GiCow,
  GiGoat,
} from "react-icons/gi";
import {
  FiCheck,
  FiAlertCircle,
  FiDollarSign,
  FiDroplet,
  FiActivity,
  FiThermometer,
  FiUser,
  FiSearch,
} from "react-icons/fi";
import { addMilk } from "../../Redux/Slices/milkSlice";
import { getFarmersDetails } from "../../Redux/Slices/farmerSlice";

export default function AddMilk() {
  const toast = useToast();
  const dispatch = useDispatch();
  
  // State management
  const [selectedCategory, setSelectedCategory] = useState("cow");
  const [farmerSearch, setFarmerSearch] = useState("");
  const [showFarmerDropdown, setShowFarmerDropdown] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  const [formMilkData, setformMilkData] = useState({
    farmerId: "",
    category: "cow",
    fat: "",
    snf: "",
    water: "",
    litter: "",
    degree: ""
  });

  // Redux state
  const { farmerData } = useSelector((state) => state.farmer);
  const { token, user } = useSelector((state) => state.auth);
  const { data, loading, error } = useSelector((state) => state.milk);

  // Responsive design
  const isMobile = useBreakpointValue({ base: true, md: false });
  const cardBg = useColorModeValue("white", "gray.700");
  const pageBg = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hoverBg = useColorModeValue("blue.50", "blue.900");
  const selectedBg = useColorModeValue("blue.100", "blue.800");

  // Fetch rate settings for calculation
  const [rateSettings, setRateSettings] = useState(null);

  // Filtered farmers based on search
  const filteredFarmers = useMemo(() => {
    if (!farmerData || !Array.isArray(farmerData)) return [];
    if (!farmerSearch) return farmerData;
    return farmerData.filter(farmer =>
      farmer.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
      farmer.mobile?.toString().includes(farmerSearch)
    );
  }, [farmerData, farmerSearch]);

  // Selected farmer details
  const selectedFarmer = useMemo(() => {
    return farmerData?.find(f => f._id === formMilkData.farmerId);
  }, [farmerData, formMilkData.farmerId]);

  // Auto-calculate estimated amount
  const estimatedAmount = useMemo(() => {
    const fat = parseFloat(formMilkData.fat) || 0;
    const litter = parseFloat(formMilkData.litter) || 0;
    
    // Simple calculation: fat * rate * litter
    // In production, this should fetch from rate settings API
    const ratePerFat = 30; // Default rate, should be fetched from backend
    const rate = fat * ratePerFat;
    const amount = rate * litter;
    
    return {
      rate: rate.toFixed(2),
      amount: amount.toFixed(2),
    };
  }, [formMilkData.fat, formMilkData.litter]);

  // Validation
  const validateForm = () => {
    const errors = {};
    
    if (!formMilkData.farmerId) {
      errors.farmerId = "Please select a farmer";
    }
    if (!formMilkData.litter || parseFloat(formMilkData.litter) <= 0) {
      errors.litter = "Valid liter quantity is required";
    }
    if (!formMilkData.fat || parseFloat(formMilkData.fat) <= 0) {
      errors.fat = "Valid FAT value is required";
    }
    if (formMilkData.snf && parseFloat(formMilkData.snf) <= 0) {
      errors.snf = "SNF must be greater than 0";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
    
    setformMilkData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle farmer selection
  const handleFarmerSelect = (farmer) => {
    setformMilkData((prev) => ({
      ...prev,
      farmerId: farmer._id,
    }));
    setFarmerSearch(farmer.name);
    setShowFarmerDropdown(false);
    setFormErrors(prev => ({ ...prev, farmerId: null }));
  };

  // Handle category selection
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setformMilkData((prev) => ({
      ...prev,
      category,
    }));
  };

  // Form submission
  const handleMilkSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: "top"
      });
      return;
    }
    
    try {
      await dispatch(addMilk({ value: formMilkData, token })).unwrap();
      
      toast({
        title: 'Success',
        description: 'Milk data added successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: "top"
      });
      
      // Reset form
      setformMilkData({
        farmerId: "",
        category: "cow",
        fat: "",
        snf: "",
        water: "",
        litter: "",
        degree: "",
      });
      setFarmerSearch("");
      setSelectedCategory("cow");
      setFormErrors({});
      
    } catch (error) {
      console.error("Error adding milk:", error);
      const errorMessage = error?.message || error || 'Failed to add milk data';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: "top"
      });
    }
  };

  // Load farmers on mount
  useEffect(() => {
    if (token) {
      dispatch(getFarmersDetails(token));
    }
  }, [token, dispatch]);

  // Milk category options
  const categories = [
    { id: "cow", name: "Cow", icon: GiCow, color: "orange" },
    { id: "buffalo", name: "Buffalo", icon: GiBuffaloHead, color: "gray" },
    { id: "goat", name: "Goat", icon: GiGoat, color: "brown" },
  ];

  return (
    <Flex
      minH={"100vh"}
      bg={pageBg}
      py={{ base: 4, md: 8 }}
      px={{ base: 3, md: 6 }}
      flexDirection="column"
    >
      {/* Header */}
      <Box mb={{ base: 4, md: 6 }}>
        <Heading 
          fontSize={{ base: "2xl", md: "4xl" }} 
          textAlign="center"
          bgGradient="linear(to-r, blue.500, teal.400)"
          bgClip="text"
        >
          Add Milk Collection
        </Heading>
        <Text 
          fontSize={{ base: "sm", md: "lg" }} 
          color="gray.600" 
          textAlign="center"
          mt={2}
        >
          Record milk collection details quickly and easily
        </Text>
      </Box>

      {/* Main Form Card */}
      <Box
        maxW={{ base: "100%", md: "800px" }}
        w="full"
        mx="auto"
        rounded={{ base: "xl", md: "2xl" }}
        bg={cardBg}
        boxShadow={{ base: "md", md: "xl" }}
        p={{ base: 4, md: 8 }}
      >
        <form onSubmit={handleMilkSubmit}>
          <Stack spacing={{ base: 4, md: 6 }}>
            
            {/* Farmer Selection */}
            <Box>
              <FormLabel fontSize="sm" fontWeight="md" color="gray.700">
                <Icon as={FiUser} mr={2} />
                Select Farmer *
              </FormLabel>
              <Box position="relative">
                <InputGroup>
                  <Input
                    placeholder="Search farmer by name or mobile..."
                    value={farmerSearch}
                    onChange={(e) => {
                      setFarmerSearch(e.target.value);
                      setShowFarmerDropdown(true);
                      if (formMilkData.farmerId) {
                        setformMilkData(prev => ({ ...prev, farmerId: "" }));
                      }
                    }}
                    onFocus={() => setShowFarmerDropdown(true)}
                    size={{ base: "md", md: "lg" }}
                    rounded="lg"
                    borderColor={formErrors.farmerId ? "red.300" : borderColor}
                    focusBorderColor={formErrors.farmerId ? "red.400" : "blue.400"}
                  />
                  <InputRightElement>
                    <Icon as={FiSearch} color="gray.400" />
                  </InputRightElement>
                </InputGroup>
                
                {/* Farmer Dropdown */}
                {showFarmerDropdown && filteredFarmers.length > 0 && (
                  <Box
                    position="absolute"
                    top="100%"
                    left={0}
                    right={0}
                    mt={2}
                    bg={cardBg}
                    border="1px solid"
                    borderColor={borderColor}
                    rounded="lg"
                    boxShadow="xl"
                    maxH="250px"
                    overflowY="auto"
                    zIndex={10}
                  >
                    {filteredFarmers.slice(0, 10).map((farmer) => (
                      <Box
                        key={farmer._id}
                        p={3}
                        cursor="pointer"
                        _hover={{ bg: hoverBg }}
                        bg={formMilkData.farmerId === farmer._id ? selectedBg : "transparent"}
                        onClick={() => handleFarmerSelect(farmer)}
                        borderBottom="1px"
                        borderColor={borderColor}
                      >
                        <Text fontWeight="md">{farmer.name}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {farmer.mobile}
                        </Text>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
              {formErrors.farmerId && (
                <Text fontSize="xs" color="red.500" mt={1}>
                  {formErrors.farmerId}
                </Text>
              )}
              {selectedFarmer && (
                <Alert status="success" mt={2} rounded="md" size="sm">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">
                    Selected: {selectedFarmer.name} ({selectedFarmer.mobile})
                  </AlertDescription>
                </Alert>
              )}
            </Box>

            {/* Milk Category Selection */}
            <Box>
              <FormLabel fontSize="sm" fontWeight="md" color="gray.700">
                Milk Category *
              </FormLabel>
              <Grid templateColumns={{ base: "repeat(3, 1fr)", md: "repeat(3, 1fr)" }} gap={3}>
                {categories.map((cat) => {
                  const IconComponent = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <GridItem key={cat.id}>
                      <Card
                        cursor="pointer"
                        onClick={() => handleCategoryChange(cat.id)}
                        bg={isSelected ? `${cat.color}.100` : cardBg}
                        borderColor={isSelected ? `${cat.color}.500` : borderColor}
                        borderWidth={isSelected ? "2px" : "1px"}
                        _hover={{ transform: "translateY(-2px)", shadow: "md" }}
                        transition="all 0.2s"
                        rounded="xl"
                      >
                        <CardBody p={{ base: 3, md: 4 }} textAlign="center">
                          <IconComponent 
                            size={isMobile ? "30px" : "40px"} 
                            color={isSelected ? `${cat.color}.600` : "gray.500"}
                          />
                          <Text 
                            mt={2} 
                            fontWeight={isSelected ? "bold" : "normal"}
                            fontSize={{ base: "sm", md: "md" }}
                          >
                            {cat.name}
                          </Text>
                        </CardBody>
                      </Card>
                    </GridItem>
                  );
                })}
              </Grid>
            </Box>

            <Divider />

            {/* Milk Details Grid */}
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
              
              {/* Liter */}
              <FormControl isInvalid={formErrors.litter}>
                <FormLabel fontSize="sm" fontWeight="md">
                  <Icon as={FiDroplet} mr={2} color="blue.500" />
                  Quantity (Liters) *
                </FormLabel>
                <Input
                  type="number"
                  name="litter"
                  value={formMilkData.litter}
                  onChange={handleChange}
                  placeholder="0.00"
                  size={{ base: "md", md: "lg" }}
                  rounded="lg"
                  step="0.1"
                  min="0"
                  focusBorderColor="blue.400"
                />
                {formErrors.litter && (
                  <Text fontSize="xs" color="red.500" mt={1}>
                    {formErrors.litter}
                  </Text>
                )}
              </FormControl>

              {/* FAT */}
              <FormControl isInvalid={formErrors.fat}>
                <FormLabel fontSize="sm" fontWeight="md">
                  <Icon as={FiActivity} mr={2} color="green.500" />
                  FAT % *
                </FormLabel>
                <Input
                  type="number"
                  name="fat"
                  value={formMilkData.fat}
                  onChange={handleChange}
                  placeholder="0.0"
                  size={{ base: "md", md: "lg" }}
                  rounded="lg"
                  step="0.1"
                  min="0"
                  max="100"
                  focusBorderColor="blue.400"
                />
                {formErrors.fat && (
                  <Text fontSize="xs" color="red.500" mt={1}>
                    {formErrors.fat}
                  </Text>
                )}
              </FormControl>

              {/* SNF */}
              <FormControl isInvalid={formErrors.snf}>
                <FormLabel fontSize="sm" fontWeight="md">
                  SNF %
                </FormLabel>
                <Input
                  type="number"
                  name="snf"
                  value={formMilkData.snf}
                  onChange={handleChange}
                  placeholder="0.0"
                  size={{ base: "md", md: "lg" }}
                  rounded="lg"
                  step="0.1"
                  min="0"
                  focusBorderColor="blue.400"
                />
                {formErrors.snf && (
                  <Text fontSize="xs" color="red.500" mt={1}>
                    {formErrors.snf}
                  </Text>
                )}
              </FormControl>

              {/* Water */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="md">
                  Water %
                </FormLabel>
                <Input
                  type="number"
                  name="water"
                  value={formMilkData.water}
                  onChange={handleChange}
                  placeholder="0.0"
                  size={{ base: "md", md: "lg" }}
                  rounded="lg"
                  step="0.1"
                  min="0"
                  focusBorderColor="blue.400"
                />
              </FormControl>

              {/* Degree */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="md">
                  <Icon as={FiThermometer} mr={2} color="orange.500" />
                  Degree
                </FormLabel>
                <Input
                  type="number"
                  name="degree"
                  value={formMilkData.degree}
                  onChange={handleChange}
                  placeholder="0.0"
                  size={{ base: "md", md: "lg" }}
                  rounded="lg"
                  step="0.1"
                  focusBorderColor="blue.400"
                />
              </FormControl>
            </Grid>

            <Divider />

            {/* Estimated Amount Card */}
            {(formMilkData.fat || formMilkData.litter) && (
              <Card bg={useColorModeValue("blue.50", "blue.900")} rounded="xl">
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">Rate per Liter:</Text>
                      <Badge colorScheme="blue" fontSize="md" px={3} py={1} rounded="full">
                        ₹{estimatedAmount.rate}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="lg" fontWeight="bold" color="gray.700">
                        Estimated Amount:
                      </Text>
                      <Badge colorScheme="green" fontSize="xl" px={4} py={2} rounded="full">
                        ₹{estimatedAmount.amount}
                      </Badge>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Submit Button */}
            <Stack spacing={4} pt={2}>
              <Button
                type="submit"
                size={{ base: "lg", md: "lg" }}
                bgGradient="linear(to-r, blue.500, teal.400)"
                color="white"
                loadingText="Submitting..."
                isLoading={loading}
                rounded="xl"
                fontSize={{ base: "md", md: "lg" }}
                py={{ base: 6, md: 7 }}
                _hover={{
                  transform: "translateY(-2px)",
                  shadow: "xl",
                }}
                _active={{
                  transform: "translateY(0)",
                }}
                leftIcon={<FiCheck />}
                isFullWidth={isMobile}
              >
                Submit Milk Collection
              </Button>
            </Stack>

          </Stack>
        </form>
      </Box>

      {/* Info Footer */}
      <Box mt={6} textAlign="center">
        <Text fontSize="xs" color="gray.500">
          All fields marked with * are required
        </Text>
        <Text fontSize="xs" color="gray.500" mt={1}>
          Amount is calculated based on current rate settings
        </Text>
      </Box>
    </Flex>
  );
}
