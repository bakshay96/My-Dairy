/**
 * SMS Notification Service
 * Integrates with SMS providers (Twilio, MSG91, etc.) for sending notifications
 * 
 * Usage:
 * - Milk entry confirmation
 * - Payment notifications
 * - Daily summaries
 * - Rate change alerts
 */

// SMS Provider Configuration
const SMS_CONFIG = {
  provider: process.env.SMS_PROVIDER || 'twilio', // twilio, msg91, custom
  enabled: process.env.SMS_ENABLED === 'true' || false,
};

// Twilio Configuration
const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  fromNumber: process.env.TWILIO_PHONE_NUMBER,
};

// MSG91 Configuration (Popular in India)
const msg91Config = {
  authKey: process.env.MSG91_AUTH_KEY,
  senderId: process.env.MSG91_SENDER_ID || 'MYDAIR',
};

/**
 * Send SMS using configured provider
 * @param {string} to - Recipient phone number with country code
 * @param {string} message - SMS message content
 * @param {object} options - Additional options
 * @returns {Promise<object>} - SMS send result
 */
const sendSMS = async (to, message, options = {}) => {
  if (!SMS_CONFIG.enabled) {
    console.log('SMS service is disabled. Message:', message);
    return { success: false, reason: 'SMS service disabled' };
  }

  try {
    switch (SMS_CONFIG.provider) {
      case 'twilio':
        return await sendViaTwilio(to, message, options);
      case 'msg91':
        return await sendViaMSG91(to, message, options);
      default:
        return await sendViaCustom(to, message, options);
    }
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send SMS via Twilio
 */
const sendViaTwilio = async (to, message, options) => {
  // Install twilio package: npm install twilio
  const twilio = require('twilio');
  
  if (!twilioConfig.accountSid || !twilioConfig.authToken) {
    throw new Error('Twilio credentials not configured');
  }

  const client = twilio(twilioConfig.accountSid, twilioConfig.authToken);

  const result = await client.messages.create({
    body: message,
    from: twilioConfig.fromNumber,
    to: to,
  });

  return {
    success: true,
    messageId: result.sid,
    status: result.status,
  };
};

/**
 * Send SMS via MSG91 (India)
 */
const sendViaMSG91 = async (to, message, options) => {
  if (!msg91Config.authKey) {
    throw new Error('MSG91 auth key not configured');
  }

  const axios = require('axios');
  
  // Clean phone number (remove +, spaces, etc.)
  const cleanPhone = to.replace(/[^0-9]/g, '');
  
  const response = await axios.post('https://api.msg91.com/api/v5/flow/', {
    template_id: options.templateId || 'default',
    recipients: [{ mobile: cleanPhone }],
    variables: {
      message: message,
    },
  }, {
    headers: {
      authkey: msg91Config.authKey,
      'Content-Type': 'application/json',
    },
  });

  return {
    success: response.data.type === 'success',
    messageId: response.data.request_id,
    status: response.data.type,
  };
};

/**
 * Custom SMS provider integration
 * Implement your own SMS provider here
 */
const sendViaCustom = async (to, message, options) => {
  // Implement your custom SMS provider integration
  console.log('Custom SMS provider - To:', to, 'Message:', message);
  
  return {
    success: false,
    reason: 'Custom SMS provider not implemented',
  };
};

/**
 * Send milk entry confirmation SMS
 */
const sendMilkEntryNotification = async (farmer) => {
  const { name, mobile, litter, fat, calculatedAmount, date } = farmer;
  
  const message = `Dear ${name},\n\nYour milk collection has been recorded:\n` +
    `Date: ${date}\n` +
    `Quantity: ${litter}L\n` +
    `FAT: ${fat}%\n` +
    `Amount: Rs. ${calculatedAmount}\n\n` +
    `Thank you!\nMy-Dairy Team`;

  return await sendSMS(mobile, message);
};

/**
 * Send payment confirmation SMS
 */
const sendPaymentNotification = async (farmer, payment) => {
  const { name, mobile } = farmer;
  const { amount, status, date } = payment;
  
  const message = `Dear ${name},\n\nPayment Update:\n` +
    `Amount: Rs. ${amount}\n` +
    `Status: ${status}\n` +
    `Date: ${date}\n\n` +
    `My-Dairy Team`;

  return await sendSMS(mobile, message);
};

/**
 * Send daily summary SMS to admin
 */
const sendDailySummaryToAdmin = async (admin, summary) => {
  const { mobile } = admin;
  const { totalLiters, totalFarmers, totalAmount } = summary;
  
  const message = `Daily Summary:\n` +
    `Total Collection: ${totalLiters}L\n` +
    `Farmers: ${totalFarmers}\n` +
    `Total Amount: Rs. ${totalAmount}\n\n` +
    `My-Dairy`;

  return await sendSMS(mobile, message);
};

/**
 * Send rate change notification
 */
const sendRateChangeNotification = async (farmer, rateInfo) => {
  const { name, mobile } = farmer;
  const { category, newRate, effectiveDate } = rateInfo;
  
  const message = `Dear ${name},\n\nRate Update:\n` +
    `Milk Type: ${category}\n` +
    `New Rate: Rs. ${newRate}/L\n` +
    `Effective: ${effectiveDate}\n\n` +
    `My-Dairy Team`;

  return await sendSMS(mobile, message);
};

/**
 * Send payment reminder SMS
 */
const sendPaymentReminder = async (farmer, pendingAmount) => {
  const { name, mobile } = farmer;
  
  const message = `Dear ${name},\n\nPayment Reminder:\n` +
    `Pending Amount: Rs. ${pendingAmount}\n` +
    `Please collect your payment at earliest.\n\n` +
    `My-Dairy Team`;

  return await sendSMS(mobile, message);
};

module.exports = {
  sendSMS,
  sendMilkEntryNotification,
  sendPaymentNotification,
  sendDailySummaryToAdmin,
  sendRateChangeNotification,
  sendPaymentReminder,
};
