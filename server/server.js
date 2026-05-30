const express = require('express');
const cors = require('cors');
require('dotenv').config();

const askRoute = require('./routes/ask');
const complianceRoute = require('./routes/compliance');
const violationsRoute = require('./routes/violations');
const approvalsRoute = require('./routes/approvals');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, product: 'BrimIQ' });
});

app.use('/api', askRoute);
app.use('/api', complianceRoute);
app.use('/api', violationsRoute);
app.use('/api', approvalsRoute);

app.listen(PORT, () => {
  console.log(`BrimIQ backend listening on port ${PORT}`);
});
