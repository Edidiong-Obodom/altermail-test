# altermail-test

Manual test scripts for the Altermail SMTP submission server.

## Setup

```bash
npm install
```

Create a `.env` file (already exists, do not commit it):

```env
SMTP_HOST=smtp.altermail-console.com.ng
SMTP_PORT=2525
SMTP_USER=apikey              # or your verified sender domain e.g. reventlify.com
SMTP_PASS=<your-api-key>
FROM=noreply@yourdomain.com
TO=your-inbox@example.com
```

> Set `SMTP_USER` to your verified sender domain to enable DKIM signing.
> Set it to the literal string `apikey` to skip domain pre-validation at AUTH (domain is verified at send time instead).

---

## Scripts

### `send.js` — single send

Sends one email and prints the Altermail-assigned `messageId` from the `250` response.

```bash
node send.js
```

**What to check:**
- `Message sent: <...>` — nodemailer message ID (client-side, ignore this)
- `Response: 250 OK messageId=<uuid>` — Altermail messageId, use this to query delivery events
- MongoDB `deliveryEvents` collection — should show `status: "sent"` immediately, then `status: "delivered"` within a few seconds

---

### `concurrency.js` — concurrent sends

Fires N emails simultaneously using `Promise.allSettled`. Use this to test quota deduction accuracy and connection-limit enforcement under load.

```bash
node concurrency.js <number>
```

**Examples:**
```bash
node concurrency.js 2    # within Free plan limit (2 concurrent connections)
node concurrency.js 10   # exceeds Free plan limit — 8 will fail with 421 4.4.5
```

**What to check:**
- `[OK #N] messageId=<uuid>` — succeeded sends with their messageIds
- `[FAIL] 421 4.4.5 Too many concurrent connections` — expected when over plan limit
- MongoDB `emailsUsed` / `dailyUsed` — should increment only for succeeded sends, not for rejected ones
- Summary line: `X succeeded, Y failed out of N`

**Plan connection limits for reference:**

| Plan       | Max concurrent connections |
|------------|---------------------------|
| Free       | 2                         |
| Developer  | 5                         |
| Growth     | 10                        |
| Business   | 25                        |
| Enterprise | 50                        |
