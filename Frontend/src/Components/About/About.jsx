import React from "react";

import projectLogo from "../../assets/Logo/project-logo.svg";
export default function About() {
  return (
    <div id="about" className="py-16 bg-white">
      <div className="container m-auto px-6 text-gray-600 md:px-12 xl:px-6">
        <div className="space-y-6 md:space-y-0 md:flex md:gap-6 lg:items-center lg:gap-12">
          <div className="md:5/12 lg:w-4/12">
            <img src={projectLogo} alt="image" />
          </div>
          <div className="md:7/12 lg:w-6/12">
            <h2 className="text-2xl text-gray-900 font-bold md:text-4xl">
              Dairy Software for Mobile & Computer
            </h2>
            <p className="mt-6 text-gray-600">
              Responsive Dairy web appliation, Simple Dairy web app for Milk collection Management , Milk
              Sale purchase with Fat/SNF multiple rate chart for Dairy farmers
              or customers. Complete solution for BMC (Bulk Milk collection).
            Milk web app for mobile
              dairy. Milk Man. Milk Delivery, Automati Milk Collection Unit
              (AMCU)
            </p>
            <p className="mt-4 text-gray-600">
            Complete Solution for Milk collection center.Simple Dairy software for mobile dairy. Milk delivery solution. 
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
