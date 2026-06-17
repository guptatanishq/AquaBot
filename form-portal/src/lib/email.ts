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
    from: process.env.SMTP_FROM || '"AquaGen Support" <support@aquagen.com>',
    to: toEmail,
    subject: `Issue Received – Ticket ID: ${ticketId}`,
    html: `
      <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
        <h3 style="font-weight: normal; margin-bottom: 24px;">Issue Received – Ticket ID: ${ticketId}</h3>
        <p>Dear ${customerName}</p>
        <p>Thank you for reporting the issue.</p>
        
        <p><strong>Issue:</strong><br/>
        "${issueDescription}"</p>
        
        <ul>
          <li><strong>Ticket ID:</strong> ${ticketId}</li>
          <li><strong>Current Status:</strong> Received</li>
        </ul>
        
        <p>We have successfully received your request and logged it in our system. Our technical team will review the issue to identify and resolve the issue.</p>
        
        <p>We will keep you informed with further updates. Thank you for your patience and cooperation.</p>
        
        <br/>
        <p>
          <strong>Best Regards,</strong><br/>
          <strong>Tanishq Gupta</strong><br/>
          <strong>FluxGen Sustainable Technologies Pvt. Ltd</strong>
        </p>
      </div>
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
