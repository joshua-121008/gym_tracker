const PROGRAMS_KEY = "gymPrograms";
const PROGRAMS_USER_KEY = "gymCurrentUser";


function programJSON(key) {

    try {

        return JSON.parse(
            localStorage.getItem(key)
        ) || [];

    } catch {

        return [];

    }

}


function programEscape(value) {

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


document.addEventListener(
    "DOMContentLoaded",
    () => {

        const user =
            programJSON(
                PROGRAMS_USER_KEY
            );


        if (!user || !user.id) {

            window.location.href =
                "login.html";

            return;
        }


        const userId =
            user.id;


        const form =
            document.querySelector(
                "#programForm"
            );

        const section =
            document.querySelector(
                "#programFormSection"
            );

        const container =
            document.querySelector(
                "#programsContainer"
            );

        const empty =
            document.querySelector(
                "#emptyPrograms"
            );

        const count =
            document.querySelector(
                "#programCount"
            );


        function render() {

            const programs =
                programJSON(
                    PROGRAMS_KEY
                ).filter(
                    program =>
                        program.userId === userId
                );


            if (count) {

                count.textContent =
                    programs.length;

            }


            if (!container) return;


            if (!programs.length) {

                container.innerHTML = "";

                if (empty) {

                    empty.style.display =
                        "block";

                }

                return;
            }


            if (empty) {

                empty.style.display =
                    "none";

            }


            container.innerHTML =
                programs.map(
                    program => `

                    <article class="program-card">

                        <div class="program-card-header">

                            <h3>
                                ${programEscape(
                                    program.name
                                )}
                            </h3>

                            <button
                                class="btn btn-danger delete-program"
                                data-id="${program.id}"
                            >
                                Delete
                            </button>

                        </div>

                        <p>
                            <strong>Goal:</strong>
                            ${programEscape(
                                program.goal || "-"
                            )}
                        </p>

                        <p>
                            <strong>Duration:</strong>
                            ${programEscape(
                                program.duration || "-"
                            )}
                            weeks
                        </p>

                        <p>
                            <strong>Days/week:</strong>
                            ${programEscape(
                                program.daysPerWeek || "-"
                            )}
                        </p>

                        <p>
                            <strong>Start:</strong>
                            ${programEscape(
                                program.startDate || "-"
                            )}
                        </p>

                        <p>
                            ${programEscape(
                                program.description ||
                                "No description"
                            )}
                        </p>

                    </article>

                `
                ).join("");


            container
                .querySelectorAll(
                    ".delete-program"
                )
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const programs =
                                programJSON(
                                    PROGRAMS_KEY
                                ).filter(
                                    program =>
                                        program.id !==
                                        button.dataset.id
                                );


                            localStorage.setItem(
                                PROGRAMS_KEY,
                                JSON.stringify(programs)
                            );


                            render();

                        }
                    );

                });

        }


        document
            .querySelector(
                "#createProgramButton"
            )
            ?.addEventListener(
                "click",
                () => {

                    if (section) {

                        section.style.display =
                            "block";

                    }

                }
            );


        document
            .querySelector(
                "#cancelProgramButton"
            )
            ?.addEventListener(
                "click",
                () => {

                    form?.reset();

                    if (section) {

                        section.style.display =
                            "none";

                    }

                }
            );


        form?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const program = {

                    id:
                        crypto.randomUUID
                            ? crypto.randomUUID()
                            : String(Date.now()),

                    userId,

                    name:
                        document.querySelector(
                            "#programName"
                        )?.value.trim(),

                    goal:
                        document.querySelector(
                            "#programGoal"
                        )?.value,

                    duration:
                        document.querySelector(
                            "#programDuration"
                        )?.value,

                    daysPerWeek:
                        document.querySelector(
                            "#daysPerWeek"
                        )?.value,

                    startDate:
                        document.querySelector(
                            "#programStartDate"
                        )?.value,

                    description:
                        document.querySelector(
                            "#programDescription"
                        )?.value.trim(),

                    createdAt:
                        new Date().toISOString()

                };


                if (!program.name) {

                    return;

                }


                const programs =
                    programJSON(
                        PROGRAMS_KEY
                    );


                programs.push(
                    program
                );


                localStorage.setItem(
                    PROGRAMS_KEY,
                    JSON.stringify(programs)
                );


                form.reset();


                if (section) {

                    section.style.display =
                        "none";

                }


                render();

            }
        );


        render();

    }
);