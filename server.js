const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize DB
const db = new sqlite3.Database('queue.db', (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to SQLite DB');
});

// Create queue table
db.run(`CREATE TABLE IF NOT EXISTS queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  stand INTEGER NOT NULL
)`);

// Get queue for a stand
app.get('/queue/:stand', (req, res) => {
    const stand = req.params.stand;
    db.all(`SELECT * FROM queue WHERE stand = ? ORDER BY id`, [stand], (err, rows) => {
        if (err) res.status(500).send(err);
        else res.json(rows);
    });
});

// Add to queue
app.post('/queue/:stand', (req, res) => {
    const { name } = req.body;
    const stand = req.params.stand;
    db.run(`INSERT INTO queue (name, stand) VALUES (?, ?)`, [name, stand], function (err) {
        if (err) res.status(500).send(err);
        else res.json({ message: 'Added', id: this.lastID });
    });
});

// Remove from queue (Next)
app.delete('/queue/:stand', (req, res) => {
    const stand = req.params.stand;
    db.get(`SELECT * FROM queue WHERE stand = ? ORDER BY id LIMIT 1`, [stand], (err, row) => {
        if (err) res.status(500).send(err);
        else if (!row) res.status(404).send('Queue Empty');
        else {
            db.run(`DELETE FROM queue WHERE id = ?`, [row.id], function (err) {
                if (err) res.status(500).send(err);
                else res.json({ message: `Removed ${row.name} from Stand ${stand}` });
            });
        }
    });
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
