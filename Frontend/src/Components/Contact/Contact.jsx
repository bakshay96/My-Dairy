import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  sendMail,
  sendMessageFailureAction,
  sendMessageSuccessAction,
} from "../../Redux/AuthReducer/action";
import { useToast } from "@chakra-ui/react";
import logo from "../../assets/Logo/ab-tech-high-resolution-logo.svg"

export default function Contact() {
  const toast = useToast();
  const data = useSelector((store) => store.authReducer);
  //console.log("auth reducer", data);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const inputRefs = useRef({
    name: null,
    email: null,
    message: null,
  });

  // State to track the form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    //console.log(formData);

    //send data to the server
    dispatch(sendMail(formData))
      .then((res) => {
        //console.log("action", res);
        dispatch(sendMessageSuccessAction(res.status));
      })
      .then((res) => {
        //console.log("admin reg response", res);
          toast({
            position: "top",
            title: `201 Message confirmation`,
            description: "Message send successfully.",
            status: "info",
            duration: 4000,
            isClosable: true,
          });
          // After successful submission, reset the form data
          setFormData({
            name: "",
            email: "",
            message: "",
          });

          // Clear all input values using the single useRef
          Object.values(inputRefs.current).forEach((ref) => {
            if (ref) ref.value = "";
          });
        
      })
      .catch((res) => {
        //console.log("action catch", res);
        dispatch(sendMessageFailureAction());
        toast({
            position: "top",
            title: `404 Server error`,
            description: "Please try again",
            status: "info",
            duration: 4000,
            isClosable: true,
          });
      });
  };

  // Function to handle input changes
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    // Update the formData state
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <div
      id="footer"
      className="relative flex items-top justify-center min-h-[700px] bg-white sm:items-center sm:pt-0"
    >
      <div className="max-w-6xl mx-auto sm:px-6 lg:px-8">
        <div className="mt-8 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-6 mr-2 bg-gray-100 sm:rounded-lg">
              <h1 className="text-3xl sm:text-4xl text-gray-800 font-extrabold tracking-tight">
                Get in touch:
              </h1>
              <p className="text-normal text-lg sm:text-xl font-medium text-gray-600 mt-2">
                Fill in the form to start a conversation
              </p>

              <div className="flex items-center mt-8 text-gray-600">
                <svg
                  fill-rule="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  stroke-linejoin="round"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                  className="w-8 h-8 text-gray-500"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div className="ml-4 text-md tracking-wide font-semibold w-40">
                  Ab tech, Buldhana, MH, 444303
                </div>
              </div>

              <div className="flex items-center mt-4 text-gray-600">
             
                {/* <svg
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  viewBox="0 0 24 24"
                  className="w-8 h-8 text-gray-500"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg> */}
                <div className="ml-4 text-md tracking-wide font-semibold w-40">
                  {/* +44 1234567890 */}
                </div>
              </div>

              <div className="flex items-center mt-2 text-gray-600">
                <svg
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  viewBox="0 0 24 24"
                  className="w-8 h-8 text-gray-500"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <div className="ml-4 text-md tracking-wide font-semibold w-45">
                  care.abtech@gmail.com
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 flex flex-col justify-center"
            >
              <div className="flex flex-col">
                <label className="hidden">Full Name</label>
                <input
                  type="name"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  ref={(el) => (inputRefs.current.name = el)}
                  placeholder="Full Name"
                  className="w-100 mt-2 py-3 px-3 rounded-lg bg-white border border-gray-400 text-gray-800 font-semibold focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col mt-2">
                <label className="hidden">Email</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  ref={(el) => (inputRefs.current.email = el)}
                  placeholder="Email"
                  className="w-100 mt-2 py-3 px-3 rounded-lg bg-white border border-gray-400 text-gray-800 font-semibold focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col mt-2">
                <label className="hidden">Message</label>
                <textarea
                  type="text"
                  name="message"
                  id="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  ref={(el) => (inputRefs.current.message = el)}
                  placeholder="Enter your message here..."
                  rows="4"
                  cols="50"
                  className="w-100 mt-2 py-3 px-3 rounded-lg bg-white border border-gray-400 text-gray-800 font-semibold focus:border-orange-500 focus:outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="md:w-32 bg-orange-700 hover:bg-blue-dark text-white font-bold py-3 px-6 rounded-lg mt-3 hover:bg-orange-600 transition ease-in-out duration-300"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
