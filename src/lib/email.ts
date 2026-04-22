import nodemailer from 'nodemailer';

// You will need to provide actual SMTP credentials here via environment variables
// e.g., SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendTicketConfirmationEmail = async (
  toEmail: string,
  customerName: string,
  ticketId: string,
  issueDescription: string
) => {
  // This is a placeholder format. 
  // We will replace this with whatever template you provide.
  const mailOptions = {
    from: process.env.SMTP_FROM || '"AquaBot Support" <support@aquabot.com>',
    to: toEmail,
    subject: `Support Ticket Created - ${ticketId}`,
    html: `
      <h2>Hello ${customerName},</h2>
      <p>Your support ticket has been successfully created.</p>
      <p><strong>Ticket ID:</strong> ${ticketId}</p>
      <p><strong>Issue Description:</strong> ${issueDescription}</p>
      <br/>
      <p>We will get back to you shortly.</p>
      <p>Best Regards,<br>AquaBot Support Team</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email: ', error);
    return false;
  }
};
