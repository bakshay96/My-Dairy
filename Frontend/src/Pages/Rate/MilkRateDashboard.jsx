import React, { useEffect, useState } from "react";
import {
	Box,
	Flex,
	Text,
	Button,
	Select,
	SimpleGrid,
	Heading,
	Switch,
	useToast,
	useColorModeValue,
	IconButton,
	border,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import MilkRateModal from "./MilkRateModal";
import { useDispatch, useSelector } from "react-redux";
import { format } from "date-fns";
import {
	addAndUpdateMilkRates,
	deleteMilkRates,
	getMilkRates,
} from "../../Redux/Slices/rateSlice";
const MilkRateDashboard = () => {
	// Hooks should always be at the top
	const { rates, loading, error } = useSelector((state) => state.rate);
	const { user, token } = useSelector((state) => state.auth);
	const [filterCategory, setFilterCategory] = useState("all");
	const [sortType, setSortType] = useState("active");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedRate, setSelectedRate] = useState(null);
	const toast = useToast();
	const dispatch = useDispatch();

	// Move useColorModeValue out of any loops or conditional blocks
	const cardTextColor = useColorModeValue("gray.800", "white");

	useEffect(() => {
		if (token) {
			dispatch(getMilkRates({ token }));
		}
	}, [token, dispatch]);

	const handleFilterChange = (e) => {
		setFilterCategory(e.target.value);
	};

	const handleSortChange = (e) => {
		setSortType(e.target.value);
	};

	const handleEditCard = (rate) => {
		setSelectedRate(rate);
		setIsModalOpen(true);
	};

	const handleAddNew = () => {
		setSelectedRate(null);
		setIsModalOpen(true);
	};

	const handleSave = async (newRate) => {
		if (!token) {
			toast({
				title: "Authentication error",
				description: "Please login again",
				status: "error",
				duration: 3000,
				isClosable: true,
			});
			return;
		}
		
		try {
			await dispatch(addAndUpdateMilkRates({ token, newRate })).unwrap();
			// Refresh the rates after saving
			dispatch(getMilkRates({ token }));
			toast({
				title: "Milk rate saved successfully!",
				status: "success",
				duration: 3000,
				isClosable: true,
			});
		} catch (error) {
			console.error("Error saving rate:", error);
			toast({
				title: error?.message || "Failed to save milk rate",
				status: "error",
				duration: 3000,
				isClosable: true,
			});
		}
	};

	const handleDelete = async (id) => {
		if (!token) {
			toast({
				title: "Authentication error",
				description: "Please login again",
				status: "error",
				duration: 3000,
				isClosable: true,
			});
			return;
		}
		
		try {
			await dispatch(deleteMilkRates({ token, id })).unwrap();
			// Refresh the rates after deleting
			dispatch(getMilkRates({ token }));
			toast({
				title: "Milk rate deleted successfully!",
				status: "success",
				duration: 3000,
				isClosable: true,
			});
		} catch (error) {
			console.error("Error deleting rate:", error);
			toast({
				title: error?.message || "Failed to delete milk rate",
				status: "error",
				duration: 3000,
				isClosable: true,
			});
		}
	};

	const handleToggleStatus = async (rate) => {
		if (!token) {
			toast({
				title: "Authentication error",
				description: "Please login again",
				status: "error",
				duration: 3000,
				isClosable: true,
			});
			return;
		}
		
		try {
			// Toggle the status
			const updatedRate = {
				_id: rate._id,
				milkCategory: rate.milkCategory,
				ratePerFat: rate.ratePerFat,
				status: !rate.status, // Toggle boolean
			};
			
			await dispatch(addAndUpdateMilkRates({ token, newRate: updatedRate })).unwrap();
			// Refresh the rates after toggling
			dispatch(getMilkRates({ token }));
			toast({
				title: `Rate ${!rate.status ? 'activated' : 'deactivated'} successfully!`,
				status: "success",
				duration: 3000,
				isClosable: true,
			});
		} catch (error) {
			console.error("Error toggling status:", error);
			toast({
				title: error?.message || "Failed to update status",
				status: "error",
				duration: 3000,
				isClosable: true,
			});
		}
	};

	const filteredRates = (rates || []).filter((rate) => {
		if (filterCategory === "all") return true;
		return rate.milkCategory === filterCategory;
	});

	const sortedRates = filteredRates.sort((a, b) => {
		if (sortType === "active") return b.status - a.status;
		return a.milkCategory.localeCompare(b.milkCategory);
	});

	const getRandomColor = () => {
		const colors = [
			"red.300",
			"blue.300",
			"green.300",
			"yellow.300",
			"purple.300",
			"orange.300",
			"teal.300",
			"cyan.300",
			'pink.300',
		];
		return colors[Math.floor(Math.random() * colors.length)];
	};

	const handleDragStart = (e, index) => {
		e.dataTransfer.setData("index", index);
	};

	const handleDrop = (e, index) => {
		const draggedIndex = e.dataTransfer.getData("index");
		const draggedCard = rates[draggedIndex];

		let newMilkRates = [...rates];
		newMilkRates.splice(draggedIndex, 1);
		newMilkRates.splice(index, 0, draggedCard);
	};

	const allowDrop = (e) => {
		e.preventDefault();
	};

	return (
		<Box p={5}>
			<Flex justifyContent="space-between" mb={5}>
				<Heading>Milk Rate Dashboard</Heading>
			</Flex>

			<Flex justifyContent="space-between" mb={5}>
				<Select
					placeholder="Filter by Category"
					onChange={handleFilterChange}
					maxW="200px"
				>
					<option value="all">All Categories</option>
					<option value="cow">Cow</option>
					<option value="buffalo">Buffalo</option>
					<option value="sheep">Sheep</option>
					<option value="goat">Goat</option>
				</Select>

				<Select
					placeholder="Filter by Status"
					onChange={handleSortChange}
					maxW="200px"
				>
					<option value="All">All</option>
					<option value="active">Active</option>
					<option value="Non-Active">Non-Active</option>
					<option value="category">Sort by Category</option>
				</Select>

				<Button colorScheme="teal" onClick={handleAddNew}>
					Add New Rate
				</Button>
			</Flex>

			{(rates && rates.length > 0) ? (
				<SimpleGrid columns={{ sm: 1, md: 2, lg: 3 }} spacing={5}>
					{sortedRates?.length > 0 ? (
						sortedRates.map((rate, index) => {
							// Convert dates to local strings
							const createdAt = new Date(rate.createdAt).toLocaleString();
							const updatedAt = new Date(rate.updatedAt).toLocaleString();
							return (
								<Box
									key={rate._id}
									borderWidth="1px"
									borderRadius="md"
									p={5}
									bg={getRandomColor()}
									color={useColorModeValue("gray.800", "white")}
									boxShadow="md"
									onDragStart={(e) => handleDragStart(e, index)}
									onDrop={(e) => handleDrop(e, index)}
									onDragOver={allowDrop}
									draggable
									position="relative"
								>
									{/* Delete Icon */}
									<IconButton
										icon={<DeleteIcon />}
										aria-label="Delete Rate"
										size="sm"
										position="absolute"
										top="4px"
										right="4px"
										onClick={() => handleDelete(rate._id)}
									/>

									<Text fontWeight="bold" fontSize="lg">
										{rate.milkCategory?.toUpperCase() || "N/A"}
									</Text>
									<Text>Rate: ₹ {rate.ratePerFat || 0}/Fat</Text>
									<Text>Created At: {createdAt}</Text>
									<Text>Updated At: {updatedAt}</Text>
									<Flex justifyContent="space-between" mt={4} alignItems="center">
										<Button
											colorScheme="teal"
											onClick={() => handleEditCard(rate)}
										>
											Edit
										</Button>
										<Flex alignItems="center" gap={2}>
											<Switch
												isChecked={rate.status}
												onChange={() => handleToggleStatus(rate)}
												colorScheme="green"
											/>
											<Text
												fontWeight="bold"
												fontSize="sm"
												color={rate.status ? "green.600" : "red.600"}
											>
												{rate.status ? "Active" : "Inactive"}
											</Text>
										</Flex>
									</Flex>
								</Box>
							);
						})
					) : (
						<Text align={"center"}>No rate data available</Text>
					)}
				</SimpleGrid>
			) : loading ? (
				<Text align={"center"}>Loading rates...</Text>
			) : (
				<Text align={"center"}>No rate data found. Click "Add New Rate" to create one.</Text>
			)}

			<MilkRateModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSave={handleSave}
				initialData={selectedRate}
			/>
		</Box>
	);
};

export default MilkRateDashboard;
