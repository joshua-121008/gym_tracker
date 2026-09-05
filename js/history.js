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

    const historyContainer =
        document.getElementById("historyContainer");

    const emptyHistory =
        document.getElementById("emptyHistory");

    const searchInput =
        document.getElementById("searchWorkout");

    const filterDate =
        document.getElementById("filterDate");

    const filterExercise =
        document.getElementById("filterExercise");

    const clearFiltersButton =
        document.getElementById("clearFiltersButton");

    const workoutCount =
        document.getElementById("workoutCount");

    const logoutButton =
        document.getElementById("logoutButton");


    // Modal
    const workoutModal =
        document.getElementById("workoutModal");

    const closeWorkoutModal =
        document.getElementById("closeWorkoutModal");

    const modalWorkoutName =
        document.getElementById("modalWorkoutName");

    const modalWorkoutDate =
        document.getElementById("modalWorkoutDate");

    const modalWorkoutDuration =
        document.getElementById("modalWorkoutDuration");

    const modalExerciseList =
        document.getElementById("modalExerciseList");

    const modalWorkoutNotes =
        document.getElementById("modalWorkoutNotes");

    const deleteWorkoutButton =
        document.getElementById("deleteWorkoutButton");


    // =====================================================
    // DATA
    // =====================================================

    let workouts = [];

    let selectedWorkoutId = null;


    // =====================================================
    // LOGOUT
    // =====================================================

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            () => {

                localStorage.removeItem("gymToken");
                localStorage.removeItem("gymCurrentUser");

                window.location.href = "login.html";

            }
        );
    }


    // =====================================================
    // FORMAT DATE
    // =====================================================

    function formatDate(dateValue) {

        if (!dateValue) {
            return "-";
        }

        const date =
            new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }


    // =====================================================
    // CALCULATE WORKOUT VOLUME
    // =====================================================

    function calculateWorkoutVolume(workout) {

        let volume = 0;

        workout.exercises?.forEach(
            exercise => {

                exercise.sets?.forEach(
                    set => {

                        const weight =
                            Number(set.weight) || 0;

                        const reps =
                            Number(set.reps) || 0;

                        volume +=
                            weight * reps;

                    }
                );

            }
        );

        return volume;
    }


    // =====================================================
    // CALCULATE WORKOUT SETS
    // =====================================================

    function calculateWorkoutSets(workout) {

        let sets = 0;

        workout.exercises?.forEach(
            exercise => {

                sets +=
                    exercise.sets?.length || 0;

            }
        );

        return sets;
    }


    // =====================================================
    // CALCULATE WORKOUT REPS
    // =====================================================

    function calculateWorkoutReps(workout) {

        let reps = 0;

        workout.exercises?.forEach(
            exercise => {

                exercise.sets?.forEach(
                    set => {

                        reps +=
                            Number(set.reps) || 0;

                    }
                );

            }
        );

        return reps;
    }


    // =====================================================
    // LOAD WORKOUTS
    // =====================================================

    async function loadWorkouts() {

        try {

            const response =
                await fetch(
                    "/api/workouts",
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                );


            // ---------------------------------------------
            // AUTH ERROR
            // ---------------------------------------------

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                logout();

                return;
            }


            const data =
                await response.json();


            console.log(
                "Workout API response:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to load workouts"
                );
            }


            // Backend returns array directly
            workouts = Array.isArray(data)
                ? data
                : [];


            console.log(
                "Number of workouts:",
                workouts.length
            );


            updateStatistics();

            populateExerciseFilter();

            renderWorkouts(workouts);


        } catch (error) {

            console.error(
                "History error:",
                error
            );


            historyContainer.innerHTML = `
                <div class="empty-state">

                    <h3>
                        Unable to load workout history
                    </h3>

                    <p>
                        ${escapeHTML(
                            error.message ||
                            "Something went wrong."
                        )}
                    </p>

                    <button
                        type="button"
                        class="btn primary-btn"
                        onclick="location.reload()"
                    >
                        Try Again
                    </button>

                </div>
            `;
        }
    }


    // =====================================================
    // UPDATE STATISTICS
    // =====================================================

    function updateStatistics() {

        let totalExercises = 0;
        let totalSets = 0;
        let totalVolume = 0;


        workouts.forEach(workout => {

            totalExercises +=
                workout.exercises?.length || 0;


            totalSets +=
                calculateWorkoutSets(workout);


            totalVolume +=
                calculateWorkoutVolume(workout);

        });


        const totalWorkouts =
            workouts.length;


        const totalWorkoutsElement =
            document.getElementById(
                "historyTotalWorkouts"
            );

        const totalExercisesElement =
            document.getElementById(
                "historyTotalExercises"
            );

        const totalSetsElement =
            document.getElementById(
                "historyTotalSets"
            );

        const totalWeightElement =
            document.getElementById(
                "historyTotalWeight"
            );


        if (totalWorkoutsElement) {

            totalWorkoutsElement.textContent =
                totalWorkouts;
        }


        if (totalExercisesElement) {

            totalExercisesElement.textContent =
                totalExercises;
        }


        if (totalSetsElement) {

            totalSetsElement.textContent =
                totalSets;
        }


        if (totalWeightElement) {

            totalWeightElement.textContent =
                `${totalVolume.toFixed(1)} kg`;
        }

    }


    // =====================================================
    // POPULATE EXERCISE FILTER
    // =====================================================

    function populateExerciseFilter() {

        if (!filterExercise) return;


        const exerciseNames =
            new Set();


        workouts.forEach(workout => {

            workout.exercises?.forEach(
                exercise => {

                    if (exercise.name) {

                        exerciseNames.add(
                            exercise.name
                        );

                    }

                }
            );

        });


        const sortedExercises =
            [...exerciseNames].sort(
                (a, b) =>
                    a.localeCompare(b)
            );


        filterExercise.innerHTML = `
            <option value="">
                All Exercises
            </option>
        `;


        sortedExercises.forEach(
            exerciseName => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    exerciseName;

                option.textContent =
                    exerciseName;

                filterExercise.appendChild(
                    option
                );

            }
        );
    }


    // =====================================================
    // FILTER WORKOUTS
    // =====================================================

    function filterWorkouts() {

        const search =
            searchInput?.value
                .trim()
                .toLowerCase() || "";


        const selectedDate =
            filterDate?.value || "";


        const selectedExercise =
            filterExercise?.value
                .toLowerCase() || "";


        const filtered =
            workouts.filter(
                workout => {

                    // -------------------------------
                    // SEARCH
                    // -------------------------------

                    const workoutName =
                        (
                            workout.workoutName ||
                            ""
                        ).toLowerCase();


                    const notes =
                        (
                            workout.notes ||
                            ""
                        ).toLowerCase();


                    const exerciseNames =
                        (
                            workout.exercises || []
                        )
                        .map(
                            exercise =>
                                exercise.name || ""
                        )
                        .join(" ")
                        .toLowerCase();


                    const matchesSearch =
                        !search ||
                        workoutName.includes(search) ||
                        notes.includes(search) ||
                        exerciseNames.includes(search);


                    // -------------------------------
                    // DATE
                    // -------------------------------

                    const workoutDate =
                        workout.workoutDate
                            ? workout.workoutDate
                                .substring(0, 10)
                            : "";


                    const matchesDate =
                        !selectedDate ||
                        workoutDate === selectedDate;


                    // -------------------------------
                    // EXERCISE
                    // -------------------------------

                    const matchesExercise =
                        !selectedExercise ||
                        (
                            workout.exercises || []
                        ).some(
                            exercise =>
                                (
                                    exercise.name || ""
                                ).toLowerCase() ===
                                selectedExercise
                        );


                    return (
                        matchesSearch &&
                        matchesDate &&
                        matchesExercise
                    );

                }
            );


        renderWorkouts(filtered);
    }


    // =====================================================
    // RENDER WORKOUTS
    // =====================================================

    function renderWorkouts(workoutArray) {

        if (!historyContainer) return;


        // Remove previous cards
        historyContainer
            .querySelectorAll(".history-card")
            .forEach(card => card.remove());


        // Update count
        if (workoutCount) {

            workoutCount.textContent =
                `${workoutArray.length} ${
                    workoutArray.length === 1
                        ? "Workout"
                        : "Workouts"
                }`;
        }


        // No results
        if (!workoutArray.length) {

            if (emptyHistory) {

                emptyHistory.style.display =
                    "block";

                emptyHistory.innerHTML = `
                    <div class="empty-icon">
                        +
                    </div>

                    <h3>
                        No workouts found
                    </h3>

                    <p>
                        Try changing your filters
                        or log a new workout.
                    </p>

                    <a
                        href="workout.html"
                        class="btn primary-btn"
                    >
                        Log Workout
                    </a>
                `;

                historyContainer.appendChild(
                    emptyHistory
                );
            }

            return;
        }


        // Hide empty state
        if (emptyHistory) {

            emptyHistory.style.display =
                "none";
        }


        // Render cards
        workoutArray.forEach(
            workout => {

                const card =
                    createWorkoutCard(
                        workout
                    );


                historyContainer.appendChild(
                    card
                );

            }
        );
    }


    // =====================================================
    // CREATE WORKOUT CARD
    // =====================================================

    function createWorkoutCard(workout) {

        const card =
            document.createElement("article");


        card.className =
            "history-card";


        const volume =
            calculateWorkoutVolume(
                workout
            );


        const sets =
            calculateWorkoutSets(
                workout
            );


        const exercises =
            workout.exercises?.length || 0;


        let exercisesHTML = "";


        if (
            workout.exercises &&
            workout.exercises.length
        ) {

            exercisesHTML =
                workout.exercises
                    .map(
                        exercise => {

                            const exerciseSets =
                                exercise.sets || [];


                            const setText =
                                exerciseSets
                                    .map(
                                        set =>
                                            `${Number(set.weight) || 0} kg × ${
                                                Number(set.reps) || 0
                                            }`
                                    )
                                    .join("  •  ");


                            return `
                                <div class="history-exercise">

                                    <div>
                                        <div class="history-exercise-name">
                                            ${escapeHTML(
                                                exercise.name ||
                                                "Unnamed Exercise"
                                            )}
                                        </div>

                                        <div class="history-exercise-info">
                                            ${
                                                exerciseSets.length
                                            } ${
                                                exerciseSets.length === 1
                                                    ? "set"
                                                    : "sets"
                                            }

                                            ${
                                                setText
                                                    ? ` • ${escapeHTML(setText)}`
                                                    : ""
                                            }
                                        </div>
                                    </div>

                                </div>
                            `;
                        }
                    )
                    .join("");

        } else {

            exercisesHTML = `
                <p class="text-muted">
                    No exercise data available.
                </p>
            `;
        }


        card.innerHTML = `

            <div class="history-card-header">

                <div>

                    <h3>
                        ${escapeHTML(
                            workout.workoutName ||
                            "Workout"
                        )}
                    </h3>

                    <span class="history-date">
                        ${formatDate(
                            workout.workoutDate
                        )}
                    </span>

                </div>


                <div class="card-actions">

                    <button
                        type="button"
                        class="btn secondary-btn view-workout"
                    >
                        View
                    </button>

                </div>

            </div>


            <div class="history-summary">

                <span class="badge badge-blue">
                    ${exercises}
                    ${
                        exercises === 1
                            ? " Exercise"
                            : " Exercises"
                    }
                </span>

                <span class="badge badge-blue">
                    ${sets}
                    ${
                        sets === 1
                            ? " Set"
                            : " Sets"
                    }
                </span>

                <span class="badge badge-green">
                    ${volume.toFixed(1)} kg
                </span>

            </div>


            <div class="history-exercises">

                ${exercisesHTML}

            </div>


            ${
                workout.notes
                    ? `
                        <div class="history-notes">
                            <strong>Notes</strong>
                            <p>
                                ${escapeHTML(
                                    workout.notes
                                )}
                            </p>
                        </div>
                    `
                    : ""
            }

        `;


        // View button
        const viewButton =
            card.querySelector(
                ".view-workout"
            );


        if (viewButton) {

            viewButton.addEventListener(
                "click",
                () => {

                    openWorkoutModal(
                        workout
                    );

                }
            );
        }


        return card;
    }


    // =====================================================
    // OPEN WORKOUT MODAL
    // =====================================================

    function openWorkoutModal(workout) {

        if (!workoutModal) return;


        selectedWorkoutId =
            workout.id;


        if (modalWorkoutName) {

            modalWorkoutName.textContent =
                workout.workoutName ||
                "Workout";
        }


        if (modalWorkoutDate) {

            modalWorkoutDate.textContent =
                formatDate(
                    workout.workoutDate
                );
        }


        if (modalWorkoutDuration) {

            modalWorkoutDuration.textContent =
                "Not recorded";
        }


        if (modalWorkoutNotes) {

            modalWorkoutNotes.textContent =
                workout.notes ||
                "No notes available.";
        }


        if (modalExerciseList) {

            modalExerciseList.innerHTML =
                "";


            if (
                !workout.exercises ||
                !workout.exercises.length
            ) {

                modalExerciseList.innerHTML = `
                    <p class="text-muted">
                        No exercises recorded.
                    </p>
                `;

            } else {

                workout.exercises.forEach(
                    exercise => {

                        const exerciseElement =
                            document.createElement(
                                "div"
                            );


                        exerciseElement.className =
                            "modal-exercise";


                        let setsHTML = "";


                        (exercise.sets || [])
                            .forEach(
                                set => {

                                    setsHTML += `
                                        <div class="modal-set">

                                            <span>
                                                Set ${
                                                    Number(
                                                        set.setNumber
                                                    ) || 0
                                                }
                                            </span>

                                            <strong>
                                                ${
                                                    Number(
                                                        set.weight
                                                    ) || 0
                                                } kg
                                            </strong>

                                            <span>
                                                ${
                                                    Number(
                                                        set.reps
                                                    ) || 0
                                                } reps
                                            </span>

                                            <span>
                                                ${
                                                    (
                                                        (
                                                            Number(
                                                                set.weight
                                                            ) || 0
                                                        ) *
                                                        (
                                                            Number(
                                                                set.reps
                                                            ) || 0
                                                        )
                                                    ).toFixed(1)
                                                } kg volume
                                            </span>

                                        </div>
                                    `;

                                }
                            );


                        exerciseElement.innerHTML = `

                            <h4>
                                ${escapeHTML(
                                    exercise.name ||
                                    "Exercise"
                                )}
                            </h4>

                            <div class="modal-set-list">

                                ${setsHTML}

                            </div>

                        `;


                        modalExerciseList.appendChild(
                            exerciseElement
                        );

                    }
                );
            }
        }


        workoutModal.classList.remove(
            "hidden"
        );
    }


    // =====================================================
    // CLOSE MODAL
    // =====================================================

    function closeModal() {

        if (!workoutModal) return;

        workoutModal.classList.add(
            "hidden"
        );

        selectedWorkoutId = null;
    }


    if (closeWorkoutModal) {

        closeWorkoutModal.addEventListener(
            "click",
            closeModal
        );
    }


    if (workoutModal) {

        workoutModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    workoutModal
                ) {

                    closeModal();
                }

            }
        );
    }


    // =====================================================
    // DELETE WORKOUT
    // =====================================================

    if (deleteWorkoutButton) {

        deleteWorkoutButton.addEventListener(
            "click",
            async () => {

                if (!selectedWorkoutId) {
                    return;
                }


                const confirmed =
                    confirm(
                        "Are you sure you want to delete this workout?"
                    );


                if (!confirmed) {
                    return;
                }


                try {

                    deleteWorkoutButton.disabled =
                        true;


                    deleteWorkoutButton.textContent =
                        "Deleting...";


                    const response =
                        await fetch(
                            `/api/workouts/${selectedWorkoutId}`,
                            {
                                method: "DELETE",

                                headers: {
                                    "Authorization":
                                        `Bearer ${token}`
                                }
                            }
                        );


                    if (
                        response.status === 401 ||
                        response.status === 403
                    ) {

                        logout();

                        return;
                    }


                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            "Failed to delete workout"
                        );
                    }


                    closeModal();


                    // Remove deleted workout locally
                    workouts =
                        workouts.filter(
                            workout =>
                                workout.id !==
                                selectedWorkoutId
                        );


                    updateStatistics();

                    populateExerciseFilter();

                    filterWorkouts();


                } catch (error) {

                    console.error(
                        "Delete workout error:",
                        error
                    );


                    alert(
                        error.message ||
                        "Failed to delete workout."
                    );


                } finally {

                    deleteWorkoutButton.disabled =
                        false;

                    deleteWorkoutButton.textContent =
                        "Delete Workout";
                }

            }
        );
    }


    // =====================================================
    // SEARCH
    // =====================================================

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterWorkouts
        );
    }


    // =====================================================
    // DATE FILTER
    // =====================================================

    if (filterDate) {

        filterDate.addEventListener(
            "change",
            filterWorkouts
        );
    }


    // =====================================================
    // EXERCISE FILTER
    // =====================================================

    if (filterExercise) {

        filterExercise.addEventListener(
            "change",
            filterWorkouts
        );
    }


    // =====================================================
    // CLEAR FILTERS
    // =====================================================

    if (clearFiltersButton) {

        clearFiltersButton.addEventListener(
            "click",
            () => {

                if (searchInput) {
                    searchInput.value = "";
                }


                if (filterDate) {
                    filterDate.value = "";
                }


                if (filterExercise) {
                    filterExercise.value = "";
                }


                renderWorkouts(
                    workouts
                );

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
    // INITIALIZE
    // =====================================================

    await loadWorkouts();

});