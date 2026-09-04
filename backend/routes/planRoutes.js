const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// =========================
// GET ALL PLANS FOR USER
// =========================
router.get("/", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
             FROM plans
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [req.user.id]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Get plans error:", error);

        res.status(500).json({
            message: "Server error while getting plans"
        });
    }
});


// =========================
// CREATE PLAN
// =========================
router.post("/", authenticateToken, async (req, res) => {
    try {
        const {
            name,
            description,
            goal
        } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Plan name is required"
            });
        }

        const result = await pool.query(
            `INSERT INTO plans
            (user_id, name, description, goal)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                req.user.id,
                name,
                description || null,
                goal || null
            ]
        );

        res.status(201).json({
            message: "Plan created successfully",
            plan: result.rows[0]
        });

    } catch (error) {
        console.error("Create plan error:", error);

        res.status(500).json({
            message: "Server error while creating plan"
        });
    }
});


// =========================
// DELETE PLAN
// =========================
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM plans
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Plan not found"
            });
        }

        res.json({
            message: "Plan deleted successfully"
        });

    } catch (error) {
        console.error("Delete plan error:", error);

        res.status(500).json({
            message: "Server error while deleting plan"
        });
    }
});

module.exports = router;