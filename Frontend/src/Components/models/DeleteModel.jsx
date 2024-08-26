import React from "react";
import {
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalFooter,
	ModalBody,
	Button,
	Text,
} from "@chakra-ui/react";

export const DeleteConfirmationModal = ({
	isOpen,
	onClose,
	onDelete,
	item,
}) => {
  
	//console.log("model open item,close,delete",item,isOpen,onClose,onDelete)
	//console.log(item);
	// The original date string in UTC
	const utcDateStr = item?.createdAt && item ? item.createdAt : undefined;
	const dateObj = new Date(utcDateStr);

	// Get the local date and time
	const localDateStr = dateObj.toLocaleString();

	const handleDeleteItem = () => {
		onDelete(item);
		onClose();
	};
	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader textColor="red">Delete Confirmation</ModalHeader>
				<ModalBody>
					<Text>
						<ul type="none">
							<li>
								Are you sure you want to delete the{" "}
								<b>{item?.farmerId?.name || item?.name}</b>
								{item && item?.date
									? ` farmer Milk Entery ? `
									: "Farmer Account ..?"}{" "}
								<br />
							</li>
							<li>Entry date : {item?.date ? item.date : localDateStr}</li>
							<li>
								<Text color={"red"} fontWeight={"3400"} fontSize={"20"}>
									This action cannot be undone...!
								</Text>
							</li>
						</ul>
					</Text>
				</ModalBody>
				<ModalFooter>
					<Button colorScheme="blue" onClick={onClose} mr={3}>
						Cancel
					</Button>
					<Button colorScheme="red" onClick={handleDeleteItem}>
						Delete
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};
