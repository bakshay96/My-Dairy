import { Flex, Modal, ModalBody, ModalContent, ModalOverlay, Spinner } from '@chakra-ui/react'
import React from 'react'

export const Loader = () => {
  return (
   <>
   <Modal isCentered isOpen={(()=>onOpen())} onClose={onClose}>
      {<ModalOverlay
      bg='blackAlpha.300'
      backdropFilter='blur(10px) hue-rotate(90deg)'
    />}
    
      <ModalContent>
        {/* <ModalHeader>Plase Wait...</ModalHeader> */}
        {/* <ModalCloseButton /> */}
        <ModalBody >
          <Flex justify={"space-around"} align={"center"}>

        <Spinner  color="success" size="lg" label="Loading..." />
          
          </Flex>
        </ModalBody>
        
      </ModalContent>
    </Modal>
    
   </>
  )
}
