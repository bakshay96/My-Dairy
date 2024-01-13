import { useEffect, useState } from "react";
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
  useToast,
} from "@chakra-ui/react";

import { GiCow, GiFarmer } from "react-icons/gi";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  addFarmer,
  addUserFailureAction,
  addUserSuccessAction,
  getFarmersDetails,
} from "../../Redux/userReducer/action";

export default function UserRegistration({ onClose }) {
  const toast = useToast();
  const [value, setValue] = useState("Male");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "Male", //default
    village: "",
    mobile: "",
    email: "",
  });
  const {token,isAuth}=useSelector((store)=>store.authReducer);
  const { isLoading, isError, usersData, response ,isUserAdded} = useSelector(
    (store) => store.farmerReducer
  );
  console.log("farmer reducer",usersData,isUserAdded ,response);
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.mobile ||
      !formData.village
    ) {
      toast({
        position: "top",
        title: `401 Field Error..!`,
        description: "Please fill all required fields.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    } else if (
      formData.firstName &&
      formData.lastName &&
      formData.mobile &&
      formData.village
    ) {
      let name = formData.firstName + " " + formData.lastName;
      delete formData.firstName;
      delete formData.lastName;

      let farmerData = { ...formData, name };
      console.log("Farmer", farmerData);
      dispatch(addFarmer({value:farmerData,token}))
        .then((res) => {
          console.log("action", res);
          dispatch(addUserSuccessAction(true));
        }).then(()=>{
          
          dispatch(getFarmersDetails({token}));
        })
        .catch((res) => {
          console.log("action catch", res);
          dispatch(addUserFailureAction(res.data.msg));
        });

      // If validation passes, proceed with form submission
      //console.log("Form data",formData)
    }
  };
  useEffect(() => {
    if (isUserAdded) {
      toast({
        position: "top-right",
        title: "Account created.",
        description: "We've created your account for you.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
      setFormData({
        firstName: "",
        lastName: "",
        gender: "Male", //default
        village: "",
        mobile: "",
        email: "",
      });
      navigate("/dashboard");
    }
    dispatch(addUserSuccessAction(false));
    
  }, [usersData]);
  return (
    <Flex
      minH={"100vh"}
      align={"center"}
      justify={"center"}
      bg={useColorModeValue("gray.50", "gray.800")}
    >
      <Stack spacing={8} mx={"auto"} maxW={"lg"} py={12} px={6}>
        <Stack align={"center"}>
          <Heading fontSize={"4xl"} textAlign={"center"}>
            Add Farmer
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
                  <FormControl id="lastName" isRequired>
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
              <FormControl id="email" isRequired>
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
              <FormControl id="mobile" isRequired>
                <FormLabel>Mobile number</FormLabel>
                <InputGroup>
                  <InputLeftAddon>+91</InputLeftAddon>
                  <Input
                    type="tel"
                    placeholder="phone number"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                  />
                </InputGroup>
              </FormControl>
              {/* village  */}
              <FormControl id="Village" isRequired>
                <FormLabel>Village Name</FormLabel>
                <Input
                  placeholder="user-village name"
                  type="text"
                  name="village"
                  value={formData.village}
                  onChange={handleInputChange}
                />
              </FormControl>
              <Stack spacing={10} pt={2}>
                {isLoading ? (
                  <Button
                    size="lg"
                    bg={"blue.400"}
                    color={"white"}
                    isLoading
                    loadingText="Submitting"
                    type="submit"
                    onClick={handleSubmit}
                    onPress={onClose}
                    _hover={{
                      bg: "blue.500",
                    }}
                  >
                    Add Milk Provider
                  </Button>
                ) : (
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
                )}
              </Stack>
            </Stack>
          </form>
        </Box>
      </Stack>
    </Flex>
  );
}
