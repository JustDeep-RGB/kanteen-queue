console.log("MONGO URI:", process.env.MONGODB_URI);
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const routes = require('./routes');
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', routes);
console.log("MONGO URI:", process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI, {})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err.message));
app.listen(PORT, () => {
  console.log(`Smart Canteen Backend running on port ${PORT}`);
});
