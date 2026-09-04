const TOKEN_KEY = "gymToken";

document.addEventListener("DOMContentLoaded", function () {

    console.log("plans.js loaded");


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


    // ==============================
    // CHECK LOGIN
    // ==============================

    const token =
        localStorage.getItem(TOKEN_KEY);

    if (!token) {

        console.log("No login token found.");

        window.location.href = "login.html";

        return;
    }


    // ==============================
    // OPEN FORM
    // ==============================

    function openForm() {

        console.log("Create Plan button clicked");

        if (!formSection) {

            console.error(
                "planFormSection not found"
            );

            return;
        }


        formSection.classList.remove("hidden");

        formSection.style.display = "block";


        formSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

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

    } else {

        console.error(
            "createPlanButton not found"
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

                localStorage.removeItem(
                    TOKEN_KEY
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
                    "Unable to load plans."
                );

            }


            const plans =
                data.plans || data || [];


            renderPlans(plans);


        } catch (error) {

            console.error(
                "Load plans error:",
                error
            );

            if (message) {

                message.textContent =
                    "Unable to load plans.";

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
                (plans.length === 1
                    ? " Plan"
                    : " Plans");

        }


        if (!plansContainer) {
            return;
        }


        // NO PLANS
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


        // PLANS EXIST
        plansContainer.innerHTML =
            plans.map(function (plan) {

                return `

                    <article class="plan-card">

                        <div class="plan-card-header">

                            <h3>
                                ${escapeHTML(
                                    plan.name
                                )}
                            </h3>

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


        // DELETE BUTTONS
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


                if (!name) {

                    if (message) {

                        message.textContent =
                            "Please enter a plan name.";

                    }

                    return;
                }


                try {

                    if (message) {

                        message.textContent =
                            "Saving plan...";

                    }


                    const response =
                        await fetch(
                            "/api/plans",
                            {
                                method: "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        "Bearer " + token

                                },

                                body: JSON.stringify({

                                    name:
                                        name,

                                    description:
                                        description || null,

                                    goal:
                                        goal || null

                                })

                            }
                        );


                    if (
                        response.status === 401 ||
                        response.status === 403
                    ) {

                        localStorage.removeItem(
                            TOKEN_KEY
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
                            "Unable to create plan."
                        );

                    }


                    console.log(
                        "Plan created:",
                        data
                    );


                    closeForm();


                    if (message) {

                        message.textContent =
                            "Plan created successfully.";

                    }


                    await loadPlans();


                } catch (error) {

                    console.error(
                        "Create plan error:",
                        error
                    );

                    if (message) {

                        message.textContent =
                            error.message;

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

                localStorage.removeItem(
                    TOKEN_KEY
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