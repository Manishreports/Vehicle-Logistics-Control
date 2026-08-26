const express = require('express');
const cors = require('cors');

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sto-vehicle-management-system' });
});

app.get('/api/dashboard', (_req, res) => {
  res.json({
    totalVehicles: 0,
    plannedVehicles: 0,
    pendingVehicles: 0,
    dispatchedVehicles: 0,
    cancelledVehicles: 0
  });
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
