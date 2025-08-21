// utils/sendEmail.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Add this new function for password reset emails
export async function sendEmail(email, resetToken) {
    console.log('SendEmail - Preparing to send password reset email');
    
    const resetLink = `https://belto-user-side.vercel.app/reset-password/${resetToken}`;
    console.log('SendEmail - Generated reset link:', resetLink);
    
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Reset Your Password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1>Password Reset</h1>
                <p>You requested to reset your password for your Belto account.</p>
                <p>Click the button below to set a new password:</p>
                <div style="margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #fbbf24; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
                </div>
                <p>Or copy and paste this link in your browser:</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request a password reset, please ignore this email.</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
    console.log('SendEmail - Password reset email sent successfully');
}

export async function sendVerificationEmail(email, token) {
    console.log('SendEmail - Preparing to send email with token:', token);
    
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}`;
    console.log('SendEmail - Generated verification link:', verificationLink);
    
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Verify Your Email',
        html: `
            <h1>Email Verification</h1>
            <p>Please click the link below to verify your email address:</p>
            <a href="${verificationLink}">Verify Email</a>
            <p>This link will expire in 24 hours.</p>
        `
    };

    await transporter.sendMail(mailOptions);
    console.log('SendEmail - Verification email sent successfully');
}