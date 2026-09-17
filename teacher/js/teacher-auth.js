/* =========================================
   GRACEXTOL CBT
   TEACHER AUTHENTICATION
   LOGIN + REGISTRATION
========================================= */


/* =========================================
   ELEMENTS
========================================= */

const loginTab =
    document.getElementById("loginTab");

const registerTab =
    document.getElementById("registerTab");

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const authMessage =
    document.getElementById("authMessage");


/* =========================================
   MESSAGE FUNCTION
========================================= */

function showMessage(message, type = "error") {

    if (!authMessage) {
        return;
    }

    authMessage.textContent = message;

    if (type === "success") {

        authMessage.style.color = "#16a34a";

    } else {

        authMessage.style.color = "#dc2626";

    }

}


/* =========================================
   SWITCH TO LOGIN
========================================= */

loginTab.addEventListener(
    "click",
    function () {

        loginTab.classList.add("active");

        registerTab.classList.remove("active");

        loginForm.classList.add("active");

        registerForm.classList.remove("active");

        showMessage("");

    }
);


/* =========================================
   SWITCH TO REGISTER
========================================= */

registerTab.addEventListener(
    "click",
    function () {

        registerTab.classList.add("active");

        loginTab.classList.remove("active");

        registerForm.classList.add("active");

        loginForm.classList.remove("active");

        showMessage("");

    }
);


/* =========================================
   TEACHER REGISTRATION
========================================= */

registerForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        /* -------------------------------------
           GET FORM VALUES
        ------------------------------------- */

        const username =
            document
                .getElementById("registerUsername")
                .value
                .trim();


        const email =
            document
                .getElementById("registerEmail")
                .value
                .trim()
                .toLowerCase();


        const password =
            document
                .getElementById("registerPassword")
                .value;


        const confirmPassword =
            document
                .getElementById("confirmPassword")
                .value;


        /* -------------------------------------
           VALIDATION
        ------------------------------------- */

        if (!username || !email || !password) {

            showMessage(
                "Please complete all required fields."
            );

            return;

        }


        if (password.length < 6) {

            showMessage(
                "Password must be at least 6 characters."
            );

            return;

        }


        if (password !== confirmPassword) {

            showMessage(
                "Passwords do not match."
            );

            return;

        }


        /* -------------------------------------
           BUTTON
        ------------------------------------- */

        const button =
            registerForm.querySelector(
                ".auth-btn"
            );


        button.disabled = true;

        button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Creating Account...
        `;


        showMessage("");


        try {
            /* ================================
               CREATE SUPABASE AUTH ACCOUNT
            ================================= */

            const {
                data,
                error
            } =
                await supabaseClient.auth.signUp({

                    email: email,

                    password: password,

                    options: {

                        data: {

                            username: username

                        }

                    }

                });


            /* ================================
               REGISTRATION ERROR
            ================================= */

            if (error) {

                console.error(
                    "Registration error:",
                    error
                );

                const registrationError =
                    `${error.code || ""} ${error.message || ""} ${error.details || ""} ${error.hint || ""}`
                        .toLowerCase();

                showMessage(
                    registrationError.includes(
                        "users_username_unique"
                    )
                        ? "That username is already taken. Please choose another username."
                        : error.message
                );

                return;

            }


            /* ================================
               SUCCESS
            ================================= */

            console.log(
                "Teacher account created:",
                data.user
            );


            if (!data.session) {

                showMessage(
                    "Account created successfully. Please check your email to confirm your account.",
                    "success"
                );

            } else {

                showMessage(
                    "Teacher account created successfully!",
                    "success"
                );


                setTimeout(
                    function () {

                        window.location.href =
                            "create-exam.html";

                    },
                    1000
                );

            }


        } catch (error) {

            console.error(
                "Unexpected registration error:",
                error
            );

            showMessage(
                "Something went wrong. Please try again."
            );

        }


        finally {

            button.disabled = false;

            button.innerHTML = `
                <i class="fa-solid fa-user-plus"></i>
                Create Teacher Account
            `;

        }

    }
);


/* =========================================
   TEACHER LOGIN
========================================= */

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim()
                .toLowerCase();


        const password =
            document
                .getElementById("loginPassword")
                .value;


        if (!email || !password) {

            showMessage(
                "Please enter your email and password."
            );

            return;

        }


        const button =
            loginForm.querySelector(
                ".auth-btn"
            );


        button.disabled = true;

        button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Signing In...
        `;


        showMessage("");


        try {

            /* ================================
               SUPABASE LOGIN
            ================================= */

            const {
                data,
                error
            } =
                await supabaseClient.auth.signInWithPassword({

                    email: email,

                    password: password

                });


            if (error) {

                console.error(
                    "Login error:",
                    error
                );

                showMessage(
                    error.message
                );

                return;

            }


            /* ================================
               LOGIN SUCCESS
            ================================= */

            console.log(
                "Authenticated teacher:",
                data.user
            );


            showMessage(
                "Login successful. Redirecting...",
                "success"
            );


            setTimeout(
                function () {

                    window.location.href =
                        "create-exam.html";

                },
                800
            );


        } catch (error) {

            console.error(
                "Unexpected login error:",
                error
            );

            showMessage(
                "Something went wrong. Please try again."
            );

        }


        finally {

            button.disabled = false;

            button.innerHTML = `
                <i class="fa-solid fa-right-to-bracket"></i>
                Sign In
            `;

        }

    }
);
/* =========================================
   PASSWORD VISIBILITY
========================================= */

const passwordToggles =
    document.querySelectorAll(".password-toggle");


passwordToggles.forEach(function (toggle) {

    toggle.addEventListener("click", function () {

        const targetId =
            this.dataset.target;

        const passwordInput =
            document.getElementById(targetId);

        const icon =
            this.querySelector("i");


        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            icon.classList.remove("fa-eye");

            icon.classList.add("fa-eye-slash");

            this.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            passwordInput.type = "password";

            icon.classList.remove("fa-eye-slash");

            icon.classList.add("fa-eye");

            this.setAttribute(
                "aria-label",
                "Show password"
            );

        }

    });

});