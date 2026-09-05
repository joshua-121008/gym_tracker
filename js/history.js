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

    const historyContainer =
        document.querySelector("#historyContainer");

    const emptyHistory =
        document.querySelector("#emptyHistory");

    const searchWorkout =
        document.querySelector("#searchWorkout");

    const filterDate =
        document.querySelector("#filterDate");

    const filterExercise =
        document.querySelector("#filterExercise");

    const clearFiltersButton =
        document.querySelector("#clearFiltersButton");

    const logoutButton =
        document.querySelector("#logoutButton");

    const workoutModal =
        document.querySelector("#workoutModal");

    const closeWorkoutModal =
        document.querySelector("#closeWorkoutModal");

    const deleteWorkoutButton =
        document.querySelector("#deleteWorkoutButton");


    // =====================================================
    // STAT ELEMENTS
    // =====================================================

    const totalWorkoutsElement =
        document.querySelector("#historyTotalWorkouts");

    const totalExercisesElement =
        document.querySelector("#historyTotalExercises");

    const totalSetsElement =
        document.querySelector("#historyTotalSets");

    const totalWeightElement =
        document.querySelector("#historyTotalWeight");

    const workoutCountElement =
        document.querySelector("#workoutCount");


    // =====================================================
    // MODAL ELEMENTS
    // =====================================================

    const modalWorkoutName =
        document.querySelector("#modalWorkoutName");

    const modalWorkoutDate =
        document.querySelector("#modalWorkoutDate");

    const modalWorkoutDuration =
        document.querySelector("#modalWorkoutDuration");

    const modalExerciseList =
        document.querySelector("#modalExerciseList");

    const modalWorkoutNotes =
        document.querySelector("#modalWorkoutNotes");


    // =====================================================
    // DATA
    // =====================================================

    let workouts = [];

    let selectedWorkout = null;


    // =====================================================
    // LOGOUT
    // =====================================================

    function logout() {

        localStorage.removeItem("gymToken");
        localStorage.removeItem("gymCurrentUser");

        window.location.href = "login.html";
    }

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            logout
        );
    }


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    function escapeHTML(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    // =====================================================
    // FORMAT DATE
    // =====================================================

    function formatDate(dateValue) {

        if (!dateValue) {
            return "-";
        }

        const date = new Date(dateValue);

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
    // CALCULATE WORKOUT STATS
    // =====================================================

    function getWorkoutStats(workout) {

        let exercises = 0;
        let sets = 0;
        let reps = 0;
        let volume = 0;

        if (Array.isArray(workout.exercises)) {

            exercises =
                workout.exercises.length;


            workout.exercises.forEach(
                exercise => {

                    if (!Array.isArray(exercise.sets)) {
                        return;
                    }

                    sets +=
                        exercise.sets.length;


                    exercise.sets.forEach(set => {

                        const weight =
                            Number(set.weight) || 0;

                        const setReps =
                            Number(set.reps) || 0;

                        reps += setReps;

                        volume +=
                            weight * setReps;
                    });
                }
            );
        }

        return {
            exercises,
            sets,
            reps,
            volume
        };
    }


    // =====================================================
    // UPDATE STATISTICS
    // =====================================================

    function updateStatistics(list) {

        let totalExercises = 0;
        let totalSets = 0;
        let totalWeight = 0;


        list.forEach(workout => {

            const stats =
                getWorkoutStats(workout);

            totalExercises +=
                stats.exercises;

            totalSets +=
                stats.sets;

            totalWeight +=
                stats.volume;
        });


        if (totalWorkoutsElement) {
            totalWorkoutsElement.textContent =
                list.length;
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
                `${totalWeight.toFixed(1)} kg`;
        }


        if (workoutCountElement) {

            workoutCountElement.textContent =
                `${list.length} ${
                    list.length === 1
                        ? "Workout"
                        : "Workouts"
                }`;
        }
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


            if (
                response.status === 401 ||
                response.status === 403
            ) {
                logout();
                return;
            }


            if (!response.ok) {

                throw new Error(
                    "Failed to load workout history"
                );
            }


            const data =
                await response.json();


            workouts =
                Array.isArray(data)
                    ? data
                    : [];


            populateExerciseFilter(
                workouts
            );


            updateStatistics(
                workouts
            );


            renderWorkouts(
                workouts
            );


        } catch (error) {

            console.error(
                "Load workouts error:",
                error
            );


            workouts = [];

            updateStatistics([]);

            renderWorkouts([]);
        }
    }


    // =====================================================
    // POPULATE EXERCISE FILTER
    // =====================================================

    function populateExerciseFilter(list) {

        if (!filterExercise) return;


        const exerciseNames =
            new Set();


        list.forEach(workout => {

            if (!Array.isArray(workout.exercises)) {
                return;
            }


            workout.exercises.forEach(
                exercise => {

                    if (exercise.name) {

                        exerciseNames.add(
                            exercise.name.trim()
                        );
                    }
                }
            );
        });


        const sortedNames =
            [...exerciseNames].sort(
                (a, b) =>
                    a.localeCompare(b)
            );


        filterExercise.innerHTML = `
            <option value="">
                All Exercises
            </option>
        `;


        sortedNames.forEach(name => {

            const option =
                document.createElement("option");

            option.value = name;

            option.textContent = name;

            filterExercise.appendChild(
                option
            );
        });
    }


    // =====================================================
    // FILTER WORKOUTS
    // =====================================================

    function filterWorkouts() {

        const search =
            searchWorkout?.value
                .trim()
                .toLowerCase() || "";


        const date =
            filterDate?.value || "";


        const exercise =
            filterExercise?.value
                .trim()
                .toLowerCase() || "";


        const filtered =
            workouts.filter(workout => {

                // Search workout name
                if (search) {

                    const name =
                        String(
                            workout.workoutName || ""
                        ).toLowerCase();


                    if (!name.includes(search)) {
                        return false;
                    }
                }


                // Date filter
                if (date) {

                    const workoutDate =
                        String(
                            workout.workoutDate || ""
                        ).split("T")[0];


                    if (workoutDate !== date) {
                        return false;
                    }
                }


                // Exercise filter
                if (exercise) {

                    const hasExercise =
                        Array.isArray(
                            workout.exercises
                        ) &&
                        workout.exercises.some(
                            item =>
                                String(
                                    item.name || ""
                                )
                                .trim()
                                .toLowerCase() ===
                                exercise
                        );


                    if (!hasExercise) {
                        return false;
                    }
                }


                return true;
            });


        updateStatistics(
            filtered
        );


        renderWorkouts(
            filtered
        );
    }


    // =====================================================
    // RENDER WORKOUTS
    // =====================================================

    function renderWorkouts(list) {

        if (!historyContainer) return;


        const existingCards =
            historyContainer.querySelectorAll(
                ".history-card"
            );


        existingCards.forEach(card => {
            card.remove();
        });


        if (!list.length) {

            if (emptyHistory) {
                emptyHistory.style.display =
                    "block";
            }

            return;
        }


        if (emptyHistory) {
            emptyHistory.style.display =
                "none";
        }


        list.forEach(workout => {

            const stats =
                getWorkoutStats(
                    workout
                );


            const card =
                document.createElement("article");


            card.className =
                "history-card";


            const programHTML =
                workout.programName
                    ? `
                        <span class="history-meta-badge">
                            Program:
                            ${escapeHTML(
                                workout.programName
                            )}
                        </span>
                    `
                    : "";


            const planHTML =
                workout.planName
                    ? `
                        <span class="history-meta-badge">
                            Plan:
                            ${escapeHTML(
                                workout.planName
                            )}
                        </span>
                    `
                    : "";


            card.innerHTML = `

                <div class="history-card-main">

                    <div class="history-card-info">

                        <p class="history-card-label">
                            WORKOUT
                        </p>

                        <h3>
                            ${escapeHTML(
                                workout.workoutName ||
                                "Workout"
                            )}
                        </h3>

                        <p class="history-card-date">
                            ${formatDate(
                                workout.workoutDate
                            )}
                        </p>

                        <div class="history-meta">

                            ${programHTML}

                            ${planHTML}

                        </div>

                    </div>


                    <div class="history-card-stats">

                        <div>
                            <strong>
                                ${stats.exercises}
                            </strong>

                            <span>
                                Exercises
                            </span>
                        </div>


                        <div>
                            <strong>
                                ${stats.sets}
                            </strong>

                            <span>
                                Sets
                            </span>
                        </div>


                        <div>
                            <strong>
                                ${stats.volume.toFixed(1)}
                                kg
                            </strong>

                            <span>
                                Volume
                            </span>
                        </div>

                    </div>


                    <button
                        type="button"
                        class="btn secondary-btn view-workout"
                        data-id="${workout.id}"
                    >
                        View Workout
                    </button>

                </div>
            `;


            historyContainer.appendChild(
                card
            );
        });
    }


    // =====================================================
    // OPEN WORKOUT MODAL
    // =====================================================

    function openWorkoutModal(workout) {

        if (!workoutModal || !workout) {
            return;
        }


        selectedWorkout =
            workout;


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


        // -----------------------------------------------
        // PROGRAM + PLAN
        // -----------------------------------------------

        let relationshipHTML = "";


        if (
            workout.programName ||
            workout.planName
        ) {

            relationshipHTML = `

                <div class="modal-workout-relationship">

                    ${
                        workout.programName
                            ? `
                                <div>
                                    <span>
                                        Program
                                    </span>

                                    <strong>
                                        ${escapeHTML(
                                            workout.programName
                                        )}
                                    </strong>
                                </div>
                            `
                            : ""
                    }


                    ${
                        workout.planName
                            ? `
                                <div>
                                    <span>
                                        Plan
                                    </span>

                                    <strong>
                                        ${escapeHTML(
                                            workout.planName
                                        )}
                                    </strong>
                                </div>
                            `
                            : ""
                    }

                </div>
            `;
        }


        // Insert relationship information
        // above exercise list
        const existingRelationship =
            workoutModal.querySelector(
                ".modal-workout-relationship"
            );


        if (existingRelationship) {
            existingRelationship.remove();
        }


        const modalInfo =
            workoutModal.querySelector(
                ".modal-info"
            );


        if (
            modalInfo &&
            relationshipHTML
        ) {

            modalInfo.insertAdjacentHTML(
                "afterend",
                relationshipHTML
            );
        }


        // -----------------------------------------------
        // EXERCISES
        // -----------------------------------------------

        if (modalExerciseList) {

            modalExerciseList.innerHTML = "";


            if (
                !Array.isArray(
                    workout.exercises
                ) ||
                workout.exercises.length === 0
            ) {

                modalExerciseList.innerHTML = `
                    <p class="modal-empty">
                        No exercise details available.
                    </p>
                `;

            } else {

                workout.exercises.forEach(
                    (exercise, index) => {

                        const exerciseBlock =
                            document.createElement(
                                "div"
                            );


                        exerciseBlock.className =
                            "modal-exercise";


                        let setsHTML = "";


                        if (
                            Array.isArray(
                                exercise.sets
                            ) &&
                            exercise.sets.length
                        ) {

                            setsHTML =
                                exercise.sets
                                    .map(
                                        set => {

                                            const weight =
                                                Number(
                                                    set.weight
                                                ) || 0;

                                            const reps =
                                                Number(
                                                    set.reps
                                                ) || 0;

                                            const volume =
                                                weight *
                                                reps;


                                            return `
                                                <div class="modal-set-row">

                                                    <span>
                                                        Set ${set.setNumber}
                                                    </span>

                                                    <span>
                                                        ${weight}
                                                        kg
                                                    </span>

                                                    <span>
                                                        ${reps}
                                                        reps
                                                    </span>

                                                    <span>
                                                        ${volume.toFixed(1)}
                                                        kg
                                                    </span>

                                                </div>
                                            `;
                                        }
                                    )
                                    .join("");

                        } else {

                            setsHTML = `
                                <p class="modal-empty">
                                    No sets recorded.
                                </p>
                            `;
                        }


                        exerciseBlock.innerHTML = `

                            <div class="modal-exercise-header">

                                <span>
                                    ${String(
                                        index + 1
                                    ).padStart(
                                        2,
                                        "0"
                                    )}
                                </span>

                                <h4>
                                    ${escapeHTML(
                                        exercise.name ||
                                        "Exercise"
                                    )}
                                </h4>

                            </div>


                            <div class="modal-set-header">

                                <span>
                                    Set
                                </span>

                                <span>
                                    Weight
                                </span>

                                <span>
                                    Reps
                                </span>

                                <span>
                                    Volume
                                </span>

                            </div>


                            <div class="modal-set-list">

                                ${setsHTML}

                            </div>
                        `;


                        modalExerciseList.appendChild(
                            exerciseBlock
                        );

                    }
                );
            }
        }


        // -----------------------------------------------
        // NOTES
        // -----------------------------------------------

        if (modalWorkoutNotes) {

            modalWorkoutNotes.textContent =
                workout.notes ||
                "No notes available.";
        }


        workoutModal.classList.remove(
            "hidden"
        );
    }


    // =====================================================
    // CLOSE WORKOUT MODAL
    // =====================================================

    function closeModal() {

        if (!workoutModal) return;

        workoutModal.classList.add(
            "hidden"
        );

        selectedWorkout =
            null;
    }


    // =====================================================
    // HISTORY CARD EVENTS
    // =====================================================

    if (historyContainer) {

        historyContainer.addEventListener(
            "click",
            event => {

                const viewButton =
                    event.target.closest(
                        ".view-workout"
                    );


                if (!viewButton) {
                    return;
                }


                const workoutId =
                    Number(
                        viewButton.dataset.id
                    );


                const workout =
                    workouts.find(
                        item =>
                            Number(item.id) ===
                            workoutId
                    );


                if (workout) {
                    openWorkoutModal(
                        workout
                    );
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

                if (!selectedWorkout) {
                    return;
                }


                const confirmed =
                    window.confirm(
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
                            `/api/workouts/${selectedWorkout.id}`,
                            {
                                method: "DELETE",

                                headers: {
                                    "Authorization":
                                        `Bearer ${token}`
                                }
                            }
                        );


                    const data =
                        await response.json();


                    if (
                        response.status === 401 ||
                        response.status === 403
                    ) {

                        logout();

                        return;
                    }


                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            "Failed to delete workout."
                        );
                    }


                    workouts =
                        workouts.filter(
                            workout =>
                                workout.id !==
                                selectedWorkout.id
                        );


                    populateExerciseFilter(
                        workouts
                    );


                    updateStatistics(
                        workouts
                    );


                    renderWorkouts(
                        workouts
                    );


                    closeModal();


                } catch (error) {

                    console.error(
                        "Delete workout error:",
                        error
                    );


                    alert(
                        error.message ||
                        "Unable to delete workout."
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
    // FILTER EVENTS
    // =====================================================

    if (searchWorkout) {

        searchWorkout.addEventListener(
            "input",
            filterWorkouts
        );
    }


    if (filterDate) {

        filterDate.addEventListener(
            "change",
            filterWorkouts
        );
    }


    if (filterExercise) {

        filterExercise.addEventListener(
            "change",
            filterWorkouts
        );
    }


    if (clearFiltersButton) {

        clearFiltersButton.addEventListener(
            "click",
            () => {

                if (searchWorkout) {
                    searchWorkout.value = "";
                }

                if (filterDate) {
                    filterDate.value = "";
                }

                if (filterExercise) {
                    filterExercise.value = "";
                }

                filterWorkouts();
            }
        );
    }


    // =====================================================
    // MODAL CLOSE EVENTS
    // =====================================================

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


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                workoutModal &&
                !workoutModal.classList.contains(
                    "hidden"
                )
            ) {

                closeModal();
            }
        }
    );


    // =====================================================
    // INITIALIZE
    // =====================================================

    await loadWorkouts();

});