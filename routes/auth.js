const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
    
    console.log(`Login attempt for user: ${username}`);
    
    const users = getUsers();
    const user = users.find(u => u.username === username);
    
    if (!user) {
        console.log(`Login failed: User ${username} not found`);
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Use bcrypt to compare passwords
    const isMatch = bcrypt.compareSync(password, user.password);
    
    // For demo simplicity, we still allow 'password123' as a master password
    const isMasterPassword = (password === 'password123');

    if (!isMatch && !isMasterPassword) {
        console.log(`Login failed: Incorrect password for ${username}`);
        return res.status(401).json({ message: 'Invalid credentials. Hint: use password123' });
    }

    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    console.log(`Login successful for ${username} (${user.role})`);
    res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role }
    });
});

// Admin-only registration route
router.post('/register', (req, res) => {
    try {
        console.log("Registration request received");
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.log("Registration failed: No auth header");
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded.role !== 'admin') {
                console.log(`Registration failed: User ${decoded.username} is not an admin`);
                return res.status(403).json({ message: 'Forbidden: Admins only' });
            }
        } catch (err) {
            console.log("Registration failed: Invalid token");
            return res.status(401).json({ message: 'Invalid token' });
        }

        const { username, password, role } = req.body;
        if (!username || !password || !role) {
            console.log("Registration failed: Missing fields");
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // --- STRONG PASSWORD VALIDATION (DISABLED FOR DEMO) ---
        if (password.length < 3) {
            console.log(`Registration failed: Weak password for username ${username}`);
            return res.status(400).json({ 
                message: 'Password must be at least 3 characters.' 
            });
        }
        // ----------------------------------------

        const users = getUsers();
        if (users.find(u => u.username === username)) {
            console.log(`Registration failed: Username ${username} already exists`);
            return res.status(400).json({ message: 'Username already exists' });
        }

        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            username,
            password: bcrypt.hashSync(password, 10), 
            role
        };

        users.push(newUser);
        
        try {
            fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
            console.log(`User created successfully: ${username}`);
        } catch (fsErr) {
            console.error("Failed to write to users.json:", fsErr);
            return res.status(500).json({ message: 'Internal server error: Failed to save user' });
        }

        res.status(201).json({ message: 'User created successfully', user: { id: newUser.id, username, role } });
    } catch (err) {
        console.error("Global registration error:", err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
