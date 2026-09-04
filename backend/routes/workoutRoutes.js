const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// =========================
// GET ALL WORKOUTS FOR USER
// =========================
router.get("/", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                w.id AS workout_id,
                w.workout_name,
                w.workout_date,
                w.notes,
                e.id AS exercise_id,
                e.exercise_name,
                s.id AS set_id,
                s.set_number,
                s.weight,
                s.reps
             FROM workouts w
             LEFT JOIN exercises e
                ON w.id = e.workout_id
             LEFT JOIN sets s
                ON e.id = s.exercise_id
             WHERE w.user_id = $1
             ORDER BY w.workout_date DESC, w.id DESC,
                      e.id ASC, s.set_number ASC`,
            [req.user.id]
        );

        const workouts = {};

        result.rows.forEach(row => {
            if (!workouts[row.workout_id]) {
                workouts[row.workout_id] = {
                    id: row.workout_id,
                    workoutName: row.workout_name,
                    workoutDate: row.workout_date,
                    notes: row.notes,
                    exercises: []
                };
            }

            if (row.exercise_id) {
                let exercise = workouts[row.workout_id].exercises
                    .find(e => e.id === row.exercise_id);

                if (!exercise) {
                    exercise = {
                        id: row.exercise_id,
                        name: row.exercise_name,
                        sets: []
                    };

                    workouts[row.workout_id].exercises.push(exercise);
                }

                if (row.set_id) {
                    exercise.sets.push({
                        id: row.set_id,
                        setNumber: row.set_number,
                        weight: Number(row.weight),
                        reps: row.reps
                    });
                }
            }
        });

        res.json(Object.values(workouts));

    } catch (error) {
        console.error("Get workouts error:", error);

        res.status(500).json({
            message: "Server error while getting workouts"
        });
    }
});


// =========================
// CREATE WORKOUT
// =========================
router.post("/", authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            workoutName,
            workoutDate,
            planId,
            notes,
            exercises
        } = req.body;

        if (!workoutName || !workoutDate) {
            return res.status(400).json({
                message: "Workout name and date are required"
            });
        }

        await client.query("BEGIN");

        // Create workout
        const workoutResult = await client.query(
            `INSERT INTO workouts
            (
                user_id,
                plan_id,
                workout_name,
                workout_date,
                notes
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                req.user.id,
                planId || null,
                workoutName,
                workoutDate,
                notes || null
            ]
        );

        const workout = workoutResult.rows[0];

        // Create exercises and sets
        if (Array.isArray(exercises)) {
            for (const exercise of exercises) {

                if (!exercise.name) {
                    continue;
                }

                const exerciseResult = await client.query(
                    `INSERT INTO exercises
                    (workout_id, exercise_name)
                    VALUES ($1, $2)
                    RETURNING *`,
                    [
                        workout.id,
                        exercise.name
                    ]
                );

                const exerciseRow = exerciseResult.rows[0];

                if (Array.isArray(exercise.sets)) {
                    for (let i = 0; i < exercise.sets.length; i++) {

                        const set = exercise.sets[i];

                        await client.query(
                            `INSERT INTO sets
                            (
                                exercise_id,
                                set_number,
                                weight,
                                reps
                            )
                            VALUES ($1, $2, $3, $4)`,
                            [
                                exerciseRow.id,
                                i + 1,
                                set.weight || 0,
                                set.reps
                            ]
                        );
                    }
                }
            }
        }

        await client.query("COMMIT");

        res.status(201).json({
            message: "Workout saved successfully",
            workout
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Create workout error:", error);

        res.status(500).json({
            message: "Server error while saving workout"
        });

    } finally {
        client.release();
    }
});


// =========================
// DELETE WORKOUT
// =========================
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM workouts
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [
                req.params.id,
                req.user.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Workout not found"
            });
        }

        res.json({
            message: "Workout deleted successfully"
        });

    } catch (error) {
        console.error("Delete workout error:", error);

        res.status(500).json({
            message: "Server error while deleting workout"
        });
    }
});

module.exports = router;