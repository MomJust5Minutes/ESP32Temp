import express from 'express';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Test server is running!' });
});

app.post('/', (req, res) => {
  console.log('Received data:', req.body);
  res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
});
