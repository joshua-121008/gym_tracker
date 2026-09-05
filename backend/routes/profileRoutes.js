const express = require("express");
const bcrypt = require("bcrypt");

const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();


// ==========================================
// GET USER PROFILE
// ==========================================

router.get("/", authenticateToken, async (req, res) => {

    try {

        const result = await pool.query(
            `SELECT id, full_name, username, email, created_at
             FROM users
             WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "User not found"
            });

        }

        const user = result.rows[0];

        res.json({
            id: user.id,
            fullName: user.full_name,
            username: user.username,
            email: user.email,
            createdAt: user.created_at
        });

    } catch (error) {

        console.error("Get profile error:", error);

        res.status(500).json({
            message: "Failed to load profile"
        });

    }

});


// ==========================================
// UPDATE USER PROFILE
// ==========================================

router.put("/", authenticateToken, async (req, res) => {

    const { fullName, username, email } = req.body;

    if (!fullName || !username || !email) {

        return res.status(400).json({
            message: "Full name, username and email are required"
        });

    }

    try {

        const existingUser = await pool.query(
            `SELECT id
             FROM users
             WHERE (username = $1 OR email = $2)
             AND id != $3`,
            [username, email, req.user.id]
        );

        if (existingUser.rows.length > 0) {

            return res.status(409).json({
                message: "Username or email is already in use"
            });

        }


        const result = await pool.query(
            `UPDATE users
             SET full_name = $1,
                 username = $2,
                 email = $3
             WHERE id = $4
             RETURNING id, full_name, username, email, created_at`,
            [
                fullName,
                username,
                email,
                req.user.id
            ]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "User not found"
            });

        }


        const user = result.rows[0];


        res.json({
            message: "Profile updated successfully",

            user: {
                id: user.id,
                fullName: user.full_name,
                username: user.username,
                email: user.email,
                createdAt: user.created_at
            }
        });

    } catch (error) {

        console.error("Update profile error:", error);

        res.status(500).json({
            message: "Failed to update profile"
        });

    }

});


// ==========================================
// CHANGE PASSWORD
// ==========================================

router.put("/password", authenticateToken, async (req, res) => {

    const {
        currentPassword,
        newPassword
    } = req.body;


    if (!currentPassword || !newPassword) {

        return res.status(400).json({
            message: "Current password and new password are required"
        });

    }


    if (newPassword.length < 6) {

        return res.status(400).json({
            message: "New password must contain at least 6 characters"
        });

    }


    try {

        const result = await pool.query(
            `SELECT password_hash
             FROM users
             WHERE id = $1`,
            [req.user.id]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "User not found"
            });

        }


        const user = result.rows[0];


        const passwordMatch = await bcrypt.compare(
            currentPassword,
            user.password_hash
        );


        if (!passwordMatch) {

            return res.status(401).json({
                message: "Current password is incorrect"
            });

        }


        const newPasswordHash = await bcrypt.hash(
            newPassword,
            10
        );


        await pool.query(
            `UPDATE users
             SET password_hash = $1
             WHERE id = $2`,
            [
                newPasswordHash,
                req.user.id
            ]
        );


        res.json({
            message: "Password changed successfully"
        });

    } catch (error) {

        console.error("Change password error:", error);

        res.status(500).json({
            message: "Failed to change password"
        });

    }

});


// ==========================================
// DELETE ACCOUNT
// ==========================================

router.delete("/", authenticateToken, async (req, res) => {

    try {

        const result = await pool.query(
            `DELETE FROM users
             WHERE id = $1
             RETURNING id`,
            [req.user.id]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "User not found"
            });

        }


        res.json({
            message: "Account deleted successfully"
        });

    } catch (error) {

        console.error("Delete account error:", error);

        res.status(500).json({
            message: "Failed to delete account"
        });

    }

});


module.exports = router;