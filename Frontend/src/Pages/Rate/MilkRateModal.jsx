import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Select,
  useToast,
} from "@chakra-ui/react";

const MilkRateModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [milkCategory, setMilkCategory] = useState(initialData?.milkCategory || 'cow');
  const [ratePerFat, setRatePerFat] = useState(initialData?.ratePerFat || "");
  const [status, setStatus] = useState(initialData?.status ? 'Active' : 'Inactive');

  const toast = useToast();

  // Update form fields when initialData changes (when opening modal for edit)
  useEffect(() => {
    if (initialData) {
      setMilkCategory(initialData.milkCategory || 'cow');
      setRatePerFat(initialData.ratePerFat || "");
      // Convert boolean status to string for the form
      setStatus(initialData.status ? 'Active' : 'Inactive');
    } else {
      // Reset form when adding new rate
      setMilkCategory('cow');
      setRatePerFat("");
      setStatus('Inactive');
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    if (!milkCategory || !ratePerFat) {
      toast({
        title: "All fields are required!",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Convert form data to proper types for backend
    const rateData = {
      milkCategory,
      ratePerFat: parseFloat(ratePerFat), // Convert string to number
      status: status === 'Active', // Convert string to boolean
    };
    
    // If editing, include the ID
    if (initialData?._id) {
      rateData._id = initialData._id;
    }
    
    onSave(rateData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{initialData ? "Edit" : "Add"} Milk Rate</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Select
            placeholder="Select Category"
            value={milkCategory}
            onChange={(e) => setMilkCategory(e.target.value)}
          >
            <option value="cow">Cow</option>
            <option value="buffalo">Buffalo</option>
            <option value="sheep">Sheep</option>
            <option value="goat">Goat</option>
          </Select>

          <Input
            mt={4}
            placeholder="Rate per Fat (₹)"
            type="number"
            value={ratePerFat}
            onChange={(e) => setRatePerFat(e.target.value)}
          />

          <Select
            mt={4}
            placeholder="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={handleSave}>
            Save
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MilkRateModal;
