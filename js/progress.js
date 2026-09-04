document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("gymToken");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const exerciseSelect =
        document.getElementById("progressExercise");

    const periodSelect =
        document.getElementById("progressPeriod");

    const canvas =
        document.getElementById("progressChart");

    const summary =
        document.getElementById("progressSummary");

    let workouts = [];

    // =====================================
    // LOAD WORKOUTS
    // =====================================

    try {

        const response = await fetch("/api/workouts", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        console.log("Progress API:", data);

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to load workouts"
            );
        }

        workouts = data;

        loadExercises();

    } catch (error) {

        console.error("Progress error:", error);

        summary.innerHTML = `
            <div class="empty-state">
                <h3>Unable to load progress</h3>
                <p>${error.message}</p>
            </div>
        `;
    }


    // =====================================
    // LOAD EXERCISES INTO DROPDOWN
    // =====================================

    function loadExercises() {

        const exerciseNames = new Set();

        workouts.forEach(workout => {

            if (!workout.exercises) {
                return;
            }

            workout.exercises.forEach(exercise => {

                if (exercise.name) {
                    exerciseNames.add(exercise.name);
                }

            });

        });


        exerciseSelect.innerHTML = `
            <option value="">
                Select an exercise
            </option>
        `;


        [...exerciseNames]
            .sort()
            .forEach(name => {

                const option =
                    document.createElement("option");

                option.value = name;

                option.textContent = name;

                exerciseSelect.appendChild(option);

            });


        console.log(
            "Exercises found:",
            [...exerciseNames]
        );


        // Automatically select first exercise
        if (exerciseNames.size > 0) {

            exerciseSelect.value =
                [...exerciseNames][0];

            updateProgress();

        }

    }


    // =====================================
    // EXERCISE CHANGE
    // =====================================

    exerciseSelect.addEventListener(
        "change",
        updateProgress
    );


    // =====================================
    // PERIOD CHANGE
    // =====================================

    periodSelect.addEventListener(
        "change",
        updateProgress
    );


    // =====================================
    // UPDATE PROGRESS
    // =====================================

    function updateProgress() {

        const exerciseName =
            exerciseSelect.value;

        if (!exerciseName) {

            clearChart();

            showEmptySummary();

            return;
        }


        const progressData =
            getProgressData(exerciseName);


        console.log(
            "Selected:",
            exerciseName
        );

        console.log(
            "Progress data:",
            progressData
        );


        if (progressData.length === 0) {

            clearChart();

            summary.innerHTML = `
                <div class="empty-state">
                    <h3>No data available</h3>
                    <p>
                        No weight data found for
                        ${exerciseName}.
                    </p>
                </div>
            `;

            return;
        }


        drawChart(
            progressData,
            exerciseName
        );

        showSummary(
            progressData
        );
    }


    // =====================================
    // GET PROGRESS DATA
    // =====================================

    function getProgressData(exerciseName) {

        const period =
            periodSelect.value;

        const today =
            new Date();

        const result = [];


        workouts.forEach(workout => {

            if (!workout.exercises) {
                return;
            }


            const workoutDate =
                new Date(workout.workoutDate);


            // -------------------------------
            // TIME FILTER
            // -------------------------------

            if (period !== "all") {

                const days =
                    Number(period);

                const difference =
                    (
                        today -
                        workoutDate
                    ) /
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    );


                if (difference > days) {
                    return;
                }

            }


            // -------------------------------
            // FIND EXERCISE
            // -------------------------------

            workout.exercises.forEach(
                exercise => {

                    if (
                        exercise.name.toLowerCase() !==
                        exerciseName.toLowerCase()
                    ) {
                        return;
                    }


                    if (
                        !exercise.sets ||
                        exercise.sets.length === 0
                    ) {
                        return;
                    }


                    // -------------------------
                    // FIND MAX WEIGHT
                    // -------------------------

                    let maxWeight = 0;


                    exercise.sets.forEach(set => {

                        const weight =
                            Number(
                                set.weight || 0
                            );


                        if (
                            weight >
                            maxWeight
                        ) {

                            maxWeight =
                                weight;

                        }

                    });


                    if (maxWeight > 0) {

                        result.push({

                            date:
                                workout.workoutDate,

                            weight:
                                maxWeight

                        });

                    }

                }
            );

        });


        // Oldest → newest
        result.sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );


        return result;
    }


    // =====================================
    // DRAW CHART
    // =====================================

    function drawChart(
        data,
        exerciseName
    ) {

        const ctx =
            canvas.getContext("2d");


        const container =
            canvas.parentElement;


        const width =
            container.clientWidth;


        const height =
            450;


        canvas.width =
            width * 2;

        canvas.height =
            height * 2;


        canvas.style.width =
            width + "px";

        canvas.style.height =
            height + "px";


        ctx.setTransform(
            1,
            0,
            0,
            1,
            0,
            0
        );


        ctx.scale(
            2,
            2
        );


        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        // =================================
        // GRAPH SETTINGS
        // =================================

        const left =
            70;

        const right =
            30;

        const top =
            60;

        const bottom =
            60;


        const graphWidth =
            width -
            left -
            right;


        const graphHeight =
            height -
            top -
            bottom;


        const weights =
            data.map(
                item => item.weight
            );


        const maxWeight =
            Math.max(...weights);


        const minWeight =
            Math.min(...weights);


        const graphMin =
            Math.max(
                0,
                Math.floor(
                    minWeight - 10
                )
            );


        const graphMax =
            Math.ceil(
                maxWeight + 10
            );


        const range =
            Math.max(
                graphMax -
                graphMin,
                10
            );


        // =================================
        // BACKGROUND
        // =================================

        ctx.fillStyle =
            "#0b1220";

        ctx.fillRect(
            0,
            0,
            width,
            height
        );


        // =================================
        // TITLE
        // =================================

        ctx.fillStyle =
            "#ffffff";

        ctx.font =
            "bold 20px Arial";

        ctx.textAlign =
            "left";

        ctx.fillText(
            `${exerciseName} - Maximum Weight`,
            left,
            30
        );


        // =================================
        // GRID
        // =================================

        ctx.strokeStyle =
            "#263244";

        ctx.lineWidth =
            1;


        for (
            let i = 0;
            i <= 5;
            i++
        ) {

            const y =
                top +
                (
                    graphHeight /
                    5
                ) * i;


            ctx.beginPath();

            ctx.moveTo(
                left,
                y
            );

            ctx.lineTo(
                width - right,
                y
            );

            ctx.stroke();


            const weight =
                graphMax -
                (
                    range /
                    5
                ) * i;


            ctx.fillStyle =
                "#b8c0cc";

            ctx.font =
                "13px Arial";

            ctx.textAlign =
                "right";

            ctx.fillText(
                `${Math.round(weight)} kg`,
                left - 10,
                y + 5
            );

        }


        // =================================
        // POINTS
        // =================================

        const points =
            data.map(
                (item, index) => {

                    let x;


                    if (
                        data.length === 1
                    ) {

                        x =
                            left +
                            graphWidth /
                            2;

                    } else {

                        x =
                            left +
                            (
                                graphWidth /
                                (
                                    data.length -
                                    1
                                )
                            ) *
                            index;

                    }


                    const y =
                        top +
                        graphHeight -
                        (
                            (
                                item.weight -
                                graphMin
                            ) /
                            range
                        ) *
                        graphHeight;


                    return {
                        x,
                        y,
                        weight:
                            item.weight,
                        date:
                            item.date
                    };

                }
            );


        // =================================
        // LINE
        // =================================

        if (points.length > 1) {

            ctx.strokeStyle =
                "#4da3ff";

            ctx.lineWidth =
                4;

            ctx.beginPath();


            points.forEach(
                (point, index) => {

                    if (index === 0) {

                        ctx.moveTo(
                            point.x,
                            point.y
                        );

                    } else {

                        ctx.lineTo(
                            point.x,
                            point.y
                        );

                    }

                }
            );


            ctx.stroke();

        }


        // =================================
        // POINTS
        // =================================

        points.forEach(point => {

            ctx.beginPath();

            ctx.arc(
                point.x,
                point.y,
                7,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                "#ffffff";

            ctx.fill();


            ctx.strokeStyle =
                "#4da3ff";

            ctx.lineWidth =
                3;

            ctx.stroke();


            // Weight
            ctx.fillStyle =
                "#ffffff";

            ctx.font =
                "bold 13px Arial";

            ctx.textAlign =
                "center";

            ctx.fillText(
                `${point.weight} kg`,
                point.x,
                point.y - 15
            );


            // Date
            ctx.fillStyle =
                "#9ca3af";

            ctx.font =
                "12px Arial";

            ctx.fillText(
                formatDate(point.date),
                point.x,
                height - 20
            );

        });

    }


    // =====================================
    // SUMMARY
    // =====================================

    function showSummary(data) {

        const first =
            data[0];

        const latest =
            data[data.length - 1];


        const difference =
            latest.weight -
            first.weight;


        let percentage = 0;


        if (first.weight > 0) {

            percentage =
                (
                    difference /
                    first.weight
                ) * 100;

        }


        let progressText;


        if (difference > 0) {

            progressText =
                `+${difference.toFixed(1)} kg`;

        } else if (difference < 0) {

            progressText =
                `${difference.toFixed(1)} kg`;

        } else {

            progressText =
                "No change";

        }


        summary.innerHTML = `

            <div class="summary-card">

                <h3>First Weight</h3>

                <strong>
                    ${first.weight} kg
                </strong>

                <p>
                    ${formatDate(first.date)}
                </p>

            </div>


            <div class="summary-card">

                <h3>Current Weight</h3>

                <strong>
                    ${latest.weight} kg
                </strong>

                <p>
                    ${formatDate(latest.date)}
                </p>

            </div>


            <div class="summary-card">

                <h3>Progress</h3>

                <strong>
                    ${progressText}
                </strong>

                <p>
                    ${percentage.toFixed(1)}%
                </p>

            </div>

        `;
    }


    // =====================================
    // CLEAR CHART
    // =====================================

    function clearChart() {

        const ctx =
            canvas.getContext("2d");

        ctx.setTransform(
            1,
            0,
            0,
            1,
            0,
            0
        );

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

    }


    // =====================================
    // EMPTY SUMMARY
    // =====================================

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


    // =====================================
    // DATE FORMAT
    // =====================================

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

});