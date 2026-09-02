/* =========================================================
   GRACEXTOL CBT
   STUDENTS PAGE
   SUPABASE VERSION
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const studentsList =
    document.getElementById(
        "studentsList"
    );

const loadingState =
    document.getElementById(
        "loadingState"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const errorState =
    document.getElementById(
        "errorState"
    );

const errorMessage =
    document.getElementById(
        "errorMessage"
    );

const retryBtn =
    document.getElementById(
        "retryBtn"
    );

const studentSearch =
    document.getElementById(
        "studentSearch"
    );

const totalStudents =
    document.getElementById(
        "totalStudents"
    );

const totalAttempts =
    document.getElementById(
        "totalAttempts"
    );


/* =========================================================
   DATA
========================================================= */

let allStudents = [];


/* =========================================================
   LOAD STUDENTS
========================================================= */

async function loadStudents() {

    showLoading();


    try {

        /* =========================================
           CHECK SUPABASE
        ========================================= */

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            throw new Error(
                "Supabase client is not available."
            );

        }


        /* =========================================
           GET CURRENT TEACHER
        ========================================= */

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

            throw authError;

        }


        if (!user) {

            throw new Error(
                "No authenticated teacher found. Please sign in again."
            );

        }


        console.log(
            "Students page teacher:",
            user.id
        );


        /* =========================================
           GET TEACHER'S EXAMS
        ========================================= */

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
                    created_by,
                    question_count
                    `
                )

                .eq(
                    "created_by",
                    user.id
                );


        if (examsError) {

            throw examsError;

        }


        /* =========================================
           NO EXAMS
        ========================================= */

        if (
            !exams ||
            exams.length === 0
        ) {

            allStudents = [];

            updateStatistics();

            showEmpty();

            return;

        }


        /* =========================================
           GET EXAM IDS
        ========================================= */

        const examIds =
            exams.map(
                exam =>
                    exam.id
            );


        /* =========================================
           GET SUBMISSIONS
        ========================================= */

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

            throw submissionsError;

        }


        /* =========================================
           NO STUDENT SUBMISSIONS
        ========================================= */

        if (
            !submissions ||
            submissions.length === 0
        ) {

            allStudents = [];

            updateStatistics();

            showEmpty();

            return;

        }


        /* =========================================
           BUILD STUDENT LIST
        ========================================= */

        const studentMap =
            new Map();


        submissions.forEach(
            submission => {

                const studentId =
                    submission.student_id ||
                    `name:${String(
                        submission.student_name ||
                        "Unknown Student"
                    )
                        .trim()
                        .toLowerCase()}`;


                const studentName =
                    submission.student_name ||
                    "Unknown Student";


                const exam =
                    exams.find(
                        item =>
                            item.id ===
                            submission.exam_id
                    );


                if (
                    !studentMap.has(
                        studentId
                    )
                ) {

                    studentMap.set(
                        studentId,
                        {

                            id:
                                submission.student_id ||
                                null,

                            name:
                                studentName,

                            attempts:
                                0,

                            exams:
                                new Set(),

                            latestScore:
                                null,

                            latestPercentage:
                                null,

                            latestExam:
                                exam?.title ||
                                "Examination",

                            latestDate:
                                submission.created_at

                        }
                    );

                }


                const student =
                    studentMap.get(
                        studentId
                    );


                /* =================================
                   ATTEMPT COUNT
                ================================= */

                student.attempts++;


                /* =================================
                   UNIQUE EXAMS
                ================================= */

                if (exam) {

                    student.exams.add(
                        exam.id
                    );

                }


                /* =================================
                   LATEST SUBMISSION
                ================================= */

                if (
                    !student.latestDate ||
                    new Date(
                        submission.created_at
                    ) >
                    new Date(
                        student.latestDate
                    )
                ) {

                    student.latestDate =
                        submission.created_at;

                    student.latestScore =
                        Number(
                            submission.score
                        ) || 0;

                    student.latestExam =
                        exam?.title ||
                        "Examination";


                    const answerCount =
                        Array.isArray(
                            submission.answers
                        )
                            ? submission.answers.length
                            : Number(
                                exam?.question_count
                            ) || 0;


                    student.latestPercentage =
                        answerCount > 0
                            ? Math.round(
                                (
                                    student.latestScore /
                                    answerCount
                                ) *
                                100
                            )
                            : 0;

                }

            }
        );


        /* =========================================
           CONVERT MAP TO ARRAY
        ========================================= */

        allStudents =
            Array.from(
                studentMap.values()
            )
                .map(
                    student => ({

                        ...student,

                        examCount:
                            student.exams.size

                    })
                )
                .sort(
                    (a, b) =>
                        a.name.localeCompare(
                            b.name
                        )
                );


        console.log(
            "Students loaded:",
            allStudents
        );


        updateStatistics();


        renderStudents(
            allStudents
        );


        showStudentList();


    } catch (error) {

        console.error(
            "Unable to load students:",
            error
        );


        showError(
            error.message ||
            "Unable to load students."
        );

    }

}


/* =========================================================
   RENDER STUDENTS
========================================================= */

function renderStudents(
    students
) {

    if (!studentsList) {

        return;

    }


    studentsList.innerHTML =
        "";


    if (
        !students ||
        students.length === 0
    ) {

        showEmpty();

        return;

    }


    students.forEach(
        student => {

            const card =
                createStudentCard(
                    student
                );


            studentsList.appendChild(
                card
            );

        }
    );


    showStudentList();

}


/* =========================================================
   CREATE STUDENT CARD
========================================================= */

function createStudentCard(
    student
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "student-card";


    const initials =
        getInitials(
            student.name
        );


    const latestScore =
        student.latestPercentage !==
        null
            ? `${student.latestPercentage}%`
            : "-";


    card.innerHTML = `

        <div class="student-card-header">


            <div class="student-avatar">

                ${escapeHTML(
                    initials
                )}

            </div>


            <div>

                <h3 class="student-name">

                    ${escapeHTML(
                        student.name
                    )}

                </h3>


                <div class="student-id">

                    ${
                        student.id
                            ? `Student ID: ${escapeHTML(
                                student.id
                            )}`
                            : "Student ID not provided"
                    }

                </div>

            </div>


        </div>


        <div class="student-stats">


            <div class="student-stat">

                <span>
                    Attempts
                </span>

                <strong>
                    ${student.attempts}
                </strong>

            </div>


            <div class="student-stat">

                <span>
                    Exams
                </span>

                <strong>
                    ${student.examCount}
                </strong>

            </div>


            <div class="student-stat">

                <span>
                    Latest
                </span>

                <strong>
                    ${latestScore}
                </strong>

            </div>


        </div>


        <div class="student-latest">


            <span class="student-latest-label">

                Latest Examination

            </span>


            <div class="student-latest-exam">

                ${escapeHTML(
                    student.latestExam
                )}

            </div>


            <div class="student-latest-score">

                ${formatDate(
                    student.latestDate
                )}

            </div>


        </div>

    `;


    return card;

}


/* =========================================================
   SEARCH
========================================================= */

if (studentSearch) {

    studentSearch.addEventListener(
        "input",
        function () {

            const search =
                this.value
                    .trim()
                    .toLowerCase();


            if (!search) {

                renderStudents(
                    allStudents
                );

                return;

            }


            const filtered =
                allStudents.filter(
                    student => {

                        return (

                            student.name
                                .toLowerCase()
                                .includes(
                                    search
                                )

                            ||

                            (
                                student.id &&
                                String(
                                    student.id
                                )
                                    .toLowerCase()
                                    .includes(
                                        search
                                    )
                            )

                        );

                    }
                );


            renderStudents(
                filtered
            );

        }
    );

}


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics() {

    if (totalStudents) {

        totalStudents.textContent =
            allStudents.length;

    }


    if (totalAttempts) {

        totalAttempts.textContent =
            allStudents.reduce(
                (
                    total,
                    student
                ) =>
                    total +
                    student.attempts,
                0
            );

    }

}


/* =========================================================
   SHOW LOADING
========================================================= */

function showLoading() {

    if (loadingState) {

        loadingState.style.display =
            "flex";

    }


    if (emptyState) {

        emptyState.style.display =
            "none";

    }


    if (errorState) {

        errorState.style.display =
            "none";

    }


    if (studentsList) {

        studentsList.style.display =
            "none";

    }

}


/* =========================================================
   SHOW EMPTY
========================================================= */

function showEmpty() {

    if (loadingState) {

        loadingState.style.display =
            "none";

    }


    if (errorState) {

        errorState.style.display =
            "none";

    }


    if (studentsList) {

        studentsList.style.display =
            "none";

    }


    if (emptyState) {

        emptyState.style.display =
            "flex";

    }

}


/* =========================================================
   SHOW STUDENTS
========================================================= */

function showStudentList() {

    if (loadingState) {

        loadingState.style.display =
            "none";

    }


    if (emptyState) {

        emptyState.style.display =
            "none";

    }


    if (errorState) {

        errorState.style.display =
            "none";

    }


    if (studentsList) {

        studentsList.style.display =
            "grid";

    }

}


/* =========================================================
   SHOW ERROR
========================================================= */

function showError(
    message
) {

    if (loadingState) {

        loadingState.style.display =
            "none";

    }


    if (emptyState) {

        emptyState.style.display =
            "none";

    }


    if (studentsList) {

        studentsList.style.display =
            "none";

    }


    if (errorState) {

        errorState.style.display =
            "flex";

    }


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }

}


/* =========================================================
   RETRY
========================================================= */

if (retryBtn) {

    retryBtn.addEventListener(
        "click",
        loadStudents
    );

}


/* =========================================================
   HELPERS
========================================================= */

function getInitials(
    name
) {

    const words =
        String(
            name ||
            "Student"
        )
            .trim()
            .split(
                /\s+/
            )
            .filter(
                Boolean
            );


    if (
        words.length === 0
    ) {

        return "S";

    }


    if (
        words.length === 1
    ) {

        return words[0]
            .substring(
                0,
                1
            )
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[
            words.length - 1
        ][0]
    )
        .toUpperCase();

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    value
) {

    if (!value) {

        return "Date unavailable";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Date unavailable";

    }


    return date.toLocaleDateString(
        "en-GB",
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


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Gracextol Students Page Loaded."
        );


        loadStudents();

    }
);