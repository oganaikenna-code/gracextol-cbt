/* =========================================================
   GRACEXTOL CBT
   TEACHER RESULTS PAGE
   UPDATED VERSION

   Supports:
   - Multiple Choice
   - True / False
   - Fill in the Gap
   - Superscript
   - Subscript
   - Scientific / mathematical symbols
========================================================= */


/* =========================================================
   GLOBAL DATA
========================================================= */

let teacherResults = [];
let allQuestions = [];
let currentResult = null;


/* =========================================================
   GET HTML ELEMENTS
========================================================= */

const totalResultsElement =
    document.getElementById("totalResults");

const totalStudentsElement =
    document.getElementById("totalStudents");

const averageScoreElement =
    document.getElementById("averageScore");

const bestScoreElement =
    document.getElementById("bestScore");

const resultCountElement =
    document.getElementById("resultCount");

const resultsTableBody =
    document.getElementById("resultsTableBody");

const emptyState =
    document.getElementById("emptyState");

const loadingState =
    document.getElementById("loadingState");

const searchInput =
    document.getElementById("searchInput");

const examFilter =
    document.getElementById("examFilter");


/* =========================================================
   MODAL ELEMENTS
========================================================= */

const resultModal =
    document.getElementById("resultModal");

const modalStudentName =
    document.getElementById("modalStudentName");

const modalExamName =
    document.getElementById("modalExamName");

const modalScore =
    document.getElementById("modalScore");

const modalPercentage =
    document.getElementById("modalPercentage");

const modalPerformance =
    document.getElementById("modalPerformance");

const modalDate =
    document.getElementById("modalDate");

const answersList =
    document.getElementById("answersList");

const answerCount =
    document.getElementById("answerCount");


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "Gracextol Teacher Results Loaded."
        );

        await loadTeacherResults();

    }
);


/* =========================================================
   LOAD TEACHER RESULTS
========================================================= */

async function loadTeacherResults() {

    console.log(
        "Loading teacher results..."
    );

    showLoading();


    try {

        /* -------------------------------------------------
           CHECK SUPABASE
        ------------------------------------------------- */

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            console.error(
                "Supabase client is not available."
            );

            showEmpty();

            return;

        }


        /* -------------------------------------------------
           GET AUTHENTICATED TEACHER
        ------------------------------------------------- */

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

            showEmpty();

            return;

        }


        if (!user) {

            console.error(
                "No authenticated teacher found."
            );

            showEmpty();

            return;

        }


        console.log(
            "Authenticated teacher:",
            user.id
        );


        /* -------------------------------------------------
           GET TEACHER EXAMS
        ------------------------------------------------- */

        const {
            data: exams,
            error: examsError
        } =
            await supabaseClient
                .from("exams")
                .select(
                    "id, title, created_by"
                )
                .eq(
                    "created_by",
                    user.id
                );


        if (examsError) {

            console.error(
                "Error loading teacher exams:",
                examsError
            );

            showEmpty();

            return;

        }


        console.log(
            "Teacher exams:",
            exams
        );


        if (
            !exams ||
            exams.length === 0
        ) {

            teacherResults = [];

            updateStatistics();

            populateExamFilter();

            renderResults([]);

            return;

        }


        /* -------------------------------------------------
           EXAM IDS
        ------------------------------------------------- */

        const examIds =
            exams.map(
                exam => exam.id
            );


        console.log(
            "Exam IDs:",
            examIds
        );


        /* -------------------------------------------------
           GET SUBMISSIONS
        ------------------------------------------------- */

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
                    answers,
                    score,
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

            showEmpty();

            return;

        }


        console.log(
            "Submissions:",
            submissions
        );


        /* -------------------------------------------------
           COLLECT QUESTION IDS
        ------------------------------------------------- */

        const questionIds =
            collectQuestionIds(
                submissions
            );


        console.log(
            "Question IDs:",
            questionIds
        );


        /* -------------------------------------------------
           LOAD ORIGINAL QUESTIONS
        ------------------------------------------------- */

        await loadQuestions(
            questionIds
        );


        /* -------------------------------------------------
           BUILD TEACHER RESULTS
        ------------------------------------------------- */

        teacherResults =
            (submissions || []).map(
                submission => {

                    const exam =
                        exams.find(
                            item =>
                                item.id ===
                                submission.exam_id
                        );


                    const answers =
                        normalizeAnswers(
                            submission.answers
                        );


                    const totalQuestions =
                        answers.length;


                    const score =
                        Number(
                            submission.score
                        ) || 0;


                    const percentage =
                        totalQuestions > 0
                            ? Math.round(
                                (
                                    score /
                                    totalQuestions
                                ) * 100
                            )
                            : 0;


                    return {

                        id:
                            submission.id,

                        exam_id:
                            submission.exam_id,

                        student_id:
                            submission.student_id,

                        student_name:
                            submission.student_name ||
                            "Unknown Student",

                        exam_title:
                            exam?.title ||
                            "Examination",

                        answers:
                            answers,

                        score:
                            score,

                        total_questions:
                            totalQuestions,

                        percentage:
                            percentage,

                        created_at:
                            submission.created_at

                    };

                }
            );


        console.log(
            "Teacher results:",
            teacherResults
        );


        /* -------------------------------------------------
           UPDATE UI
        ------------------------------------------------- */

        updateStatistics();

        populateExamFilter();

        renderResults(
            teacherResults
        );


    } catch (error) {

        console.error(
            "Unexpected error loading teacher results:",
            error
        );

        showEmpty();

    }

}


/* =========================================================
   NORMALIZE ANSWERS
========================================================= */

function normalizeAnswers(
    answers
) {

    if (
        Array.isArray(answers)
    ) {

        return answers;

    }


    if (
        typeof answers ===
        "string"
    ) {

        try {

            const parsed =
                JSON.parse(
                    answers
                );

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch (error) {

            console.error(
                "Unable to parse submission answers:",
                error
            );

            return [];

        }

    }


    return [];

}


/* =========================================================
   COLLECT QUESTION IDS
========================================================= */

function collectQuestionIds(
    submissions
) {

    const ids =
        new Set();


    (
        submissions || []
    ).forEach(
        submission => {

            const answers =
                normalizeAnswers(
                    submission.answers
                );


            answers.forEach(
                answer => {

                    if (
                        answer &&
                        answer.question_id
                    ) {

                        ids.add(
                            answer.question_id
                        );

                    }

                }
            );

        }
    );


    return Array.from(ids);

}


/* =========================================================
   LOAD ORIGINAL QUESTIONS
========================================================= */

async function loadQuestions(
    questionIds
) {

    allQuestions = [];


    if (
        !questionIds ||
        questionIds.length === 0
    ) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("questions")
                .select(
                    `
                    id,
                    question_number,
                    question_text,
                    question_type,
                    answer,
                    correct_answer,
                    options
                    `
                )
                .in(
                    "id",
                    questionIds
                );


        if (error) {

            console.error(
                "Error loading questions:",
                error
            );

            return;

        }


        allQuestions =
            data || [];


        console.log(
            "Original questions:",
            allQuestions
        );


    } catch (error) {

        console.error(
            "Unexpected error loading questions:",
            error
        );

    }

}


/* =========================================================
   UPDATE STATISTICS
========================================================= */

function updateStatistics() {

    const total =
        teacherResults.length;


    const uniqueStudents =
        new Set(
            teacherResults.map(
                result =>
                    result.student_id ||
                    result.student_name
            )
        );


    const percentages =
        teacherResults.map(
            result =>
                Number(
                    result.percentage
                ) || 0
        );


    const average =
        percentages.length > 0
            ? Math.round(
                percentages.reduce(
                    (
                        total,
                        value
                    ) =>
                        total + value,
                    0
                ) /
                percentages.length
            )
            : 0;


    const best =
        percentages.length > 0
            ? Math.max(
                ...percentages
            )
            : 0;


    if (
        totalResultsElement
    ) {

        totalResultsElement.textContent =
            total;

    }


    if (
        totalStudentsElement
    ) {

        totalStudentsElement.textContent =
            uniqueStudents.size;

    }


    if (
        averageScoreElement
    ) {

        averageScoreElement.textContent =
            `${average}%`;

    }


    if (
        bestScoreElement
    ) {

        bestScoreElement.textContent =
            `${best}%`;

    }

}


/* =========================================================
   POPULATE EXAM FILTER
========================================================= */

function populateExamFilter() {

    if (
        !examFilter
    ) {

        return;

    }


    examFilter.innerHTML =
        `
        <option value="">
            All Examinations
        </option>
        `;


    const exams =
        new Map();


    teacherResults.forEach(
        result => {

            exams.set(
                result.exam_id,
                result.exam_title
            );

        }
    );


    exams.forEach(
        (
            title,
            id
        ) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                id;


            option.textContent =
                title;


            examFilter.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   RENDER RESULTS
========================================================= */

function renderResults(
    results
) {

    if (
        !resultsTableBody
    ) {

        return;

    }


    resultsTableBody.innerHTML =
        "";


    if (
        !results ||
        results.length === 0
    ) {

        showEmpty();


        if (
            resultCountElement
        ) {

            resultCountElement.textContent =
                "0 results";

        }


        return;

    }


    hideEmpty();


    if (
        resultCountElement
    ) {

        resultCountElement.textContent =
            `${results.length} ${
                results.length === 1
                    ? "result"
                    : "results"
            }`;

    }


    results.forEach(
        (
            result,
            index
        ) => {

            const row =
                document.createElement(
                    "tr"
                );


            const performance =
                getPerformance(
                    result.percentage
                );


            const avatar =
                getInitials(
                    result.student_name
                );


            row.innerHTML =
                `
                <td>
                    ${index + 1}
                </td>

                <td>

                    <div class="student-cell">

                        <div class="student-avatar">
                            ${escapeHtml(avatar)}
                        </div>

                        <span class="student-name">
                            ${escapeHtml(
                                result.student_name
                            )}
                        </span>

                    </div>

                </td>

                <td>

                    <span class="exam-name">
                        ${escapeHtml(
                            result.exam_title
                        )}
                    </span>

                </td>

                <td>

                    <span class="score-value">
                        ${result.score}/${result.total_questions}
                    </span>

                </td>

                <td>

                    <span class="percentage-value">
                        ${result.percentage}%
                    </span>

                </td>

                <td>

                    <span
                        class="
                            performance-badge
                            ${performance.className}
                        "
                    >

                        ${performance.label}

                    </span>

                </td>

                <td>

                    ${formatDate(
                        result.created_at
                    )}

                </td>

                <td>

                    <button
                        type="button"
                        class="view-btn"
                        onclick="viewResult('${result.id}')"
                    >

                        <i class="fa-solid fa-eye"></i>

                        View

                    </button>

                </td>
                `;


            resultsTableBody.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   SEARCH
========================================================= */

if (
    searchInput
) {

    searchInput.addEventListener(
        "input",
        applyFilters
    );

}


/* =========================================================
   EXAM FILTER
========================================================= */

if (
    examFilter
) {

    examFilter.addEventListener(
        "change",
        applyFilters
    );

}


/* =========================================================
   APPLY FILTERS
========================================================= */

function applyFilters() {

    const search =
        (
            searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const examId =
        examFilter?.value ||
        "";


    const filtered =
        teacherResults.filter(
            result => {

                const studentName =
                    String(
                        result.student_name ||
                        ""
                    )
                        .toLowerCase();


                const examTitle =
                    String(
                        result.exam_title ||
                        ""
                    )
                        .toLowerCase();


                const matchesSearch =
                    !search ||
                    studentName.includes(
                        search
                    ) ||
                    examTitle.includes(
                        search
                    );


                const matchesExam =
                    !examId ||
                    result.exam_id ===
                    examId;


                return (
                    matchesSearch &&
                    matchesExam
                );

            }
        );


    renderResults(
        filtered
    );

}


/* =========================================================
   VIEW RESULT
========================================================= */

async function viewResult(
    resultId
) {

    const result =
        teacherResults.find(
            item =>
                item.id ===
                resultId
        );


    if (
        !result
    ) {

        console.error(
            "Result not found:",
            resultId
        );

        return;

    }


    currentResult =
        result;


    /* -------------------------------------------------
       BASIC INFORMATION
    ------------------------------------------------- */

    if (
        modalStudentName
    ) {

        modalStudentName.textContent =
            result.student_name;

    }


    if (
        modalExamName
    ) {

        modalExamName.textContent =
            result.exam_title;

    }


    if (
        modalScore
    ) {

        modalScore.textContent =
            `${result.score}/${result.total_questions}`;

    }


    if (
        modalPercentage
    ) {

        modalPercentage.textContent =
            `${result.percentage}%`;

    }


    if (
        modalPerformance
    ) {

        modalPerformance.textContent =
            getPerformance(
                result.percentage
            ).label;

    }


    if (
        modalDate
    ) {

        modalDate.textContent =
            formatDate(
                result.created_at
            );

    }


    /* -------------------------------------------------
       DETAILED ANSWERS
    ------------------------------------------------- */

    renderDetailedAnswers(
        result.answers
    );


    /* -------------------------------------------------
       OPEN MODAL
    ------------------------------------------------- */

    if (
        resultModal
    ) {

        resultModal.classList.add(
            "active"
        );

    }


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   RENDER DETAILED ANSWERS
========================================================= */

function renderDetailedAnswers(
    answers
) {

    if (
        !answersList
    ) {

        return;

    }


    answersList.innerHTML =
        "";


    if (
        !answers ||
        answers.length === 0
    ) {

        answersList.innerHTML =
            `
            <div class="no-answer-options">
                No answer details are available
                for this submission.
            </div>
            `;


        if (
            answerCount
        ) {

            answerCount.textContent =
                "0 Questions";

        }


        return;

    }


    if (
        answerCount
    ) {

        answerCount.textContent =
            `${answers.length} ${
                answers.length === 1
                    ? "Question"
                    : "Questions"
            }`;

    }


    answers.forEach(
        (
            answer,
            index
        ) => {

            /* -------------------------------------------------
               FIND ORIGINAL QUESTION
            ------------------------------------------------- */

            const question =
                allQuestions.find(
                    item =>
                        item.id ===
                        answer.question_id
                );


            /* -------------------------------------------------
               QUESTION TYPE
            ------------------------------------------------- */

            const questionType =
                String(
                    question?.question_type ||
                    answer.question_type ||
                    "multiple-choice"
                )
                    .trim()
                    .toLowerCase();


            /* -------------------------------------------------
               GET CORRECT ANSWER
            ------------------------------------------------- */

            const correctAnswerText =
                getCorrectAnswerText(
                    question,
                    answer,
                    questionType
                );


            /* -------------------------------------------------
               STUDENT ANSWER
            ------------------------------------------------- */

            const studentAnswer =
                answer.answer !== null &&
                answer.answer !== undefined &&
                String(
                    answer.answer
                ).trim() !== ""
                    ? answer.answer
                    : "No answer";


            /* -------------------------------------------------
               CORRECT / INCORRECT
            ------------------------------------------------- */

            const isCorrect =
                answer.is_correct === true;


            /* -------------------------------------------------
               QUESTION NUMBER
            ------------------------------------------------- */

            const questionNumber =
                answer.question_number ??
                question?.question_number ??
                index + 1;


            /* -------------------------------------------------
               QUESTION TEXT
            ------------------------------------------------- */

            const questionText =
                answer.question_text ||
                question?.question_text ||
                "Question text unavailable.";


            /* -------------------------------------------------
               CREATE CARD
            ------------------------------------------------- */

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                `
                answer-card
                ${
                    isCorrect
                        ? "correct"
                        : "incorrect"
                }
                `;


            card.innerHTML =
                `
                <div class="answer-top">

                    <span class="question-number">

                        QUESTION
                        ${escapeHtml(
                            String(
                                questionNumber
                            )
                        )}

                    </span>


                    <span
                        class="
                            answer-status
                            ${
                                isCorrect
                                    ? "correct"
                                    : "incorrect"
                            }
                        "
                    >

                        <i
                            class="
                                fa-solid
                                ${
                                    isCorrect
                                        ? "fa-check"
                                        : "fa-xmark"
                                }
                            "
                        ></i>

                        ${
                            isCorrect
                                ? "Correct"
                                : "Incorrect"
                        }

                    </span>

                </div>


                <div class="question-text">

                    ${formatRichText(
                        questionText
                    )}

                </div>


                <div class="answer-grid">


                    <div
                        class="
                            answer-box
                            student-answer
                        "
                    >

                        <span>
                            Student Answer
                        </span>

                        <strong>

                            ${formatRichText(
                                String(
                                    studentAnswer
                                )
                            )}

                        </strong>

                    </div>



                    <div
                        class="
                            answer-box
                            correct-answer
                        "
                    >

                        <span>
                            Correct Answer
                        </span>

                        <strong>

                            ${formatRichText(
                                String(
                                    correctAnswerText
                                )
                            )}

                        </strong>

                    </div>


                </div>
                `;


            answersList.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   GET CORRECT ANSWER TEXT

   Supports:

   1. Multiple Choice
   2. True / False
   3. Fill in the Gap
========================================================= */

function getCorrectAnswerText(
    question,
    submissionAnswer,
    questionType
) {

    /* -------------------------------------------------
       NO QUESTION FOUND
    ------------------------------------------------- */

    if (!question) {

        if (
            submissionAnswer &&
            submissionAnswer.correct_answer !== null &&
            submissionAnswer.correct_answer !== undefined
        ) {

            return String(
                submissionAnswer.correct_answer
            );

        }

        return "Not available";

    }


    /* -------------------------------------------------
       FILL IN THE GAP
    ------------------------------------------------- */

    if (
        questionType === "fill-gap" ||
        questionType === "fill_gap" ||
        questionType === "fill-in-the-gap" ||
        questionType === "fill_in_the_gap" ||
        questionType === "fill-in-the-blank" ||
        questionType === "fill_in_the_blank" ||
        questionType === "fill-in" ||
        questionType === "fill_in" ||
        questionType === "fill" ||
        questionType === "short-answer" ||
        questionType === "short_answer"
    ) {

        if (
            question.answer !== null &&
            question.answer !== undefined &&
            String(
                question.answer
            ).trim() !== ""
        ) {

            return String(
                question.answer
            );

        }


        if (
            question.correct_answer !== null &&
            question.correct_answer !== undefined &&
            String(
                question.correct_answer
            ).trim() !== ""
        ) {

            return String(
                question.correct_answer
            );

        }


        return "Not available";

    }


    /* -------------------------------------------------
       TRUE / FALSE
    ------------------------------------------------- */

    if (
        questionType === "true-false" ||
        questionType === "true_false" ||
        questionType === "true/false" ||
        questionType === "truefalse" ||
        questionType === "boolean"
    ) {

        if (
            question.answer !== null &&
            question.answer !== undefined &&
            String(
                question.answer
            ).trim() !== ""
        ) {

            return normalizeBooleanAnswer(
                question.answer
            );

        }


        if (
            question.correct_answer !== null &&
            question.correct_answer !== undefined
        ) {

            return normalizeBooleanAnswer(
                question.correct_answer
            );

        }


        return "Not available";

    }


    /* -------------------------------------------------
       MULTIPLE CHOICE
    ------------------------------------------------- */

    let correctIndex =
        question.correct_answer;


    if (
        correctIndex === null ||
        correctIndex === undefined
    ) {

        correctIndex =
            submissionAnswer?.correct_answer;

    }


    const optionAnswer =
        getAnswerFromQuestionIndex(
            question,
            correctIndex
        );


    if (
        optionAnswer !== null &&
        optionAnswer !== undefined &&
        String(
            optionAnswer
        ).trim() !== ""
    ) {

        return String(
            optionAnswer
        );

    }


    /* -------------------------------------------------
       LAST FALLBACK
    ------------------------------------------------- */

    if (
        question.answer !== null &&
        question.answer !== undefined &&
        String(
            question.answer
        ).trim() !== ""
    ) {

        return String(
            question.answer
        );

    }


    return "Not available";

}


/* =========================================================
   NORMALIZE BOOLEAN ANSWER
========================================================= */

function normalizeBooleanAnswer(
    value
) {

    if (
        typeof value ===
        "boolean"
    ) {

        return value
            ? "True"
            : "False";

    }


    const text =
        String(
            value
        )
            .trim()
            .toLowerCase();


    if (
        text === "true" ||
        text === "1"
    ) {

        return "True";

    }


    if (
        text === "false" ||
        text === "0"
    ) {

        return "False";

    }


    return String(
        value
    );

}


/* =========================================================
   GET ANSWER FROM MULTIPLE-CHOICE OPTIONS
========================================================= */

function getAnswerFromQuestionIndex(
    question,
    correctIndex
) {

    if (
        !question
    ) {

        return null;

    }


    let options =
        question.options;


    if (
        typeof options ===
        "string"
    ) {

        try {

            options =
                JSON.parse(
                    options
                );

        } catch (error) {

            console.error(
                "Unable to parse question options:",
                error
            );

            return null;

        }

    }


    if (
        !Array.isArray(options)
    ) {

        return null;

    }


    /* -------------------------------------------------
       NO CORRECT ANSWER
    ------------------------------------------------- */

    if (
        correctIndex === null ||
        correctIndex === undefined
    ) {

        return null;

    }


    /* -------------------------------------------------
       NUMERIC INDEX
       0 = A
       1 = B
       2 = C
       3 = D
    ------------------------------------------------- */

    if (
        typeof correctIndex ===
        "number"
    ) {

        if (
            correctIndex >= 0 &&
            correctIndex < options.length
        ) {

            return String(
                options[
                    correctIndex
                ]
            );

        }

    }


    /* -------------------------------------------------
       STRING INDEX
       e.g. "A", "B", "C", "D"
    ------------------------------------------------- */

    const value =
        String(
            correctIndex
        ).trim();


    const upper =
        value.toUpperCase();


    const labels = [
        "A",
        "B",
        "C",
        "D",
        "E"
    ];


    const labelIndex =
        labels.indexOf(
            upper
        );


    if (
        labelIndex >= 0 &&
        labelIndex < options.length
    ) {

        return String(
            options[
                labelIndex
            ]
        );

    }


    /* -------------------------------------------------
       STRING NUMERIC INDEX
    ------------------------------------------------- */

    const numericIndex =
        Number(
            value
        );


    if (
        !Number.isNaN(
            numericIndex
        ) &&
        numericIndex >= 0 &&
        numericIndex < options.length
    ) {

        return String(
            options[
                numericIndex
            ]
        );

    }


    /* -------------------------------------------------
       ALREADY STORED AS ANSWER TEXT
    ------------------------------------------------- */

    return value;

}


/* =========================================================
   FORMAT RICH TEXT

   Allows ONLY the formatting tags we intentionally use
   for mathematical/scientific notation.

   Examples:

   394<sub>4</sub>

   x<sup>2</sup>

   H<sub>2</sub>O

   CO<sub>2</sub>

   E = mc<sup>2</sup>
========================================================= */

function formatRichText(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    let text =
        String(
            value
        );


    /* -------------------------------------------------
       First escape everything
    ------------------------------------------------- */

    text =
        escapeHtml(
            text
        );


    /* -------------------------------------------------
       Restore only safe formatting tags
    ------------------------------------------------- */

    text =
        text
            .replace(
                /&lt;sub&gt;/gi,
                "<sub>"
            )
            .replace(
                /&lt;\/sub&gt;/gi,
                "</sub>"
            )
            .replace(
                /&lt;sup&gt;/gi,
                "<sup>"
            )
            .replace(
                /&lt;\/sup&gt;/gi,
                "</sup>"
            )
            .replace(
                /&lt;br\s*\/?&gt;/gi,
                "<br>"
            )
            .replace(
                /&lt;b&gt;/gi,
                "<b>"
            )
            .replace(
                /&lt;\/b&gt;/gi,
                "</b>"
            )
            .replace(
                /&lt;i&gt;/gi,
                "<i>"
            )
            .replace(
                /&lt;\/i&gt;/gi,
                "</i>"
            )
            .replace(
                /&lt;u&gt;/gi,
                "<u>"
            )
            .replace(
                /&lt;\/u&gt;/gi,
                "</u>"
            );


    /* -------------------------------------------------
       Restore non-breaking spaces
    ------------------------------------------------- */

    text =
        text.replace(
            /&amp;nbsp;/gi,
            "&nbsp;"
        );


    return text;

}


/* =========================================================
   CLOSE RESULT MODAL
========================================================= */

function closeResultModal() {

    if (
        resultModal
    ) {

        resultModal.classList.remove(
            "active"
        );

    }


    document.body.style.overflow =
        "";

}


/* =========================================================
   BACK TO DASHBOARD
========================================================= */

function goBackToDashboard() {

    window.location.href =
        "teacher.html";

}


/* =========================================================
   PERFORMANCE
========================================================= */

function getPerformance(
    percentage
) {

    const value =
        Number(
            percentage
        ) || 0;


    if (
        value >= 80
    ) {

        return {

            label:
                "Excellent",

            className:
                "performance-excellent"

        };

    }


    if (
        value >= 70
    ) {

        return {

            label:
                "Very Good",

            className:
                "performance-very-good"

        };

    }


    if (
        value >= 60
    ) {

        return {

            label:
                "Good",

            className:
                "performance-good"

        };

    }


    if (
        value >= 50
    ) {

        return {

            label:
                "Fair",

            className:
                "performance-fair"

        };

    }


    return {

        label:
            "Needs Improvement",

        className:
            "performance-needs"

    };

}


/* =========================================================
   GET INITIALS
========================================================= */

function getInitials(
    name
) {

    const parts =
        String(
            name ||
            "Student"
        )
            .trim()
            .split(
                /\s+/
            );


    if (
        parts.length === 1
    ) {

        return parts[0]
            .substring(
                0,
                2
            )
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[
            parts.length - 1
        ][0]
    )
        .toUpperCase();

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
    date
) {

    if (
        !date
    ) {

        return "-";

    }


    const parsedDate =
        new Date(
            date
        );


    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {

        return "-";

    }


    return parsedDate.toLocaleString(
        "en-NG",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
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


/* =========================================================
   LOADING STATE
========================================================= */

function showLoading() {

    if (
        loadingState
    ) {

        loadingState.style.display =
            "block";

    }


    if (
        emptyState
    ) {

        emptyState.style.display =
            "none";

    }

}


function hideLoading() {

    if (
        loadingState
    ) {

        loadingState.style.display =
            "none";

    }

}


/* =========================================================
   EMPTY STATE
========================================================= */

function showEmpty() {

    hideLoading();


    if (
        emptyState
    ) {

        emptyState.style.display =
            "block";

    }

}


function hideEmpty() {

    hideLoading();


    if (
        emptyState
    ) {

        emptyState.style.display =
            "none";

    }

}


/* =========================================================
   ESC KEY CLOSES MODAL
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            closeResultModal();

        }

    }
);


/* =========================================================
   CLICK OUTSIDE MODAL TO CLOSE
========================================================= */

if (
    resultModal
) {

    resultModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                resultModal
            ) {

                closeResultModal();

            }

        }
    );

}