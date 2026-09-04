document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // REGISTER
    // =========================

    const registerForm = document.querySelector("#registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const fullName = document.querySelector("#fullName").value.trim();
            const username = document.querySelector("#username").value.trim();
            const email = document.querySelector("#email").value.trim();
            const password = document.querySelector("#password").value;
            const confirmPassword =
                document.querySelector("#confirmPassword").value;

            // Check passwords
            if (password !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }

            try {
                const response = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        fullName,
                        username,
                        email,
                        password
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    alert(data.message);
                    return;
                }

                alert("Registration successful!");

                window.location.href = "login.html";

            } catch (error) {
                console.error("Registration error:", error);
                alert("Unable to connect to the server.");
            }
        });
    }


    // =========================
    // LOGIN
    // =========================

    const loginForm = document.querySelector("#loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const username =
                document.querySelector("#username").value.trim();

            const password =
                document.querySelector("#password").value;

            try {
                const response = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username,
                        password
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    alert(data.message);
                    return;
                }

                // Save JWT token
                localStorage.setItem("gymToken", data.token);

                // Save logged-in user information
                localStorage.setItem(
                    "gymCurrentUser",
                    JSON.stringify(data.user)
                );

                alert("Login successful!");

                window.location.href = "dashboard.html";

            } catch (error) {
                console.error("Login error:", error);
                alert("Unable to connect to the server.");
            }
        });
    }

});