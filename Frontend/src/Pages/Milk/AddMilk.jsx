import React, { useEffect, useState } from "react";
import {
  Box, Button, Flex, FormControl, FormLabel, Heading,
  Input, Select, Stack, Text, useColorModeValue, useToast,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { addMilk } from "../../Redux/Slices/milkSlice";
import { getFarmersDetails } from "../../Redux/Slices/farmerSlice";

const CATEGORIES = ["cow", "buffalo", "mixed"];

const initialForm = {
  farmerId: "",
  category: "cow",
  fat: "",
  snf: "",
  litter: "",
};

export default function AddMilk() {
  const toast = useToast();
  const dispatch = useDispatch();
  const { farmerData } = useSelector((state) => state.farmer);
  const { loading } = useSelector((state) => state.milk);
  const { token } = useSelector((state) => state.auth);
  const [form, setForm] = useState(initialForm);
  const bg = useColorModeValue("white", "gray.700");

  useEffect(() => {
    if (token) dispatch(getFarmersDetails(token));
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.farmerId) {
      toast({ title: "Please select a farmer", status: "warning", position: "top", duration: 3000 });
      return;
    }
    if (!form.fat || !form.litter) {
      toast({ title: "FAT and Litter are required", status: "warning", position: "top", duration: 3000 });
      return;
    }
    const result = await dispatch(addMilk({ value: form, token }));
    if (addMilk.fulfilled.match(result)) {
      toast({ title: "Milk entry added successfully!", status: "success", position: "top", duration: 3000 });
      setForm(initialForm);
    } else {
      const msg = result.payload?.message || "Failed to add milk entry";
      toast({ title: msg, status: "error", position: "top", duration: 4000 });
    }
  };

  return (
    <Flex minH="80vh" align="center" justify="center">
      <Box bg={bg} rounded="xl" shadow="lg" p={8} w="full" maxW="520px">
        <Heading mb={2} fontSize="2xl" textAlign="center">
          🥛 Add Milk Entry
        </Heading>
        <Text mb={6} textAlign="center" color="gray.500" fontSize="sm">
          Record a farmer's milk collection for today
        </Text>
        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            {/* Farmer */}
            <FormControl isRequired>
              <FormLabel>Select Farmer</FormLabel>
              <Select
                name="farmerId"
                value={form.farmerId}
                onChange={handleChange}
                placeholder="-- Choose Farmer --"
              >
                {Array.isArray(farmerData) && farmerData.map((f) => (
                  <option key={f._id} value={f._id}>{f.name} — {f.mobile}</option>
                ))}
              </Select>
            </FormControl>

            {/* Category */}
            <FormControl isRequired>
              <FormLabel>Milk Category</FormLabel>
              <Select name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </Select>
            </FormControl>

            {/* FAT & SNF */}
            <Flex gap={4}>
              <FormControl isRequired>
                <FormLabel>FAT (%)</FormLabel>
                <Input
                  name="fat"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="e.g. 3.5"
                  value={form.fat}
                  onChange={handleChange}
                />
              </FormControl>
              <FormControl>
                <FormLabel>SNF (%)</FormLabel>
                <Input
                  name="snf"
                  type="number"
                  step="0.1"
                  min="0"
                  max="15"
                  placeholder="e.g. 8.5"
                  value={form.snf}
                  onChange={handleChange}
                />
              </FormControl>
            </Flex>

            {/* Litter */}
            <FormControl isRequired>
              <FormLabel>Quantity (Litres)</FormLabel>
              <Input
                name="litter"
                type="number"
                step="0.001"
                min="0"
                placeholder="e.g. 10.5"
                value={form.litter}
                onChange={handleChange}
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="teal"
              size="lg"
              isLoading={loading}
              loadingText="Submitting..."
              mt={2}
            >
              Add Milk Entry
            </Button>
          </Stack>
        </form>
      </Box>
    </Flex>
  );
}
