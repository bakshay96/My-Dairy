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
} from "@chakra-ui/react";
import { useState } from "react";
import { GiCow, GiFarmer } from "react-icons/gi";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";

export default function UserRegistration() {
    const [value, setValue] =useState('1')
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Flex
      minH={"100vh"}
      align={"center"}
      justify={"center"}
      bg={useColorModeValue("gray.50", "gray.800")}
    >
      <Stack spacing={8} mx={"auto"} maxW={"lg"} py={12} px={6}>
        <Stack align={"center"}>
          <Heading fontSize={"medium"} textAlign={"center"} mt={"1.5rem"}>
           Farmer Registration
           <Box display={"flex"} justifyContent={"center"}><GiCow /></Box>
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
          <Stack spacing={4}>
            <HStack>
              {/* first name */}
              <Box>
                <FormControl id="firstName" isRequired>
                  <FormLabel>First Name</FormLabel>
                  <Input placeholder="first-name" type="text" />
                </FormControl>
              </Box>
              {/* last name */}
              <Box>
                <FormControl id="lastName">
                  <FormLabel>Last Name</FormLabel>
                  <Input placeholder="last-name" type="text" />
                </FormControl>
              </Box>
            </HStack>

            {/* Gender */}
            <FormControl>
                <FormLabel>Gender</FormLabel>
              <RadioGroup onChange={setValue} value={value}>
                <Stack direction="row">
                  <Radio value="1">Male</Radio>
                  <Radio value="2">Female</Radio>
                  <Radio value="3">Other</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            {/* email */}
            <FormControl id="email">
              <FormLabel>Email address</FormLabel>
              <Input placeholder="user-email@example.com" type="email" />
            </FormControl>
             {/* mobile  */}
            <FormControl id="mobile" isRequired>
              <FormLabel>Mobile number</FormLabel>
              <InputGroup>
                <InputLeftAddon>+91</InputLeftAddon>
                <Input type="tel" placeholder="phone number" />
              </InputGroup>
            </FormControl>
            {/* village  */}
            <FormControl id="Village" isRequired>
              <FormLabel>Village Name</FormLabel>
              <Input placeholder="user-village name" type="text" />
            </FormControl>
            
            <Stack spacing={10} pt={2}>
              <Button
               
                size="lg"
                bg={"blue.400"}
                color={"white"}
                loadingText="Submitting"
                isLoading={"false"}
                _hover={{
                    bg: "blue.600",
                    
                }}
              >
                Add Milk Provider
              </Button>
            </Stack>
            
          </Stack>
        </Box>
      </Stack>
    </Flex>
  );
}
