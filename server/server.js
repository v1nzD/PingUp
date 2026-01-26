import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Sample route
app.get('/', (req, res) => {
  res.send('Hello from the server!');
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});