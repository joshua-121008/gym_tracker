document.addEventListener("DOMContentLoaded", () => {

    // Display current year if an element with id="year" exists
    const year = document.querySelector("#year");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    // Logout
    const logoutButtons = document.querySelectorAll(
        "#logoutButton, .logout-button"
    );

    logoutButtons.forEach(button => {

        button.addEventListener("click", () => {

            localStorage.removeItem("gymCurrentUser");

            window.location.href = "login.html";
        });

    });

});