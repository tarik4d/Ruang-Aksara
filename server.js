const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'poems.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ============ DATA HANDLING ============
function readPoems() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            // Data awal jika file belum ada
            const initialData = [
                {
                    id: 1,
                    title: "Rindu yang Tak Bertepi",
                    author: "Muhammad Irwan",
                    content: "Dalam sunyi aku merindukanmu\nSeperti laut merindukan pantai\nSeperti malam merindukan bintang\nKau adalah rindu yang tak bertepi",
                    category: "cinta",
                    date: new Date().toISOString(),
                    views: 0
                },
                {
                    id: 2,
                    title: "Di Bawah Langit Jakarta",
                    author: "Muhammad Irwan",
                    content: "Deru kendaraan tak pernah berhenti\nNamun hatiku tetap sepi\nMencari ketenangan di antara hiruk pikuk\nKota yang tak pernah tidur",
                    category: "kehidupan",
                    date: new Date().toISOString(),
                    views: 0
                }
            ];
            fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data:', error);
        return [];
    }
}

function writePoems(poems) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(poems, null, 2));
}

// ============ API ROUTES ============
// Get all poems
app.get('/api/poems', (req, res) => {
    try {
        const poems = readPoems();
        res.json({ success: true, data: poems });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single poem
app.get('/api/poems/:id', (req, res) => {
    try {
        const poems = readPoems();
        const poem = poems.find(p => p.id === parseInt(req.params.id));
        
        if (!poem) {
            return res.status(404).json({ success: false, message: 'Puisi tidak ditemukan' });
        }
        
        // Increment views
        poem.views += 1;
        writePoems(poems);
        
        res.json({ success: true, data: poem });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create poem
app.post('/api/poems', (req, res) => {
    try {
        const { title, author, content, category } = req.body;
        
        if (!title || !author || !content) {
            return res.status(400).json({ 
                success: false, 
                message: 'Judul, penulis, dan isi puisi wajib diisi' 
            });
        }
        
        const poems = readPoems();
        const newPoem = {
            id: Date.now(),
            title: title.trim(),
            author: author.trim(),
            content: content.trim(),
            category: category || 'lainnya',
            date: new Date().toISOString(),
            views: 0
        };
        
        poems.push(newPoem);
        writePoems(poems);
        
        res.status(201).json({ 
            success: true, 
            data: newPoem,
            message: '✅ Puisi berhasil ditambahkan!' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update poem
app.put('/api/poems/:id', (req, res) => {
    try {
        const poems = readPoems();
        const index = poems.findIndex(p => p.id === parseInt(req.params.id));
        
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Puisi tidak ditemukan' });
        }
        
        const { title, author, content, category } = req.body;
        poems[index] = {
            ...poems[index],
            title: title || poems[index].title,
            author: author || poems[index].author,
            content: content || poems[index].content,
            category: category || poems[index].category
        };
        
        writePoems(poems);
        res.json({ 
            success: true, 
            data: poems[index],
            message: '✅ Puisi berhasil diupdate!' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete poem
app.delete('/api/poems/:id', (req, res) => {
    try {
        const poems = readPoems();
        const filtered = poems.filter(p => p.id !== parseInt(req.params.id));
        
        if (filtered.length === poems.length) {
            return res.status(404).json({ success: false, message: 'Puisi tidak ditemukan' });
        }
        
        writePoems(filtered);
        res.json({ success: true, message: '✅ Puisi berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ ADMIN LOGIN (Simple) ============
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        res.json({ 
            success: true, 
            token: 'simple-token-' + Date.now(),
            message: 'Login berhasil!' 
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Username atau password salah!' 
        });
    }
});

// ============ SERVE FRONTEND ============
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Admin panel: http://localhost:${PORT}/admin`);
    console.log(`👤 Login: ${ADMIN_USER} / ${ADMIN_PASS}`);
});