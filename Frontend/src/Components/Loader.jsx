import { Flex, Modal, ModalBody, ModalContent, ModalOverlay, Spinner, useDisclosure } from '@chakra-ui/react'
import React from 'react'

export const Loader = ({message}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
   <>
   <Modal isCentered isOpen={(()=>onOpen())} onClose={onClose}>
      {<ModalOverlay
      bg='blackAlpha.100'
      backdropFilter='blur(10px) hue-rotate(90deg)'
    />}
    
      <ModalContent bg={"white.900"}>
        {/* <ModalHeader>Plase Wait...</ModalHeader> */}
        {/* <ModalCloseButton /> */}
        <ModalBody >
          <Flex gap={"5px"} direction={"column"} align={"center"}>

        <Spinner 	thickness="4px"
							speed="1s"
							emptyColor="gray.200"
							color="blue.500"
							size="xl"
							label="Loading..."
						 />
          <h1 color='blueviolet.800' fontSize={"25px"}>{message?message:"Please wait...!"}</h1>
          </Flex>
        </ModalBody>
        
      </ModalContent>
    </Modal>
    
   </>
  )
}
