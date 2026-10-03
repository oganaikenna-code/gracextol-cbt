/* =========================================================
   GRACEXTOL CBT
   ORGANIZATION ADMIN LOGIN
   COMPLETE REPLACEMENT
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const loginForm =
    document.getElementById(
        "organizationLoginForm"
    );


const loginEmail =
    document.getElementById(
        "loginEmail"
    );


const loginPassword =
    document.getElementById(
        "loginPassword"
    );


const loginButton =
    document.getElementById(
        "loginButton"
    );


const loginMessage =
    document.getElementById(
        "loginMessage"
    );


const toggleLoginPassword =
    document.getElementById(
        "toggleLoginPassword"
    );


/* =========================================================
   CHECK SUPABASE CLIENT
========================================================= */

if (
    typeof supabaseClient ===
    "undefined"
) {

    console.error(
        "Gracextol Supabase client is not available."
    );

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    message,
    type = ""
) {

    if (!loginMessage) {
        return;
    }


    loginMessage.textContent =
        message;


    loginMessage.className =
        "auth-message";


    if (type) {

        loginMessage.classList.add(
            type
        );

    }

}


/* =========================================================
   PASSWORD TOGGLE
========================================================= */

if (toggleLoginPassword) {

    toggleLoginPassword.addEventListener(
        "click",
        function () {

            const isPassword =
                loginPassword.type ===
                "password";


            loginPassword.type =
                isPassword
                    ? "text"
                    : "password";


            const icon =
                toggleLoginPassword.querySelector(
                    "i"
                );


            if (icon) {

                icon.className =
                    isPassword
                        ? "fa-solid fa-eye-slash"
                        : "fa-solid fa-eye";

            }


            toggleLoginPassword.setAttribute(
                "aria-label",
                isPassword
                    ? "Hide password"
                    : "Show password"
            );

        }
    );

}


/* =========================================================
   CHECK EXISTING SESSION
========================================================= */

async function checkExistingSession() {

    try {

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            return;

        }


        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (error) {

            console.error(
                "Existing session error:",
                error
            );

            return;

        }


        if (
            !data ||
            !data.session
        ) {

            return;

        }


        console.log(
            "Existing Supabase session found."
        );


        await verifyOrganizationAccess(
            data.session.user.id,
            true
        );

    }

    catch (
        error
    ) {

        console.error(
            "Existing session check error:",
            error
        );

    }

}


/* =========================================================
   VERIFY ORGANIZATION ACCESS
========================================================= */

async function verifyOrganizationAccess(
    authId,
    redirectOnSuccess = false
) {

    try {

        /* =============================================
           GET USER PROFILE
        ============================================== */

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
                    teacher,
                    role,
                    organization_id,
                    is_active
                    `
                )

                .eq(
                    "auth_id",
                    authId
                )

                .maybeSingle();


        /* =============================================
           PROFILE ERROR
        ============================================== */

        if (
            profileError
        ) {

            console.error(
                "Organization profile error:",
                profileError
            );

            return {

                allowed: false,

                message:
                    "Unable to verify your organization profile."

            };

        }


        /* =============================================
           PROFILE NOT FOUND
        ============================================== */

        if (
            !profile
        ) {

            return {

                allowed: false,

                message:
                    "Your organization profile could not be found."

            };

        }


        /* =============================================
           ROLE CHECK
        ============================================== */

        if (
            profile.role !==
            "organization_admin"
        ) {

            return {

                allowed: false,

                message:
                    "This login is reserved for Organization Administrators."

            };

        }


        /* =============================================
           ACTIVE ACCOUNT CHECK
        ============================================== */

        if (
            profile.is_active !==
            true
        ) {

            /*
             * Check organization status so that
             * we can provide a more useful message.
             */

            if (
                profile.organization_id
            ) {

                const {
                    data: organization
                } =
                    await supabaseClient

                        .from("organizations")

                        .select(
                            `
                            id,
                            name,
                            status
                            `
                        )

                        .eq(
                            "id",
                            profile.organization_id
                        )

                        .maybeSingle();


                if (
                    organization?.status ===
                    "pending"
                ) {

                    return {

                        allowed: false,

                        message:
                            "Your organization registration is still awaiting platform approval."

                    };

                }


                if (
                    organization?.status ===
                    "rejected"
                ) {

                    return {

                        allowed: false,

                        message:
                            "Your organization registration was not approved."

                    };

                }

            }


            return {

                allowed: false,

                message:
                    "Your organization account is currently inactive."

            };

        }


        /* =============================================
           ORGANIZATION ID CHECK
        ============================================== */

        if (
            !profile.organization_id
        ) {

            return {

                allowed: false,

                message:
                    "Your account is not linked to an organization."

            };

        }


        /* =============================================
           GET ORGANIZATION
        ============================================== */

        const {
            data: organization,
            error: organizationError
        } =
            await supabaseClient

                .from("organizations")

                .select(
                    `
                    id,
                    name,
                    slug,
                    status
                    `
                )

                .eq(
                    "id",
                    profile.organization_id
                )

                .maybeSingle();


        /* =============================================
           ORGANIZATION ERROR
        ============================================== */

        if (
            organizationError
        ) {

            console.error(
                "Organization lookup error:",
                organizationError
            );

            return {

                allowed: false,

                message:
                    "Unable to verify your organization."

            };

        }


        /* =============================================
           ORGANIZATION NOT FOUND
        ============================================== */

        if (
            !organization
        ) {

            return {

                allowed: false,

                message:
                    "Your organization could not be found."

            };

        }


        /* =============================================
           ORGANIZATION STATUS
        ============================================== */

        if (
            organization.status !==
            "active"
        ) {

            return {

                allowed: false,

                message:
                    "Your organization has not been activated."

            };

        }


        /* =============================================
           SAVE ORGANIZATION DATA
        ============================================== */

        sessionStorage.setItem(
            "organizationAdminProfile",
            JSON.stringify(
                profile
            )
        );


        sessionStorage.setItem(
            "organizationProfile",
            JSON.stringify(
                organization
            )
        );


        /* =============================================
           REDIRECT IF REQUESTED
        ============================================== */

        if (
            redirectOnSuccess
        ) {

            window.location.href =
                "dashboard.html";

        }


        return {

            allowed: true,

            profile,

            organization

        };

    }

    catch (
        error
    ) {

        console.error(
            "Organization access verification error:",
            error
        );


        return {

            allowed: false,

            message:
                "Unable to verify your organization access."

        };

    }

}


/* =========================================================
   LOGIN
========================================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            /* =============================================
               GET FORM VALUES
            ============================================== */

            const email =
                loginEmail.value
                    .trim()
                    .toLowerCase();


            const password =
                loginPassword.value;


            /* =============================================
               VALIDATION
            ============================================== */

            if (
                !email ||
                !password
            ) {

                showMessage(
                    "Please enter your email and password.",
                    "error"
                );

                return;

            }


            /* =============================================
               SUPABASE CHECK
            ============================================== */

            if (
                typeof supabaseClient ===
                "undefined"
            ) {

                showMessage(
                    "Unable to connect to the authentication system.",
                    "error"
                );

                return;

            }


            /* =============================================
               BUTTON STATE
            ============================================== */

            loginButton.disabled =
                true;


            loginButton.innerHTML = `

                <i class="fa-solid fa-spinner fa-spin"></i>

                Signing In...

            `;


            showMessage("");


            try {

                /* =========================================
                   SUPABASE AUTHENTICATION
                ========================================== */

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .auth
                        .signInWithPassword({

                            email,

                            password

                        });


                /* =========================================
                   AUTH ERROR
                ========================================== */

                if (
                    error
                ) {

                    console.error(
                        "Organization login error:",
                        error
                    );


                    const errorText =
                        `${error.message || ""}`
                            .toLowerCase();


                    if (
                        errorText.includes(
                            "email not confirmed"
                        )
                    ) {

                        showMessage(
                            "Please verify your email before signing in.",
                            "error"
                        );

                    }

                    else {

                        showMessage(
                            "Invalid email or password.",
                            "error"
                        );

                    }


                    return;

                }


                /* =========================================
                   USER CHECK
                ========================================== */

                if (
                    !data ||
                    !data.user
                ) {

                    showMessage(
                        "Unable to identify your account.",
                        "error"
                    );

                    return;

                }


                console.log(
                    "Supabase authentication successful."
                );


                console.log(
                    "Authenticated user:",
                    data.user.id
                );


                /* =========================================
                   VERIFY SESSION IMMEDIATELY
                ========================================== */

                const {
                    data: sessionData,
                    error: sessionError
                } =
                    await supabaseClient
                        .auth
                        .getSession();


                console.log(
                    "SESSION AFTER LOGIN:",
                    sessionData?.session
                );


                if (
                    sessionError
                ) {

                    console.error(
                        "Session verification error:",
                        sessionError
                    );


                    await supabaseClient
                        .auth
                        .signOut();


                    showMessage(
                        "Unable to verify your login session. Please try again.",
                        "error"
                    );


                    return;

                }


                if (
                    !sessionData ||
                    !sessionData.session
                ) {

                    console.error(
                        "NO SUPABASE SESSION AFTER LOGIN."
                    );


                    showMessage(
                        "Login succeeded, but the authentication session was not saved.",
                        "error"
                    );


                    return;

                }


                console.log(
                    "Supabase session confirmed."
                );


                /* =========================================
                   VERIFY ORGANIZATION ACCOUNT
                ========================================== */

                const access =
                    await verifyOrganizationAccess(
                        data.user.id
                    );


                /* =========================================
                   ACCESS DENIED
                ========================================== */

                if (
                    !access.allowed
                ) {

                    await supabaseClient
                        .auth
                        .signOut();


                    showMessage(
                        access.message ||
                        "Your organization account is not yet authorized.",
                        "error"
                    );


                    return;

                }


                /* =========================================
                   FINAL SESSION CHECK
                ========================================== */

                const {
                    data: finalSessionData,
                    error: finalSessionError
                } =
                    await supabaseClient
                        .auth
                        .getSession();


                console.log(
                    "FINAL SESSION BEFORE REDIRECT:",
                    finalSessionData?.session
                );


                if (
                    finalSessionError ||
                    !finalSessionData?.session
                ) {

                    console.error(
                        "Supabase session disappeared before redirect.",
                        finalSessionError
                    );


                    showMessage(
                        "Your login session could not be maintained. Please try again.",
                        "error"
                    );


                    return;

                }


                /* =========================================
                   SUCCESS
                ========================================== */

                showMessage(
                    "Login successful. Redirecting...",
                    "success"
                );


                console.log(
                    "Organization login successful."
                );


                /*
                 * Short delay allows the success
                 * message to be displayed before
                 * navigation.
                 */

                setTimeout(
                    function () {

                        window.location.href =
                            "dashboard.html";

                    },
                    500
                );

            }

            catch (
                error
            ) {

                console.error(
                    "Unexpected organization login error:",
                    error
                );


                showMessage(
                    error?.message ||
                    "Something went wrong. Please try again.",
                    "error"
                );

            }


            finally {

                loginButton.disabled =
                    false;


                loginButton.innerHTML = `

                    <i class="fa-solid fa-right-to-bracket"></i>

                    Sign In

                `;

            }

        }
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

checkExistingSession();