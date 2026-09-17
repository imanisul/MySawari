// Using native fetch for modern Node.js environments (v18+)
const AppError = require('../common/errors/app-error');

class WatiService {
  constructor() {
    this.apiUrl = process.env.WATI_API_URL || 'https://live-mt-server.wati.io';
    this.accessToken = process.env.WATI_ACCESS_TOKEN || '';
    this.templateName = process.env.WATI_TEMPLATE_NAME || 'otp_message';
    this.tenantId = process.env.WATI_TENANT_ID || '';
  }

  /**
   * Send WhatsApp OTP using WATI Template Message
   * @param {string} mobile - Mobile number including country code (e.g. 919999999999)
   * @param {string} otp - The OTP to send
   */
  async sendWhatsAppOtp(mobile, otp) {
    if (!this.accessToken) {
      console.warn('WATI_ACCESS_TOKEN is missing. Skipping WhatsApp OTP delivery.');
      return false;
    }

    try {
      // Clean mobile number - remove spaces and '+' if present, ensure it has country code
      const cleanMobile = mobile.replace(/[^0-9]/g, '');
      const finalMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;

      const endpoint = `${this.apiUrl}/api/v1/sendTemplateMessage?whatsappNumber=${finalMobile}`;
      
      const payload = {
        template_name: this.templateName,
        broadcast_name: "otp_broadcast",
        parameters: [
          {
            name: "1",
            value: otp
          }
        ]
      };

      const headers = {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };
      
      if (this.tenantId) {
        headers['tenantId'] = this.tenantId;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.warn('WATI API returned non-JSON response');
      }

      if (!response.ok || data.result === false) {
        console.error('❌ WATI API Rejection details:', responseText);
        throw new AppError(data.info || data.message || data.error || 'WATI API rejected the request', response.status || 500);
      }

      console.log(`💬 WhatsApp OTP sent to +${finalMobile} via WATI`);
      return data;
    } catch (error) {
      console.error(`[WatiService] Failed to send OTP to ${mobile}:`, error.message);
      
      // If it's already an AppError, rethrow it
      if (error instanceof AppError) throw error;
      
      // Otherwise, wrap it in a generic 502 Bad Gateway (upstream error)
      throw new AppError('Failed to dispatch WhatsApp message. Please try again.', 502);
    }
  }
}

module.exports = new WatiService();
