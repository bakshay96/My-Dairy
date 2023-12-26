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
  Select,
  GridItem,
} from "@chakra-ui/react";
import { useState } from "react";
import { GiBuffaloHead, GiCow, GiFarmer, GiGoat } from "react-icons/gi";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";

export default function AddMilk() {
  const [value, setValue] = useState("1");
  const [showPassword, setShowPassword] = useState(false);
  const [showCnfPassword, setShowCnfPassword] = useState(false);

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
            Add Milk
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
          <Stack spacing={4}>
            {/* select farmer */}
            <FormControl  colSpan={[6, 3]}>
              <FormLabel
                htmlFor="country"
                fontSize="sm"
                fontWeight="md"
                color="gray.700"
                _dark={{
                  color: "gray.50",
                }}
              >
               Select Farmer
              </FormLabel>
              <Select
                id="farmer"
                name="farmer"
                autoComplete="Farmer"
                placeholder="Select Farmer"
                focusBorderColor="brand.400"
                shadow="sm"
                size="sm"
                w="full"
                rounded="md"
              >
                <option>Akshay Bombatkar</option>
                <option>Pavan Bombatkar</option>
                <option>Nilesh Bombatkar</option>
              </Select>
            </FormControl>
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

            {/* Milk Category */}
            <FormControl>
              <FormLabel>Milk Category</FormLabel>
              <RadioGroup onChange={setValue} value={value}>
                <Stack direction="row" spacing={"2rem"}>
                  <Radio value="1"><GiCow />Cow</Radio>
                  <Radio value="2"><GiBuffaloHead />Buffelo</Radio>
                  <Radio value="3"><GiGoat />Goat</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>

            {/* liter */}
            <FormControl id="liter" isRequired>
              <FormLabel>Liter</FormLabel>
              <Input placeholder="MILK Liter" type="number" />
            </FormControl>

            {/* FAT */}
            <FormControl id="fat" isRequired>
              <FormLabel>FAT</FormLabel>
              <Input placeholder="MILK FAT" type="number" />
            </FormControl>

            {/* WATER */}
            <FormControl id="water" isRequired>
              <FormLabel>WATER</FormLabel>
              <Input placeholder="MILK WATER" type="number" />
            </FormControl>

            {/* SNF */}
            <FormControl id="snf" >
              <FormLabel>SNF</FormLabel>
              <Input placeholder="MILK SNF" type="number" />
            </FormControl>

            {/* Degree  */}
            <FormControl id="degree">
              <FormLabel>Degree</FormLabel>
              <Input placeholder="Degree" type="number" />
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
                Submit  Milk
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Flex>
  );
}
