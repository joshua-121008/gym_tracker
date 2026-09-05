document.addEventListener("DOMContentLoaded", async () => {

    // ==========================================
    // AUTHENTICATION
    // ==========================================

    const token = localStorage.getItem("gymToken");
    const userData = localStorage.getItem("gymCurrentUser");

    if (!token || !userData) {
        window.location.href = "login.html";
        return;
    }

    let user;

    try {
        user = JSON.parse(userData);
    } catch (error) {

        localStorage.removeItem("gymToken");
        localStorage.removeItem("gymCurrentUser");

        window.location.href = "login.html";
        return;
    }


    // ==========================================
    // HELPERS
    // ==========================================

    function setText(id, value) {

        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    }


    function escapeHTML(value) {

        return String(value ?? "").replace(
            /[&<>"']/g,
            character => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[character])
        );
    }


    // ==========================================
    // USERNAME
    // ==========================================

    setText(
        "username",
        user.full_name ||
        user.fullName ||
        user.username ||
        "User"
    );


    // ==========================================
    // LOGOUT
    // ==========================================

    const logoutButton =
        document.getElementById("logoutButton");

    if (logoutButton) {

        logoutButton.addEventListener("click", () => {

            localStorage.removeItem("gymToken");
            localStorage.removeItem("gymCurrentUser");

            window.location.href = "login.html";
        });
    }


    // ==========================================
    // LOAD WORKOUTS
    // ==========================================

    try {

        const response = await fetch("/api/workouts", {

            method: "GET",

            headers: {
                "Authorization": `Bearer ${token}`
            }

        });


        // Token expired
        if (
            response.status === 401 ||
            response.status === 403
        ) {

            localStorage.removeItem("gymToken");
            localStorage.removeItem("gymCurrentUser");

            window.location.href = "login.html";

            return;
        }


        if (!response.ok) {
            throw new Error("Failed to load workouts");
        }


        const workouts = await response.json();


        if (!Array.isArray(workouts)) {
            throw new Error("Invalid workout data");
        }


        // ==========================================
        // TOTAL WORKOUTS
        // ==========================================

        const totalWorkouts = workouts.length;


        // ==========================================
        // TOTAL EXERCISES
        // ==========================================

        const totalExercises = workouts.reduce(
            (total, workout) => {

                return total +
                    (workout.exercises?.length || 0);

            },
            0
        );


        // ==========================================
        // TOTAL SETS + VOLUME
        // ==========================================

        let totalSets = 0;
        let totalVolume = 0;

        let heaviestLift = 0;
        let heaviestExercise = "No data yet";


        workouts.forEach(workout => {

            (workout.exercises || []).forEach(exercise => {

                (exercise.sets || []).forEach(set => {

                    const weight =
                        Number(set.weight) || 0;

                    const reps =
                        Number(set.reps) || 0;


                    totalSets++;

                    totalVolume +=
                        weight * reps;


                    if (weight > heaviestLift) {

                        heaviestLift = weight;

                        heaviestExercise =
                            exercise.name ||
                            "Unknown exercise";
                    }

                });

            });

        });


        // ==========================================
        // THIS WEEK
        // ==========================================

        const now = new Date();

        const weekStart = new Date(now);

        const day = weekStart.getDay();

        const difference =
            day === 0 ? 6 : day - 1;

        weekStart.setDate(
            weekStart.getDate() - difference
        );

        weekStart.setHours(
            0,
            0,
            0,
            0
        );


        const weeklyWorkouts =
            workouts.filter(workout => {

                const workoutDate =
                    new Date(workout.workoutDate);

                return workoutDate >= weekStart;

            }).length;


        // ==========================================
        // PERSONAL RECORDS
        // ==========================================

        const exerciseBestWeights = {};

        workouts.forEach(workout => {

            (workout.exercises || []).forEach(exercise => {

                const exerciseName =
                    exercise.name?.trim();

                if (!exerciseName) {
                    return;
                }


                (exercise.sets || []).forEach(set => {

                    const weight =
                        Number(set.weight) || 0;


                    if (
                        !exerciseBestWeights[exerciseName] ||
                        weight >
                        exerciseBestWeights[exerciseName]
                    ) {

                        exerciseBestWeights[exerciseName] =
                            weight;
                    }

                });

            });

        });


        const personalRecords =
            Object.keys(exerciseBestWeights).filter(
                exercise =>
                    exerciseBestWeights[exercise] > 0
            ).length;


        // ==========================================
        // WORKOUT STREAK
        // ==========================================

        const workoutDates =
            [...new Set(

                workouts.map(workout => {

                    const date =
                        new Date(workout.workoutDate);

                    return date.toISOString().split("T")[0];

                })

            )].sort().reverse();


        let workoutStreak = 0;


        if (workoutDates.length > 0) {

            const today =
                new Date();

            today.setHours(
                0,
                0,
                0,
                0
            );


            const latestDate =
                new Date(workoutDates[0]);

            latestDate.setHours(
                0,
                0,
                0,
                0
            );


            const daysSinceLatest =
                Math.floor(
                    (today - latestDate) /
                    (1000 * 60 * 60 * 24)
                );


            // Streak is active if latest workout
            // was today or yesterday
            if (daysSinceLatest <= 1) {

                workoutStreak = 1;

                let previousDate =
                    latestDate;


                for (let i = 1; i < workoutDates.length; i++) {

                    const currentDate =
                        new Date(workoutDates[i]);

                    currentDate.setHours(
                        0,
                        0,
                        0,
                        0
                    );


                    const difference =
                        Math.floor(
                            (previousDate - currentDate) /
                            (1000 * 60 * 60 * 24)
                        );


                    if (difference === 1) {

                        workoutStreak++;

                        previousDate =
                            currentDate;

                    } else {

                        break;
                    }

                }

            }

        }


        // ==========================================
        // UPDATE DASHBOARD
        // ==========================================

        setText(
            "totalWorkouts",
            totalWorkouts
        );

        setText(
            "weeklyWorkouts",
            weeklyWorkouts
        );

        setText(
            "totalExercises",
            totalExercises
        );

        setText(
            "totalWeight",
            `${totalVolume.toFixed(1)} kg`
        );

        setText(
            "workoutStreak",
            `${workoutStreak} ${workoutStreak === 1 ? "day" : "days"}`
        );

        setText(
            "heaviestLift",
            `${heaviestLift.toFixed(1)} kg`
        );

        setText(
            "heaviestExercise",
            heaviestExercise
        );

        setText(
            "totalSets",
            totalSets
        );

        setText(
            "personalRecords",
            personalRecords
        );


        // ==========================================
        // RECENT WORKOUTS
        // ==========================================

        const recentContainer =
            document.getElementById("recentWorkouts");


        if (!recentContainer) {
            return;
        }


        const recentWorkouts =
            [...workouts]
                .sort(
                    (a, b) =>
                        new Date(b.workoutDate) -
                        new Date(a.workoutDate)
                )
                .slice(0, 5);


        if (recentWorkouts.length === 0) {

            recentContainer.innerHTML = `

                <div class="empty-state">

                    <h3>No workouts yet</h3>

                    <p>
                        Start your first workout
                        to see your progress here.
                    </p>

                    <a
                        href="workout.html"
                        class="btn primary-btn"
                    >
                        Start Workout
                    </a>

                </div>

            `;

            return;
        }


        recentContainer.innerHTML =
            recentWorkouts.map(workout => {

                const date =
                    new Date(
                        workout.workoutDate
                    ).toLocaleDateString();


                const exerciseCount =
                    workout.exercises?.length || 0;


                const setCount =
                    (workout.exercises || [])
                        .reduce(
                            (total, exercise) =>
                                total +
                                (exercise.sets?.length || 0),
                            0
                        );


                return `

                    <div class="history-item">

                        <div>

                            <h3>
                                ${escapeHTML(
                                    workout.workoutName ||
                                    "Workout"
                                )}
                            </h3>

                            <p>
                                ${date}
                            </p>

                            <p>
                                ${exerciseCount}
                                exercises ·
                                ${setCount}
                                sets
                            </p>

                        </div>

                        <a
                            href="history.html"
                            class="btn secondary-btn"
                        >
                            View
                        </a>

                    </div>

                `;

            }).join("");


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        const recentContainer =
            document.getElementById("recentWorkouts");


        if (recentContainer) {

            recentContainer.innerHTML = `

                <div class="empty-state">

                    <h3>Unable to load workouts</h3>

                    <p>
                        Please check your server
                        connection and try again.
                    </p>

                </div>

            `;

        }

    }

});