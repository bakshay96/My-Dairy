import {
	Flex,
	Modal,
	ModalBody,
	ModalContent,
	ModalOverlay,
	Spinner,
	useDisclosure,
} from "@chakra-ui/react";
import React from "react";

export const Loader1 = () => {
	const { isOpen, onOpen, onClose } = useDisclosure();
	return (
		<>
			<Modal isCentered isOpen={() => onOpen()} onClose={onClose}>
				{
					<ModalOverlay
						bg="blueviolet.300"
						backdropFilter="blur(10px) hue-rotate(90deg)"
					/>
				}

				<ModalContent bg={"white.800"}>
					{/* <ModalHeader>Plase Wait...</ModalHeader> */}
					{/* <ModalCloseButton /> */}

					<Flex direction={"column"} align={"center"}>
						<Spinner
							thickness="4px"
							speed="1s"
							emptyColor="gray.200"
							color="blue.500"
							size="xl"
							label="Loading..."
						/>
						<h1 fontSize={"18px"} color="blue">
							...Loading
						</h1>
					</Flex>
				</ModalContent>
			</Modal>
		</>
	);
};
