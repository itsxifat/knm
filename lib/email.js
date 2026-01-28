import nodemailer from 'nodemailer';
import path from 'path';

// --- SECURE SMTP TRANSPORTER ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  // Essential for some cPanel/Hosting providers to prevent handshake errors
  tls: {
    rejectUnauthorized: false
  }
});

// --- EMAIL CONFIGURATION MAP ---
const emailTypes = {
  verification: {
    subject: "Verify Your KNM Account",
    headline: "Welcome to KNM Lifestyle",
    body: "Please use the secure code below to complete your verification.",
  },
  email_change: {
    subject: "Verify New Email Address",
    headline: "Security Update",
    body: "You requested to change your account email. Use the code below to confirm this change.",
  },
  password_reset: {
    subject: "Reset Your Password",
    headline: "Password Reset",
    body: "We received a request to reset your password. Use the code below to proceed.",
  },
  login: {
    subject: "Login Verification",
    headline: "Secure Login",
    body: "Use the following code to complete your login securely.",
  }
};

// --- HTML TEMPLATE GENERATOR ---
const generateEmailTemplate = (otp, type) => {
  const config = emailTypes[type] || emailTypes.verification;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;700&family=Manrope:wght@300;400;600&display=swap');
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F9F6F0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F9F6F0; padding: 60px 0;">
        <tr>
          <td align="center">
            
            <table width="500" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #C5A05930; box-shadow: 0 4px 20px rgba(197, 160, 89, 0.1);">
              
              <tr>
                <td align="center" style="padding: 50px 0 30px 0; background-color: #ffffff; border-bottom: 1px solid #f0f0f0;">
                  <img src="cid:knm-logo" alt="KNM" style="width: 140px; height: auto; display: block;" />
                </td>
              </tr>
              
              <tr>
                <td align="center">
                   <div style="width: 100%; height: 3px; background-color: #C5A059;"></div>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding: 50px 40px;">
                  <h3 style="margin: 0 0 15px 0; font-family: 'Times New Roman', serif; font-size: 24px; color: #121212; font-weight: normal; text-transform: uppercase; letter-spacing: 1px;">
                    ${config.headline}
                  </h3>
                  
                  <p style="margin: 0 0 35px 0; font-size: 13px; line-height: 24px; color: #57534E;">
                    ${config.body}
                  </p>
                  
                  <table border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" style="background-color: #F9F6F0; border: 1px solid #E5E5E5; border-radius: 2px; padding: 20px 40px;">
                        <span style="color: #121212; font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: monospace; display: block;">
                          ${otp}
                        </span>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 35px 0 0 0; font-size: 11px; color: #8C8279; line-height: 1.6;">
                    This code will expire in 10 minutes.<br/>
                    If you did not request this, please ignore this email.
                  </p>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding: 25px 50px; background-color: #121212;">
                   <p style="margin: 0; font-size: 10px; color: #8C8279; text-transform: uppercase; letter-spacing: 2px;">
                     &copy; ${new Date().getFullYear()} KNM Lifestyle. Secure System.
                   </p>
                </td>
              </tr>
              
            </table>

          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
};

// --- SEND FUNCTION ---
export async function sendOtpEmail(to, otp, type = 'verification') {
  const config = emailTypes[type] || emailTypes.verification;
  
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');

  const mailOptions = {
    from: `"KNM Security" <${process.env.SMTP_USER}>`,
    to,
    subject: config.subject,
    html: generateEmailTemplate(otp, type),
    attachments: [
      {
        filename: 'logo.png',
        path: logoPath,
        cid: 'knm-logo' 
      }
    ]
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email Error:", error);
    return { success: false, error: "Failed to send email" };
  }
}