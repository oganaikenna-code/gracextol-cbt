/* =========================================================
   GRACEXTOL CBT
   STUDENT JOIN EXAMINATION
   JOIN LINK / ACCESS CODE VERSION

   URL:
   /student/pages/join.html?gc=ACCESS_CODE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        /* =====================================================
           ELEMENTS
        ===================================================== */

        const joinForm =
            document.getElementById("joinForm");

        const studentNameInput =
            document.getElementById("studentName");

        const startExamBtn =
            document.getElementById("startExamBtn");

        const joinMessage =
            document.getElementById("joinMessage");

        const examPreview =
            document.getElementById("examPreview");

        const examTitle =
            document.getElementById("examTitle");

        const examDetails =
            document.getElementById("examDetails");


        /* =====================================================
           VERIFIED EXAM
        ===================================================== */

        let verifiedExam = null;


        /* =====================================================
           SHOW MESSAGE
        ===================================================== */

        function showMessage(
            message,
            type = "error"
        ) {

            if (!joinMessage) {
                return;
            }

            joinMessage.textContent =
                message;


            if (type === "success") {

                joinMessage.style.color =
                    "#15803d";

            }

            else if (type === "info") {

                joinMessage.style.color =
                    "#7c3aed";

            }

            else {

                joinMessage.style.color =
                    "#dc2626";

            }

        }


        /* =====================================================
           CHECK SUPABASE
        ===================================================== */

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            console.error(
                "Gracextol Supabase client is not available."
            );

            showMessage(
                "Unable to connect to the examination system."
            );

            return;
        }


        /* =====================================================
           GET JOIN CODE FROM URL
           
           Example:
           ?gc=583214
        ===================================================== */

        const urlParams =
            new URLSearchParams(
                window.location.search
            );


        const accessCode =
            (
                urlParams.get("gc") ||
                ""
            )
                .trim()
                .toUpperCase();


        /* =====================================================
           INVALID LINK
        ===================================================== */

        if (!accessCode) {

            showMessage(
                "This examination link is incomplete or invalid."
            );


            if (startExamBtn) {

                startExamBtn.disabled =
                    true;

                startExamBtn.innerHTML = `
                    <i class="fa-solid fa-link-slash"></i>
                    Invalid Examination Link
                `;

            }

            return;
        }


        /* =====================================================
           SHOW VERIFYING MESSAGE
        ===================================================== */

        showMessage(
            "Verifying examination...",
            "info"
        );


        try {

            /* =================================================
               FETCH EXAMINATION
            ================================================= */
const {
    data: examData,
    error: examError
} =
    await supabaseClient.rpc(
        "get_exam_by_access_code",
        {
            p_access_code: accessCode
        }
    );

const exam =
    examData?.[0] || null;


            /* =================================================
               SUPABASE ERROR
            ================================================= */

            if (examError) {

                console.error(
                    "Join examination lookup error:",
                    examError
                );


                showMessage(
                    "Unable to verify this examination. Please try again."
                );


                return;
            }


            /* =================================================
               EXAMINATION NOT FOUND
            ================================================= */

            if (!exam) {

                showMessage(
                    "This examination link is invalid or the examination is no longer available."
                );


                if (startExamBtn) {

                    startExamBtn.disabled =
                        true;

                    startExamBtn.innerHTML = `
                        <i class="fa-solid fa-circle-xmark"></i>
                        Examination Unavailable
                    `;

                }

                return;
            }


            /* =================================================
               STORE VERIFIED EXAM
            ================================================= */

            verifiedExam =
                exam;


            console.log(
                "Verified examination:",
                exam
            );


            /* =================================================
               DISPLAY EXAMINATION PREVIEW
            ================================================= */

            if (examPreview) {

                /*
                 * Force the preview to become visible.
                 * !important in CSS cannot override this
                 * JavaScript inline display value unless
                 * CSS itself uses !important, so we also
                 * add the visible class below.
                 */

                examPreview.style.display =
                    "block";

                examPreview.style.visibility =
                    "visible";

                examPreview.style.opacity =
                    "1";

            }


            /* =================================================
               EXAMINATION TITLE
            ================================================= */

            if (examTitle) {

                examTitle.textContent =
                    exam.title ||
                    "Examination";

            }


            /* =================================================
               EXAMINATION DETAILS
            ================================================= */

            if (examDetails) {

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
                    exam.question_count !==
                    null
                    &&
                    exam.question_count !==
                    undefined
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


                examDetails.textContent =
                    details.length > 0
                        ? details.join(" • ")
                        : "Examination details available";


                console.log(
                    "Exam details displayed:",
                    examDetails.textContent
                );

            }


            /* =================================================
               ENABLE START BUTTON
            ================================================= */

            if (startExamBtn) {

                startExamBtn.disabled =
                    false;

                startExamBtn.innerHTML = `
                    <i class="fa-solid fa-play"></i>
                    Start Examination
                    <i class="fa-solid fa-arrow-right"></i>
                `;

            }


            /* =================================================
               SUCCESS MESSAGE
            ================================================= */

            showMessage(
                "Examination verified successfully. Enter your full name to continue.",
                "success"
            );


            /* =================================================
               FOCUS STUDENT NAME
            ================================================= */

            if (studentNameInput) {

                studentNameInput.focus();

            }


        }

        catch (error) {

            console.error(
                "Unexpected join examination error:",
                error
            );


            showMessage(
                "Something went wrong while verifying the examination."
            );

        }



        /* =====================================================
           FORM SUBMISSION
        ===================================================== */

        if (joinForm) {

            joinForm.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();


                    /* =============================================
                       EXAM MUST BE VERIFIED
                    ============================================== */

                    if (!verifiedExam) {

                        showMessage(
                            "This examination could not be verified."
                        );

                        return;
                    }


                    /* =============================================
                       GET STUDENT NAME
                    ============================================== */

                    const studentName =
                        studentNameInput
                            ? studentNameInput.value.trim()
                            : "";


                    /* =============================================
                       VALIDATE STUDENT NAME
                    ============================================== */

                    if (!studentName) {

                        showMessage(
                            "Please enter your full name."
                        );


                        if (studentNameInput) {

                            studentNameInput.focus();

                        }

                        return;
                    }


                    /* =============================================
                       SAVE STUDENT INFORMATION
                    ============================================== */

                    const startedAt =
                        new Date();

                    const durationMinutes =
                        Number(
                            verifiedExam.duration
                        ) > 0
                            ? Number(
                                verifiedExam.duration
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

                    localStorage.setItem(
                        "studentName",
                        studentName
                    );


                    localStorage.setItem(
                        "selectedExamId",
                        verifiedExam.id
                    );


                    localStorage.setItem(
                        "examAccessCode",
                        verifiedExam.access_code || accessCode
                    );


                    localStorage.setItem(
                        "selectedExam",
                        JSON.stringify(
                            verifiedExam
                        )
                    );


                    /* =============================================
                       CREATE STUDENT EXAM SESSION
                    ============================================== */

                    const studentExamSession = {

                        studentName:
                            studentName,

                        examId:
                            verifiedExam.id,

                        examAccessCode:
                            verifiedExam.access_code ||
                            accessCode,

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
                                verifiedExam.id,

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


                    /* =============================================
                       BUTTON STATE
                    ============================================== */

                    if (startExamBtn) {

                        startExamBtn.disabled =
                            true;

                        startExamBtn.innerHTML = `
                            <i class="fa-solid fa-spinner fa-spin"></i>
                            Starting Examination...
                        `;

                    }


                    /* =============================================
                       GO TO EXISTING EXAMINATION PAGE
                    ============================================== */

                    window.location.href =
                        "exam.html";

                }
            );

        }


        /* =====================================================
           STUDENT NAME INPUT
        ===================================================== */

        if (studentNameInput) {

            studentNameInput.addEventListener(
                "input",
                function () {

                    /*
                     * Keep typed text readable.
                     */

                    this.style.color =
                        "#17203f";

                    this.style.webkitTextFillColor =
                        "#17203f";

                }
            );

        }

    }
);
