// FeatureContainer.js

import React from 'react';

const FeatureContainer = () => {
  return (
    <div className="container mx-auto my-8" id="features">
      <h2 className="text-2xl font-bold mb-4">App Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Feature Box 1 */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <img src="feature1-image.png" alt="Feature 1" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-center font-semibold">Secure Login/Logout</p>
        </div>

        {/* Feature Box 2 */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <img src="feature2-image.png" alt="Feature 2" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-center font-semibold">Secure Connection</p>
        </div>

        {/* Feature Box 3 */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <img src="feature3-image.png" alt="Feature 3" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-center font-semibold">Auto Milk Calculation</p>
        </div>

        {/* Feature Box 4 */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <img src="feature4-image.png" alt="Feature 4" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-center font-semibold">User-Friendly Interface</p>
        </div>
      </div>
    </div>
  );
};

export default FeatureContainer;
