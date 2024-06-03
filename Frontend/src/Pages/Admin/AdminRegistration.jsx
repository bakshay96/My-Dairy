import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
	InputLeftAddon,
	RadioGroup,
	Radio,
	FormHelperText,
	FormErrorMessage,
  position,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { GiCow, GiFarmer } from "react-icons/gi";
import { useToast } from "@chakra-ui/react";
import UpperNavbar from "../../Components/UpperNavbar";
import { resetRequestAction, signup } from "../../Redux/AuthReducer/action";
import { Link } from "react-router-dom";
import { Loader } from "../../Components/Loader";

export default function AdminRegistration() {
	const toast = useToast();
	const [value, setValue] = useState("Male");
	const [showPassword, setShowPassword] = useState(false);
	const [formErrors, setFormErrors] = useState({});
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
		confirmPassword: "",
	});
	const { isLoading, isError, isRegistered, status} = useSelector(
		(store) => store.authReducer
	);
  //console.log(isLoading,isError,isRegistered,)
  //console.log("Form error",formErrors)

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
   // console.log("form data",formData)
		e.preventDefault();
		if (
			! formData.firstName ||
			! formData.lastName ||
			! formData.email ||
			! formData.village ||
			! formData.shopName ||
			! formData.mobile ||
      ! formData.password ||
      ! formData.confirmPassword
		) {
			toast({
				position: "top-right",
				title: `Form Error...!`,
				description: "Please fill all required information.",
				status: "error",
				duration: 3000,
				isClosable: true,
			});
     // console.log("form data",formData)
      return;
		}
    else
    {

        if (formData.password !== formData.confirmPassword) {
          //console.log("pass",formData.password, formData.confirmPassword)
          toast({
            position: "top-right",
            title: `Password doesn't match`,
            description: "password and confirm password should be same.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }  
    }
    try{
			let name = formData.firstName + " " + formData.lastName;
			delete formData.firstName;
			delete formData.lastName;
			delete formData.confirmPassword;

			let adminData = { ...formData, name };
			 //console.log("Admin", adminData);
			dispatch(signup(adminData)).then((res) => {
				//console.log("admin reg response", res);
			});



			// If validation passes, proceed with form submission
			//console.log("Form data",formData)
      //clear form formData
      setFormData({firstName: "",
		lastName: "",
		gender: "Male", //default
		village: "",
		shopName: "",
		mobile: "",
		email: "",
		password: "",
		confirmPassword: "",})
		}
    catch(error)
    {
      alert("err",err);
      toast({
            position: "top-right",
            title: `Error`,
            description: `${error}`,
            status: "error",
            duration: 3000,
            isClosable: true,
          });
    }
	};

	useEffect(() => {
		// console.log("axios")
		if (isRegistered) {
			toast({
				title: "Account created.",
				description: "We've created your account for you.",
				status: "success",
				duration: 5000,
				isClosable: true,
        position:"top-right",
			});
     		 dispatch(resetRequestAction(!isRegistered))
			navigate("/admin/signin");

		} else if (isError) {
			toast({
				title: `${status.code}`,
				description: `${status.message}`,
				status: "failure",
				duration: 5000,
				isClosable: true,
        		position:"top-right"
			});
			dispatch(resetRequestAction(false))
			navigate("/");
		}
	}, [isRegistered,isError]);

	return (
		<>
			<UpperNavbar />
			{isLoading ? (
				<Loader />
			) : (
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

									{/* shopName */}
									<FormControl id="shopname" isRequired>
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
									<FormControl id="password" isRequired>
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
									<FormControl id="cnf-password" isRequired>
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
											SignUp
										</Button>
									</Stack>
									<Stack pt={6}>
										<Text align={"center"}>
											Already a user?{" "}
											<Link to={"/admin/signin"} color={"blue.400"}>
												<span style={{ color: "blue" }}>Sign in</span>
											</Link>
										</Text>
									</Stack>
								</Stack>
							</form>
						</Box>
					</Stack>
				</Flex>
			)}
		</>
	);
}
