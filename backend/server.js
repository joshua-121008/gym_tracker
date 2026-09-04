const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const pool = require("./db");

const authRoutes = require("./routes/authRoutes");
const planRoutes = require("./routes/planRoutes");
const programRoutes = require("./routes/programRoutes");
const workoutRoutes = require("./routes/workoutRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static(path.join(__dirname, "..")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/workouts", workoutRoutes);

// API test route
app.get("/api", (req, res) => {
    res.json({
        message: "Gym Tracker API is running"
    });
});

// Database test route
app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            message: "PostgreSQL connection successful",
            time: result.rows[0].now
        });
    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            message: "PostgreSQL connection failed",
            error: error.message
        });
    }
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Gym server running at http://localhost:${PORT}`);
});