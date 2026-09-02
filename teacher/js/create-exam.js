/* =========================================
   GRACEXTOL CBT
   CREATE EXAMINATION JAVASCRIPT
   SUPABASE VERSION
========================================= */


/* =========================================
   GET FORM
========================================= */

const examDetailsForm =
    document.getElementById("examDetailsForm");


/* =========================================
   CHECK FORM
========================================= */

if (examDetailsForm) {

    examDetailsForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            /* =====================================
               CHECK TEACHER
            ===================================== */

            if (
                !window.currentTeacher ||
                !window.currentTeacher.authId
            ) {

                alert(
                    "Your teacher session could not be verified. Please sign in again."
                );

                window.location.href =
                    "login.html";

                return;

            }


            const teacherAuthId =
                window.currentTeacher.authId;


            /* =====================================
               GET EXAM DETAILS
            ===================================== */

            const examTitle =
                document
                    .getElementById("examTitle")
                    .value
                    .trim();


            const subject =
                document
                    .getElementById("subject")
                    .value
                    .trim();


            const classLevel =
                document
                    .getElementById("classLevel")
                    .value
                    .trim();


            const duration =
                document
                    .getElementById("duration")
                    .value;


            const questionCount =
                document
                    .getElementById("questionCount")
                    .value;


            const instructions =
                document
                    .getElementById("instructions")
                    .value
                    .trim();


            /* =====================================
               EXAMINATION SETTINGS
            ===================================== */

            const shuffleQuestions =
                document
                    .getElementById("shuffleQuestions")
                    .checked;


            const showResult =
                document
                    .getElementById("showResult")
                    .checked;


            const allowRetake =
                document
                    .getElementById("allowRetake")
                    .checked;


            /* =====================================
               VALIDATION
            ===================================== */

            if (
                !examTitle ||
                !subject ||
                !classLevel ||
                !duration ||
                !questionCount
            ) {

                alert(
                    "Please complete all required examination details."
                );

                return;

            }


            /* =====================================
               PREVENT DOUBLE SUBMISSION
            ===================================== */

            const submitButton =
                examDetailsForm.querySelector(
                    'button[type="submit"]'
                );


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Creating...';

            }


            try {

                /* =====================================
                   INSERT EXAM INTO SUPABASE
                ===================================== */

                const {
                    data: exam,
                    error
                } =
                    await supabaseClient
                        .from("exams")
                        .insert({

                            title:
                                examTitle,

                            subject:
                                subject,

                            class_level:
                                classLevel,

                            question_count:
                                Number(
                                    questionCount
                                ),

                            duration:
                                Number(
                                    duration
                                ),

                            instructions:
                                instructions,

                            /* =========================
                               EXAM SETTINGS
                            ========================= */

                            shuffle_questions:
                                shuffleQuestions,

                            show_result:
                                showResult,

                            allow_retake:
                                allowRetake,

                            /* =========================
                               TEACHER OWNERSHIP
                            ========================= */

                            created_by:
                                teacherAuthId

                        })
                        .select()
                        .single();


                /* =====================================
                   HANDLE ERROR
                ===================================== */

                if (error) {

                    console.error(
                        "Supabase exam creation error:",
                        error.message,
                        error.details,
                        error.hint,
                        error.code
                    );

                    alert(
                        "Unable to create examination. Please try again."
                    );


                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.innerHTML =
                            'Continue to Questions <i class="fa-solid fa-arrow-right"></i>';

                    }

                    return;

                }


                /* =====================================
                   SAVE SUPABASE EXAM DATA
                ===================================== */

                const examData = {

                    id:
                        exam.id,

                    title:
                        exam.title,

                    subject:
                        exam.subject,

                    classLevel:
                        exam.class_level,

                    duration:
                        exam.duration,

                    questionCount:
                        exam.question_count,

                    instructions:
                        exam.instructions,

                    /* =========================
                       EXAM SETTINGS
                    ========================= */

                    shuffleQuestions:
                        exam.shuffle_questions,

                    showResult:
                        exam.show_result,

                    allowRetake:
                        exam.allow_retake,

                    /* =========================
                       TEACHER INFORMATION
                    ========================= */

                    createdBy:
                        exam.created_by,

                    /* =========================
                       ACCESS CODE
                    ========================= */

                    accessCode:
                        exam.access_code,

                    questions:
                        [],

                    createdAt:
                        exam.created_at

                };


                /* =====================================
                   SAVE CURRENT EXAM LOCALLY
                   FOR PAGE-TO-PAGE ACCESS
                ===================================== */

                localStorage.setItem(
                    "currentExam",
                    JSON.stringify(
                        examData
                    )
                );


                localStorage.setItem(
                    "gracextolExam",
                    JSON.stringify(
                        examData
                    )
                );


                /* =====================================
                   SAVE BASIC INFORMATION
                   FOR EXISTING UI
                ===================================== */

                localStorage.setItem(
                    "examName",
                    examTitle
                );


                localStorage.setItem(
                    "examSubject",
                    subject
                );


                localStorage.setItem(
                    "examClass",
                    classLevel
                );


                localStorage.setItem(
                    "examDuration",
                    duration
                );


                localStorage.setItem(
                    "plannedQuestions",
                    questionCount
                );


                /* =====================================
                   SAVE EXAM SETTINGS LOCALLY
                ===================================== */

                localStorage.setItem(
                    "shuffleQuestions",
                    String(
                        shuffleQuestions
                    )
                );


                localStorage.setItem(
                    "showResult",
                    String(
                        showResult
                    )
                );


                localStorage.setItem(
                    "allowRetake",
                    String(
                        allowRetake
                    )
                );


                /* =====================================
                   CONSOLE CONFIRMATION
                ===================================== */

                console.log(
                    "Examination created successfully:",
                    examData
                );


                console.log(
                    "Shuffle Questions:",
                    shuffleQuestions
                );


                console.log(
                    "Show Result:",
                    showResult
                );


                console.log(
                    "Allow Retake:",
                    allowRetake
                );


                /* =====================================
                   MOVE TO QUESTION BUILDER
                ===================================== */

                window.location.href =
                    "questions.html";


            } catch (error) {

                console.error(
                    "Unexpected error creating examination:",
                    error
                );


                alert(
                    "Something went wrong while creating the examination."
                );


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.innerHTML =
                        'Continue to Questions <i class="fa-solid fa-arrow-right"></i>';

                }

            }

        }
    );

}