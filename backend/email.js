require('dotenv').config();
const nodemailer = require('nodemailer');

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send a contact form email
const sendContactEmail = async ({ name, email, phone, service, message }) => {
  const mailOptions = {
    from: `"Blade and Snow Services" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // Send the email to yourself
    replyTo: email, // So you can reply directly to the user
    subject: `New Quote Request: ${service}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">New Quote Request</h2>
        <p>You have received a new quote request from your website.</p>
        <hr>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Service of Interest:</strong> ${service}</p>
        <p><strong>Message:</strong></p>
        <p style="padding: 10px; border-left: 3px solid #eee;">${message}</p>
        <hr>
        <p style="font-size: 0.9em; color: #777;">This email was sent from the contact form on your Blade and Snow Services website.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = { sendContactEmail };
