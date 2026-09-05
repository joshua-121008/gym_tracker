const TOKEN_KEY = "gymToken";

document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // AUTHENTICATION
    // =========================

    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
        window.location.href = "login.html";
        return;
    }


    // =========================
    // DOM ELEMENTS
    // =========================

    const form = document.querySelector("#programForm");
    const section = document.querySelector("#programFormSection");
    const container = document.querySelector("#programsContainer");
    const emptyState = document.querySelector("#emptyPrograms");
    const count = document.querySelector("#programCount");
    const message = document.querySelector("#programMessage");

    const createButton =
        document.querySelector("#createProgramButton");

    const emptyCreateButton =
        document.querySelector("#emptyCreateProgramButton");

    const closeButton =
        document.querySelector("#closeProgramForm");

    const cancelButton =
        document.querySelector("#cancelProgramButton");

    const logoutButton =
        document.querySelector("#logoutButton");


    // =========================
    // API HEADERS
    // =========================

    function getHeaders() {
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };
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
    // SHOW MESSAGE
    // =========================

    function showMessage(text, type = "") {

        if (!message) return;

        message.textContent = text;
        message.className =
            `form-message ${type}`;

    }


    // =========================
    // OPEN FORM
    // =========================

    function openForm() {

        if (!section) return;

        section.classList.remove("hidden");
        section.style.display = "block";

        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    // =========================
    // CLOSE FORM
    // =========================

    function closeForm() {

        if (form) {
            form.reset();
        }

        if (section) {
            section.style.display = "none";
        }

        showMessage("");

    }


    // =========================
    // LOAD PROGRAMS
    // =========================

    async function loadPrograms() {

        try {

            const response = await fetch(
                "/api/programs",
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


            // Authentication error

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                localStorage.removeItem(
                    TOKEN_KEY
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
                    "Failed to load programs."
                );

            }


            const data =
                await response.json();


            const programs =
                Array.isArray(data)
                    ? data
                    : data.programs || [];


            renderPrograms(programs);

        } catch (error) {

            console.error(
                "Load programs error:",
                error
            );

            showMessage(
                "Unable to load programs.",
                "error"
            );

        }

    }


    // =========================
    // RENDER PROGRAMS
    // =========================

    function renderPrograms(programs) {

        if (!container) return;


        // Program count

        if (count) {

            count.textContent =
                `${programs.length} Program${programs.length === 1 ? "" : "s"}`;

        }


        // No programs

        if (programs.length === 0) {

            container.innerHTML = "";


            if (emptyState) {

                emptyState.style.display =
                    "block";

                container.appendChild(
                    emptyState
                );

            }

            return;

        }


        // Hide empty state

        if (emptyState) {

            emptyState.style.display =
                "none";

        }


        // Create program cards

        container.innerHTML =
            programs.map(program => {

                return `

                    <article class="program-card">

                        <div class="program-card-header">

                            <h3>
                                ${escapeHTML(
                                    program.name
                                )}
                            </h3>

                            <button
                                type="button"
                                class="btn btn-danger delete-program"
                                data-id="${program.id}"
                            >
                                Delete
                            </button>

                        </div>


                        <p>
                            <strong>Goal:</strong>
                            ${escapeHTML(
                                program.goal || "-"
                            )}
                        </p>


                        <p>
                            <strong>Duration:</strong>
                            ${escapeHTML(
                                program.duration || "-"
                            )}
                            weeks
                        </p>


                        <p>
                            <strong>Days/week:</strong>
                            ${escapeHTML(
                                program.daysPerWeek || "-"
                            )}
                        </p>


                        <p>
                            <strong>Start:</strong>
                            ${escapeHTML(
                                program.startDate || "-"
                            )}
                        </p>


                        <p>
                            ${escapeHTML(
                                program.description ||
                                "No description"
                            )}
                        </p>

                    </article>

                `;

            }).join("");


        // Add delete events

        const deleteButtons =
            container.querySelectorAll(
                ".delete-program"
            );


        deleteButtons.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const programId =
                        button.dataset.id;

                    deleteProgram(
                        programId
                    );

                }
            );

        });

    }


    // =========================
    // DELETE PROGRAM
    // =========================

    async function deleteProgram(programId) {

        const confirmed =
            confirm(
                "Are you sure you want to delete this program?"
            );


        if (!confirmed) return;


        try {

            const response =
                await fetch(
                    `/api/programs/${programId}`,
                    {
                        method: "DELETE",
                        headers: getHeaders()
                    }
                );


            if (
                response.status === 401 ||
                response.status === 403
            ) {

                localStorage.removeItem(
                    TOKEN_KEY
                );

                localStorage.removeItem(
                    "gymCurrentUser"
                );

                window.location.href =
                    "login.html";

                return;

            }


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to delete program."
                );

            }


            await loadPrograms();

        } catch (error) {

            console.error(
                "Delete program error:",
                error
            );

            alert(
                error.message ||
                "Unable to delete program."
            );

        }

    }


    // =========================
    // CREATE PROGRAM
    // =========================

    async function createProgram(event) {

        event.preventDefault();


        const name =
            document
                .querySelector("#programName")
                ?.value
                .trim();


        const goal =
            document
                .querySelector("#programGoal")
                ?.value;


        const duration =
            document
                .querySelector("#programDuration")
                ?.value;


        const daysPerWeek =
            document
                .querySelector("#daysPerWeek")
                ?.value;


        const startDate =
            document
                .querySelector("#programStartDate")
                ?.value;


        const description =
            document
                .querySelector("#programDescription")
                ?.value
                .trim();


        // Validation

        if (
            !name ||
            !goal ||
            !duration ||
            !daysPerWeek ||
            !startDate
        ) {

            showMessage(
                "Please fill in all required fields.",
                "error"
            );

            return;

        }


        const programData = {

            name: name,

            goal: goal,

            duration: Number(duration),

            daysPerWeek: Number(daysPerWeek),

            startDate: startDate,

            description: description

        };


        try {

            showMessage(
                "Saving program..."
            );


            const response =
                await fetch(
                    "/api/programs",
                    {
                        method: "POST",
                        headers: getHeaders(),
                        body: JSON.stringify(
                            programData
                        )
                    }
                );


            if (
                response.status === 401 ||
                response.status === 403
            ) {

                localStorage.removeItem(
                    TOKEN_KEY
                );

                localStorage.removeItem(
                    "gymCurrentUser"
                );

                window.location.href =
                    "login.html";

                return;

            }


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to create program."
                );

            }


            showMessage(
                "Program created successfully!",
                "success"
            );


            form.reset();


            await loadPrograms();


            setTimeout(() => {

                closeForm();

            }, 700);


        } catch (error) {

            console.error(
                "Create program error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to create program.",
                "error"
            );

        }

    }


    // =========================
    // EVENT LISTENERS
    // =========================

    createButton?.addEventListener(
        "click",
        openForm
    );


    emptyCreateButton?.addEventListener(
        "click",
        openForm
    );


    closeButton?.addEventListener(
        "click",
        closeForm
    );


    cancelButton?.addEventListener(
        "click",
        closeForm
    );


    form?.addEventListener(
        "submit",
        createProgram
    );


    // =========================
    // LOGOUT
    // =========================

    logoutButton?.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                TOKEN_KEY
            );

            localStorage.removeItem(
                "gymCurrentUser"
            );

            window.location.href =
                "login.html";

        }
    );


    // =========================
    // INITIAL LOAD
    // =========================

    loadPrograms();

});