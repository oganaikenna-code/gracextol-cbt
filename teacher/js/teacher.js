/* =========================================================
   GRACEXTOL CBT
   TEACHER DASHBOARD
   SUPABASE VERSION
   ========================================================= */


/* =========================================================
   DASHBOARD ELEMENTS
   ========================================================= */

const totalExamsElement =
    document.getElementById("totalExams");

const totalQuestionsElement =
    document.getElementById("totalQuestions");

const totalStudentsElement =
    document.getElementById("totalStudents");

const totalResultsElement =
    document.getElementById("totalResults");


/* =========================================================
   DASHBOARD DATA
   ========================================================= */

let teacherExams = [];
let teacherSubmissions = [];


/* =========================================================
   INITIALIZE DASHBOARD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "Gracextol Teacher Dashboard Loaded."
        );

        await loadDashboard();

    }
);


/* =========================================================
   LOAD DASHBOARD
   ========================================================= */

async function loadDashboard() {

    console.log(
        "Loading teacher dashboard..."
    );


    /* =====================================================
       CHECK SUPABASE
    ===================================================== */

    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        console.error(
            "Supabase client is not available."
        );

        return;

    }


    try {

        /* =================================================
           GET AUTHENTICATED TEACHER
        ================================================= */

        const {
            data: {
                user
            },
            error: authError
        } =
            await supabaseClient
                .auth
                .getUser();


        if (authError) {

            console.error(
                "Teacher authentication error:",
                authError
            );

            return;

        }


        if (!user) {

            console.error(
                "No authenticated teacher found."
            );

            return;

        }


        console.log(
            "Authenticated teacher:",
            user.id
        );


        /* =================================================
           LOAD TEACHER'S EXAMINATIONS
        ================================================= */

        const {
            data: exams,
            error: examsError
        } =
            await supabaseClient
                .from("exams")
                .select(
                    `
                    id,
                    title,
                    question_count,
                    created_by,
                    created_at
                    `
                )
                .eq(
                    "created_by",
                    user.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (examsError) {

            console.error(
                "Error loading teacher examinations:",
                examsError
            );

            return;

        }


        teacherExams =
            exams || [];


        console.log(
            "Teacher examinations:",
            teacherExams
        );


        /* =================================================
           UPDATE TOTAL EXAMS
        ================================================= */

        if (
            totalExamsElement
        ) {

            totalExamsElement.textContent =
                teacherExams.length;

        }


        /* =================================================
           CALCULATE TOTAL QUESTIONS
        ================================================= */

        const totalQuestionCount =
            teacherExams.reduce(
                (
                    total,
                    exam
                ) => {

                    return (
                        total +
                        (
                            Number(
                                exam.question_count
                            ) || 0
                        )
                    );

                },
                0
            );


        if (
            totalQuestionsElement
        ) {

            totalQuestionsElement.textContent =
                totalQuestionCount;

        }


        /* =================================================
           NO EXAMS
        ================================================= */

        if (
            teacherExams.length === 0
        ) {

            teacherSubmissions = [];

            updateStudentAndResultStatistics();

            return;

        }


        /* =================================================
           GET EXAM IDS
        ================================================= */

        const examIds =
            teacherExams.map(
                exam =>
                    exam.id
            );


        console.log(
            "Teacher exam IDs:",
            examIds
        );


        /* =================================================
           LOAD STUDENT SUBMISSIONS
        ================================================= */

        const {
            data: submissions,
            error: submissionsError
        } =
            await supabaseClient
                .from("submissions")
                .select(
                    `
                    id,
                    exam_id,
                    student_id,
                    student_name,
                    score,
                    answers,
                    created_at
                    `
                )
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


        if (submissionsError) {

            console.error(
                "Error loading submissions:",
                submissionsError
            );

            teacherSubmissions = [];

            updateStudentAndResultStatistics();

            return;

        }


        teacherSubmissions =
            submissions || [];


        console.log(
            "Teacher submissions:",
            teacherSubmissions
        );


        /* =================================================
           UPDATE STUDENT + RESULT STATISTICS
        ================================================= */

        updateStudentAndResultStatistics();


        /* =================================================
           LOAD RECENT EXAMINATIONS
        ================================================= */

        renderRecentExaminations();


    } catch (error) {

        console.error(
            "Unexpected dashboard error:",
            error
        );

    }

}


/* =========================================================
   UPDATE STUDENT + RESULT STATISTICS
   ========================================================= */

function updateStudentAndResultStatistics() {


    /* =====================================================
       TOTAL RESULTS
       Each submission = one result
    ===================================================== */

    if (
        totalResultsElement
    ) {

        totalResultsElement.textContent =
            teacherSubmissions.length;

    }


    /* =====================================================
       UNIQUE STUDENTS
    ===================================================== */

    const uniqueStudents =
        new Set();


    teacherSubmissions.forEach(
        submission => {

            const studentKey =
                submission.student_id ||
                submission.student_name;


            if (
                studentKey
            ) {

                uniqueStudents.add(
                    studentKey
                );

            }

        }
    );


    if (
        totalStudentsElement
    ) {

        totalStudentsElement.textContent =
            uniqueStudents.size;

    }


    console.log(
        "Total students:",
        uniqueStudents.size
    );


    console.log(
        "Total results:",
        teacherSubmissions.length
    );

}


/* =========================================================
   RENDER RECENT EXAMINATIONS
   ========================================================= */

function renderRecentExaminations() {


    /*
       Your current HTML contains:

       <div class="exam-table">
           <div class="empty-state">
               ...
           </div>
       </div>

       We replace that area with real
       examination records when exams exist.
    */


    const examTable =
        document.querySelector(
            ".exam-table"
        );


    if (!examTable) {

        console.warn(
            "Recent examinations container not found."
        );

        return;

    }


    /* =====================================================
       NO EXAMS
    ===================================================== */

    if (
        teacherExams.length === 0
    ) {

        examTable.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    <i class="fa-solid fa-file-circle-plus"></i>
                </div>

                <h3>
                    No examinations yet
                </h3>

                <p>
                    Create your first examination to see it here.
                </p>

                <button
                    class="primary-btn"
                    type="button"
                    onclick="window.location.href='create-exam.html'"
                >
                    <i class="fa-solid fa-plus"></i>
                    Create Examination
                </button>

            </div>

        `;

        return;

    }


    /* =====================================================
       SHOW RECENT EXAMS
    ===================================================== */

    const recentExams =
        teacherExams.slice(
            0,
            5
        );


    examTable.innerHTML = `

        <div class="recent-exams-list">

            ${recentExams
                .map(
                    exam => {

                        const questionCount =
                            Number(
                                exam.question_count
                            ) || 0;


                        const createdDate =
                            formatDate(
                                exam.created_at
                            );


                        return `

                            <div
                                class="recent-exam-row"
                                data-exam-id="${escapeHTML(
                                    exam.id
                                )}"
                            >

                                <div class="recent-exam-icon">

                                    <i
                                        class="fa-solid fa-file-lines"
                                    ></i>

                                </div>


                                <div class="recent-exam-info">

                                    <h3>
                                        ${escapeHTML(
                                            exam.title ||
                                            "Untitled Examination"
                                        )}
                                    </h3>

                                    <p>
                                        ${questionCount}
                                        ${
                                            questionCount === 1
                                                ? "Question"
                                                : "Questions"
                                        }
                                        &nbsp;•&nbsp;
                                        ${createdDate}
                                    </p>

                                </div>


                                <div class="recent-exam-action">

                                    <button
                                        type="button"
                                        onclick="openExam('${escapeHTML(
                                            exam.id
                                        )}')"
                                        aria-label="Open examination"
                                    >
                                        <i
                                            class="fa-solid fa-arrow-right"
                                        ></i>
                                    </button>

                                </div>

                            </div>

                        `;

                    }
                )
                .join("")}

        </div>

    `;

}


/* =========================================================
   OPEN EXAMINATION
   ========================================================= */

function openExam(
    examId
) {

    if (!examId) {

        return;

    }


    /*
       For now, send the teacher to
       My Examinations.

       We can later make this open
       the exact examination directly.
    */

    window.location.href =
        "my-exams.html";

}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(
    dateValue
) {

    if (!dateValue) {

        return "Date unavailable";

    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Date unavailable";

    }


    return date.toLocaleDateString(
        "en-NG",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
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