/* =========================================================
   GRACEXTOL CBT
   ORGANIZATION ADMIN
   EXAMINATIONS
========================================================= */


/* =========================================================
   PAGE ELEMENTS
========================================================= */

const examinationsContent =
    document.getElementById(
        "examinationsContent"
    );


const examCount =
    document.getElementById(
        "examCount"
    );


const adminName =
    document.getElementById(
        "adminName"
    );


/* =========================================================
   DATA
========================================================= */

let organizationProfile = null;

let organizationAdminProfile = null;

let examinations = [];

let submissionCounts = {};


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "Gracextol Organization Examinations loaded."
        );


        await initializeExaminationsPage();

    }
);


/* =========================================================
   INITIALIZE PAGE
========================================================= */

async function initializeExaminationsPage() {

    try {

        /* -----------------------------------------------
           CHECK SUPABASE
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
           GET CURRENT SESSION
        ------------------------------------------------ */

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

            showError(
                "Unable to verify your login session."
            );

            return;

        }


        const session =
            sessionData?.session;


        if (!session) {

            console.warn(
                "No active organization admin session."
            );

            redirectToLogin();

            return;

        }


        console.log(
            "Organization admin session confirmed:",
            session.user.id
        );


        /* -----------------------------------------------
           GET AUTHENTICATED USER
        ------------------------------------------------ */

        const {
            data: userData,
            error: userError
        } =
            await supabaseClient
                .auth
                .getUser();


        if (userError) {

            console.error(
                "Authenticated user error:",
                userError
            );

            showError(
                "Unable to verify your authenticated account."
            );

            return;

        }


        const authUser =
            userData?.user;


        if (!authUser) {

            console.warn(
                "Authenticated user was not found."
            );

            redirectToLogin();

            return;

        }


        console.log(
            "Authenticated organization admin:",
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
                .select(`
                    id,
                    auth_id,
                    username,
                    email,
                    teacher,
                    role,
                    organization_id,
                    is_active
                `)
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
                "Unable to load your organization administrator profile."
            );

            return;

        }


        if (!profile) {

            console.error(
                "No profile found for authenticated user:",
                authUser.id
            );

            showError(
                "Your organization administrator profile could not be found."
            );

            return;

        }


        console.log(
            "Organization admin profile:",
            profile
        );


        /* -----------------------------------------------
           ROLE CHECK
        ------------------------------------------------ */

        if (
            profile.role !==
            "organization_admin"
        ) {

            console.error(
                "Unexpected organization account role:",
                profile.role
            );

            showError(
                "This account is not registered as an Organization Administrator."
            );

            return;

        }


        /* -----------------------------------------------
           ACTIVE CHECK
        ------------------------------------------------ */

        if (
            profile.is_active !==
            true
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
           ADMIN NAME
        ------------------------------------------------ */

        if (adminName) {

            adminName.textContent =
                profile.username ||
                profile.email ||
                "Organization Admin";

        }


        /* -----------------------------------------------
           LOAD ORGANIZATION
        ------------------------------------------------ */

        await loadOrganization(
            profile.organization_id
        );

    }

    catch (error) {

        console.error(
            "Examinations initialization error:",
            error
        );

        showError(
            "Something went wrong while loading examinations."
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
                .select(`
                    id,
                    name,
                    slug,
                    status
                `)
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


        await loadExaminations();

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
   LOAD ORGANIZATION TEACHERS
========================================================= */

async function loadOrganizationTeachers() {

    const organizationId =
        organizationProfile.id;


    const {
        data: teachers,
        error
    } =
        await supabaseClient
            .from("users")
            .select(`
                id,
                auth_id,
                username,
                email,
                teacher,
                role,
                organization_id,
                is_active
            `)
            .eq(
                "organization_id",
                organizationId
            )
            .eq(
                "role",
                "teacher"
            );


    if (error) {

        throw error;

    }


    return teachers || [];

}


/* =========================================================
   LOAD EXAMINATIONS
========================================================= */

async function loadExaminations() {

    showLoading();


    try {

        const teachers =
            await loadOrganizationTeachers();


        /* -----------------------------------------------
           GET TEACHER AUTH IDS
        ------------------------------------------------ */

        const teacherAuthIds =
            teachers
                .map(
                    function (teacher) {

                        return teacher.auth_id;

                    }
                )
                .filter(
                    function (authId) {

                        return !!authId;

                    }
                );


        /* -----------------------------------------------
           NO TEACHERS
        ------------------------------------------------ */

        if (
            teacherAuthIds.length ===
            0
        ) {

            examinations = [];

            submissionCounts = {};

            updateExamCount();

            showEmptyState();

            return;

        }


        /* -----------------------------------------------
           LOAD EXAMS
        ------------------------------------------------ */

        const {
            data: exams,
            error: examError
        } =
            await supabaseClient
                .from("exams")
                .select(`
                    id,
                    title,
                    subject,
                    class_level,
                    duration,
                    question_count,
                    access_code,
                    published,
                    status,
                    published_at,
                    created_at,
                    created_by
                `)
                .in(
                    "created_by",
                    teacherAuthIds
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (examError) {

            console.error(
                "Examination query error:",
                examError
            );

            showError(
                "Unable to load examinations."
            );

            return;

        }


        examinations =
            exams || [];


        /* -----------------------------------------------
           ATTACH TEACHER DETAILS
        ------------------------------------------------ */

        examinations =
            examinations.map(
                function (exam) {

                    const teacher =
                        teachers.find(
                            function (item) {

                                return (
                                    item.auth_id ===
                                    exam.created_by
                                );

                            }
                        );


                    return {

                        ...exam,

                        teacher_name:
                            teacher?.username ||
                            "Unknown Teacher",

                        teacher_email:
                            teacher?.email ||
                            ""

                    };

                }
            );


        updateExamCount();


        /* -----------------------------------------------
           LOAD SUBMISSION COUNTS
        ------------------------------------------------ */

        await loadSubmissionCounts();


        renderExaminations();

    }

    catch (error) {

        console.error(
            "Examination loading error:",
            error
        );

        showError(
            "Something went wrong while loading examinations."
        );

    }

}


/* =========================================================
   LOAD SUBMISSION COUNTS
========================================================= */

async function loadSubmissionCounts() {

    submissionCounts = {};


    if (
        examinations.length ===
        0
    ) {

        return;

    }


    const examIds =
        examinations.map(
            function (exam) {

                return exam.id;

            }
        );


    const {
        data: submissions,
        error
    } =
        await supabaseClient
            .from("submissions")
            .select(`
                exam_id
            `)
            .in(
                "exam_id",
                examIds
            );


    if (error) {

        console.error(
            "Submission count query error:",
            error
        );

        /*
         * We do not stop the examination
         * page if submission counts cannot
         * be loaded.
         */

        return;

    }


    (submissions || []).forEach(
        function (submission) {

            const examId =
                submission.exam_id;


            if (
                !submissionCounts[examId]
            ) {

                submissionCounts[examId] =
                    0;

            }


            submissionCounts[examId]++;

        }
    );

}


/* =========================================================
   UPDATE EXAM COUNT
========================================================= */

function updateExamCount() {

    if (examCount) {

        examCount.textContent =
            examinations.length;

    }

}


/* =========================================================
   RENDER EXAMINATIONS
========================================================= */

function renderExaminations() {

    if (
        examinations.length ===
        0
    ) {

        showEmptyState();

        return;

    }


    let rows = "";


    examinations.forEach(
        function (exam) {

            const status =
                getExamStatus(
                    exam
                );


            const submissions =
                submissionCounts[
                    exam.id
                ] || 0;


            rows += `

                <tr>

                    <td>

                        <div class="exam-title">

                            ${escapeHtml(
                                exam.title ||
                                "Untitled Examination"
                            )}

                        </div>

                        <div class="exam-meta">

                            ${escapeHtml(
                                exam.subject ||
                                "No subject"
                            )}

                            ${
                                exam.class_level
                                    ? ` • ${escapeHtml(
                                        exam.class_level
                                    )}`
                                    : ""
                            }

                        </div>

                    </td>


                    <td>

                        <div class="teacher-name">

                            ${escapeHtml(
                                exam.teacher_name
                            )}

                        </div>

                        <div class="teacher-email">

                            ${escapeHtml(
                                exam.teacher_email
                            )}

                        </div>

                    </td>


                    <td>

                        ${
                            exam.question_count !==
                                null &&
                            exam.question_count !==
                                undefined
                                ? exam.question_count
                                : "—"
                        }

                    </td>


                    <td>

                        ${
                            exam.duration
                                ? `${escapeHtml(
                                    String(
                                        exam.duration
                                    )
                                )} min`
                                : "—"
                        }

                    </td>


                    <td>

                        <span
                            class="submission-count"
                        >

                            ${submissions}

                        </span>

                    </td>


                    <td>

                        <span
                            class="
                                status-badge
                                ${status.className}
                            "
                        >

                            <span
                                class="status-dot"
                            ></span>

                            ${status.label}

                        </span>

                    </td>


                    <td>

                        ${
                            exam.access_code
                                ? `
                                    <span
                                        class="access-code"
                                    >

                                        ${escapeHtml(
                                            exam.access_code
                                        )}

                                    </span>
                                  `
                                : "—"
                        }

                    </td>

                </tr>

            `;

        }
    );


    examinationsContent.innerHTML = `

        <div class="table-wrapper">

            <table>

                <thead>

                    <tr>

                        <th>
                            Examination
                        </th>

                        <th>
                            Teacher
                        </th>

                        <th>
                            Questions
                        </th>

                        <th>
                            Duration
                        </th>

                        <th>
                            Submissions
                        </th>

                        <th>
                            Status
                        </th>

                        <th>
                            Access Code
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
   EXAM STATUS
========================================================= */

function getExamStatus(
    exam
) {

    if (
        exam.published === true ||
        exam.status ===
            "published"
    ) {

        return {

            label:
                "Published",

            className:
                "published"

        };

    }


    if (
        exam.status ===
        "archived"
    ) {

        return {

            label:
                "Archived",

            className:
                "archived"

        };

    }


    return {

        label:
            "Draft",

        className:
            "draft"

    };

}


/* =========================================================
   EMPTY STATE
========================================================= */

function showEmptyState() {

    examinationsContent.innerHTML = `

        <div class="table-state">

            <div class="table-state-icon">

                <i
                    class="fa-solid fa-file-lines"
                ></i>

            </div>


            <h3>
                No examinations yet
            </h3>


            <p>
                Examinations created by teachers
                in your organization will appear here.
            </p>

        </div>

    `;

}


/* =========================================================
   LOADING STATE
========================================================= */

function showLoading() {

    examinationsContent.innerHTML = `

        <div class="table-state">

            <div class="loading-spinner"></div>

            <h3>
                Loading examinations...
            </h3>


            <p>
                Please wait while we load your
                organization's examinations.
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

    examinationsContent.innerHTML = `

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
                Unable to load examinations
            </h3>


            <p>

                ${escapeHtml(
                    message
                )}

            </p>

        </div>

    `;

}


/* =========================================================
   REDIRECT TO LOGIN
========================================================= */

function redirectToLogin() {

    window.location.href =
        "login.html";

}


/* =========================================================
   LOGOUT
========================================================= */

const logoutButton =
    document.getElementById(
        "logoutBtn"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            await supabaseClient
                .auth
                .signOut();

            window.location.href =
                "login.html";

        }
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}