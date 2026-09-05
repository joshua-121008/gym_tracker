const TOKEN_KEY = "gymToken";

document.addEventListener("DOMContentLoaded", function () {

    // ==============================
    // GET ELEMENTS
    // ==============================

    const createButton =
        document.getElementById("createPlanButton");

    const emptyCreateButton =
        document.getElementById("emptyCreatePlanButton");

    const closeButton =
        document.getElementById("closePlanForm");

    const cancelButton =
        document.getElementById("cancelPlanButton");

    const formSection =
        document.getElementById("planFormSection");

    const form =
        document.getElementById("planForm");

    const plansContainer =
        document.getElementById("plansContainer");

    const planCount =
        document.getElementById("planCount");

    const message =
        document.getElementById("planMessage");

    const programSelect =
        document.getElementById("planProgram");


    // ==============================
    // CHECK LOGIN
    // ==============================

    const token =
        localStorage.getItem(TOKEN_KEY);

    if (!token) {

        window.location.href = "login.html";

        return;
    }


    // ==============================
    // AUTH HEADERS
    // ==============================

    function getHeaders() {

        return {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        };

    }


    // ==============================
    // LOGOUT / AUTH FAILURE
    // ==============================

    function handleAuthFailure() {

        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("gymCurrentUser");

        window.location.href = "login.html";

    }


    // ==============================
    // OPEN FORM
    // ==============================

    function openForm() {

        if (!formSection) {
            return;
        }

        formSection.classList.remove("hidden");

        formSection.style.display = "block";

        formSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        // Load programs when form opens
        loadPrograms();

    }


    // ==============================
    // CLOSE FORM
    // ==============================

    function closeForm() {

        if (form) {
            form.reset();
        }

        if (formSection) {

            formSection.classList.add("hidden");

            formSection.style.display = "none";

        }

        if (message) {

            message.textContent = "";

            message.className = "form-message";

        }

    }


    // ==============================
    // LOAD PROGRAMS
    // ==============================

    async function loadPrograms() {

        if (!programSelect) {
            return;
        }

        try {

            programSelect.innerHTML = `
                <option value="">
                    No Program
                </option>
            `;


            const response =
                await fetch(
                    "/api/programs",
                    {
                        method: "GET",
                        headers: {
                            "Authorization":
                                "Bearer " + token
                        }
                    }
                );


            if (
                response.status === 401 ||
                response.status === 403
            ) {

                handleAuthFailure();

                return;
            }


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load programs."
                );

            }


            const programs =
                Array.isArray(data)
                    ? data
                    : data.programs || [];


            if (programs.length === 0) {

                programSelect.innerHTML = `
                    <option value="">
                        No Program
                    </option>
                `;

                return;
            }


            programs.forEach(function (program) {

                const option =
                    document.createElement("option");

                option.value = program.id;

                option.textContent =
                    program.name;

                programSelect.appendChild(option);

            });


        } catch (error) {

            console.error(
                "Load programs error:",
                error
            );

            programSelect.innerHTML = `
                <option value="">
                    No Program
                </option>
            `;

        }

    }


    // ==============================
    // BUTTON EVENTS
    // ==============================

    if (createButton) {

        createButton.addEventListener(
            "click",
            openForm
        );

    }


    if (emptyCreateButton) {

        emptyCreateButton.addEventListener(
            "click",
            openForm
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeForm
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeForm
        );

    }


    // ==============================
    // LOAD PLANS
    // ==============================

    async function loadPlans() {

        try {

            const response =
                await fetch(
                    "/api/plans",
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                "Bearer " + token
                        }
                    }
                );


            if (
                response.status === 401 ||
                response.status === 403
            ) {

                handleAuthFailure();

                return;
            }


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load plans."
                );

            }


            const plans =
                Array.isArray(data)
                    ? data
                    : data.plans || [];


            renderPlans(plans);


        } catch (error) {

            console.error(
                "Load plans error:",
                error
            );

            if (message) {

                message.textContent =
                    "Unable to load plans.";

                message.className =
                    "form-message error";

            }

        }

    }


    // ==============================
    // RENDER PLANS
    // ==============================

    function renderPlans(plans) {

        if (!Array.isArray(plans)) {
            plans = [];
        }


        if (planCount) {

            planCount.textContent =
                plans.length +
                (
                    plans.length === 1
                        ? " Plan"
                        : " Plans"
                );

        }


        if (!plansContainer) {
            return;
        }


        // ==============================
        // NO PLANS
        // ==============================

        if (plans.length === 0) {

            plansContainer.innerHTML = `

                <div
                    id="emptyPlans"
                    class="empty-state"
                >

                    <div class="empty-icon">
                        +
                    </div>

                    <h3>
                        No workout plans yet
                    </h3>

                    <p>
                        Create your first workout plan
                        to get started.
                    </p>

                    <button
                        type="button"
                        id="emptyCreatePlanButton"
                        class="btn primary-btn"
                    >
                        Create Your First Plan
                    </button>

                </div>

            `;


            const newEmptyButton =
                document.getElementById(
                    "emptyCreatePlanButton"
                );


            if (newEmptyButton) {

                newEmptyButton.addEventListener(
                    "click",
                    openForm
                );

            }


            return;
        }


        // ==============================
        // PLANS EXIST
        // ==============================

        plansContainer.innerHTML =
            plans.map(function (plan) {

                return `

                    <article class="plan-card">

                        <div class="plan-card-header">

                            <div>

                                <h3>
                                    ${escapeHTML(
                                        plan.name
                                    )}
                                </h3>

                                ${
                                    plan.program_name
                                        ? `
                                            <span class="plan-program">
                                                ${escapeHTML(
                                                    plan.program_name
                                                )}
                                            </span>
                                          `
                                        : ""
                                }

                            </div>


                            <button
                                type="button"
                                class="btn btn-danger delete-plan"
                                data-id="${plan.id}"
                            >
                                Delete
                            </button>

                        </div>


                        <p>
                            ${escapeHTML(
                                plan.description ||
                                "No description"
                            )}
                        </p>


                        <p>

                            <strong>
                                Goal:
                            </strong>

                            ${escapeHTML(
                                plan.goal ||
                                "General fitness"
                            )}

                        </p>

                    </article>

                `;

            }).join("");


        // ==============================
        // DELETE BUTTONS
        // ==============================

        document
            .querySelectorAll(".delete-plan")
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        deletePlan(
                            button.dataset.id
                        );

                    }
                );

            });

    }


    // ==============================
    // ESCAPE HTML
    // ==============================

    function escapeHTML(value) {

        return String(value ?? "").replace(
            /[&<>"']/g,
            function (character) {

                return {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#039;"
                }[character];

            }
        );

    }


    // ==============================
    // CREATE PLAN
    // ==============================

    if (form) {

        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const name =
                    document
                        .getElementById("planName")
                        .value
                        .trim();


                const description =
                    document
                        .getElementById("planDescription")
                        .value
                        .trim();


                const goal =
                    document
                        .getElementById("planGoal")
                        .value;


                const programId =
                    programSelect
                        ? programSelect.value
                        : "";


                // ==============================
                // VALIDATION
                // ==============================

                if (!name) {

                    if (message) {

                        message.textContent =
                            "Please enter a plan name.";

                        message.className =
                            "form-message error";

                    }

                    return;
                }


                try {

                    if (message) {

                        message.textContent =
                            "Saving plan...";

                        message.className =
                            "form-message";

                    }


                    const response =
                        await fetch(
                            "/api/plans",
                            {
                                method: "POST",

                                headers: getHeaders(),

                                body: JSON.stringify({

                                    name:
                                        name,

                                    description:
                                        description || null,

                                    goal:
                                        goal || null,

                                    programId:
                                        programId
                                            ? Number(programId)
                                            : null

                                })

                            }
                        );


                    if (
                        response.status === 401 ||
                        response.status === 403
                    ) {

                        handleAuthFailure();

                        return;
                    }


                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            "Unable to create plan."
                        );

                    }


                    // ==============================
                    // SUCCESS
                    // ==============================

                    if (message) {

                        message.textContent =
                            "Plan created successfully.";

                        message.className =
                            "form-message success";

                    }


                    closeForm();

                    await loadPlans();


                } catch (error) {

                    console.error(
                        "Create plan error:",
                        error
                    );

                    if (message) {

                        message.textContent =
                            error.message;

                        message.className =
                            "form-message error";

                    }

                }

            }
        );

    }


    // ==============================
    // DELETE PLAN
    // ==============================

    async function deletePlan(planId) {

        const confirmed =
            confirm(
                "Are you sure you want to delete this plan?"
            );


        if (!confirmed) {
            return;
        }


        try {

            const response =
                await fetch(
                    "/api/plans/" + planId,
                    {
                        method: "DELETE",

                        headers: {
                            "Authorization":
                                "Bearer " + token
                        }
                    }
                );


            if (
                response.status === 401 ||
                response.status === 403
            ) {

                handleAuthFailure();

                return;
            }


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to delete plan."
                );

            }


            await loadPlans();


        } catch (error) {

            console.error(
                "Delete plan error:",
                error
            );

        }

    }


    // ==============================
    // START
    // ==============================

    loadPlans();

});