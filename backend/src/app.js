const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', routes);

// Servir o build do React
const path = require('path');
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// Para qualquer rota que não seja API, retorna o index.html do React
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
  res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
});

module.exports = app; 