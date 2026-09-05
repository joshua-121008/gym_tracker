// ==========================================
// PROFILE.JS
// ==========================================

const token = localStorage.getItem("gymToken");


// ==========================================
// AUTH CHECK
// ==========================================

if (!token) {
    window.location.href = "login.html";
}


// ==========================================
// ELEMENTS
// ==========================================

const profileForm = document.getElementById("profileForm");
const passwordForm = document.getElementById("passwordForm");

const fullNameInput = document.getElementById("fullName");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");

const accountId = document.getElementById("accountId");
const memberSince = document.getElementById("memberSince");
const accountUsername = document.getElementById("accountUsername");
const accountEmail = document.getElementById("accountEmail");

const profileMessage = document.getElementById("profileMessage");
const passwordMessage = document.getElementById("passwordMessage");

const logoutButton = document.getElementById("logoutButton");
const deleteAccountButton =
    document.getElementById("deleteAccountButton");


// ==========================================
// LOAD PROFILE
// ==========================================

async function loadProfile() {

    try {

        const response = await fetch("/api/profile", {
            method: "GET",

            headers: {
                "Authorization": `Bearer ${token}`
            }
        });


        if (response.status === 401 || response.status === 403) {

            localStorage.removeItem("gymToken");
            localStorage.removeItem("gymCurrentUser");

            window.location.href = "login.html";

            return;
        }


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.message || "Failed to load profile"
            );

        }


        // Profile form
        fullNameInput.value = data.fullName;
        usernameInput.value = data.username;
        emailInput.value = data.email;


        // Account information
        accountId.textContent = data.id;

        accountUsername.textContent = data.username;

        accountEmail.textContent = data.email;


        if (data.createdAt) {

            const date = new Date(data.createdAt);

            memberSince.textContent =
                date.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                });

        }

    } catch (error) {

        console.error("Profile loading error:", error);

        profileMessage.textContent =
            error.message || "Unable to load profile";

        profileMessage.classList.add("error");

    }

}


// ==========================================
// UPDATE PROFILE
// ==========================================

profileForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const fullName = fullNameInput.value.trim();
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();


    if (!fullName || !username || !email) {

        profileMessage.textContent =
            "Please fill in all fields.";

        profileMessage.classList.add("error");

        return;
    }


    const saveButton =
        document.getElementById("saveProfileButton");

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";


    try {

        const response = await fetch("/api/profile", {

            method: "PUT",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({
                fullName,
                username,
                email
            })

        });


        const data = await response.json();


        if (response.status === 401 || response.status === 403) {

            localStorage.removeItem("gymToken");
            localStorage.removeItem("gymCurrentUser");

            window.location.href = "login.html";

            return;
        }


        if (!response.ok) {

            throw new Error(
                data.message || "Failed to update profile"
            );

        }


        // Update displayed account information
        accountUsername.textContent = data.user.username;
        accountEmail.textContent = data.user.email;


        // Update stored user information
        const currentUser =
            JSON.parse(
                localStorage.getItem("gymCurrentUser")
            ) || {};

        currentUser.id = data.user.id;
        currentUser.username = data.user.username;
        currentUser.fullName = data.user.fullName;
        currentUser.email = data.user.email;

        localStorage.setItem(
            "gymCurrentUser",
            JSON.stringify(currentUser)
        );


        profileMessage.textContent =
            "Profile updated successfully.";

        profileMessage.classList.remove("error");

        profileMessage.classList.add("success");


    } catch (error) {

        console.error("Profile update error:", error);

        profileMessage.textContent =
            error.message || "Failed to update profile";

        profileMessage.classList.remove("success");

        profileMessage.classList.add("error");

    } finally {

        saveButton.disabled = false;
        saveButton.textContent = "Save Changes";

    }

});


// ==========================================
// CHANGE PASSWORD
// ==========================================

passwordForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const currentPassword =
        document.getElementById("currentPassword").value;

    const newPassword =
        document.getElementById("newPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;


    if (newPassword !== confirmPassword) {

        passwordMessage.textContent =
            "New passwords do not match.";

        passwordMessage.classList.add("error");

        return;
    }


    if (newPassword.length < 6) {

        passwordMessage.textContent =
            "Password must contain at least 6 characters.";

        passwordMessage.classList.add("error");

        return;
    }


    const changeButton =
        document.getElementById("changePasswordButton");

    changeButton.disabled = true;
    changeButton.textContent = "Changing...";


    try {

        const response = await fetch(
            "/api/profile/password",
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            }
        );


        const data = await response.json();


        if (response.status === 401 || response.status === 403) {

            localStorage.removeItem("gymToken");
            localStorage.removeItem("gymCurrentUser");

            window.location.href = "login.html";

            return;
        }


        if (!response.ok) {

            throw new Error(
                data.message || "Failed to change password"
            );

        }


        passwordMessage.textContent =
            "Password changed successfully.";

        passwordMessage.classList.remove("error");

        passwordMessage.classList.add("success");


        passwordForm.reset();


    } catch (error) {

        console.error("Password change error:", error);

        passwordMessage.textContent =
            error.message || "Failed to change password";

        passwordMessage.classList.remove("success");

        passwordMessage.classList.add("error");

    } finally {

        changeButton.disabled = false;
        changeButton.textContent = "Change Password";

    }

});


// ==========================================
// DELETE ACCOUNT
// ==========================================

deleteAccountButton.addEventListener(
    "click",
    async () => {

        const confirmed = confirm(
            "Are you sure you want to delete your account?\n\n" +
            "This will permanently delete your profile, " +
            "plans, programs, workouts and workout history.\n\n" +
            "This action cannot be undone."
        );


        if (!confirmed) {
            return;
        }


        const doubleConfirmed = confirm(
            "This is your final confirmation.\n\n" +
            "Delete your Gym Tracker account permanently?"
        );


        if (!doubleConfirmed) {
            return;
        }


        deleteAccountButton.disabled = true;
        deleteAccountButton.textContent = "Deleting...";


        try {

            const response = await fetch(
                "/api/profile",
                {
                    method: "DELETE",

                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message || "Failed to delete account"
                );

            }


            // Remove login information
            localStorage.removeItem("gymToken");
            localStorage.removeItem("gymCurrentUser");


            alert(
                "Your account has been deleted successfully."
            );


            window.location.href = "register.html";


        } catch (error) {

            console.error("Delete account error:", error);

            alert(
                error.message ||
                "Failed to delete account."
            );


            deleteAccountButton.disabled = false;
            deleteAccountButton.textContent = "Delete Account";

        }

    }
);


// ==========================================
// LOGOUT
// ==========================================

logoutButton.addEventListener("click", () => {

    localStorage.removeItem("gymToken");
    localStorage.removeItem("gymCurrentUser");

    window.location.href = "login.html";

});


// ==========================================
// INITIALIZE
// ==========================================

loadProfile();