const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// =========================
// GET ALL PROGRAMS FOR USER
// =========================
router.get("/", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
             FROM programs
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [req.user.id]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Get programs error:", error);

        res.status(500).json({
            message: "Server error while getting programs"
        });
    }
});


// =========================
// CREATE PROGRAM
// =========================
router.post("/", authenticateToken, async (req, res) => {
    try {
        const {
            name,
            goal,
            duration,
            daysPerWeek,
            startDate,
            description
        } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Program name is required"
            });
        }

        const result = await pool.query(
            `INSERT INTO programs
            (
                user_id,
                name,
                goal,
                duration,
                days_per_week,
                start_date,
                description
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                req.user.id,
                name,
                goal || null,
                duration || null,
                daysPerWeek || null,
                startDate || null,
                description || null
            ]
        );

        res.status(201).json({
            message: "Program created successfully",
            program: result.rows[0]
        });

    } catch (error) {
        console.error("Create program error:", error);

        res.status(500).json({
            message: "Server error while creating program"
        });
    }
});


// =========================
// DELETE PROGRAM
// =========================
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM programs
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Program not found"
            });
        }

        res.json({
            message: "Program deleted successfully"
        });

    } catch (error) {
        console.error("Delete program error:", error);

        res.status(500).json({
            message: "Server error while deleting program"
        });
    }
});

module.exports = router;