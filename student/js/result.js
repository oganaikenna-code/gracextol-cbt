/* =========================================================
   GRACEXTOL CBT
   STUDENT RESULT PAGE
   RESULT + RETAKE CONTROLLED BY SUPABASE
========================================================= */


/* =========================================================
   IMMEDIATELY PREVENT RESULT FLASH
========================================================= */

document.documentElement.classList.add(
    "result-page-loading"
);


/* =========================================================
   GLOBAL DATA
========================================================= */

let completedExam = null;
let examData = null;


/* =========================================================
   GET HTML ELEMENTS
========================================================= */

const resultPage =
    document.querySelector(".result-page");

const studentNameElement =
    document.getElementById("studentName");

const percentageElement =
    document.getElementById("percentage");

const correctAnswersElement =
    document.getElementById("correctAnswers");

const totalQuestionsElement =
    document.getElementById("totalQuestions");

const performanceElement =
    document.getElementById("performance");

const performanceTitleElement =
    document.getElementById("performanceTitle");

const performanceMessageElement =
    document.getElementById("performanceMessage");

const resultMessageElement =
    document.querySelector(".result-message");

const scoreSection =
    document.querySelector(".score-section");

const performanceCard =
    document.querySelector(".performance-card");

const resultLabel =
    document.querySelector(".result-label");

const retakeButton =
    document.querySelector(".retake-btn");


/* =========================================================
   STUDENT SESSION
========================================================= */

const savedStudentName =
    localStorage.getItem("studentName");

const selectedExamId =
    localStorage.getItem("selectedExamId");


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "Gracextol Student Result Page Loaded."
        );

        await loadResultPage();

    }
);


/* =========================================================
   LOAD RESULT PAGE
========================================================= */

async function loadResultPage() {

    try {

        /* -----------------------------------------------
           LOAD COMPLETED EXAM
        ------------------------------------------------ */

        const savedCompletedExam =
            localStorage.getItem(
                "completedExam"
            );


        if (savedCompletedExam) {

            try {

                completedExam =
                    JSON.parse(
                        savedCompletedExam
                    );

            }

            catch (error) {

                console.error(
                    "Unable to parse completed exam:",
                    error
                );

            }

        }


        /* -----------------------------------------------
           DISPLAY STUDENT NAME
        ------------------------------------------------ */

        if (studentNameElement) {

            studentNameElement.textContent =
                savedStudentName ||
                completedExam?.studentName ||
                "Student";

        }


        /* -----------------------------------------------
           GET EXAM ID
        ------------------------------------------------ */

        const examId =
            selectedExamId ||
            completedExam?.examId;


        if (!examId) {

            console.warn(
                "No examination ID found."
            );

            showSubmissionOnly();

            hideRetakeButton();

            finishLoading();

            return;

        }


        /* -----------------------------------------------
           CHECK SUPABASE
        ------------------------------------------------ */

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            console.error(
                "Supabase client is not available."
            );

            showSubmissionOnly();

            hideRetakeButton();

            finishLoading();

            return;

        }


        /* -----------------------------------------------
           LOAD EXAM SETTINGS
        ------------------------------------------------ */

        const {
            data: exam,
            error: examError
        } =
            await supabaseClient

                .from("exams")

                .select(
                    "id, title, show_result, allow_retake"
                )

                .eq(
                    "id",
                    examId
                )

                .maybeSingle();


        /* -----------------------------------------------
           DATABASE ERROR
        ------------------------------------------------ */

        if (examError) {

            console.error(
                "Error loading exam settings:",
                examError
            );

            /*
               SECURITY-FIRST FALLBACK:
               Never expose result when
               exam settings cannot be verified.
            */

            showSubmissionOnly();

            hideRetakeButton();

            finishLoading();

            return;

        }


        /* -----------------------------------------------
           EXAM NOT FOUND
        ------------------------------------------------ */

        if (!exam) {

            console.warn(
                "Examination was not found."
            );

            showSubmissionOnly();

            hideRetakeButton();

            finishLoading();

            return;

        }


        /* -----------------------------------------------
           SAVE EXAM SETTINGS
        ------------------------------------------------ */

        examData =
            exam;


        console.log(
            "Exam settings:",
            examData
        );


        /* =================================================
           RESULT VISIBILITY
        ================================================= */

        if (
            examData.show_result === true
        ) {

            console.log(
                "SHOW RESULT = TRUE"
            );

            showFullResult();

        }

        else {

            console.log(
                "SHOW RESULT = FALSE"
            );

            showSubmissionOnly();

        }


        /* =================================================
           RETAKE VISIBILITY
        ================================================= */

        if (
            examData.allow_retake === true
        ) {

            console.log(
                "ALLOW RETAKE = TRUE"
            );

            showRetakeButton();

        }

        else {

            console.log(
                "ALLOW RETAKE = FALSE"
            );

            hideRetakeButton();

        }


        /* -----------------------------------------------
           FINISH LOADING
        ------------------------------------------------ */

        finishLoading();

    }


    catch (error) {

        console.error(
            "Unexpected result page error:",
            error
        );


        /*
           SECURITY-FIRST FALLBACK
        */

        showSubmissionOnly();

        hideRetakeButton();

        finishLoading();

    }

}


/* =========================================================
   SHOW FULL RESULT
========================================================= */

function showFullResult() {

    if (!completedExam) {

        showSubmissionOnly();

        return;

    }


    /* -----------------------------------------------
       SCORE
    ------------------------------------------------ */

    const score =
        Number(
            completedExam.score
        ) || 0;


    /* -----------------------------------------------
       TOTAL QUESTIONS
    ------------------------------------------------ */

    const total =
        Number(
            completedExam.totalQuestions
        ) || 0;


    /* -----------------------------------------------
       PERCENTAGE
    ------------------------------------------------ */

    let percentage =
        Number(
            completedExam.percentage
        );


    if (
        Number.isNaN(
            percentage
        )
    ) {

        percentage =
            total > 0
                ? Number(
                    (
                        (
                            score /
                            total
                        ) * 100
                    ).toFixed(2)
                )
                : 0;

    }


    /* -----------------------------------------------
       DISPLAY SCORE
    ------------------------------------------------ */

    if (percentageElement) {

        percentageElement.textContent =
            `${Number(
                percentage
            ).toString()}%`;

    }

const scoreCircle =
    document.querySelector(".score-circle");

if (scoreCircle) {

    scoreCircle.style.setProperty(
        "--score-progress",
        percentage * 3.6
    );

}
    if (correctAnswersElement) {

        correctAnswersElement.textContent =
            score;

    }


    if (totalQuestionsElement) {

        totalQuestionsElement.textContent =
            total;

    }


    /* -----------------------------------------------
       PERFORMANCE
    ------------------------------------------------ */

    const performance =
        getPerformance(
            percentage
        );


    if (performanceElement) {

        performanceElement.textContent =
            performance.label;

    }


    if (performanceTitleElement) {

        performanceTitleElement.textContent =
            performance.title;

    }


    if (performanceMessageElement) {

        performanceMessageElement.textContent =
            performance.message;

    }


    /* -----------------------------------------------
       MESSAGE
    ------------------------------------------------ */

    if (resultMessageElement) {

        resultMessageElement.textContent =
            "Your examination has been successfully submitted. Here is your performance summary.";

    }


    if (resultLabel) {

        resultLabel.textContent =
            "EXAMINATION COMPLETED";

    }


    /* -----------------------------------------------
       SHOW RESULT SECTIONS
    ------------------------------------------------ */

    if (scoreSection) {

        scoreSection.style.display =
            "";

    }


    if (performanceCard) {

        performanceCard.style.display =
            "";

    }

}


/* =========================================================
   SHOW SUBMISSION ONLY
========================================================= */

function showSubmissionOnly() {

    console.log(
        "Result hidden — showing submission confirmation."
    );


    /* -----------------------------------------------
       HIDE SCORE
    ------------------------------------------------ */

    if (scoreSection) {

        scoreSection.style.display =
            "none";

    }


    /* -----------------------------------------------
       HIDE PERFORMANCE
    ------------------------------------------------ */

    if (performanceCard) {

        performanceCard.style.display =
            "none";

    }


    /* -----------------------------------------------
       UPDATE LABEL
    ------------------------------------------------ */

    if (resultLabel) {

        resultLabel.textContent =
            "EXAMINATION SUBMITTED";

    }


    /* -----------------------------------------------
       UPDATE MESSAGE
    ------------------------------------------------ */

    if (resultMessageElement) {

        resultMessageElement.textContent =
            "Your examination has been successfully submitted. Your result will be made available by your teacher when it is released.";

    }

}


/* =========================================================
   SHOW RETAKE BUTTON
========================================================= */

function showRetakeButton() {

    if (!retakeButton) {

        return;

    }


    retakeButton.style.display =
        "flex";

}


/* =========================================================
   HIDE RETAKE BUTTON
========================================================= */

function hideRetakeButton() {

    if (!retakeButton) {

        return;

    }


    retakeButton.style.display =
        "none";

}


/* =========================================================
   FINISH LOADING
========================================================= */

function finishLoading() {

    /*
       Result has now been completely decided.
       Reveal the page only after Supabase
       settings have been applied.
    */

    document.documentElement.classList.remove(
        "result-page-loading"
    );


    if (resultPage) {

        resultPage.classList.remove(
            "result-loading"
        );

    }

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


    if (value >= 80) {

        return {

            label:
                "Excellent",

            title:
                "Excellent Work!",

            message:
                "Outstanding performance. Keep up the excellent work."

        };

    }


    if (value >= 70) {

        return {

            label:
                "Very Good",

            title:
                "Very Good!",

            message:
                "You performed very well. Keep working hard."

        };

    }


    if (value >= 60) {

        return {

            label:
                "Good",

            title:
                "Good Job!",

            message:
                "You did well. Keep learning and improving."

        };

    }


    if (value >= 50) {

        return {

            label:
                "Fair",

            title:
                "Fair Performance",

            message:
                "You have made a good start. Continue studying and improving."

        };

    }


    return {

        label:
            "Needs Improvement",

        title:
            "Keep Learning",

        message:
            "Don't give up. Review your work and keep improving."

    };

}


/* =========================================================
   RETAKE EXAM
========================================================= */

function retakeExam() {

    /*
       This function is only accessible through
       the visible button when allow_retake = true.
    */

    localStorage.removeItem(
        "examScore"
    );

    localStorage.removeItem(
        "totalQuestions"
    );

    localStorage.removeItem(
        "examPercentage"
    );

    localStorage.removeItem(
        "studentAnswers"
    );

    localStorage.removeItem(
        "completedExam"
    );


    localStorage.removeItem(
        "gracextolActiveExamAttempt"
    );


    localStorage.removeItem(
        "studentExamSession"
    );


    /*
       Keep selectedExamId so the student
       can take the same examination again.
    */

    window.location.href =
        "exam.html";

}


/* =========================================================
   GO HOME
========================================================= */

function goHome() {

    localStorage.removeItem(
        "examScore"
    );

    localStorage.removeItem(
        "totalQuestions"
    );

    localStorage.removeItem(
        "examPercentage"
    );

    localStorage.removeItem(
        "studentAnswers"
    );

    localStorage.removeItem(
        "completedExam"
    );


    localStorage.removeItem(
        "gracextolActiveExamAttempt"
    );

    localStorage.removeItem(
        "selectedExamId"
    );

    localStorage.removeItem(
        "selectedExam"
    );

    localStorage.removeItem(
        "examId"
    );

    localStorage.removeItem(
        "examTitle"
    );


    window.location.href =
        "index.html";

}