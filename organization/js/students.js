/* =========================================================
   GRACEXTOL CBT
   ORGANIZATION ADMIN
   STUDENTS DASHBOARD
========================================================= */


/* =========================================================
   PAGE ELEMENTS
========================================================= */

const studentsContent =
    document.getElementById(
        "studentsContent"
    );


const studentCount =
    document.getElementById(
        "studentCount"
    );


const activeStudentCount =
    document.getElementById(
        "activeStudentCount"
    );


const submissionCount =
    document.getElementById(
        "submissionCount"
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

let students = [];

let submissions = [];


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "Gracextol Organization Students loaded."
        );

        await initializeStudentsPage();

    }
);


/* =========================================================
   INITIALIZE STUDENTS PAGE
========================================================= */

async function initializeStudentsPage() {

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
           GET SESSION
        ------------------------------------------------ */

        const {
            data: sessionData,
            error: sessionError
        } =
            await supabaseClient
                .auth
                .getSession();


        if (
            sessionError
        ) {

            console.error(
                "Session error:",
                sessionError
            );

            redirectToLogin();

            return;

        }


        const session =
            sessionData?.session;


        if (!session) {

            console.warn(
                "No active session."
            );

            redirectToLogin();

            return;

        }


        /* -----------------------------------------------
           GET AUTH USER
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
                "You do not have permission to access the Organization Students dashboard."
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


        adminName.textContent =
            profile.username ||
            profile.email ||
            "Organization Admin";


        /* -----------------------------------------------
           LOAD ORGANIZATION
        ------------------------------------------------ */

        await loadOrganization(
            profile.organization_id
        );

    }

    catch (error) {

        console.error(
            "Students initialization error:",
            error
        );

        showError(
            "Something went wrong while loading the Students dashboard."
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


        /* -----------------------------------------------
           ORGANIZATION STATUS
        ------------------------------------------------ */

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


        await loadStudentActivity();

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
   LOAD STUDENT ACTIVITY
========================================================= */

async function loadStudentActivity() {

    showLoading();


    try {

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


        /* -----------------------------------------------
           NO TEACHERS YET
        ------------------------------------------------ */

        if (
            teacherAuthIds.length ===
            0
        ) {

            students = [];

            submissions = [];

            updateStatistics();

            showEmptyState();

            return;

        }


        /* -----------------------------------------------
           LOAD ORGANIZATION EXAMS
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
                    created_by,
                    created_at
                `)
                .in(
                    "created_by",
                    teacherAuthIds
                );


        if (examError) {

            throw examError;

        }


        if (
            !exams ||
            exams.length === 0
        ) {

            students = [];

            submissions = [];

            updateStatistics();

            showEmptyState();

            return;

        }


        /* -----------------------------------------------
           CREATE EXAM LOOKUP
        ------------------------------------------------ */

        const examIds =
            exams.map(
                function (exam) {

                    return exam.id;

                }
            );


        const examLookup = {};


        exams.forEach(
            function (exam) {

                examLookup[
                    exam.id
                ] = exam;

            }
        );


        /* -----------------------------------------------
           LOAD SUBMISSIONS
        ------------------------------------------------ */

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

            throw submissionError;

        }


        submissions =
            submissionData || [];


        /* -----------------------------------------------
           BUILD STUDENT RECORDS
        ------------------------------------------------ */

        students =
            buildStudentRecords(
                submissions,
                examLookup
            );


        /* -----------------------------------------------
           UPDATE STATISTICS
        ------------------------------------------------ */

        updateStatistics();


        /* -----------------------------------------------
           RENDER
        ------------------------------------------------ */

        renderStudents();


    }

    catch (error) {

        console.error(
            "Student activity error:",
            error
        );

        showError(
            "Unable to load student examination activity."
        );

    }

}


/* =========================================================
   BUILD STUDENT RECORDS
========================================================= */

function buildStudentRecords(
    submissionRows,
    examLookup
) {

    const studentMap = {};


    submissionRows.forEach(
        function (submission) {

            const name =
                (
                    submission.student_name ||
                    "Unnamed Student"
                ).trim();


            const key =
                name.toLowerCase();


            if (
                !studentMap[key]
            ) {

                studentMap[key] = {

                    name:
                        name,

                    examsTaken:
                        0,

                    submissions:
                        0,

                    lastExam:
                        null,

                    lastExamDate:
                        null

                };

            }


            const student =
                studentMap[key];


            student.submissions +=
                1;


            const exam =
                examLookup[
                    submission.exam_id
                ];


            if (exam) {

                student.examsTaken +=
                    1;


                const submissionDate =
                    submission.created_at
                        ? new Date(
                            submission.created_at
                        )
                        : null;


                if (
                    submissionDate &&
                    (
                        !student.lastExamDate ||
                        submissionDate >
                        student.lastExamDate
                    )
                ) {

                    student.lastExamDate =
                        submissionDate;

                    student.lastExam =
                        exam.title;

                }

            }

        }
    );


    return Object.values(
        studentMap
    );

}


/* =========================================================
   UPDATE STATISTICS
========================================================= */

function updateStatistics() {

    studentCount.textContent =
        students.length;


    activeStudentCount.textContent =
        students.length;


    submissionCount.textContent =
        submissions.length;

}


/* =========================================================
   RENDER STUDENTS
========================================================= */

function renderStudents() {

    if (
        !studentsContent
    ) {

        return;

    }


    if (
        students.length ===
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
                        Exams Taken
                    </th>

                    <th>
                        Submissions
                    </th>

                    <th>
                        Last Examination
                    </th>

                    <th>
                        Status
                    </th>

                </tr>

            </thead>

            <tbody>

    `;


    students.forEach(
        function (student) {

            html += `

                <tr>

                    <td>

                        <span class="student-name">
                            ${escapeHtml(
                                student.name
                            )}
                        </span>

                    </td>


                    <td>
                        ${student.examsTaken}
                    </td>


                    <td>
                        ${student.submissions}
                    </td>


                    <td>
                        ${
                            student.lastExam
                                ? escapeHtml(
                                    student.lastExam
                                )
                                : "—"
                        }
                    </td>


                    <td>

                        <span class="status active">
                            Active
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


    studentsContent.innerHTML =
        html;

}


/* =========================================================
   LOADING STATE
========================================================= */

function showLoading() {

    if (
        !studentsContent
    ) {

        return;

    }


    studentsContent.innerHTML = `

        <div class="loading-state">

            Loading student activity...

        </div>

    `;

}


/* =========================================================
   EMPTY STATE
========================================================= */

function showEmptyState() {

    if (
        !studentsContent
    ) {

        return;

    }


    studentsContent.innerHTML = `

        <div class="empty-state">

            <i class="fa-solid fa-user-graduate"></i>

            <h3>
                No student activity yet
            </h3>

            <p>
                Students who take your organization's examinations will appear here.
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
        message
    );


    if (
        studentsContent
    ) {

        studentsContent.innerHTML = `

            <div class="error-state">

                <i class="fa-solid fa-circle-exclamation"></i>

                <h3>
                    Unable to load students
                </h3>

                <p>
                    ${escapeHtml(message)}
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
        value
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