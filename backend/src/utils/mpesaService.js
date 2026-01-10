const axios = require('axios');
const crypto = require('crypto');

class MpesaService {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.passKey = process.env.MPESA_PASSKEY;
    this.businessShortCode = process.env.MPESA_SHORTCODE;
    this.callbackUrl = process.env.MPESA_CALLBACK_URL;
    this.environment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
    
    this.baseUrl = this.environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
  }

  async generateAccessToken() {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error('Error generating access token:', error.response?.data || error.message);
      throw new Error('Failed to generate M-Pesa access token');
    }
  }

  generatePassword(timestamp) {
    const data = `${this.businessShortCode}${this.passKey}${timestamp}`;
    return Buffer.from(data).toString('base64');
  }

  generateTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  formatPhoneNumber(phoneNumber) {
    let formattedPhone = phoneNumber.trim();
    
    // Remove any spaces or dashes
    formattedPhone = formattedPhone.replace(/\s+/g, '').replace(/-/g, '');
    
    // Format to 2547XXXXXXXX
    if (formattedPhone.startsWith('0')) {
      formattedPhone = `254${formattedPhone.substring(1)}`;
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('254')) {
      // Already formatted
    } else if (formattedPhone.startsWith('7') && formattedPhone.length === 9) {
      formattedPhone = `254${formattedPhone}`;
    } else {
      throw new Error('Invalid phone number format. Use: 07XXXXXXXX, 2547XXXXXXXX, or +2547XXXXXXXX');
    }
    
    // Validate length
    if (formattedPhone.length !== 12) {
      throw new Error('Phone number must be 12 digits after formatting');
    }
    
    return formattedPhone;
  }

  async stkPush(phoneNumber, amount, accountReference, transactionDesc) {
    try {
      const accessToken = await this.generateAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);
      
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const payload = {
        BusinessShortCode: this.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: this.businessShortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: this.callbackUrl,
        AccountReference: accountReference.substring(0, 12),
        TransactionDesc: transactionDesc.substring(0, 13)
      };

      console.log('M-Pesa STK Push payload:', payload);

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('STK Push error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errorMessage || 'Failed to initiate M-Pesa payment');
    }
  }

  async checkTransactionStatus(checkoutRequestID) {
    try {
      const accessToken = await this.generateAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);

      const payload = {
        BusinessShortCode: this.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Check transaction status error:', error.response?.data || error.message);
      throw new Error('Failed to check transaction status');
    }
  }

  validateCallback(data) {
    const stkCallback = data.Body?.stkCallback;
    if (!stkCallback) {
      throw new Error('Invalid callback data');
    }

    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;
    const checkoutRequestID = stkCallback.CheckoutRequestID;
    const metadata = stkCallback.CallbackMetadata;

    let mpesaReceiptNumber = null;
    let amount = null;
    let phoneNumber = null;
    let transactionDate = null;

    // Only extract metadata if payment was successful
    if (resultCode === 0 && metadata && metadata.Item) {
      metadata.Item.forEach(item => {
        if (item.Name === 'MpesaReceiptNumber') mpesaReceiptNumber = item.Value;
        if (item.Name === 'Amount') amount = item.Value;
        if (item.Name === 'PhoneNumber') phoneNumber = item.Value;
        if (item.Name === 'TransactionDate') transactionDate = item.Value;
      });
    }

    // Log all result codes for debugging
    console.log(`M-Pesa Callback - ResultCode: ${resultCode}, ResultDesc: ${resultDesc}`);

    return {
      success: resultCode === 0,  // Only true if ResultCode is exactly 0
      resultCode: String(resultCode),  // Convert to string for consistency
      resultDesc: resultDesc || 'Transaction failed',
      checkoutRequestID,
      mpesaReceiptNumber,
      amount,
      phoneNumber,
      transactionDate
    };
  }
}

module.exports = new MpesaService();