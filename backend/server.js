require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const routes = require('./routes');
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use('/api', routes);
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-canteen', {
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));
app.listen(PORT, () => {
  console.log(`Smart Canteen Backend running on port ${PORT}`);
});
