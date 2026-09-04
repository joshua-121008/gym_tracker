document.addEventListener("DOMContentLoaded", async () => {

    // =========================
    // AUTHENTICATION
    // =========================

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


    // =========================
    // HELPER FUNCTIONS
    // =========================

    function setText(id, value) {
        const element = document.querySelector(`#${id}`);

        if (element) {
            element.textContent = value;
        }
    }


    function escapeHTML(value) {
        return String(value ?? "").replace(
            /[&<>"']/g,
            (character) => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[character])
        );
    }


    // =========================
    // SHOW USERNAME
    // =========================

    const welcome = document.querySelector("#username");

    if (welcome) {
        welcome.textContent =
            user.full_name ||
            user.fullName ||
            user.username;
    }


    // =========================
    // LOGOUT
    // =========================

    const logoutButton =
        document.querySelector("#logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {

            localStorage.removeItem("gymToken");
            localStorage.removeItem("gymCurrentUser");

            window.location.href = "login.html";
        });
    }


    // =========================
    // GET WORKOUTS FROM API
    // =========================

    try {

        const response = await fetch(
            "/api/workouts",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        // Token invalid / expired
        if (response.status === 401 || response.status === 403) {

            localStorage.removeItem("gymToken");
            localStorage.removeItem("gymCurrentUser");

            window.location.href = "login.html";

            return;
        }


        if (!response.ok) {
            throw new Error("Failed to load workouts");
        }


        const workouts = await response.json();


        // =========================
        // TOTAL WORKOUTS
        // =========================

        const totalWorkouts = workouts.length;


        // =========================
        // TOTAL EXERCISES
        // =========================

        const totalExercises = workouts.reduce(
            (total, workout) => {

                return total +
                    (workout.exercises?.length || 0);

            },
            0
        );


        // =========================
        // TOTAL WEIGHT
        // =========================

        const totalWeight = workouts.reduce(
            (workoutTotal, workout) => {

                return workoutTotal +
                    (workout.exercises || []).reduce(
                        (exerciseTotal, exercise) => {

                            return exerciseTotal +
                                (exercise.sets || []).reduce(
                                    (setTotal, set) => {

                                        const weight =
                                            Number(set.weight) || 0;

                                        const reps =
                                            Number(set.reps) || 0;

                                        return setTotal +
                                            (weight * reps);

                                    },
                                    0
                                );

                        },
                        0
                    );

            },
            0
        );


        // =========================
        // THIS WEEK
        // =========================

        const now = new Date();

        const weekStart = new Date(now);

        weekStart.setDate(
            now.getDate() - now.getDay()
        );

        weekStart.setHours(
            0,
            0,
            0,
            0
        );


        const weeklyWorkouts = workouts.filter(
            (workout) => {

                const workoutDate =
                    new Date(workout.workout_date);

                return workoutDate >= weekStart;
            }
        ).length;


        // =========================
        // UPDATE STATISTICS
        // =========================

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
            `${totalWeight.toFixed(1)} kg`
        );


        // =========================
        // RECENT WORKOUTS
        // =========================

        const recentContainer =
            document.querySelector("#recentWorkouts");


        if (!recentContainer) {
            return;
        }


        const recentWorkouts =
            [...workouts]
                .sort(
                    (a, b) =>
                        new Date(b.workout_date) -
                        new Date(a.workout_date)
                )
                .slice(0, 5);


        // No workouts
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


        // Display recent workouts
        recentContainer.innerHTML =
            recentWorkouts.map(
                (workout) => {

                    const date =
                        new Date(
                            workout.workout_date
                        ).toLocaleDateString();


                    const exerciseCount =
                        workout.exercises?.length || 0;


                    return `

                        <div class="history-item">

                            <div>

                                <h3>
                                    ${escapeHTML(
                                        workout.workout_name
                                    )}
                                </h3>

                                <p>
                                    ${date}
                                </p>

                                <p>
                                    ${exerciseCount}
                                    exercises
                                </p>

                            </div>

                            <a
                                href="history.html"
                                class="btn btn-secondary"
                            >
                                View
                            </a>

                        </div>

                    `;

                }
            ).join("");


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        const recentContainer =
            document.querySelector("#recentWorkouts");


        if (recentContainer) {

            recentContainer.innerHTML = `

                <div class="empty-state">

                    <h3>Unable to load workouts</h3>

                    <p>
                        Please check your server connection
                        and try again.
                    </p>

                </div>

            `;

        }

    }

});