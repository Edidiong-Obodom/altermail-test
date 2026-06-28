require("dotenv").config();
const nodemailer = require("nodemailer");

const count = parseInt(process.argv[2]);
if (!count || count < 1) {
  console.error("Usage: node concurrency.js <number-of-emails>");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? "2525"),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  tls: { rejectUnauthorized: false },
});

async function sendOne(index) {
  const info = await transporter.sendMail({
    from: process.env.FROM,
    to: process.env.TO,
    subject: `Concurrency test #${index + 1} of ${count}`,
    text: `This is message ${index + 1} of ${count} sent concurrently.`,
  });
  return { index: index + 1, messageId: info.response.match(/messageId=(\S+)/)?.[1] ?? "unknown", response: info.response };
}

(async () => {
  console.log(`Firing ${count} emails concurrently...`);
  const start = Date.now();

  const results = await Promise.allSettled(
    Array.from({ length: count }, (_, i) => sendOne(i))
  );

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  let succeeded = 0;
  let failed = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      succeeded++;
      console.log(`  [OK #${result.value.index}] messageId=${result.value.messageId}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${result.reason?.message ?? result.reason}`);
    }
  }

  console.log(`\nDone in ${elapsed}s — ${succeeded} succeeded, ${failed} failed out of ${count}`);
  transporter.close();
})();
