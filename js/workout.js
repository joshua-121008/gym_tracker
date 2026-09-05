document.addEventListener("DOMContentLoaded", async () => {

    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const token = localStorage.getItem("gymToken");
    const userData = localStorage.getItem("gymCurrentUser");

    if (!token || !userData) {
        window.location.href = "login.html";
        return;
    }

    try {
        JSON.parse(userData);
    } catch (error) {
        localStorage.removeItem("gymToken");
        localStorage.removeItem("gymCurrentUser");
        window.location.href = "login.html";
        return;
    }


    // =====================================================
    // ELEMENTS
    // =====================================================

    const form = document.querySelector("#workoutForm");
    const exerciseList = document.querySelector("#exerciseList");
    const message = document.querySelector("#workoutMessage");
    const planSelect = document.querySelector("#workoutPlan");
    const dateInput = document.querySelector("#workoutDate");

    const addExerciseButton =
        document.querySelector("#addExerciseButton");

    const logoutButton =
        document.querySelector("#logoutButton");

    const saveButton =
        document.querySelector("#saveWorkoutButton");


    // =====================================================
    // LOGOUT
    // =====================================================

    function logout() {

        localStorage.removeItem("gymToken");
        localStorage.removeItem("gymCurrentUser");

        window.location.href = "login.html";
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }


    // =====================================================
    // TODAY'S DATE
    // =====================================================

    if (dateInput && !dateInput.value) {

        dateInput.value =
            new Date().toISOString().split("T")[0];
    }


    // =====================================================
    // MESSAGE
    // =====================================================

    function showMessage(text, type = "") {

        if (!message) return;

        message.textContent = text;

        message.className =
            type
                ? `form-message ${type}`
                : "form-message";
    }


    // =====================================================
    // LOAD WORKOUT PLANS
    // =====================================================

    async function loadPlans() {

        if (!planSelect) return;

        try {

            const response = await fetch("/api/plans", {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });


            // Authentication failure
            if (
                response.status === 401 ||
                response.status === 403
            ) {
                logout();
                return;
            }


            if (!response.ok) {
                throw new Error(
                    "Failed to load workout plans"
                );
            }


            const plans = await response.json();


            planSelect.innerHTML = `
                <option value="">
                    Select a workout plan
                </option>
            `;


            if (!plans.length) {

                planSelect.innerHTML = `
                    <option value="">
                        No workout plans available
                    </option>
                `;

                return;
            }


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


    // =====================================================
    // CREATE SET HTML
    // =====================================================

    function setHTML(number = 1) {

        return `
            <div class="set-row">

                <span class="set-number">
                    ${number}
                </span>


                <input
                    class="set-input weight-input"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Weight (kg)"
                    required
                >


                <input
                    class="set-input reps-input"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Reps"
                    required
                >


                <span class="set-volume">
                    0 kg
                </span>


                <button
                    type="button"
                    class="remove-set"
                    aria-label="Remove set"
                    title="Remove set"
                >
                    ×
                </button>

            </div>
        `;
    }


    // =====================================================
    // CREATE EXERCISE HTML
    // =====================================================

    function exerciseHTML(number = 1) {

        return `
            <div class="exercise-card">

                <div class="exercise-header">

                    <div class="exercise-title">

                        <span class="exercise-number">
                            ${String(number).padStart(2, "0")}
                        </span>

                        <h3>
                            Exercise ${number}
                        </h3>

                    </div>


                    <button
                        type="button"
                        class="remove-exercise"
                        aria-label="Remove exercise"
                        title="Remove exercise"
                    >
                        ×
                    </button>

                </div>


                <label class="exercise-label">
                    Exercise Name
                </label>


                <input
                    class="exercise-name"
                    type="text"
                    placeholder="Example: Bench Press"
                    required
                >


                <div class="sets-container">

                    <div class="sets-header">

                        <h4>
                            Sets
                        </h4>


                        <button
                            type="button"
                            class="add-set-button"
                        >
                            + Add Set
                        </button>

                    </div>


                    <div class="set-table-header">

                        <span>#</span>

                        <span>Weight</span>

                        <span>Reps</span>

                        <span>Volume</span>

                        <span></span>

                    </div>


                    <div class="set-list">

                        ${setHTML(1)}

                    </div>

                </div>


                <div class="exercise-summary">

                    <span>
                        Exercise Volume
                    </span>


                    <strong class="exercise-volume">
                        0 kg
                    </strong>

                </div>

            </div>
        `;
    }


    // =====================================================
    // UPDATE EXERCISE / SET NUMBERS
    // =====================================================

    function updateNumbers() {

        if (!exerciseList) return;


        const cards =
            exerciseList.querySelectorAll(
                ".exercise-card"
            );


        cards.forEach(
            (card, exerciseIndex) => {

                const exerciseNumber =
                    exerciseIndex + 1;


                const heading =
                    card.querySelector("h3");

                if (heading) {
                    heading.textContent =
                        `Exercise ${exerciseNumber}`;
                }


                const numberElement =
                    card.querySelector(
                        ".exercise-number"
                    );


                if (numberElement) {

                    numberElement.textContent =
                        String(exerciseNumber)
                            .padStart(2, "0");
                }


                const setRows =
                    card.querySelectorAll(
                        ".set-row"
                    );


                setRows.forEach(
                    (row, setIndex) => {

                        const setNumber =
                            row.querySelector(
                                ".set-number"
                            );


                        if (setNumber) {

                            setNumber.textContent =
                                setIndex + 1;
                        }

                    }
                );

            }
        );


        updateWorkoutSummary();
    }


    // =====================================================
    // UPDATE EXERCISE VOLUME
    // =====================================================

    function updateExerciseVolume(card) {

        if (!card) return;


        let totalVolume = 0;


        const rows =
            card.querySelectorAll(
                ".set-row"
            );


        rows.forEach(row => {

            const weight =
                Number(
                    row.querySelector(
                        ".weight-input"
                    )?.value
                ) || 0;


            const reps =
                Number(
                    row.querySelector(
                        ".reps-input"
                    )?.value
                ) || 0;


            const volume =
                weight * reps;


            totalVolume += volume;


            const volumeElement =
                row.querySelector(
                    ".set-volume"
                );


            if (volumeElement) {

                volumeElement.textContent =
                    `${volume.toFixed(1)} kg`;
            }

        });


        const exerciseVolume =
            card.querySelector(
                ".exercise-volume"
            );


        if (exerciseVolume) {

            exerciseVolume.textContent =
                `${totalVolume.toFixed(1)} kg`;
        }


        updateWorkoutSummary();
    }


    // =====================================================
    // UPDATE ALL EXERCISE VOLUMES
    // =====================================================

    function updateAllExerciseVolumes() {

        if (!exerciseList) return;


        exerciseList
            .querySelectorAll(".exercise-card")
            .forEach(card => {

                updateExerciseVolume(card);

            });
    }


    // =====================================================
    // WORKOUT SUMMARY
    // =====================================================

    function updateWorkoutSummary() {

        if (!exerciseList) return;


        let totalSets = 0;
        let totalReps = 0;
        let totalVolume = 0;


        const cards =
            exerciseList.querySelectorAll(
                ".exercise-card"
            );


        cards.forEach(card => {

            const rows =
                card.querySelectorAll(
                    ".set-row"
                );


            rows.forEach(row => {

                const weight =
                    Number(
                        row.querySelector(
                            ".weight-input"
                        )?.value
                    ) || 0;


                const reps =
                    Number(
                        row.querySelector(
                            ".reps-input"
                        )?.value
                    ) || 0;


                totalSets++;

                totalReps += reps;

                totalVolume +=
                    weight * reps;

            });

        });


        updateSummaryElement(
            "workoutTotalExercises",
            cards.length
        );


        updateSummaryElement(
            "workoutTotalSets",
            totalSets
        );


        updateSummaryElement(
            "workoutTotalReps",
            totalReps
        );


        updateSummaryElement(
            "workoutTotalVolume",
            `${totalVolume.toFixed(1)} kg`
        );
    }


    // =====================================================
    // UPDATE SUMMARY ELEMENT
    // =====================================================

    function updateSummaryElement(id, value) {

        const element =
            document.getElementById(id);


        if (element) {
            element.textContent = value;
        }
    }


    // =====================================================
    // ADD EXERCISE
    // =====================================================

    if (addExerciseButton) {

        addExerciseButton.addEventListener(
            "click",
            () => {

                if (!exerciseList) return;


                const number =
                    exerciseList.querySelectorAll(
                        ".exercise-card"
                    ).length + 1;


                exerciseList.insertAdjacentHTML(
                    "beforeend",
                    exerciseHTML(number)
                );


                updateNumbers();

            }
        );
    }


    // =====================================================
    // EXERCISE BUTTON EVENTS
    // =====================================================

    if (exerciseList) {

        exerciseList.addEventListener(
            "click",
            event => {


                // -----------------------------------------
                // REMOVE EXERCISE
                // -----------------------------------------

                const removeExercise =
                    event.target.closest(
                        ".remove-exercise"
                    );


                if (removeExercise) {

                    const card =
                        removeExercise.closest(
                            ".exercise-card"
                        );


                    if (card) {

                        card.remove();

                        updateNumbers();

                        showMessage(
                            "Exercise removed."
                        );
                    }


                    return;
                }


                // -----------------------------------------
                // ADD SET
                // -----------------------------------------

                const addSet =
                    event.target.closest(
                        ".add-set-button"
                    );


                if (addSet) {

                    const card =
                        addSet.closest(
                            ".exercise-card"
                        );


                    if (!card) return;


                    const setList =
                        card.querySelector(
                            ".set-list"
                        );


                    if (!setList) return;


                    const number =
                        setList.querySelectorAll(
                            ".set-row"
                        ).length + 1;


                    setList.insertAdjacentHTML(
                        "beforeend",
                        setHTML(number)
                    );


                    updateNumbers();

                    return;
                }


                // -----------------------------------------
                // REMOVE SET
                // -----------------------------------------

                const removeSet =
                    event.target.closest(
                        ".remove-set"
                    );


                if (removeSet) {

                    const row =
                        removeSet.closest(
                            ".set-row"
                        );


                    const card =
                        removeSet.closest(
                            ".exercise-card"
                        );


                    if (!row || !card) return;


                    const rows =
                        card.querySelectorAll(
                            ".set-row"
                        );


                    if (rows.length <= 1) {

                        showMessage(
                            "Each exercise must have at least one set."
                        );

                        return;
                    }


                    row.remove();

                    updateExerciseVolume(card);

                    updateNumbers();

                    return;
                }

            }
        );


        // =================================================
        // LIVE INPUT
        // =================================================

        exerciseList.addEventListener(
            "input",
            event => {

                if (
                    event.target.classList.contains(
                        "weight-input"
                    ) ||
                    event.target.classList.contains(
                        "reps-input"
                    )
                ) {

                    const card =
                        event.target.closest(
                            ".exercise-card"
                        );


                    updateExerciseVolume(card);
                }

            }
        );
    }


    // =====================================================
    // SAVE WORKOUT
    // =====================================================

    if (form) {

        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                showMessage("");


                // -----------------------------------------
                // GET BASIC DETAILS
                // -----------------------------------------

                const workoutName =
                    document
                        .querySelector("#workoutName")
                        ?.value
                        .trim();


                const workoutDate =
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
                        ?.value
                        .trim();


                // -----------------------------------------
                // VALIDATE BASIC DETAILS
                // -----------------------------------------

                if (!workoutName) {

                    showMessage(
                        "Please enter a workout name."
                    );

                    return;
                }


                if (!workoutDate) {

                    showMessage(
                        "Please select a workout date."
                    );

                    return;
                }


                // -----------------------------------------
                // VALIDATE PLAN
                // -----------------------------------------

                if (
                    planSelect &&
                    planSelect.options.length > 1 &&
                    !planId
                ) {

                    showMessage(
                        "Please select a workout plan."
                    );

                    return;
                }


                // -----------------------------------------
                // GET EXERCISES
                // -----------------------------------------

                const cards = [
                    ...(exerciseList?.querySelectorAll(
                        ".exercise-card"
                    ) || [])
                ];


                if (!cards.length) {

                    showMessage(
                        "Add at least one exercise."
                    );

                    return;
                }


                // -----------------------------------------
                // BUILD EXERCISE DATA
                // -----------------------------------------

                const exercises =
                    cards.map(card => {

                        const exerciseName =
                            card.querySelector(
                                ".exercise-name"
                            )?.value
                            .trim();


                        const rows = [
                            ...card.querySelectorAll(
                                ".set-row"
                            )
                        ];


                        const sets =
                            rows.map(row => {

                                const weight =
                                    Number(
                                        row.querySelector(
                                            ".weight-input"
                                        )?.value
                                    );


                                const reps =
                                    Number(
                                        row.querySelector(
                                            ".reps-input"
                                        )?.value
                                    );


                                return {

                                    weight:
                                        Number.isFinite(weight) &&
                                        weight >= 0
                                            ? weight
                                            : 0,

                                    reps:
                                        Number.isInteger(reps) &&
                                        reps > 0
                                            ? reps
                                            : 0
                                };

                            });


                        return {
                            name: exerciseName,
                            sets: sets
                        };

                    });


                // -----------------------------------------
                // VALIDATE EXERCISES
                // -----------------------------------------

                for (const exercise of exercises) {

                    if (!exercise.name) {

                        showMessage(
                            "Every exercise needs a name."
                        );

                        return;
                    }


                    if (!exercise.sets.length) {

                        showMessage(
                            `${exercise.name} needs at least one set.`
                        );

                        return;
                    }


                    for (const set of exercise.sets) {

                        if (set.reps <= 0) {

                            showMessage(
                                `Enter valid reps for ${exercise.name}.`
                            );

                            return;
                        }


                        if (set.weight < 0) {

                            showMessage(
                                `Weight cannot be negative for ${exercise.name}.`
                            );

                            return;
                        }
                    }
                }


                // -----------------------------------------
                // PREPARE SAVE BUTTON
                // -----------------------------------------

                if (saveButton) {

                    saveButton.disabled = true;

                    saveButton.textContent =
                        "Saving...";
                }


                // -----------------------------------------
                // SAVE TO BACKEND
                // -----------------------------------------

                try {

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

                                    workoutName:
                                        workoutName,

                                    workoutDate:
                                        workoutDate,

                                    planId:
                                        planId
                                            ? Number(planId)
                                            : null,

                                    notes:
                                        notes || null,

                                    exercises:
                                        exercises
                                })
                            }
                        );


                    let data = {};

                    try {

                        data =
                            await response.json();

                    } catch (error) {

                        data = {};
                    }


                    // -------------------------------------
                    // AUTH ERROR
                    // -------------------------------------

                    if (
                        response.status === 401 ||
                        response.status === 403
                    ) {

                        logout();

                        return;
                    }


                    // -------------------------------------
                    // BACKEND ERROR
                    // -------------------------------------

                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            "Failed to save workout."
                        );
                    }


                    // -------------------------------------
                    // SUCCESS
                    // -------------------------------------

                    showMessage(
                        "Workout saved successfully!",
                        "success"
                    );


                    if (saveButton) {

                        saveButton.textContent =
                            "Saved ✓";
                    }


                    setTimeout(
                        () => {

                            window.location.href =
                                "history.html";

                        },
                        900
                    );


                } catch (error) {

                    console.error(
                        "Save workout error:",
                        error
                    );


                    showMessage(
                        error.message ||
                        "Unable to save workout."
                    );


                    if (saveButton) {

                        saveButton.disabled = false;

                        saveButton.textContent =
                            "Save Workout";
                    }

                }

            }
        );
    }


    // =====================================================
    // INITIALIZE
    // =====================================================

    await loadPlans();

    updateNumbers();

    updateAllExerciseVolumes();

});