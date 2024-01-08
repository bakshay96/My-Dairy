import React, { useState } from 'react';

function Test() {
  const [dateValues, setDateValues] = useState({
    startDate: '',
    endDate: '',
  });
  console.log(dateValues)

  const handleDateChange = (event, dateType) => {
    const { value } = event.target;
    setDateValues((prevValues) => ({
      ...prevValues,
      [dateType]: value,
    }));
    console.log(dateValues)
  };

  return (
    <div>
      <label>Start Date:</label>
      <input
        type="date"
        value={dateValues.startDate}
        onChange={(e) => handleDateChange(e, 'startDate')}
      />

      <label>End Date:</label>
      <input
      
        type="date"
        value={dateValues.endDate}
        onChange={(e) => handleDateChange(e, 'endDate')}
      />

      {/* Rest of your component */}
    </div>
  );
}

export default Test;
