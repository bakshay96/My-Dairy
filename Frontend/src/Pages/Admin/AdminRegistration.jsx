import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  HStack,
  InputRightElement,
  Stack,
  Button,
  Heading,
  Text,
  useColorModeValue,
  Link,
  InputLeftAddon,
  RadioGroup,
  Radio,
  FormHelperText,
  FormErrorMessage,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import { useState } from "react";
import { GiCow, GiFarmer } from "react-icons/gi";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import UpperNavbar from "../../Componets/UpperNavbar";

export default function AdminRegistration() {
  const [value, setValue] = useState("Male");
  const [showPassword, setShowPassword] = useState(false);
  const [showCnfPassword, setShowCnfPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "Male", //default
    village: "",
    shopName: "",
    mobile: "",
    email: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState({});

  // Handle input changes and update the state
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
   
    
   

    // Clear validation error when the user types in the field
    setFormErrors({
      ...formErrors,
      [name]: "",
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate form data
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // If validation passes, proceed with form submission
    console.log("Form data",formData)
   
  };

  // Validation function
  const validateForm = (data) => {
    const errors = {};

  
    // Check if password and confirm password match
    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    console.log("error", errors);

    return errors;
  };

  return (
    <>
      <UpperNavbar />
      <Flex
        minH={"100vh"}
        align={"center"}
        justify={"center"}
        bg={useColorModeValue("gray.50", "gray.800")}
      >
        <Stack spacing={8} mx={"auto"} maxW={"lg"} py={12} px={6}>
          <Stack align={"center"}>
            <Heading fontSize={"4xl"} textAlign={"center"}>
              Create Account
              <Box display={"flex"} justifyContent={"center"}>
                <GiCow />
              </Box>
            </Heading>
            <Text fontSize={"lg"} color={"gray.600"}>
              to enjoy all of our cool features ✌️
            </Text>
          </Stack>
          <Box
            rounded={"lg"}
            bg={useColorModeValue("white", "gray.700")}
            boxShadow={"lg"}
            p={8}
          >
            <form>
              <Stack spacing={4}>
                <HStack>
                  {/* first name */}
                  <Box>
                    <FormControl id="firstName" isRequired>
                      <FormLabel>First Name</FormLabel>
                      <Input
                        placeholder="first-name"
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                      />
                    </FormControl>
                  </Box>
                  {/* last name */}
                  <Box>
                    <FormControl id="lastName">
                      <FormLabel>Last Name</FormLabel>
                      <Input
                        placeholder="last-name"
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                      />
                    </FormControl>
                  </Box>
                </HStack>

                {/* Gender */}
                <FormControl>
                  <FormLabel>Gender</FormLabel>
                  <RadioGroup
                    onChange={setValue}
                    defaultValue={"Male"}
                    value={value}
                  >
                    <Stack direction="row">
                      <Radio
                        value="Male"
                        name="gender"
                        checked={formData.gender === "male"}
                        onChange={handleInputChange}
                      >
                        Male
                      </Radio>
                      <Radio
                        value="Female"
                        name="gender"
                        checked={formData.gender === "Female"}
                        onChange={handleInputChange}
                      >
                        Female
                      </Radio>
                      <Radio
                        value="Other"
                        name="gender"
                        checked={formData.gender === "Other"}
                        onChange={handleInputChange}
                      >
                        Other
                      </Radio>
                    </Stack>
                  </RadioGroup>
                </FormControl>

                {/* email */}
                <FormControl id="email">
                  <FormLabel>Email address</FormLabel>
                  <Input
                    placeholder="user-email@example.com"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </FormControl>
                {/* mobile  */}
                <FormControl id="mobile">
                  <FormLabel>Mobile number</FormLabel>
                  <InputGroup>
                    <InputLeftAddon>+91</InputLeftAddon>
                    <Input
                      type="tel"
                      placeholder="phone number"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                    />
                  </InputGroup>
                </FormControl>
                {/* village  */}
                <FormControl id="Village">
                  <FormLabel>Village Name</FormLabel>
                  <Input
                    placeholder="user-village name"
                    type="text"
                    name="village"
                    value={formData.village}
                    onChange={handleInputChange}
                  />
                </FormControl>

                {/* shopName */}
                <FormControl id="shopname">
                  <FormLabel>Shop Name</FormLabel>
                  <Input
                    placeholder="user-shop name , ex (ab milk shop Bhandari )"
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleInputChange}
                  />
                </FormControl>

                {/* password */}
                <FormControl id="password">
                  <FormLabel>Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <InputRightElement h={"full"}>
                      <Button
                        variant={"ghost"}
                        onClick={() =>
                          setShowPassword((showPassword) => !showPassword)
                        }
                      >
                        {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                {/*  confirm password */}
                <FormControl id="cnf-password">
                  <FormLabel>Confirm Password</FormLabel>
                  <InputGroup isRequired>
                    <Input
                      type={showCnfPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                    />
                    
                    <InputRightElement h={"full"}>
                      <Button
                        variant={"ghost"}
                        onClick={() =>
                          setShowCnfPassword(
                            (showCnfPassword) => !showCnfPassword
                          )
                        }
                      >
                        {showCnfPassword ? <ViewIcon /> : <ViewOffIcon />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
                <Stack spacing={10} pt={2}>
                  <Button
                    size="lg"
                    bg={"blue.400"}
                    color={"white"}
                    loadingText="Submitting"
                    type="submit"
                    onClick={handleSubmit}
                    _hover={{
                      bg: "blue.500",
                    }}
                  >
                    Add Milk Provider
                  </Button>
                </Stack>
                <Stack pt={6}>
                  <Text align={"center"}>
                    Already a user?{" "}
                    <Link to="/admin_login" color={"blue.400"}>
                      Login
                    </Link>
                  </Text>
                </Stack>
              </Stack>
            </form>
          </Box>
        </Stack>
      </Flex>
    </>
  );
}
