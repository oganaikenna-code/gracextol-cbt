/* =========================================
   GRACEXTOL CBT
   STUDENT EXAMINATION PORTAL
   ACCESS CODE VERSION
========================================= */


/* =========================================
   DATE & TIME
========================================= */

function updateDateTime() {

    const now = new Date();

    const dateElement =
        document.getElementById("currentDate");

    const timeElement =
        document.getElementById("currentTime");


    /* -----------------------------------------
       DATE
    ----------------------------------------- */

    if (dateElement) {

        dateElement.textContent =
            now.toLocaleDateString(
                "en-US",
                {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                }
            );

    }


    /* -----------------------------------------
       TIME
    ----------------------------------------- */

    if (timeElement) {

        timeElement.textContent =
            now.toLocaleTimeString(
                "en-US",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

    }

}


/* =========================================
   START DATE / TIME
========================================= */

updateDateTime();

setInterval(
    updateDateTime,
    1000
);


/* =========================================
   ELEMENTS
========================================= */

const startForm =
    document.getElementById("startForm");


const studentNameInput =
    document.getElementById("studentName");


const accessCodeInput =
    document.getElementById("accessCode");


const examPreview =
    document.getElementById("examPreview");


const previewExamTitle =
    document.getElementById("previewExamTitle");


const previewExamDetails =
    document.getElementById("previewExamDetails");


const startMessage =
    document.getElementById("startMessage");


const startExamBtn =
    document.getElementById("startExamBtn");


/* =========================================
   VERIFIED EXAM
========================================= */

/*
   This variable holds the examination
   after Supabase successfully verifies
   the student's access code.
*/

let verifiedExam = null;


/* =========================================
   CHECK SUPABASE
========================================= */

if (
    typeof supabaseClient ===
    "undefined"
) {

    console.error(
        "Gracextol Supabase client is not available."
    );

}


/* =========================================
   SHOW STATUS MESSAGE
========================================= */

function showMessage(
    message,
    type = "error"
) {

    if (!startMessage) {
        return;
    }


    startMessage.textContent =
        message;


    /* -----------------------------------------
       ERROR
    ----------------------------------------- */

    if (type === "error") {

        startMessage.style.color =
            "#dc2626";

    }


    /* -----------------------------------------
       SUCCESS
    ----------------------------------------- */

    else if (type === "success") {

        startMessage.style.color =
            "#16a34a";

    }


    /* -----------------------------------------
       INFO
    ----------------------------------------- */

    else {

        startMessage.style.color =
            "#7c3aed";

    }

}


/* =========================================
   CLEAR STATUS MESSAGE
========================================= */

function clearMessage() {

    if (startMessage) {

        startMessage.textContent =
            "";

    }

}


/* =========================================
   RESET EXAM PREVIEW
========================================= */

function resetExamPreview() {

    verifiedExam =
        null;


    if (examPreview) {

        examPreview.style.display =
            "none";

    }


    if (previewExamTitle) {

        previewExamTitle.textContent =
            "Examination";

    }


    if (previewExamDetails) {

        previewExamDetails.textContent =
            "--";

    }


    if (startExamBtn) {

        startExamBtn.innerHTML = `

            <span>

                <i class="fa-solid fa-play"></i>

            </span>

            Verify Examination

            <i class="fa-solid fa-arrow-right"></i>

        `;

    }

}


/* =========================================
   FORMAT ACCESS CODE
========================================= */

function normalizeAccessCode(
    value
) {

    return String(value || "")
        .trim()
        .toUpperCase();

}


/* =========================================
   DISPLAY EXAM PREVIEW
========================================= */

function displayExamPreview(
    exam
) {

    if (!exam) {
        return;
    }


    /* -----------------------------------------
       EXAM TITLE
    ----------------------------------------- */

    if (previewExamTitle) {

        previewExamTitle.textContent =
            exam.title ||
            "Examination";

    }


    /* -----------------------------------------
       EXAM DETAILS
    ----------------------------------------- */

    if (previewExamDetails) {

        const details = [];


        if (exam.subject) {

            details.push(
                exam.subject
            );

        }


        if (exam.class_level) {

            details.push(
                exam.class_level
            );

        }


        if (
            exam.question_count !== null &&
            exam.question_count !== undefined
        ) {

            details.push(
                `${exam.question_count} Questions`
            );

        }


        if (exam.duration) {

            details.push(
                `${exam.duration} Minutes`
            );

        }


        previewExamDetails.textContent =
            details.length > 0
                ? details.join(" • ")
                : "Examination verified";

    }


    /* -----------------------------------------
       SHOW PREVIEW
    ----------------------------------------- */

    if (examPreview) {

        examPreview.style.display =
            "flex";

    }

}


/* =========================================
   VERIFY EXAMINATION ACCESS CODE
========================================= */

async function verifyExamination(
    accessCode
) {

    /* -----------------------------------------
       CHECK SUPABASE
    ----------------------------------------- */

    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        showMessage(
            "Unable to connect to the examination system.",
            "error"
        );

        return null;

    }


    /* -----------------------------------------
       NORMALIZE CODE
    ----------------------------------------- */

    const normalizedCode =
        normalizeAccessCode(
            accessCode
        );


    /* -----------------------------------------
       VALIDATE CODE
    ----------------------------------------- */

    if (!normalizedCode) {

        showMessage(
            "Please enter your examination access code.",
            "error"
        );

        if (accessCodeInput) {

            accessCodeInput.focus();

        }

        return null;

    }


    /* -----------------------------------------
       SHOW LOADING STATE
    ----------------------------------------- */

    showMessage(
        "Verifying examination access code...",
        "info"
    );


    if (startExamBtn) {

        startExamBtn.disabled =
            true;

        startExamBtn.innerHTML = `

            <span>

                <i class="fa-solid fa-spinner fa-spin"></i>

            </span>

            Verifying...

        `;

    }


    try {

        /* -----------------------------------------
           SEARCH SUPABASE EXAMS TABLE
        ----------------------------------------- */

        const {
            data: exam,
            error
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
                    instructions,
                    shuffle_questions,
                    show_result,
                    status,
                    published,
                    published_at,
                    access_code,
                    created_at
                `)
                .eq(
                    "access_code",
                    normalizedCode
                )
                .eq(
                    "published",
                    true
                )
                .eq(
                    "status",
                    "published"
                )
                .maybeSingle();


        /* -----------------------------------------
           HANDLE SUPABASE ERROR
        ----------------------------------------- */

        if (error) {

            console.error(
                "Examination verification error:",
                error
            );


            showMessage(
                "Unable to verify the examination. Please try again.",
                "error"
            );


            return null;

        }


        /* -----------------------------------------
           CODE NOT FOUND
        ----------------------------------------- */

        if (!exam) {

            resetExamPreview();


            showMessage(
                "Invalid or unavailable examination access code.",
                "error"
            );


            if (accessCodeInput) {

                accessCodeInput.focus();

                accessCodeInput.classList.add(
                    "input-error"
                );

            }


            return null;

        }


        /* -----------------------------------------
           REMOVE ERROR STYLE
        ----------------------------------------- */

        if (accessCodeInput) {

            accessCodeInput.classList.remove(
                "input-error"
            );

            accessCodeInput.classList.add(
                "input-success"
            );

        }


        /* -----------------------------------------
           SAVE VERIFIED EXAM
        ----------------------------------------- */

        verifiedExam =
            exam;


        /* -----------------------------------------
           DISPLAY EXAM
        ----------------------------------------- */

        displayExamPreview(
            exam
        );


        /* -----------------------------------------
           SUCCESS MESSAGE
        ----------------------------------------- */

        showMessage(
            "Examination verified successfully. You can now start.",
            "success"
        );


        /* -----------------------------------------
           CHANGE BUTTON
        ----------------------------------------- */

        if (startExamBtn) {

            startExamBtn.disabled =
                false;

            startExamBtn.innerHTML = `

                <span>

                    <i class="fa-solid fa-play"></i>

                </span>

                Start Examination

                <i class="fa-solid fa-arrow-right"></i>

            `;

        }


        return exam;


    } catch (error) {

        console.error(
            "Unexpected examination verification error:",
            error
        );


        showMessage(
            "Something went wrong while verifying the examination.",
            "error"
        );


        return null;


    } finally {

        /*
           If verification failed, restore
           the normal button.
        */

        if (
            startExamBtn &&
            !verifiedExam
        ) {

            startExamBtn.disabled =
                false;

            startExamBtn.innerHTML = `

                <span>

                    <i class="fa-solid fa-play"></i>

                </span>

                Verify Examination

                <i class="fa-solid fa-arrow-right"></i>

            `;

        }

    }

}


/* =========================================
   SAVE STUDENT EXAM SESSION
========================================= */

function saveStudentExamSession(
    studentName,
    exam
) {

    const startedAt =
        new Date();

    const durationMinutes =
        Number(
            exam.duration
        ) > 0
            ? Number(
                exam.duration
            )
            : 30;

    const endAt =
        new Date(
            startedAt.getTime() +
            durationMinutes * 60 * 1000
        ).toISOString();

    const sessionId =
        window.crypto &&
        typeof window.crypto.randomUUID ===
        "function"
            ? window.crypto.randomUUID()
            : `exam-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    /* -----------------------------------------
       BASIC STUDENT INFORMATION
    ----------------------------------------- */

    localStorage.setItem(
        "studentName",
        studentName
    );


    /* -----------------------------------------
       SAVE EXAM ID
    ----------------------------------------- */

    localStorage.setItem(
        "selectedExamId",
        exam.id
    );


    /* -----------------------------------------
       SAVE ACCESS CODE
    ----------------------------------------- */

    localStorage.setItem(
        "examAccessCode",
        exam.access_code || ""
    );


    /* -----------------------------------------
       SAVE SELECTED EXAM
    ----------------------------------------- */

    localStorage.setItem(
        "selectedExam",
        JSON.stringify(
            exam
        )
    );


    /* -----------------------------------------
       SAVE STUDENT EXAM SESSION
    ----------------------------------------- */

    const studentExamSession = {

        studentName:
            studentName,

        classLevel:
            exam.class_level || "",

        examId:
            exam.id,

        examTitle:
            exam.title,

        subject:
            exam.subject || "",

        duration:
            exam.duration || 0,

        questionCount:
            exam.question_count || 0,

        instructions:
            exam.instructions || "",

        shuffleQuestions:
            exam.shuffle_questions || false,

        showResult:
            exam.show_result !== false,

        /* IMPORTANT:
           exam.js expects examAccessCode
        */

        examAccessCode:
            exam.access_code || "",

        startedAt:
            startedAt.toISOString(),

        endAt:
            endAt,

        sessionId:
            sessionId

    };


    localStorage.setItem(
        "studentExamSession",
        JSON.stringify(
            studentExamSession
        )
    );


    localStorage.setItem(
        "gracextolActiveExamAttempt",
        JSON.stringify({

            sessionId:
                sessionId,

            examId:
                exam.id,

            studentName:
                studentName,

            startedAt:
                startedAt.toISOString(),

            endAt:
                endAt,

            currentQuestion:
                0,

            answers:
                [],

            lastSavedAt:
                new Date().toISOString()

        })
    );

}


/* =========================================
   START EXAMINATION
========================================= */

function startExamination() {

    /* -----------------------------------------
       CHECK VERIFIED EXAM
    ----------------------------------------- */

    if (!verifiedExam) {

        showMessage(
            "Please verify your examination access code first.",
            "error"
        );

        return;

    }


    /* -----------------------------------------
       GET STUDENT NAME
    ----------------------------------------- */

    const studentName =
        studentNameInput
            ? studentNameInput.value.trim()
            : "";


    /* -----------------------------------------
       VALIDATE STUDENT NAME
    ----------------------------------------- */

    if (!studentName) {

        showMessage(
            "Please enter your full name before starting.",
            "error"
        );


        if (studentNameInput) {

            studentNameInput.focus();

        }


        return;

    }


    /* -----------------------------------------
       SAVE SESSION
    ----------------------------------------- */

    saveStudentExamSession(
        studentName,
        verifiedExam
    );


    /* -----------------------------------------
       MOVE TO EXAMINATION
    ----------------------------------------- */

    window.location.href =
        "exam.html";

}


/* =========================================
   FORM SUBMISSION
========================================= */

if (startForm) {

    startForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            /* -------------------------------------
               GET STUDENT NAME
            ------------------------------------- */

            const studentName =
                studentNameInput
                    ? studentNameInput.value.trim()
                    : "";


            /* -------------------------------------
               VALIDATE STUDENT NAME
            ------------------------------------- */

            if (!studentName) {

                showMessage(
                    "Please enter your full name.",
                    "error"
                );


                if (studentNameInput) {

                    studentNameInput.focus();

                }


                return;

            }


            /* -------------------------------------
               IF EXAM IS ALREADY VERIFIED
               START THE EXAM
            ------------------------------------- */

            if (verifiedExam) {

                startExamination();

                return;

            }


            /* -------------------------------------
               GET ACCESS CODE
            ------------------------------------- */

            const accessCode =
                accessCodeInput
                    ? accessCodeInput.value
                    : "";


            /* -------------------------------------
               VERIFY ACCESS CODE
            ------------------------------------- */

            await verifyExamination(
                accessCode
            );

        }
    );

}


/* =========================================
   ACCESS CODE INPUT
========================================= */

if (accessCodeInput) {

    /* -----------------------------------------
       FORCE UPPERCASE
    ----------------------------------------- */

    accessCodeInput.addEventListener(
        "input",
        function () {

            this.value =
                this.value
                    .toUpperCase();

            /*
               If the student changes the code
               after successful verification,
               the previous verification becomes
               invalid.
            */

            if (verifiedExam) {

                resetExamPreview();

                clearMessage();

            }


            this.classList.remove(
                "input-error"
            );

            this.classList.remove(
                "input-success"
            );

        }
    );


    /* -----------------------------------------
       ENTER KEY
    ----------------------------------------- */

    accessCodeInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                if (startForm) {

                    startForm.requestSubmit();

                }

            }

        }
    );

}


/* =========================================
   STUDENT NAME INPUT
========================================= */

if (studentNameInput) {

    studentNameInput.addEventListener(
        "input",
        function () {

            this.classList.remove(
                "input-error"
            );

        }
    );

}


/* =========================================
   INITIALIZE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Gracextol Student Examination Portal loaded."
        );


        /*
           No examinations are loaded
           automatically.

           Students must provide the unique
           access code given by their teacher.
        */

        verifiedExam =
            null;


        /*
           Make sure the preview starts hidden.
        */

        if (examPreview) {

            examPreview.style.display =
                "none";

        }


        /*
           Set initial button text.
        */

        if (startExamBtn) {

            startExamBtn.disabled =
                false;

            startExamBtn.innerHTML = `

                <span>

                    <i class="fa-solid fa-play"></i>

                </span>

                Verify Examination

                <i class="fa-solid fa-arrow-right"></i>

            `;

        }

    }
);