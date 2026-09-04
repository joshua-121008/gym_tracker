const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../db");

const router = express.Router();

// =========================
// REGISTER
// =========================
router.post("/register", async (req, res) => {
    try {
        const {
            fullName,
            username,
            email,
            password
        } = req.body;

        // Check required fields
        if (!fullName || !username || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        // Check existing username/email
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE username = $1 OR email = $2",
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: "Username or email already exists"
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const result = await pool.query(
            `INSERT INTO users
            (full_name, username, email, password_hash)
            VALUES ($1, $2, $3, $4)
            RETURNING id, full_name, username, email, created_at`,
            [fullName, username, email, passwordHash]
        );

        res.status(201).json({
            message: "Registration successful",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            message: "Server error during registration"
        });
    }
});


// =========================
// LOGIN
// =========================
router.post("/login", async (req, res) => {
    try {
        const {
            username,
            password
        } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username/email and password are required"
            });
        }

        // Find user by username OR email
        const result = await pool.query(
            `SELECT *
             FROM users
             WHERE username = $1 OR email = $1`,
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid username/email or password"
            });
        }

        const user = result.rows[0];

        // Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid username/email or password"
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: "Server error during login"
        });
    }
});

module.exports = router;
