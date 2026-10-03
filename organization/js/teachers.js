/* =========================================================
   GRACEXTOL CBT
   ORGANIZATION ADMIN
   TEACHERS
========================================================= */


/* =========================================================
   PAGE ELEMENTS
========================================================= */

const teachersContent =
    document.getElementById(
        "teachersContent"
    );


const teacherCount =
    document.getElementById(
        "teacherCount"
    );


const addTeacherButton =
    document.getElementById(
        "addTeacherButton"
    );


/* =========================================================
   MODAL ELEMENTS
========================================================= */

const teacherModal =
    document.getElementById(
        "teacherModal"
    );


const closeTeacherModal =
    document.getElementById(
        "closeTeacherModal"
    );


const cancelTeacherButton =
    document.getElementById(
        "cancelTeacherButton"
    );


const teacherForm =
    document.getElementById(
        "teacherForm"
    );


const teacherName =
    document.getElementById(
        "teacherName"
    );


const teacherEmail =
    document.getElementById(
        "teacherEmail"
    );


const teacherFormMessage =
    document.getElementById(
        "teacherFormMessage"
    );


const sendInvitationButton =
    document.getElementById(
        "sendInvitationButton"
    );


/* =========================================================
   DATA
========================================================= */

let organizationProfile = null;

let organizationAdminProfile = null;

let teachers = [];


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "Gracextol Organization Teachers loaded."
        );


        await initializeTeachersPage();

    }
);


/* =========================================================
   INITIALIZE TEACHERS PAGE
========================================================= */

async function initializeTeachersPage() {

    try {

        /* -----------------------------------------------
           CHECK SUPABASE CLIENT
        ------------------------------------------------ */

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            showError(
                "The Gracextol database connection is unavailable."
            );

            return;

        }


        /* -----------------------------------------------
           GET AUTHENTICATED USER
        ------------------------------------------------ */

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getUser();


        if (error) {

            console.error(
                "Authentication error:",
                error
            );


            redirectToLogin();

            return;

        }


        const authUser =
            data?.user;


        if (!authUser) {

            console.warn(
                "No authenticated user."
            );


            redirectToLogin();

            return;

        }


        console.log(
            "Authenticated user:",
            authUser.id
        );


        /* -----------------------------------------------
           LOAD ADMIN PROFILE
        ------------------------------------------------ */

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
                    authUser.id
                )

                .maybeSingle();


        if (profileError) {

            console.error(
                "Admin profile error:",
                profileError
            );


            showError(
                "Unable to verify your organization account."
            );


            return;

        }


        if (!profile) {

            showError(
                "Your organization administrator profile could not be found."
            );


            return;

        }


        /* -----------------------------------------------
           ROLE CHECK
        ------------------------------------------------ */

        if (
            profile.role !==
            "organization_admin"
        ) {

            await supabaseClient
                .auth
                .signOut();


            redirectToLogin();

            return;

        }


        /* -----------------------------------------------
           ACTIVE ACCOUNT CHECK
        ------------------------------------------------ */

        if (
            profile.is_active !== true
        ) {

            showError(
                "Your organization administrator account is inactive."
            );


            return;

        }


        /* -----------------------------------------------
           ORGANIZATION CHECK
        ------------------------------------------------ */

        if (
            !profile.organization_id
        ) {

            showError(
                "Your account is not linked to an organization."
            );


            return;

        }


        organizationAdminProfile =
            profile;


        /* -----------------------------------------------
           LOAD ORGANIZATION
        ------------------------------------------------ */

        await loadOrganization(
            profile.organization_id
        );

    }

    catch (error) {

        console.error(
            "Teachers initialization error:",
            error
        );


        showError(
            "Something went wrong while loading the Teachers page."
        );

    }

}


/* =========================================================
   LOAD ORGANIZATION
========================================================= */

async function loadOrganization(
    organizationId
) {

    try {

        const {
            data: organization,
            error
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
                    organizationId
                )

                .maybeSingle();


        if (error) {

            console.error(
                "Organization error:",
                error
            );


            showError(
                "Unable to verify your organization."
            );


            return;

        }


        if (!organization) {

            showError(
                "Your organization could not be found."
            );


            return;

        }


        if (
            organization.status !==
            "active"
        ) {

            showError(
                "Your organization is not currently active."
            );


            return;

        }


        organizationProfile =
            organization;


        console.log(
            "Organization:",
            organizationProfile
        );


        await loadTeachers();

    }

    catch (error) {

        console.error(
            "Organization loading error:",
            error
        );


        showError(
            "Unable to load your organization."
        );

    }

}


/* =========================================================
   LOAD TEACHERS
========================================================= */

async function loadTeachers() {

    showLoading();


    try {

        const organizationId =
            organizationProfile.id;


        const {
            data,
            error
        } =
            await supabaseClient

                .from("users")

                .select(
                    `
                    id,
                    username,
                    email,
                    role,
                    teacher,
                    organization_id,
                    is_active
                    `
                )

                .eq(
                    "organization_id",
                    organizationId
                )

                .eq(
                    "role",
                    "teacher"
                )

                .order(
                    "username",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Teacher query error:",
                error
            );


            showError(
                "Unable to load teachers."
            );


            return;

        }


        teachers =
            data || [];


        updateTeacherCount();

        renderTeachers();

    }

    catch (error) {

        console.error(
            "Teacher loading error:",
            error
        );


        showError(
            "Something went wrong while loading teachers."
        );

    }

}


/* =========================================================
   UPDATE COUNT
========================================================= */

function updateTeacherCount() {

    teacherCount.textContent =
        teachers.length;

}


/* =========================================================
   RENDER TEACHERS
========================================================= */

function renderTeachers() {

    if (
        teachers.length === 0
    ) {

        showEmptyState();

        return;

    }


    let rows = "";


    teachers.forEach(
        function (teacher) {

            const name =
                teacher.username ||
                "Unnamed Teacher";


            const email =
                teacher.email ||
                "No email";


            let statusClass =
                "inactive";


            let statusText =
                "Inactive";


            if (
                teacher.is_active === true
            ) {

                statusClass =
                    "active";

                statusText =
                    "Active";

            }


            rows += `

                <tr>

                    <td>

                        <div class="teacher-name">

                            ${escapeHtml(name)}

                        </div>

                    </td>


                    <td>

                        <div class="teacher-email">

                            ${escapeHtml(email)}

                        </div>

                    </td>


                    <td>

                        <span
                            class="status-badge ${statusClass}"
                        >

                            <span
                                class="status-dot"
                            ></span>

                            ${statusText}

                        </span>

                    </td>

                </tr>

            `;

        }
    );


    teachersContent.innerHTML = `

        <div class="table-wrapper">

            <table class="teachers-table">

                <thead>

                    <tr>

                        <th>
                            Name
                        </th>

                        <th>
                            Email
                        </th>

                        <th>
                            Status
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${rows}

                </tbody>

            </table>

        </div>

    `;

}


/* =========================================================
   EMPTY STATE
========================================================= */

function showEmptyState() {

    teachersContent.innerHTML = `

        <div class="table-state">

            <div class="table-state-icon">

                <i class="fa-solid fa-user-group"></i>

            </div>


            <h3>
                No teachers yet
            </h3>


            <p>
                Teachers added to your organization
                will appear here.
            </p>

        </div>

    `;

}


/* =========================================================
   LOADING STATE
========================================================= */

function showLoading() {

    teachersContent.innerHTML = `

        <div class="table-state">

            <div class="loading-spinner"></div>

            <h3>
                Loading teachers...
            </h3>


            <p>
                Please wait while we load your
                organization teachers.
            </p>

        </div>

    `;

}


/* =========================================================
   ERROR STATE
========================================================= */

function showError(
    message
) {

    teachersContent.innerHTML = `

        <div class="table-state">

            <div
                class="table-state-icon"
                style="
                    background:#fee2e2;
                    color:#b91c1c;
                "
            >

                <i
                    class="fa-solid fa-triangle-exclamation"
                ></i>

            </div>


            <h3>
                Unable to load teachers
            </h3>


            <p>
                ${escapeHtml(message)}
            </p>

        </div>

    `;

}


/* =========================================================
   OPEN ADD TEACHER MODAL
========================================================= */

addTeacherButton.addEventListener(
    "click",
    function () {

        openTeacherModal();

    }
);


/* =========================================================
   OPEN MODAL
========================================================= */

function openTeacherModal() {

    teacherModal.classList.remove(
        "hidden"
    );


    teacherForm.reset();


    clearFormMessage();


    setTimeout(
        function () {

            teacherName.focus();

        },
        100
    );

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeTeacherModalWindow() {

    teacherModal.classList.add(
        "hidden"
    );


    teacherForm.reset();


    clearFormMessage();

}


closeTeacherModal.addEventListener(
    "click",
    closeTeacherModalWindow
);


cancelTeacherButton.addEventListener(
    "click",
    closeTeacherModalWindow
);


/* =========================================================
   CLICK OUTSIDE MODAL
========================================================= */

teacherModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            teacherModal
        ) {

            closeTeacherModalWindow();

        }

    }
);


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Escape" &&
            !teacherModal.classList.contains(
                "hidden"
            )
        ) {

            closeTeacherModalWindow();

        }

    }
);


/* =========================================================
   FORM SUBMISSION
========================================================= */

teacherForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const name =
            teacherName.value.trim();


        const email =
            teacherEmail.value
                .trim()
                .toLowerCase();


        /* -----------------------------------------------
           VALIDATION
        ------------------------------------------------ */

        if (!name) {

            showFormMessage(
                "Please enter the teacher's name.",
                "error"
            );


            teacherName.focus();

            return;

        }


        if (!email) {

            showFormMessage(
                "Please enter the teacher's email address.",
                "error"
            );


            teacherEmail.focus();

            return;

        }


        if (
            !isValidEmail(email)
        ) {

            showFormMessage(
                "Please enter a valid email address.",
                "error"
            );


            teacherEmail.focus();

            return;

        }


        /* -----------------------------------------------
           CHECK ORGANIZATION
        ------------------------------------------------ */

        if (
            !organizationProfile ||
            !organizationProfile.id
        ) {

            showFormMessage(
                "Your organization could not be identified. Please refresh the page.",
                "error"
            );


            return;

        }


        /* -----------------------------------------------
           DISABLE BUTTON
        ------------------------------------------------ */

        sendInvitationButton.disabled =
            true;


        sendInvitationButton.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Checking...

        `;


        clearFormMessage();


        try {

            /* -------------------------------------------
               CHECK EXISTING USER
            -------------------------------------------- */

            const {
                data: existingUser,
                error: existingUserError
            } =
                await supabaseClient

                    .from("users")

                    .select(
                        `
                        id,
                        email,
                        role,
                        organization_id
                        `
                    )

                    .ilike(
                        "email",
                        email
                    )

                    .maybeSingle();


            if (
                existingUserError
            ) {

                console.error(
                    "Existing user check error:",
                    existingUserError
                );


                showFormMessage(
                    "Unable to check this email address. Please try again.",
                    "error"
                );


                return;

            }


            if (existingUser) {

                if (
                    existingUser.role ===
                    "teacher"
                ) {

                    if (
                        existingUser.organization_id ===
                        organizationProfile.id
                    ) {

                        showFormMessage(
                            "This teacher is already connected to your organization.",
                            "error"
                        );

                    } else {

                        showFormMessage(
                            "A teacher account already exists with this email address.",
                            "error"
                        );

                    }


                    return;

                }


                showFormMessage(
                    "An account already exists with this email address.",
                    "error"
                );


                return;

            }


            /* -------------------------------------------
               GET CURRENT ADMIN SESSION
            -------------------------------------------- */

            const {
                data: sessionData,
                error: sessionError
            } =
                await supabaseClient
                    .auth
                    .getSession();


            if (sessionError) {

                console.error(
                    "Session error:",
                    sessionError
                );


                showFormMessage(
                    "Your login session could not be verified. Please sign in again.",
                    "error"
                );


                return;

            }


            const session =
                sessionData?.session;


            if (
                !session ||
                !session.access_token
            ) {

                console.error(
                    "No valid authenticated session found."
                );


                showFormMessage(
                    "Your login session has expired. Please sign in again.",
                    "error"
                );


                return;

            }


            console.log(
                "Authenticated session confirmed."
            );


            /* -------------------------------------------
               SEND INVITATION THROUGH EDGE FUNCTION
            -------------------------------------------- */

            sendInvitationButton.innerHTML = `

                <i class="fa-solid fa-spinner fa-spin"></i>

                Sending...

            `;


            console.log(
                "Sending teacher invitation:",
                {
                    name: name,
                    email: email
                }
            );


            const {
                data: invitationResult,
                error: invitationError
            } =
                await supabaseClient.functions.invoke(
                    "invite-teacher",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${session.access_token}`
                        },

                        body: {
                            name: name,
                            email: email
                        }
                    }
                );


            /* -------------------------------------------
               EDGE FUNCTION ERROR
            -------------------------------------------- */

            if (
                invitationError
            ) {

                console.error(
                    "Teacher invitation function error:",
                    invitationError
                );


                /*
                 * Try to expose as much diagnostic
                 * information as possible in the console.
                 */

                console.error(
                    "Invitation error details:",
                    {
                        name:
                            invitationError.name,

                        message:
                            invitationError.message,

                        context:
                            invitationError.context
                    }
                );


                showFormMessage(
                    invitationError.message ||
                    "Unable to send teacher invitation. Please try again.",
                    "error"
                );


                return;

            }


            /* -------------------------------------------
               SUCCESS
            -------------------------------------------- */

            console.log(
                "Teacher invitation response:",
                invitationResult
            );


            showFormMessage(
                "Invitation sent successfully. The teacher should check their email.",
                "success"
            );


            /*
             * Reload the teacher list so that the newly
             * created teacher profile appears.
             */

            await loadTeachers();


            /*
             * Give the success message a moment to be seen
             * before closing the modal.
             */

            setTimeout(
                function () {

                    closeTeacherModalWindow();

                },
                1800
            );

        }

        catch (error) {

            console.error(
                "Teacher invitation error:",
                error
            );


            showFormMessage(
                error?.message ||
                "Something went wrong while sending the invitation. Please try again.",
                "error"
            );

        }

        finally {

            sendInvitationButton.disabled =
                false;


            sendInvitationButton.innerHTML = `

                <i class="fa-solid fa-paper-plane"></i>

                Send Invitation

            `;

        }

    }
);


/* =========================================================
   FORM MESSAGE
========================================================= */

function showFormMessage(
    message,
    type
) {

    teacherFormMessage.textContent =
        message;


    teacherFormMessage.className =
        "modal-message";


    if (type) {

        teacherFormMessage.classList.add(
            type
        );

    }

}


/* =========================================================
   CLEAR FORM MESSAGE
========================================================= */

function clearFormMessage() {

    teacherFormMessage.textContent =
        "";


    teacherFormMessage.className =
        "modal-message";

}


/* =========================================================
   EMAIL VALIDATION
========================================================= */

function isValidEmail(
    email
) {

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    return emailPattern.test(
        email
    );

}


/* =========================================================
   REDIRECT TO LOGIN
========================================================= */

function redirectToLogin() {

    window.location.href =
        "login.html";

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}