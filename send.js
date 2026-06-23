require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? "2525"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Allow self-signed / no TLS locally
    rejectUnauthorized: false,
  },
});

async function main() {
  const info = await transporter.sendMail({
    from: process.env.FROM,
    to: process.env.TO,
    subject: "Altermail SMTP test",
    text: "If you see this, the SMTP pipeline is working.",
    html: "<p>If you see this, the SMTP pipeline is working.</p>",
  });

  console.log("Message sent:", info.messageId);
  console.log("Response:", info.response);
}

main().catch((err) => {
  console.error("Send failed:", err.message);
  process.exit(1);
});
