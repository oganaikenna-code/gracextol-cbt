/* =========================================================
   GRACEXTOL CBT
   ORGANIZATION ADMIN
   RESULTS
   COMPLETE REPLACEMENT
========================================================= */


/* =========================================================
   PAGE ELEMENTS
========================================================= */

const resultsContent =
    document.getElementById(
        "resultsContent"
    );


const resultCount =
    document.getElementById(
        "resultCount"
    );


const studentCount =
    document.getElementById(
        "studentCount"
    );


const examCount =
    document.getElementById(
        "examCount"
    );


const adminName =
    document.getElementById(
        "adminName"
    );


const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


/* =========================================================
   DATA
========================================================= */

let organizationProfile = null;

let organizationAdminProfile = null;

let results = [];


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "Gracextol Organization Results loaded."
        );

        await initializeResultsPage();

    }
);


/* =========================================================
   INITIALIZE RESULTS PAGE
========================================================= */

async function initializeResultsPage() {

    try {

        console.log(
            "RESULTS: Initializing Results page..."
        );


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
           GET SESSION
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
                "RESULTS: Session error:",
                sessionError
            );

            redirectToLogin();

            return;

        }


        const session =
            sessionData?.session;


        if (!session) {

            console.warn(
                "RESULTS: No active session."
            );

            redirectToLogin();

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
                "RESULTS: Authentication error:",
                error
            );

            redirectToLogin();

            return;

        }


        const authUser =
            data?.user;


        if (!authUser) {

            redirectToLogin();

            return;

        }


        console.log(
            "RESULTS: Authenticated organization admin:",
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
                "RESULTS: Admin profile error:",
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

            showError(
                "You do not have permission to access the Organization Results dashboard."
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


        if (adminName) {

            adminName.textContent =
                profile.username ||
                profile.email ||
                "Organization Admin";

        }


        console.log(
            "RESULTS: Organization ID:",
            profile.organization_id
        );


        /* -----------------------------------------------
           LOAD ORGANIZATION
        ------------------------------------------------ */

        await loadOrganization(
            profile.organization_id
        );

    }

    catch (error) {

        console.error(
            "RESULTS: Initialization error:",
            error
        );

        showError(
            "Something went wrong while loading results."
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

        console.log(
            "RESULTS: Loading organization..."
        );


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
                "RESULTS: Organization error:",
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
            "RESULTS: Organization loaded:",
            organizationProfile
        );


        /* -----------------------------------------------
           NOW LOAD RESULTS
        ------------------------------------------------ */

        await loadResults();

    }

    catch (error) {

        console.error(
            "RESULTS: Organization loading error:",
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

    if (
        !organizationProfile ||
        !organizationProfile.id
    ) {

        throw new Error(
            "Organization profile is not available."
        );

    }


    const organizationId =
        organizationProfile.id;


    console.log(
        "RESULTS: Loading teachers for organization:",
        organizationId
    );


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

        console.error(
            "RESULTS: Teacher query error:",
            error
        );

        throw error;

    }


    console.log(
        "RESULTS: Organization teachers:",
        teachers
    );


    return teachers || [];

}


/* =========================================================
   LOAD RESULTS
========================================================= */

async function loadResults() {

    showLoading();


    try {

        console.log(
            "RESULTS: loadResults() started."
        );


        /* -----------------------------------------------
           GET ORGANIZATION TEACHERS
        ------------------------------------------------ */

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


        console.log(
            "RESULTS: Teacher Auth IDs:",
            teacherAuthIds
        );


        /* -----------------------------------------------
           NO TEACHERS
        ------------------------------------------------ */

        if (
            teacherAuthIds.length ===
            0
        ) {

            console.log(
                "RESULTS: No teachers found for organization."
            );

            results = [];

            updateStatistics();

            showEmptyState();

            return;

        }


        /* -----------------------------------------------
           LOAD ORGANIZATION EXAMS
        ------------------------------------------------ */

        console.log(
            "RESULTS: Loading examinations..."
        );


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
                    question_count,
                    duration,
                    created_by,
                    created_at
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
                "RESULTS: Examination query error:",
                examError
            );

            throw examError;

        }


        console.log(
            "RESULTS: Organization examinations:",
            exams
        );


        /* -----------------------------------------------
           NO EXAMS
        ------------------------------------------------ */

        if (
            !exams ||
            exams.length ===
            0
        ) {

            console.log(
                "RESULTS: No examinations found."
            );

            results = [];

            updateStatistics();

            showEmptyState();

            return;

        }


        /* -----------------------------------------------
           EXAM IDS
        ------------------------------------------------ */

        const examIds =
            exams.map(
                function (exam) {

                    return exam.id;

                }
            );


        console.log(
            "RESULTS: Exam IDs:",
            examIds
        );


        /* -----------------------------------------------
           BUILD EXAM LOOKUP
        ------------------------------------------------ */

        const examLookup = {};


        exams.forEach(
            function (exam) {

                examLookup[
                    exam.id
                ] =
                    exam;

            }
        );


        /* -----------------------------------------------
           BUILD TEACHER LOOKUP
        ------------------------------------------------ */

        const teacherLookup = {};


        teachers.forEach(
            function (teacher) {

                teacherLookup[
                    teacher.auth_id
                ] =
                    teacher;

            }
        );


        /* -----------------------------------------------
           LOAD SUBMISSIONS
        ------------------------------------------------ */

        console.log(
            "RESULTS: Loading submissions..."
        );


        const {
            data: submissionData,
            error: submissionError
        } =
            await supabaseClient
                .from("submissions")
                .select(`
                    id,
                    exam_id,
                    student_id,
                    student_name,
                    score,
                    created_at
                `)
                .in(
                    "exam_id",
                    examIds
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (submissionError) {

            console.error(
                "RESULTS: Submission query error:",
                submissionError
            );

            throw submissionError;

        }


        console.log(
            "RESULTS: Submissions returned:",
            submissionData
        );


        /* -----------------------------------------------
           BUILD RESULT RECORDS
        ------------------------------------------------ */

        results =
            (submissionData || [])
                .map(
                    function (submission) {

                        const exam =
                            examLookup[
                                submission.exam_id
                            ];


                        if (!exam) {

                            console.warn(
                                "RESULTS: Submission has no matching exam:",
                                submission
                            );

                            return null;

                        }


                        const teacher =
                            teacherLookup[
                                exam.created_by
                            ];


                        return {

                            id:
                                submission.id,

                            studentName:
                                submission.student_name ||
                                "Unnamed Student",

                            score:
                                submission.score,

                            examTitle:
                                exam.title ||
                                "Untitled Examination",

                            subject:
                                exam.subject ||
                                "",

                            classLevel:
                                exam.class_level ||
                                "",

                            teacherName:
                                teacher
                                    ? (
                                        teacher.username ||
                                        teacher.email ||
                                        "Teacher"
                                    )
                                    : "Teacher",

                            submittedAt:
                                submission.created_at

                        };

                    }
                )
                .filter(
                    function (result) {

                        return result !== null;

                    }
                );


        console.log(
            "RESULTS: Final result records:",
            results
        );


        /* -----------------------------------------------
           UPDATE STATISTICS
        ------------------------------------------------ */

        updateStatistics();


        /* -----------------------------------------------
           RENDER RESULTS
        ------------------------------------------------ */

        renderResults();


    }

    catch (error) {

        console.error(
            "RESULTS: Results loading error:",
            error
        );

        results = [];

        updateStatistics();

        showError(
            "Unable to load examination results."
        );

    }

}


/* =========================================================
   UPDATE STATISTICS
========================================================= */

function updateStatistics() {

    const total =
        results.length;


    if (resultCount) {

        resultCount.textContent =
            total;

    }


    const uniqueStudents =
        new Set();


    results.forEach(
        function (result) {

            if (
                result.studentName
            ) {

                uniqueStudents.add(
                    result.studentName
                        .trim()
                        .toLowerCase()
                );

            }

        }
    );


    if (studentCount) {

        studentCount.textContent =
            uniqueStudents.size;

    }


    const uniqueExams =
        new Set();


    results.forEach(
        function (result) {

            if (
                result.examTitle
            ) {

                uniqueExams.add(
                    result.examTitle
                );

            }

        }
    );


    if (examCount) {

        examCount.textContent =
            uniqueExams.size;

    }


    console.log(
        "RESULTS: Statistics:",
        {
            totalResults: total,
            students: uniqueStudents.size,
            examinations: uniqueExams.size
        }
    );

}


/* =========================================================
   RENDER RESULTS
========================================================= */

function renderResults() {

    if (
        !resultsContent
    ) {

        console.error(
            "RESULTS: resultsContent element not found."
        );

        return;

    }


    if (
        results.length ===
        0
    ) {

        showEmptyState();

        return;

    }


    let html = `

        <table>

            <thead>

                <tr>

                    <th>
                        Student
                    </th>

                    <th>
                        Examination
                    </th>

                    <th>
                        Subject
                    </th>

                    <th>
                        Teacher
                    </th>

                    <th>
                        Score
                    </th>

                    <th>
                        Date
                    </th>

                    <th>
                        Status
                    </th>

                </tr>

            </thead>

            <tbody>

    `;


    results.forEach(
        function (result) {

            html += `

                <tr>

                    <td>

                        <span class="student-name">
                            ${escapeHtml(
                                result.studentName
                            )}
                        </span>

                    </td>


                    <td>

                        ${escapeHtml(
                            result.examTitle
                        )}

                    </td>


                    <td>

                        ${
                            result.subject
                                ? escapeHtml(
                                    result.subject
                                )
                                : "—"
                        }

                    </td>


                    <td>

                        ${escapeHtml(
                            result.teacherName
                        )}

                    </td>


                    <td>

                        <span class="score">

                            ${
                                result.score !==
                                null &&
                                result.score !==
                                undefined
                                    ? result.score
                                    : "—"
                            }

                        </span>

                    </td>


                    <td>

                        ${
                            result.submittedAt
                                ? formatDate(
                                    result.submittedAt
                                )
                                : "—"
                        }

                    </td>


                    <td>

                        <span class="status completed">
                            Completed
                        </span>

                    </td>

                </tr>

            `;

        }
    );


    html += `

            </tbody>

        </table>

    `;


    resultsContent.innerHTML =
        html;


    console.log(
        "RESULTS: Results rendered successfully."
    );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    value
) {

    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleDateString(
        "en-NG",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"
        }
    );

}


/* =========================================================
   LOADING STATE
========================================================= */

function showLoading() {

    if (
        !resultsContent
    ) {

        return;

    }


    resultsContent.innerHTML = `

        <div class="loading-state">

            Loading examination results...

        </div>

    `;

}


/* =========================================================
   EMPTY STATE
========================================================= */

function showEmptyState() {

    if (
        !resultsContent
    ) {

        return;

    }


    resultsContent.innerHTML = `

        <div class="empty-state">

            <i class="fa-solid fa-chart-column"></i>

            <h3>
                No examination results yet
            </h3>

            <p>
                Results from examinations taken by students in your organization will appear here.
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

    console.error(
        "RESULTS ERROR:",
        message
    );


    if (
        resultsContent
    ) {

        resultsContent.innerHTML = `

            <div class="error-state">

                <i class="fa-solid fa-circle-exclamation"></i>

                <h3>
                    Unable to load results
                </h3>

                <p>
                    ${escapeHtml(
                        message
                    )}
                </p>

            </div>

        `;

    }

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

if (
    logoutBtn
) {

    logoutBtn.addEventListener(
        "click",
        async function () {

            try {

                await supabaseClient
                    .auth
                    .signOut();

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }


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

    return String(
        value ??
        ""
    )
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