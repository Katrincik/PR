const { Sequelize, DataTypes } = require('sequelize');
const express = require('express');
const multer = require('multer');
const fs = require('fs');

// Initialize Express and Sequelize
const app = express();
// Middleware to parse JSON bodies
app.use(express.json());

const sequelize = new Sequelize('PR_lab2', 'postgres', 'postgres', {
    host: 'localhost',
    dialect: 'postgres',
});

const Book = sequelize.define('Book', {
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    price: {
        type: DataTypes.DECIMAL,
        allowNull: false,
    },
});

(async () => {
    await sequelize.sync();
})();

// CREATE - add a new book
app.post('/books', async (req, res) => {
    try {
        const {title, price} = req.body;
        const newBook = await Book.create({title, price});
        res.status(201).json(newBook);
    } catch (error) {
        res.status(400).json({ error: error.message});
    }
});

// GET - get book by ID
app.get('/books', async (req, res) => {
    const {offset=0, limit=5} = req.query;
    try {
        const book = await Book.findAll({
            offset: parseInt(offset),
            limit: parseInt(limit)
        });
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: error.message});
    }
});

// UPDATE - update a book by ID
app.put('/books', async (req, res) => {
    const {id} = req.body;
    const {title, price} = req.body;
    try {
        const book = await Book.findByPk(id);
        if (book) {
            book.title = title || book.title;
            book.price = price || book.price;
            await book.save();
            res.json(book);
        } else {
            res.status(404).json({error: "Book not found"});
        }
    } catch (error) {
        res.status(500).json({ error: error.message});
    }
});

// DELETE - delete a book by ID
app.delete('/books', async (req, res) => {
    const {id} = req.body;
    try {
        const book = await Book.findByPk(id);
        if (book) {
            await book.destroy();
            res.status(204).end();
        } else {
            res.status(404).json({error: "Book not found"});
        }
    } catch (error) {
        res.status(500).json({ error: error.message});
    }
});

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Route to handle JSON file upload
app.post('/uploadJson', upload.single('file'), (req, res) => {
    // Make sure the file is uploaded
    if (!req.file) {
        return res.status(400).json({error: 'No file uploaded'});
    }

    // Make sure the file is json
    if (req.file.mimetype !== 'application/json') {
        return res.status(400).json({error: 'File should be json'});
    }

    // Read and parse the JSON file
    fs.readFile(req.file.path, 'utf8', (err,data) => {
        if (err) {
            return res.status(500).json({error: 'Failed to read file'});
        }

        try {
            const jsonData = JSON.parse(data);
            res.json({message: 'File uploaded and parsed', data: jsonData});
        } catch {
            return res.status(400).json({error: 'Invalid json format'});
        }
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

