/* =========================================================
   GRACEXTOL CBT
   ORGANIZATION SELF-REGISTRATION
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const registrationForm =
    document.getElementById(
        "organizationRegistrationForm"
    );


const organizationName =
    document.getElementById(
        "organizationName"
    );


const adminUsername =
    document.getElementById(
        "adminUsername"
    );


const adminEmail =
    document.getElementById(
        "adminEmail"
    );


const adminPassword =
    document.getElementById(
        "adminPassword"
    );


const confirmPassword =
    document.getElementById(
        "confirmPassword"
    );


const registrationButton =
    document.getElementById(
        "registrationButton"
    );


const registrationMessage =
    document.getElementById(
        "registrationMessage"
    );


const togglePassword =
    document.getElementById(
        "togglePassword"
    );


const toggleConfirmPassword =
    document.getElementById(
        "toggleConfirmPassword"
    );


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    message,
    type = ""
) {

    registrationMessage.textContent =
        message;


    registrationMessage.className =
        "auth-message";


    if (type) {

        registrationMessage.classList.add(
            type
        );

    }

}


/* =========================================================
   PASSWORD TOGGLE HELPER
========================================================= */

function setupPasswordToggle(
    button,
    input
) {

    if (
        !button ||
        !input
    ) {

        return;

    }


    button.addEventListener(
        "click",
        function () {

            const isPassword =
                input.type ===
                "password";


            input.type =
                isPassword
                    ? "text"
                    : "password";


            const icon =
                button.querySelector(
                    "i"
                );


            if (icon) {

                icon.className =
                    isPassword
                        ? "fa-solid fa-eye-slash"
                        : "fa-solid fa-eye";

            }


            button.setAttribute(
                "aria-label",
                isPassword
                    ? "Hide password"
                    : "Show password"
            );

        }
    );

}


/* =========================================================
   PASSWORD TOGGLES
========================================================= */

setupPasswordToggle(
    togglePassword,
    adminPassword
);


setupPasswordToggle(
    toggleConfirmPassword,
    confirmPassword
);


/* =========================================================
   REGISTRATION
========================================================= */

registrationForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const organization =
            organizationName.value.trim();


        const username =
            adminUsername.value.trim();


        const email =
            adminEmail.value
                .trim()
                .toLowerCase();


        const password =
            adminPassword.value;


        const confirm =
            confirmPassword.value;


        /* =============================================
           VALIDATION
        ============================================== */

        if (
            !organization ||
            !username ||
            !email ||
            !password ||
            !confirm
        ) {

            showMessage(
                "Please complete all required fields.",
                "error"
            );

            return;

        }


        if (
            organization.length < 2
        ) {

            showMessage(
                "Please enter a valid organization name.",
                "error"
            );

            return;

        }


        if (
            username.length < 2
        ) {

            showMessage(
                "Username must contain at least 2 characters.",
                "error"
            );

            return;

        }


        if (
            password.length < 8
        ) {

            showMessage(
                "Password must contain at least 8 characters.",
                "error"
            );

            return;

        }


        if (
            password !== confirm
        ) {

            showMessage(
                "Passwords do not match.",
                "error"
            );

            return;

        }


        /* =============================================
           BUTTON
        ============================================== */

        registrationButton.disabled =
            true;


        registrationButton.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Registering...

        `;


        showMessage("");


        try {

            /* =========================================
               SUPABASE SIGNUP
            ========================================== */

            const {
                data,
                error
            } =
                await supabaseClient.auth.signUp({

                    email,

                    password,

                    options: {

                        emailRedirectTo:
                            "https://gracextol.com/organization/pages/login.html",

                        data: {

                            username,

                            role:
                                "organization_admin",

                            organization_name:
                                organization

                        }

                    }

                });


            /* =========================================
               SIGNUP ERROR
            ========================================== */

            if (
                error
            ) {

                console.error(
                    "Organization registration error:",
                    error
                );


                const errorText =
                    `${error.code || ""} ${error.message || ""}`
                        .toLowerCase();


                if (
                    errorText.includes(
                        "users_email_unique"
                    ) ||
                    errorText.includes(
                        "email already"
                    ) ||
                    errorText.includes(
                        "already registered"
                    )
                ) {

                    showMessage(
                        "An account with this email already exists.",
                        "error"
                    );

                }

                else if (
                    errorText.includes(
                        "users_username_unique"
                    ) ||
                    errorText.includes(
                        "username"
                    )
                ) {

                    showMessage(
                        "That username is already in use. Please choose another.",
                        "error"
                    );

                }

                else {

                    showMessage(
                        error.message ||
                        "Unable to complete registration.",
                        "error"
                    );

                }


                return;

            }


            /* =========================================
               SUCCESS
            ========================================== */

            console.log(
                "Organization registration submitted:",
                data.user
            );


            /*
             * Organization accounts must wait for
             * Owner approval before portal access.
             */

            if (
                data.session
            ) {

                await supabaseClient.auth.signOut();

            }


            showMessage(

                "Registration submitted successfully. Please verify your email and wait for Gracextol platform approval before signing in.",

                "success"

            );


            registrationForm.reset();


        }

        catch (
            error
        ) {

            console.error(
                "Unexpected organization registration error:",
                error
            );


            showMessage(
                "Something went wrong. Please try again.",
                "error"
            );

        }


        finally {

            registrationButton.disabled =
                false;


            registrationButton.innerHTML = `

                <i class="fa-solid fa-building-circle-check"></i>

                Register Organization

            `;

        }

    }
);