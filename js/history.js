document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("gymToken");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const historyContainer = document.getElementById("historyContainer");
    const emptyHistory = document.getElementById("emptyHistory");

    try {

        const response = await fetch("/api/workouts", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        console.log("Workout API response:", data);

        if (!response.ok) {
            throw new Error(data.message || "Failed to load workouts");
        }

        // Your API returns an ARRAY directly
        const workouts = data;

        console.log("Number of workouts:", workouts.length);

        // Statistics
        let totalExercises = 0;
        let totalSets = 0;
        let totalWeight = 0;

        workouts.forEach(workout => {

            if (workout.exercises) {

                totalExercises += workout.exercises.length;

                workout.exercises.forEach(exercise => {

                    if (exercise.sets) {

                        totalSets += exercise.sets.length;

                        exercise.sets.forEach(set => {
                            totalWeight +=
                                Number(set.weight || 0) *
                                Number(set.reps || 0);
                        });
                    }

                });
            }
        });

        document.getElementById("historyTotalWorkouts").textContent =
            workouts.length;

        document.getElementById("historyTotalExercises").textContent =
            totalExercises;

        document.getElementById("historyTotalSets").textContent =
            totalSets;

        document.getElementById("historyTotalWeight").textContent =
            `${totalWeight} kg`;

        document.getElementById("workoutCount").textContent =
            `${workouts.length} Workouts`;


        // Remove empty message
        if (emptyHistory) {
            emptyHistory.style.display = "none";
        }


        // Display workouts
        workouts.forEach(workout => {

            const card = document.createElement("div");

            card.className = "history-card";

            let exercisesHTML = "";

            if (workout.exercises && workout.exercises.length > 0) {

                workout.exercises.forEach(exercise => {

                    let setsHTML = "";

                    if (exercise.sets && exercise.sets.length > 0) {

                        exercise.sets.forEach(set => {

                            setsHTML += `
                                <div class="set-row">
                                    <span>
                                        Set ${set.set_number}
                                    </span>

                                    <span>
                                        ${set.weight} kg
                                    </span>

                                    <span>
                                        ${set.reps} reps
                                    </span>
                                </div>
                            `;

                        });
                    }

                    exercisesHTML += `
                        <div class="exercise-history">

                            <h3>
                                ${exercise.exercise_name}
                            </h3>

                            ${setsHTML}

                        </div>
                    `;
                });
            }

            card.innerHTML = `

                <div class="history-header">

                    <div>

                        <h2>
                            ${workout.workout_name}
                        </h2>

                        <p>
                            ${workout.workout_date}
                        </p>

                    </div>

                    <button
                        class="delete-workout"
                        data-id="${workout.id}">
                        Delete
                    </button>

                </div>

                <div class="workout-exercises">

                    ${exercisesHTML}

                </div>

                ${
                    workout.notes
                    ? `<p>${workout.notes}</p>`
                    : ""
                }

            `;

            historyContainer.appendChild(card);

        });


        // Delete buttons
        document.querySelectorAll(".delete-workout").forEach(button => {

            button.addEventListener("click", async () => {

                const workoutId = button.dataset.id;

                if (!confirm("Delete this workout?")) {
                    return;
                }

                const deleteResponse = await fetch(
                    `/api/workouts/${workoutId}`,
                    {
                        method: "DELETE",
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    }
                );

                if (deleteResponse.ok) {

                    location.reload();

                } else {

                    const errorData =
                        await deleteResponse.json();

                    alert(
                        errorData.message ||
                        "Failed to delete workout"
                    );
                }

            });

        });

    } catch (error) {

        console.error("History error:", error);

        historyContainer.innerHTML = `
            <div class="empty-state">

                <h3>
                    Unable to load workout history
                </h3>

                <p>
                    ${error.message}
                </p>

            </div>
        `;
    }

});