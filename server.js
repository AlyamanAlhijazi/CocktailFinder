require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connectie
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Verbonden met MongoDB'))
  .catch(err => console.error('Database connectie mislukt:', err));

app.listen(PORT, () => console.log(`Server draait op http://localhost:${PORT}`));

// routes
const cocktailRoutes = require('./routes/cocktailRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/cocktails', cocktailRoutes);
app.use('/users', userRoutes);
