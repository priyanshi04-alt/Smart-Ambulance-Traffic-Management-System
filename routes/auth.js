const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const usersFilePath = path.join(__dirname, '../data/users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_smart_ambulance_key_123';

// Helper to get users
const getUsers = () => {
    try {
        const data = fs.readFileSync(usersFilePath, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
};

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // In a real app we use bcrypt, but for this simulation demo we'll do simple password check
    // "password123" is assumed valid for all seeded users for ease of review
    const users = getUsers();
    const user = users.find(u => u.username === username);
    
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // A real app: const isMatch = await bcrypt.compare(password, user.password);
    // Shortcut for demo: accept any non-empty correctly mapped pass or 'password123'
    if (password !== 'password123') {
        return res.status(401).json({ message: 'Invalid credentials. Hint: use password123' });
    }

    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role }
    });
});

module.exports = router;
