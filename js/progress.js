document.addEventListener("DOMContentLoaded", async () => {

    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const token = localStorage.getItem("gymToken");

    if (!token) {
        window.location.href = "login.html";
        return;
    }


    // =====================================================
    // ELEMENTS
    // =====================================================

    const exerciseSelect = document.getElementById("progressExercise");
    const periodSelect = document.getElementById("progressPeriod");
    const canvas = document.getElementById("progressChart");
    const chartEmpty = document.getElementById("chartEmpty");
    const summary = document.getElementById("progressSummary");
    const logoutButton = document.getElementById("logoutButton");

    const progressBest = document.getElementById("progressBest");
    const progressStarting = document.getElementById("progressStarting");
    const progressImprovement = document.getElementById("progressImprovement");
    const progressWorkoutCount = document.getElementById("progressWorkoutCount");

    let workouts = [];
    let progressChart = null;


    // =====================================================
    // LOGOUT
    // =====================================================

    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }

    function logout() {
        localStorage.removeItem("gymToken");
        localStorage.removeItem("gymCurrentUser");
        window.location.href = "login.html";
    }


    // =====================================================
    // LOAD WORKOUTS
    // =====================================================

    async function loadWorkouts() {

        try {

            const response = await fetch("/api/workouts", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.status === 401 || response.status === 403) {
                logout();
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load workouts"
                );
            }

            workouts = Array.isArray(data) ? data : [];

            console.log("Progress API:", workouts);

            loadExercises();

        } catch (error) {

            console.error("Progress error:", error);

            summary.innerHTML = `
                <div class="empty-state">
                    <h3>Unable to load progress</h3>
                    <p>
                        ${escapeHTML(
                            error.message || "Something went wrong."
                        )}
                    </p>
                </div>
            `;
        }
    }


    // =====================================================
    // LOAD EXERCISES
    // =====================================================

    function loadExercises() {

        const exerciseNames = new Set();

        workouts.forEach(workout => {

            if (!Array.isArray(workout.exercises)) {
                return;
            }

            workout.exercises.forEach(exercise => {

                if (exercise.name) {
                    exerciseNames.add(exercise.name);
                }

            });

        });


        const sortedExercises = [...exerciseNames].sort(
            (a, b) => a.localeCompare(b)
        );


        exerciseSelect.innerHTML = `
            <option value="">Select an exercise</option>
        `;


        sortedExercises.forEach(name => {

            const option = document.createElement("option");

            option.value = name;
            option.textContent = name;

            exerciseSelect.appendChild(option);

        });


        console.log(
            "Exercises found:",
            sortedExercises
        );


        if (sortedExercises.length > 0) {

            exerciseSelect.value = sortedExercises[0];

            updateProgress();

        } else {

            clearProgress();

        }
    }


    // =====================================================
    // EVENT LISTENERS
    // =====================================================

    exerciseSelect.addEventListener(
        "change",
        updateProgress
    );

    periodSelect.addEventListener(
        "change",
        updateProgress
    );


    // =====================================================
    // UPDATE PROGRESS
    // =====================================================

    function updateProgress() {

        const exerciseName = exerciseSelect.value;

        if (!exerciseName) {
            clearProgress();
            return;
        }


        const progressData = getProgressData(
            exerciseName
        );


        console.log(
            "Selected exercise:",
            exerciseName
        );

        console.log(
            "Progress data:",
            progressData
        );


        if (progressData.length === 0) {

            clearChart();
            resetMetrics();

            summary.innerHTML = `
                <div class="empty-state">
                    <h3>No data available</h3>
                    <p>
                        No weight data found for
                        ${escapeHTML(exerciseName)}
                        in this time period.
                    </p>
                </div>
            `;

            return;
        }


        drawChart(
            progressData,
            exerciseName
        );


        updateMetrics(
            progressData
        );


        showSummary(
            progressData,
            exerciseName
        );
    }


    // =====================================================
    // GET PROGRESS DATA
    // =====================================================

    function getProgressData(exerciseName) {

        const period = periodSelect.value;

        const today = new Date();

        const result = [];


        workouts.forEach(workout => {

            if (
                !Array.isArray(workout.exercises) ||
                workout.exercises.length === 0
            ) {
                return;
            }


            const workoutDate = new Date(
                workout.workoutDate
            );


            if (period !== "all") {

                const days = Number(period);

                const difference =
                    (
                        today - workoutDate
                    ) /
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    );


                if (
                    difference < 0 ||
                    difference > days
                ) {
                    return;
                }
            }


            workout.exercises.forEach(exercise => {

                if (!exercise.name) {
                    return;
                }


                if (
                    exercise.name.toLowerCase() !==
                    exerciseName.toLowerCase()
                ) {
                    return;
                }


                if (
                    !Array.isArray(exercise.sets) ||
                    exercise.sets.length === 0
                ) {
                    return;
                }


                let maxWeight = 0;


                exercise.sets.forEach(set => {

                    const weight = Number(
                        set.weight || 0
                    );


                    if (weight > maxWeight) {
                        maxWeight = weight;
                    }

                });


                if (maxWeight > 0) {

                    result.push({
                        date: workout.workoutDate,
                        weight: maxWeight
                    });

                }

            });

        });


        result.sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );


        return result;
    }


    // =====================================================
    // DRAW CHART
    // =====================================================

    function drawChart(data, exerciseName) {

        if (!canvas) {
            return;
        }


        if (typeof Chart === "undefined") {

            console.error(
                "Chart.js was not loaded."
            );

            return;
        }


        if (progressChart) {

            progressChart.destroy();

            progressChart = null;
        }


        if (chartEmpty) {
            chartEmpty.style.display = "none";
        }


        const ctx = canvas.getContext("2d");


        const labels = data.map(item =>
            formatShortDate(item.date)
        );


        const values = data.map(item =>
            Number(item.weight)
        );


        progressChart = new Chart(ctx, {

            type: "line",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            `${exerciseName} - Maximum Weight`,

                        data: values,

                        tension: 0.3,

                        borderWidth: 3,

                        pointRadius: 5,

                        pointHoverRadius: 7,

                        fill: false
                    }

                ]
            },


            options: {

                responsive: true,

                maintainAspectRatio: false,


                interaction: {
                    intersect: false,
                    mode: "index"
                },


                plugins: {

                    legend: {
                        display: true
                    },


                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                return (
                                    ` ${context.parsed.y} kg`
                                );

                            }

                        }

                    }

                },


                scales: {

                    y: {

                        beginAtZero: true,

                        title: {

                            display: true,

                            text: "Weight (kg)"
                        }

                    },


                    x: {

                        title: {

                            display: true,

                            text: "Workout Date"
                        }

                    }

                }

            }

        });
    }


    // =====================================================
    // UPDATE METRICS
    // =====================================================

    function updateMetrics(data) {

        const weights = data.map(item =>
            Number(item.weight)
        );


        const startingWeight = weights[0];

        const bestWeight = Math.max(
            ...weights
        );

        const latestWeight =
            weights[weights.length - 1];


        const improvement =
            latestWeight -
            startingWeight;


        if (progressBest) {

            progressBest.textContent =
                `${bestWeight.toFixed(1)} kg`;
        }


        if (progressStarting) {

            progressStarting.textContent =
                `${startingWeight.toFixed(1)} kg`;
        }


        if (progressImprovement) {

            if (improvement > 0) {

                progressImprovement.textContent =
                    `+${improvement.toFixed(1)} kg`;

            } else if (improvement < 0) {

                progressImprovement.textContent =
                    `${improvement.toFixed(1)} kg`;

            } else {

                progressImprovement.textContent =
                    "No change";
            }
        }


        if (progressWorkoutCount) {

            progressWorkoutCount.textContent =
                data.length;
        }
    }


    // =====================================================
    // PROFESSIONAL PERFORMANCE ANALYSIS
    // =====================================================

    function showSummary(data, exerciseName) {

        const first = data[0];

        const latest =
            data[data.length - 1];


        const weights = data.map(item =>
            Number(item.weight)
        );


        const bestWeight =
            Math.max(...weights);


        const lowestWeight =
            Math.min(...weights);


        const firstWeight =
            Number(first.weight);


        const latestWeight =
            Number(latest.weight);


        const totalSessions =
            data.length;


        // -------------------------------------------------
        // OVERALL IMPROVEMENT
        // -------------------------------------------------

        const improvement =
            latestWeight -
            firstWeight;


        let percentageChange = 0;


        if (firstWeight > 0) {

            percentageChange =
                (
                    improvement /
                    firstWeight
                ) * 100;
        }


        // -------------------------------------------------
        // STATUS
        // -------------------------------------------------

        let status = "Maintaining";


        if (improvement > 0) {

            status = "Improving";

        } else if (improvement < 0) {

            status = "Needs Attention";
        }


        // -------------------------------------------------
        // BEST SESSION
        // -------------------------------------------------

        const bestSession =
            data.reduce(
                (best, current) =>
                    Number(current.weight) >
                    Number(best.weight)
                        ? current
                        : best,
                data[0]
            );


        // -------------------------------------------------
        // RECENT TREND
        // -------------------------------------------------

        let recentTrend = "Stable";


        if (data.length >= 3) {

            const recent =
                data
                    .slice(-3)
                    .map(item =>
                        Number(item.weight)
                    );


            const recentChange =
                recent[recent.length - 1] -
                recent[0];


            if (recentChange > 0) {

                recentTrend = "Positive";

            } else if (recentChange < 0) {

                recentTrend = "Negative";
            }
        }


        // -------------------------------------------------
        // PERFORMANCE SCORE
        // -------------------------------------------------

        let score = 50;


        if (improvement > 0) {

            score += 20;

        } else if (improvement < 0) {

            score -= 15;
        }


        if (totalSessions >= 10) {

            score += 20;

        } else if (totalSessions >= 5) {

            score += 10;

        } else if (totalSessions <= 2) {

            score -= 5;
        }


        if (recentTrend === "Positive") {

            score += 10;

        } else if (recentTrend === "Negative") {

            score -= 10;
        }


        score = Math.max(
            0,
            Math.min(100, score)
        );


        // -------------------------------------------------
        // RECOMMENDATION
        // -------------------------------------------------

        let recommendation;


        if (
            improvement > 0 &&
            recentTrend === "Positive"
        ) {

            recommendation =
                "Your strength trend is positive. Continue progressive overload while maintaining good technique and recovery.";

        } else if (
            improvement > 0 &&
            recentTrend === "Stable"
        ) {

            recommendation =
                "You have improved overall, but your recent performances have stabilized. Consider a small, controlled increase in training load.";

        } else if (
            improvement === 0
        ) {

            recommendation =
                "Your performance is currently stable. Focus on consistency, technique, recovery, and gradually increasing training stimulus.";

        } else {

            recommendation =
                "Your recent performance is below your starting level. Prioritize recovery, technique, consistency, and manageable training loads before increasing intensity.";
        }


        // -------------------------------------------------
        // CHANGE DISPLAY
        // -------------------------------------------------

        let progressDisplay = "No change";


        if (improvement > 0) {

            progressDisplay =
                `+${improvement.toFixed(1)} kg`;

        } else if (improvement < 0) {

            progressDisplay =
                `${improvement.toFixed(1)} kg`;
        }


        // -------------------------------------------------
        // RENDER
        // -------------------------------------------------

        summary.innerHTML = `

            <div class="analysis-header">

                <div>

                    <span class="analysis-label">
                        PERFORMANCE ANALYSIS
                    </span>

                    <h3>
                        ${escapeHTML(exerciseName)}
                    </h3>

                    <p>
                        Based on ${totalSessions}
                        recorded
                        ${
                            totalSessions === 1
                                ? "session"
                                : "sessions"
                        }
                    </p>

                </div>


                <div class="performance-status">

                    <span>STATUS</span>

                    <strong>
                        ${status}
                    </strong>

                </div>

            </div>


            <div class="analysis-metrics">

                <div class="analysis-metric">

                    <span>Starting</span>

                    <strong>
                        ${firstWeight.toFixed(1)} kg
                    </strong>

                    <small>
                        ${formatDate(first.date)}
                    </small>

                </div>


                <div class="analysis-metric">

                    <span>Latest</span>

                    <strong>
                        ${latestWeight.toFixed(1)} kg
                    </strong>

                    <small>
                        ${formatDate(latest.date)}
                    </small>

                </div>


                <div class="analysis-metric">

                    <span>Personal Best</span>

                    <strong>
                        ${bestWeight.toFixed(1)} kg
                    </strong>

                    <small>
                        ${formatDate(bestSession.date)}
                    </small>

                </div>


                <div class="analysis-metric">

                    <span>Overall Change</span>

                    <strong>
                        ${progressDisplay}
                    </strong>

                    <small>
                        ${percentageChange.toFixed(1)}%
                    </small>

                </div>

            </div>


            <div class="analysis-grid">

                <div class="analysis-card">

                    <span class="analysis-card-label">
                        RECENT TREND
                    </span>

                    <strong>
                        ${recentTrend}
                    </strong>

                    <p>
                        ${
                            recentTrend === "Positive"
                                ? "Your latest sessions show upward movement."
                                : recentTrend === "Negative"
                                    ? "Your latest sessions show a decline."
                                    : "Your latest sessions are relatively stable."
                        }
                    </p>

                </div>


                <div class="analysis-card">

                    <span class="analysis-card-label">
                        BEST PERFORMANCE
                    </span>

                    <strong>
                        ${bestWeight.toFixed(1)} kg
                    </strong>

                    <p>
                        Your highest recorded weight
                        for this exercise.
                    </p>

                </div>


                <div class="analysis-card">

                    <span class="analysis-card-label">
                        TRAINING SESSIONS
                    </span>

                    <strong>
                        ${totalSessions}
                    </strong>

                    <p>
                        Recorded sessions for this
                        exercise in the selected period.
                    </p>

                </div>

            </div>


            <div class="performance-score">

                <div>

                    <span>
                        PERFORMANCE SCORE
                    </span>

                    <strong>
                        ${score}
                        <small>/100</small>
                    </strong>

                </div>


                <div class="score-bar">

                    <div
                        class="score-progress"
                        style="width: ${score}%"
                    ></div>

                </div>

            </div>


            <div class="coach-insight">

                <div class="coach-icon">
                    💡
                </div>

                <div>

                    <span>
                        COACH INSIGHT
                    </span>

                    <p>
                        ${escapeHTML(recommendation)}
                    </p>

                </div>

            </div>


            <div class="analysis-footer">

                <div>

                    <span>
                        Lowest Recorded
                    </span>

                    <strong>
                        ${lowestWeight.toFixed(1)} kg
                    </strong>

                </div>


                <div>

                    <span>
                        Best Session
                    </span>

                    <strong>
                        ${formatDate(bestSession.date)}
                    </strong>

                </div>


                <div>

                    <span>
                        Current vs Best
                    </span>

                    <strong>
                        ${
                            (
                                latestWeight -
                                bestWeight
                            ).toFixed(1)
                        } kg
                    </strong>

                </div>

            </div>

        `;
    }


    // =====================================================
    // CLEAR PROGRESS
    // =====================================================

    function clearProgress() {

        clearChart();

        resetMetrics();

        showEmptySummary();
    }


    // =====================================================
    // CLEAR CHART
    // =====================================================

    function clearChart() {

        if (progressChart) {

            progressChart.destroy();

            progressChart = null;
        }


        if (canvas) {

            const ctx =
                canvas.getContext("2d");

            ctx.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );
        }


        if (chartEmpty) {

            chartEmpty.style.display =
                "flex";
        }
    }


    // =====================================================
    // RESET METRICS
    // =====================================================

    function resetMetrics() {

        if (progressBest) {
            progressBest.textContent = "—";
        }

        if (progressStarting) {
            progressStarting.textContent = "—";
        }

        if (progressImprovement) {
            progressImprovement.textContent = "—";
        }

        if (progressWorkoutCount) {
            progressWorkoutCount.textContent = "—";
        }
    }


    // =====================================================
    // EMPTY SUMMARY
    // =====================================================

    function showEmptySummary() {

        summary.innerHTML = `

            <div class="empty-state">

                <h3>
                    Select an exercise
                </h3>

                <p>
                    Choose an exercise above
                    to view your progress.
                </p>

            </div>

        `;
    }


    // =====================================================
    // DATE FORMAT
    // =====================================================

    function formatDate(dateString) {

        const date =
            new Date(dateString);


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }


    function formatShortDate(dateString) {

        const date =
            new Date(dateString);


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short"
            }
        );
    }


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    function escapeHTML(value) {

        const div =
            document.createElement("div");

        div.textContent =
            value ?? "";

        return div.innerHTML;
    }


    // =====================================================
    // START
    // =====================================================

    await loadWorkouts();

});