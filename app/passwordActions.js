'use server';

import connectDB from "@/lib/db";
import User from "@/models/User";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer"; 
import path from "path";

// --- REQUEST RESET LINK ---
export async function requestPasswordReset(formData) {
  await connectDB();
  const email = formData.get("email");

  const user = await User.findOne({ email });
  
  // SECURITY LAYER 1: Prevent User Enumeration
  // Always return success even if user is not found to stop email fishing.
  if (!user) {
    return { success: true, message: "If an account exists, a link has been sent." };
  }

  // SECURITY LAYER 2: Rate Limiting (Anti-Spam)
  // If a reset token exists and is still fresh (created less than 5 minutes ago), stop.
  // Logic: 1 hour expiry. If expiry is > 55 mins from now, it means it was just created.
  const cooldownThreshold = 55 * 60 * 1000; // 55 minutes
  if (user.resetPasswordExpires && user.resetPasswordExpires.getTime() - Date.now() > cooldownThreshold) {
    return { success: true, message: "A link was recently sent. Please wait before retrying." };
  }

  // 1. Generate Token & Expiry
  const token = crypto.randomBytes(32).toString("hex");
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 1); // 1 Hour Validity

  user.resetPasswordToken = token;
  user.resetPasswordExpires = expiryDate;
  await user.save();

  // 2. Create Reset Link
  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  // 3. SEND PREMIUM EMAIL via KNM Server
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "support.knm.international",
      port: Number(process.env.SMTP_PORT) || 465, // Default to SSL port
      secure: true, // Use SSL (true for 465, false for 587)
      auth: {
        user: process.env.SMTP_USER,       
        pass: process.env.SMTP_PASSWORD, 
      },
      // SECURITY LAYER 3: Enforce Secure Connection
      tls: {
        rejectUnauthorized: true, // Fail if certificate is invalid
        minVersion: "TLSv1.2"     // Prevent downgrade attacks
      }
    });

    const logoPath = path.join(process.cwd(), 'public', 'logo.png');

    const mailOptions = {
      from: `"KNM Support" <${process.env.SMTP_USER}>`, // Must match auth user
      to: email,
      subject: "Reset Your Password | KNM Lifestyle",
      attachments: [{
        filename: 'logo.png',
        path: logoPath,
        cid: 'knm-logo' 
      }],
      html: `
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
                      <img src="cid:knm-logo" alt="KNM" style="width: 160px; display: block;" />
                    </td>
                  </tr>
                  
                  <tr>
                    <td align="center">
                       <div style="width: 100%; height: 3px; background-color: #C5A059;"></div>
                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="padding: 50px 50px;">
                      <h3 style="margin: 0 0 20px 0; font-family: 'Times New Roman', serif; font-size: 26px; color: #121212; font-weight: normal; text-transform: uppercase; letter-spacing: 1px;">
                        Reset Password
                      </h3>
                      
                      <p style="margin: 0 0 35px 0; font-size: 14px; line-height: 26px; color: #57534E;">
                        We received a request to regain access to your KNM Lifestyle account. 
                        Please click the button below to create a new secure password.
                      </p>

                      <a href="${resetLink}" style="display: inline-block; background-color: #C5A059; color: #ffffff; text-decoration: none; padding: 16px 40px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; border-radius: 2px;">
                        Reset Access
                      </a>
                      
                      <p style="margin: 35px 0 0 0; font-size: 11px; color: #8C8279; line-height: 1.6;">
                        If you did not request this change, please ignore this email.<br/>
                        This link will expire in 60 minutes.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="padding: 25px 50px; background-color: #121212;">
                       <p style="margin: 0; font-size: 10px; color: #8C8279; text-transform: uppercase; letter-spacing: 2px;">
                         &copy; ${new Date().getFullYear()} KNM Lifestyle
                       </p>
                    </td>
                  </tr>
                  
                </table>

              </td>
            </tr>
          </table>

        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: "Secure link sent to your inbox." };

  } catch (error) {
    console.error("Email Error:", error);
    return { error: "Unable to send email. Please contact support." };
  }
}

// --- PERFORM RESET ---
export async function resetPassword(token, newPassword) {
  await connectDB();
  
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() } 
  });

  if (!user) {
    return { error: "This link is invalid or has expired." };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { success: true };
}