import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Table,
  Tbody,
  Tr,
  Td,
  Input,
  Box,
  Radio,
  RadioGroup,
  Stack,
  useColorModeValue,
  useToast,
  Text,
} from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import { getMilkDetails, updateExistingMilkEntry } from '../../Redux/Slices/milkSlice';

const MoreInfoModal = ({ isOpen, onClose, details, onUpdate ,mode}) => {
  const {token,user} =useSelector((state)=>state.auth);
  const [isEditing, setIsEditing] = useState(mode||false);
  const [editableDetails, setEditableDetails] = useState({
    snf: '',
    fat: '',
    degree: '',
    water: '',
    total: '',
    category: 'cow', // Default category,
   
  });
  const toast = useToast();
  const dispatch=useDispatch();

  useEffect(() => {
    if (details) {
      // Initialize editable details with the current details when modal opens
      setEditableDetails({
        id:details._id || "not defined",
        snf: details.snf || 0,
        fat: details.fat || 0,
        degree: details.degree || 0,
        water: details.water || 0,
        litter: details.litter || 0,
        category: details.category || 'cow', // Default category
      });
    }
  }, [details, isOpen]);

  const inputBgColor = useColorModeValue('white', 'gray.700');
  const inputTextColor = useColorModeValue('black', 'white');
  const inputBorderColor = useColorModeValue('gray.300', 'gray.600');

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleBackClick = () => {
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleCategoryChange = (value) => {
    setEditableDetails((prevDetails) => ({
      ...prevDetails,
      category: value,
    }));
  };

  const handleUpdateClick = () => {
    setIsEditing(false);
    //console.log(editableDetails)
    const id=editableDetails.id;
    const payload=editableDetails;
    dispatch(updateExistingMilkEntry({id,payload,token})).then(()=>{
      //dispatch(getMilkDetails({token,id}))
    })

    onClose();
   // onUpdate(editableDetails);

    
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" >
      <ModalOverlay />
      <ModalContent borderRadius={"10px"}>
        <ModalHeader>
          Farmer: {details?.farmerId?.name || 'Unknown Farmer'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box borderWidth="1px" borderRadius="10px" overflow="hidden" boxShadow="lg">
            {
            details?
            <Table variant="striped" colorScheme="gray" size="sm">
              <Tbody>
                <Tr bg={useColorModeValue('gray.200', 'gray.600')}>
                  <Td><strong>Category</strong></Td>
                  <Td>
                    {isEditing ? (
                      <RadioGroup
                        value={editableDetails.category}
                        onChange={handleCategoryChange}
                      >
                        <Stack spacing={4} direction="row">
                          <Radio value="cow">Cow</Radio>
                          <Radio value="buffalo">Buffalo</Radio>
                          <Radio value="sheep">Sheep</Radio>
                          <Radio value="goat">Goat</Radio>
                        </Stack>
                      </RadioGroup>
                    ) : (
                      editableDetails.category
                    )}
                  </Td>
                </Tr>
                <Tr bg={useColorModeValue('gray.200', 'gray.700')}>
                  <Td><strong>SNF</strong></Td>
                  <Td>
                    {isEditing ? (
                      <Input
                        name="snf"
                        value={editableDetails.snf}
                        onChange={handleInputChange}
                        size="sm"
                        bg={inputBgColor}
                        color={inputTextColor}
                        borderColor={inputBorderColor}
                      />
                    ) : (
                      details.snf
                    )}
                  </Td>
                </Tr>
                <Tr bg={useColorModeValue('gray.100', 'gray.600')}>
                  <Td><strong>Fat</strong></Td>
                  <Td>
                    {isEditing ? (
                      <Input
                        name="fat"
                        value={editableDetails.fat}
                        onChange={handleInputChange}
                        size="sm"
                        bg={inputBgColor}
                        color={inputTextColor}
                        borderColor={inputBorderColor}
                      />
                    ) : (
                      details.fat
                    )}
                  </Td>
                </Tr>
                <Tr bg={useColorModeValue('gray.200', 'gray.700')}>
                  <Td><strong>Degree</strong></Td>
                  <Td>
                    {isEditing ? (
                      <Input
                        name="degree"
                        value={editableDetails.degree}
                        onChange={handleInputChange}
                        size="sm"
                        bg={inputBgColor}
                        color={inputTextColor}
                        borderColor={inputBorderColor}
                      />
                    ) : (
                      details.degree
                    )}
                  </Td>
                </Tr>
                <Tr bg={useColorModeValue('gray.100', 'gray.600')}>
                  <Td><strong>Water</strong></Td>
                  <Td>
                    {isEditing ? (
                      <Input
                        name="water"
                        value={editableDetails.water}
                        onChange={handleInputChange}
                        size="sm"
                        bg={inputBgColor}
                        color={inputTextColor}
                        borderColor={inputBorderColor}
                      />
                    ) : (
                      details.water
                    )}
                  </Td>
                </Tr>
                <Tr bg={useColorModeValue('gray.200', 'gray.700')}>
                  <Td><strong>Total</strong></Td>
                  <Td>
                    {isEditing ? (
                      <Input
                        name="litter"
                        value={editableDetails.litter}
                        onChange={handleInputChange}
                        size="sm"
                        bg={inputBgColor}
                        color={inputTextColor}
                        borderColor={inputBorderColor}
                      />
                    ) : (
                      details.litter
                    )}
                  </Td>
                </Tr>
              </Tbody>
            </Table>
            : <Text color={"Red"} >Please Select farmer from dropdown menu</Text>
            }
          </Box>
        </ModalBody>
        <ModalFooter>
          {isEditing ? (
            <>
              <Button colorScheme="blue" onClick={handleUpdateClick}>
                Update
              </Button>
              <Button colorScheme="gray" onClick={handleBackClick} ml={3}>
                Back
              </Button>
            </>
          ) : (
            details && (
              <Button colorScheme="blue" onClick={handleEditClick}>
                Edit
              </Button>
            )
          )}
          <Button colorScheme="red" onClick={onClose} ml={3}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MoreInfoModal;
