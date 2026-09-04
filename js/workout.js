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
    // ELEMENTS
    // =========================

    const form = document.querySelector("#workoutForm");
    const exerciseList = document.querySelector("#exerciseList");
    const message = document.querySelector("#workoutMessage");
    const planSelect = document.querySelector("#workoutPlan");
    const dateInput = document.querySelector("#workoutDate");
    const addExerciseButton =
        document.querySelector("#addExerciseButton");
    const logoutButton =
        document.querySelector("#logoutButton");


    // =========================
    // LOGOUT
    // =========================

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            localStorage.removeItem("gymToken");
            localStorage.removeItem("gymCurrentUser");

            window.location.href = "login.html";
        });
    }


    // =========================
    // TODAY'S DATE
    // =========================

    if (dateInput && !dateInput.value) {
        dateInput.value =
            new Date().toISOString().split("T")[0];
    }


    // =========================
    // ESCAPE HTML
    // =========================

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


    // =========================
    // LOAD PLANS FROM DATABASE
    // =========================

    async function loadPlans() {

        if (!planSelect) return;

        try {

            const response = await fetch(
                "/api/plans",
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );


            if (response.status === 401 ||
                response.status === 403) {

                localStorage.removeItem("gymToken");
                localStorage.removeItem("gymCurrentUser");

                window.location.href = "login.html";
                return;
            }


            if (!response.ok) {
                throw new Error("Failed to load plans");
            }


            const plans = await response.json();


            planSelect.innerHTML = `
                <option value="">
                    Select a workout plan
                </option>
            `;


            plans.forEach(plan => {

                const option =
                    document.createElement("option");

                option.value = plan.id;
                option.textContent = plan.name;

                planSelect.appendChild(option);

            });


        } catch (error) {

            console.error(
                "Load plans error:",
                error
            );

            planSelect.innerHTML = `
                <option value="">
                    Unable to load plans
                </option>
            `;

        }
    }


    // =========================
    // CREATE SET HTML
    // =========================

    function setHTML(number = 1) {

        return `
            <div class="set-row">

                <span class="set-number">
                    ${number}
                </span>

                <input
                    class="weight-input"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Weight (kg)"
                    required
                >

                <input
                    class="reps-input"
                    type="number"
                    min="1"
                    placeholder="Reps"
                    required
                >

                <button
                    type="button"
                    class="remove-set"
                    aria-label="Remove set"
                >
                    ×
                </button>

            </div>
        `;
    }


    // =========================
    // CREATE EXERCISE HTML
    // =========================

    function exerciseHTML(number) {

        return `
            <div class="exercise-card">

                <div class="exercise-header">

                    <h3>
                        Exercise ${number}
                    </h3>

                    <button
                        type="button"
                        class="remove-exercise"
                    >
                        ×
                    </button>

                </div>

                <label>
                    Exercise Name
                </label>

                <input
                    class="exercise-name"
                    type="text"
                    placeholder="Example: Bench Press"
                    required
                >

                <div class="sets-container">

                    ${setHTML(1)}

                </div>

                <button
                    type="button"
                    class="add-set-button"
                >
                    + Add Set
                </button>

            </div>
        `;
    }


    // =========================
    // UPDATE NUMBERS
    // =========================

    function updateNumbers() {

        exerciseList
            ?.querySelectorAll(".exercise-card")
            .forEach((card, exerciseIndex) => {

                const heading =
                    card.querySelector("h3");

                if (heading) {
                    heading.textContent =
                        `Exercise ${exerciseIndex + 1}`;
                }


                card
                    .querySelectorAll(".set-row")
                    .forEach((row, setIndex) => {

                        const number =
                            row.querySelector(".set-number");

                        if (number) {
                            number.textContent =
                                setIndex + 1;
                        }

                    });

            });
    }


    // =========================
    // BIND BUTTON EVENTS
    // =========================

    function bindEvents() {

        // Remove exercise
        exerciseList
            ?.querySelectorAll(".remove-exercise")
            .forEach(button => {

                button.onclick = () => {

                    const card =
                        button.closest(".exercise-card");

                    card?.remove();

                    updateNumbers();
                };

            });


        // Add set
        exerciseList
            ?.querySelectorAll(".add-set-button")
            .forEach(button => {

                button.onclick = () => {

                    const card =
                        button.closest(".exercise-card");

                    const sets =
                        card?.querySelector(
                            ".sets-container"
                        );

                    if (card && sets) {

                        const number =
                            sets.querySelectorAll(
                                ".set-row"
                            ).length + 1;


                        sets.insertAdjacentHTML(
                            "beforeend",
                            setHTML(number)
                        );


                        updateNumbers();
                        bindEvents();

                    }

                };

            });


        // Remove set
        exerciseList
            ?.querySelectorAll(".remove-set")
            .forEach(button => {

                button.onclick = () => {

                    const card =
                        button.closest(".exercise-card");

                    const row =
                        button.closest(".set-row");


                    if (
                        card &&
                        row &&
                        card.querySelectorAll(
                            ".set-row"
                        ).length > 1
                    ) {

                        row.remove();

                        updateNumbers();

                    }

                };

            });

    }


    // =========================
    // ADD EXERCISE
    // =========================

    if (addExerciseButton) {

        addExerciseButton.addEventListener(
            "click",
            () => {

                const number =
                    exerciseList
                        ?.querySelectorAll(
                            ".exercise-card"
                        ).length + 1 || 1;


                exerciseList?.insertAdjacentHTML(
                    "beforeend",
                    exerciseHTML(number)
                );


                bindEvents();

            }
        );

    }


    // =========================
    // ADD FIRST EXERCISE
    // =========================

    if (
        exerciseList &&
        !exerciseList.children.length
    ) {

        exerciseList.insertAdjacentHTML(
            "beforeend",
            exerciseHTML(1)
        );

    }


    bindEvents();


    // =========================
    // SAVE WORKOUT
    // =========================

    form?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const name =
                document
                    .querySelector("#workoutName")
                    ?.value.trim();


            const date =
                document
                    .querySelector("#workoutDate")
                    ?.value;


            const planId =
                document
                    .querySelector("#workoutPlan")
                    ?.value;


            const notes =
                document
                    .querySelector("#workoutNotes")
                    ?.value.trim();


            // Basic validation
            if (!name || !date) {

                if (message) {
                    message.textContent =
                        "Enter workout name and date.";

                    message.className =
                        "form-message";
                }

                return;
            }


            const cards = [
                ...(exerciseList
                    ?.querySelectorAll(
                        ".exercise-card"
                    ) || [])
            ];


            if (!cards.length) {

                if (message) {
                    message.textContent =
                        "Add at least one exercise.";

                    message.className =
                        "form-message";
                }

                return;
            }


            // =========================
            // COLLECT EXERCISES
            // =========================

            const exercises =
                cards.map(card => {

                    const exerciseName =
                        card
                            .querySelector(
                                ".exercise-name"
                            )
                            ?.value.trim();


                    const sets = [
                        ...card.querySelectorAll(
                            ".set-row"
                        )
                    ]
                        .map(row => ({

                            weight:
                                Number(
                                    row
                                        .querySelector(
                                            ".weight-input"
                                        )
                                        ?.value
                                ) || 0,

                            reps:
                                Number(
                                    row
                                        .querySelector(
                                            ".reps-input"
                                        )
                                        ?.value
                                ) || 0

                        }))
                        .filter(set => set.reps > 0);


                    return {
                        name: exerciseName,
                        sets: sets
                    };

                });


            // Validate exercises
            if (
                exercises.some(
                    exercise =>
                        !exercise.name ||
                        !exercise.sets.length
                )
            ) {

                if (message) {

                    message.textContent =
                        "Each exercise needs a name and at least one set with reps.";

                    message.className =
                        "form-message";

                }

                return;
            }


            // =========================
            // SEND TO BACKEND
            // =========================

            try {

                const saveButton =
                    document.querySelector(
                        "#saveWorkoutButton"
                    );


                if (saveButton) {
                    saveButton.disabled = true;
                    saveButton.textContent =
                        "Saving...";
                }


                const response =
                    await fetch(
                        "/api/workouts",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify({

                                workoutName: name,

                                workoutDate: date,

                                planId:
                                    planId || null,

                                notes:
                                    notes || null,

                                exercises:
                                    exercises

                            })

                        }
                    );


                const data =
                    await response.json();


                // Invalid token
                if (
                    response.status === 401 ||
                    response.status === 403
                ) {

                    localStorage.removeItem(
                        "gymToken"
                    );

                    localStorage.removeItem(
                        "gymCurrentUser"
                    );

                    window.location.href =
                        "login.html";

                    return;
                }


                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Failed to save workout"
                    );
                }


                // Success
                if (message) {

                    message.textContent =
                        "Workout saved successfully!";

                    message.className =
                        "form-message success";

                }


                // Go to history
                setTimeout(() => {

                    window.location.href =
                        "history.html";

                }, 800);


            } catch (error) {

                console.error(
                    "Save workout error:",
                    error
                );


                if (message) {

                    message.textContent =
                        error.message ||
                        "Unable to save workout.";

                    message.className =
                        "form-message";

                }


                const saveButton =
                    document.querySelector(
                        "#saveWorkoutButton"
                    );


                if (saveButton) {

                    saveButton.disabled = false;

                    saveButton.textContent =
                        "Save Workout";

                }

            }

        }
    );


    // =========================
    // INITIAL LOAD
    // =========================

    await loadPlans();

});