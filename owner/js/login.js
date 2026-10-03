"use strict";


/* =========================================================
   GRACEXTOL OWNER LOGIN
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const ownerLoginForm =
    document.getElementById(
        "ownerLoginForm"
    );

const ownerEmailInput =
    document.getElementById(
        "ownerEmail"
    );

const ownerPasswordInput =
    document.getElementById(
        "ownerPassword"
    );

const ownerLoginButton =
    document.getElementById(
        "ownerLoginButton"
    );

const ownerLoginMessage =
    document.getElementById(
        "ownerLoginMessage"
    );

const toggleOwnerPassword =
    document.getElementById(
        "toggleOwnerPassword"
    );


/* =========================================================
   MESSAGE
========================================================= */

function showOwnerMessage(
    message,
    type = "error"
) {

    if (!ownerLoginMessage) {

        return;

    }


    ownerLoginMessage.textContent =
        message;


    ownerLoginMessage.className =
        "owner-login-message";


    if (type === "success") {

        ownerLoginMessage.classList.add(
            "success"
        );

    }

    else {

        ownerLoginMessage.classList.add(
            "error"
        );

    }

}


/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

if (toggleOwnerPassword) {

    toggleOwnerPassword.addEventListener(
        "click",
        function () {

            if (
                ownerPasswordInput.type ===
                "password"
            ) {

                ownerPasswordInput.type =
                    "text";

                toggleOwnerPassword.textContent =
                    "🙈";

                toggleOwnerPassword.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            }

            else {

                ownerPasswordInput.type =
                    "password";

                toggleOwnerPassword.textContent =
                    "👁";

                toggleOwnerPassword.setAttribute(
                    "aria-label",
                    "Show password"
                );

            }

        }
    );

}


/* =========================================================
   CHECK EXISTING SESSION
========================================================= */

async function checkExistingOwnerSession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Session check error:",
                error
            );

            return;

        }


        const session =
            data?.session;


        if (!session) {

            return;

        }


        const {
            data: profile,
            error: profileError
        } =
            await supabaseClient
                .from("users")
                .select(
                    `
                    id,
                    auth_id,
                    username,
                    email,
                    role,
                    is_active
                    `
                )
                .eq(
                    "auth_id",
                    session.user.id
                )
                .maybeSingle();


        if (profileError) {

            console.error(
                "Existing Owner profile check failed:",
                profileError
            );

            return;

        }


        if (
            profile &&
            profile.role === "owner" &&
            profile.is_active === true
        ) {

            window.location.href =
                "dashboard.html";

        }

    }

    catch (error) {

        console.error(
            "Existing session error:",
            error
        );

    }

}


/* =========================================================
   OWNER LOGIN
========================================================= */

if (ownerLoginForm) {

    ownerLoginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                ownerEmailInput
                    .value
                    .trim()
                    .toLowerCase();


            const password =
                ownerPasswordInput
                    .value;


            if (
                !email ||
                !password
            ) {

                showOwnerMessage(
                    "Please enter your email and password."
                );

                return;

            }


            ownerLoginButton.disabled =
                true;


            ownerLoginButton.innerHTML = `
                <span class="owner-login-spinner"></span>
                Signing In...
            `;


            showOwnerMessage("");


            try {


                /* =========================================
                   SUPABASE AUTH LOGIN
                ========================================== */

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth.signInWithPassword({

                        email:
                            email,

                        password:
                            password

                    });


                if (error) {

                    console.error(
                        "Owner login error:",
                        error
                    );

                    showOwnerMessage(
                        error.message ||
                        "Unable to sign in."
                    );

                    return;

                }


                if (!data?.user) {

                    await supabaseClient.auth.signOut();

                    showOwnerMessage(
                        "Authentication was unsuccessful."
                    );

                    return;

                }


                /* =========================================
                   LOAD OWNER PROFILE
                ========================================== */

                const {
                    data: profile,
                    error: profileError
                } =
                    await supabaseClient
                        .from("users")
                        .select(
                            `
                            id,
                            auth_id,
                            username,
                            email,
                            role,
                            is_active
                            `
                        )
                        .eq(
                            "auth_id",
                            data.user.id
                        )
                        .maybeSingle();


                if (profileError) {

                    console.error(
                        "Owner profile error:",
                        profileError
                    );

                    await supabaseClient.auth.signOut();

                    showOwnerMessage(
                        "Unable to verify your Owner account."
                    );

                    return;

                }


                /* =========================================
                   PROFILE NOT FOUND
                ========================================== */

                if (!profile) {

                    await supabaseClient.auth.signOut();

                    showOwnerMessage(
                        "This account does not have a Gracextol Owner profile."
                    );

                    return;

                }


                /* =========================================
                   OWNER ROLE CHECK
                ========================================== */

                if (
                    profile.role !==
                    "owner"
                ) {

                    console.warn(
                        "Non-owner attempted Owner login:",
                        profile.email
                    );

                    await supabaseClient.auth.signOut();

                    showOwnerMessage(
                        "You do not have permission to access the Owner Portal."
                    );

                    return;

                }


                /* =========================================
                   ACTIVE STATUS CHECK
                ========================================== */

                if (
                    profile.is_active !== true
                ) {

                    await supabaseClient.auth.signOut();

                    showOwnerMessage(
                        "This Owner account is inactive. Please contact the platform administrator."
                    );

                    return;

                }


                /* =========================================
                   SUCCESS
                ========================================== */

                showOwnerMessage(
                    "Owner authentication successful. Redirecting...",
                    "success"
                );


                window.setTimeout(
                    function () {

                        window.location.href =
                            "dashboard.html";

                    },
                    700
                );


            }

            catch (error) {

                console.error(
                    "Unexpected Owner login error:",
                    error
                );


                try {

                    await supabaseClient.auth.signOut();

                }

                catch (signOutError) {

                    console.error(
                        "Sign out error:",
                        signOutError
                    );

                }


                showOwnerMessage(
                    "Something went wrong. Please try again."
                );

            }


            finally {

                window.setTimeout(
                    function () {

                        ownerLoginButton.disabled =
                            false;

                        ownerLoginButton.textContent =
                            "Sign In as Owner";

                    },
                    800
                );

            }

        }
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        checkExistingOwnerSession();

    }
);