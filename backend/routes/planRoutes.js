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
            `SELECT
                p.id,
                p.user_id,
                p.name,
                p.description,
                p.goal,
                p.program_id,
                p.created_at,
                pr.name AS program_name
             FROM plans p
             LEFT JOIN programs pr
                ON p.program_id = pr.id
                AND pr.user_id = p.user_id
             WHERE p.user_id = $1
             ORDER BY p.created_at DESC`,
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
            goal,
            programId
        } = req.body;


        // Validate name

        if (!name || !name.trim()) {

            return res.status(400).json({
                message: "Plan name is required"
            });

        }


        // Validate program if supplied

        if (programId) {

            const programCheck = await pool.query(
                `SELECT id
                 FROM programs
                 WHERE id = $1
                 AND user_id = $2`,
                [programId, req.user.id]
            );

            if (programCheck.rows.length === 0) {

                return res.status(404).json({
                    message: "Program not found"
                });

            }

        }


        // Create plan

        const result = await pool.query(
            `INSERT INTO plans
            (
                user_id,
                name,
                description,
                goal,
                program_id
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                req.user.id,
                name.trim(),
                description || null,
                goal || null,
                programId || null
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
             WHERE id = $1
             AND user_id = $2
             RETURNING id`,
            [
                req.params.id,
                req.user.id
            ]
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