require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const mapRoutes = require('./routes/map.routes');
app.use('/api/v1/map', mapRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Eventofu Map Platform API' });
});

const migrate = require('./database/migrate');

const startServer = async () => {
    await migrate(); // Create tables if not exist

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
