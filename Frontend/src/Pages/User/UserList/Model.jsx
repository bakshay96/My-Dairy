import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import { PlusIcon } from "./PlusIcon";
import UserRegistration from "../UserRegistration";

export default function Model() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [backdrop, setBackdrop] = React.useState("blur");

  const handleOpen = (backdrop) => {
    onOpen();
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button
          onPress={() => handleOpen()}
          color="primary"
          endContent={<PlusIcon />}
        >
          Add Farmer
        </Button>
        {/* <Button  
          color="primary" endContent={<PlusIcon />}
           
          
           
            onPress={() => handleOpen()}
            className="capitalize"
          >
           Blur
          </Button> */}
      </div>
      <Modal
      
        size={"4xl"}
        
        backdrop={backdrop}
        isOpen={isOpen}
        onClose={onClose}
        scrollBehavior={"inside"}
        placement={"top"}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Farmer Registration
              </ModalHeader>
              <ModalBody>
                <UserRegistration />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={onClose}>
                  Action
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
