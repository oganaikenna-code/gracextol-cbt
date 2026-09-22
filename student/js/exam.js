/* =========================================================
   GRACEXTOL CBT
   STUDENT EXAMINATION JAVASCRIPT
   PRODUCTION VERSION

   Supports:
   - Multiple Choice
   - True / False
   - Fill in the Gap
   - Mathematical/scientific HTML formatting
   - Superscript / Subscript
   - question_options table
   - Server-side grading
========================================================= */


/* =========================================================
   EXAM VARIABLES
========================================================= */

let examData = null;

let questions = [];

let currentQuestion = 0;

let userAnswers = [];

let timeRemaining = 0;

let timer = null;

let examSubmitted = false;

const ACTIVE_EXAM_ATTEMPT_KEY =
    "gracextolActiveExamAttempt";

let activeExamAttempt = null;

let activeAttemptSaveTimeout = null;

let examModeActive = false;

let examModeListenersActive = false;

let lastIntegrityEventAt = 0;

let pendingVisibilityWarning = false;

let pendingFocusWarning = false;

let examModeWarningKind = "";

let examModeWarningTimeout = null;


/* =========================================================
   HTML ELEMENTS
========================================================= */

const questionNumber =
    document.getElementById("questionNumber");

const totalQuestions =
    document.getElementById("totalQuestions");

const questionText =
    document.getElementById("questionText");

const answersContainer =
    document.getElementById("answersContainer");

const progressFill =
    document.getElementById("progressFill");

const progressText =
    document.getElementById("progressText");

const previousBtn =
    document.getElementById("previousBtn");

const nextBtn =
    document.getElementById("nextBtn");

const timerDisplay =
    document.getElementById("timer");

const questionDots =
    document.getElementById("questionDots");

const submitBtn =
    document.getElementById("submitBtn");

const studentNameDisplay =
    document.getElementById("studentName");

const examTitleDisplay =
    document.getElementById("examTitle");

const questionLabel =
    document.getElementById("questionLabel");

const questionTypeDisplay =
    document.getElementById("questionType");

const examModeGate =
    document.getElementById("examModeGate");

const enterExamModeBtn =
    document.getElementById("enterExamModeBtn");

const continueWithoutFullscreenBtn =
    document.getElementById("continueWithoutFullscreenBtn");

const examModeGateMessage =
    document.getElementById("examModeGateMessage");

const examModeWarning =
    document.getElementById("examModeWarning");

const examModeWarningMessage =
    document.getElementById("examModeWarningMessage");

const returnFullscreenBtn =
    document.getElementById("returnFullscreenBtn");


/* =========================================================
   STUDENT INFORMATION
========================================================= */

const savedStudentName =
    (
        localStorage.getItem("studentName") ||
        ""
    ).trim();


/* =========================================================
   SELECTED EXAM
========================================================= */

const selectedExamId =
    localStorage.getItem("selectedExamId");


/* =========================================================
   ACTIVE EXAM ATTEMPT
========================================================= */

function createLocalSessionId() {

    return (
        window.crypto &&
        typeof window.crypto.randomUUID ===
        "function"
            ? window.crypto.randomUUID()
            : `exam-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
}


function readStudentExamSession() {

    try {

        const savedSession =
            localStorage.getItem(
                "studentExamSession"
            );


        return savedSession
            ? JSON.parse(savedSession)
            : null;

    } catch (error) {

        console.warn(
            "Unable to read student exam session:",
            error
        );

        return null;
    }
}


function initializeActiveExamAttempt() {

    const studentExamSession =
        readStudentExamSession() || {};

    let savedAttempt = null;

    try {

        const storedAttempt =
            localStorage.getItem(
                ACTIVE_EXAM_ATTEMPT_KEY
            );

        savedAttempt =
            storedAttempt
                ? JSON.parse(storedAttempt)
                : null;

    } catch (error) {

        console.warn(
            "Unable to read active examination attempt:",
            error
        );

        localStorage.removeItem(
            ACTIVE_EXAM_ATTEMPT_KEY
        );

        savedAttempt =
            null;
    }


    const currentSessionId =
        studentExamSession.sessionId ||
        "";


    const savedAttemptMatchesExam =
        Boolean(
            savedAttempt &&
            savedAttempt.examId ===
                selectedExamId
        );


    const savedAttemptMatchesSession =
        Boolean(
            savedAttemptMatchesExam &&
            currentSessionId &&
            savedAttempt.sessionId ===
                currentSessionId
        );


    /*
     * IMPORTANT:
     *
     * Only the exact same Join Exam session
     * is allowed to resume an old attempt.
     *
     * If the student joins the same examination
     * again, a new sessionId is created and the
     * previous attempt is discarded.
     */

    if (
        savedAttemptMatchesExam &&
        !savedAttemptMatchesSession
    ) {

        console.log(
            "[Exam Recovery] Old attempt belongs to a different session. Discarding stale attempt."
        );

        localStorage.removeItem(
            ACTIVE_EXAM_ATTEMPT_KEY
        );

        savedAttempt =
            null;
    }


    /*
     * SAME SESSION:
     *
     * Resume the existing attempt.
     *
     * If the attempt has already expired, keep
     * the expired attempt instead of creating a
     * new timer.
     */

    if (
        savedAttemptMatchesSession &&
        savedAttempt.startedAt &&
        savedAttempt.endAt
    ) {

        const savedEndTime =
            Date.parse(
                savedAttempt.endAt
            );


        activeExamAttempt =
            savedAttempt;


        ensureIntegrityState();


        if (
            Number.isFinite(
                savedEndTime
            ) &&
            savedEndTime >
                Date.now()
        ) {

            console.log(
                "[Exam Recovery] Resuming active examination attempt."
            );

        } else {

            console.log(
                "[Exam Recovery] Existing examination attempt has expired."
            );
        }


        return;
    }


    /*
     * NEW SESSION:
     *
     * Create a completely new examination
     * attempt using the current Join Exam session.
     */

    const startedAt =
        studentExamSession.startedAt ||
        new Date().toISOString();


    const durationMinutes =
        Number(
            examData.duration
        ) > 0
            ? Number(
                examData.duration
            )
            : 30;


    const calculatedEndAt =
        new Date(
            Date.parse(
                startedAt
            ) +
            durationMinutes *
            60 *
            1000
        ).toISOString();


    const endAt =
        studentExamSession.endAt ||
        calculatedEndAt;


    activeExamAttempt = {

        sessionId:
            currentSessionId ||
            createLocalSessionId(),

        examId:
            examData.id,

        studentName:
            savedStudentName,

        startedAt:
            startedAt,

        endAt:
            endAt,

        currentQuestion:
            0,

        answers:
            [],

        lastSavedAt:
            new Date().toISOString(),

        violations: {

            fullscreenExit:
                0,

            visibilityHidden:
                0,

            focusLost:
                0,

            total:
                0,

            events:
                []

        }

    };


    localStorage.setItem(
        ACTIVE_EXAM_ATTEMPT_KEY,
        JSON.stringify(
            activeExamAttempt
        )
    );


    console.log(
        "[Exam Recovery] New examination attempt created."
    );
}


function saveActiveExamAttempt() {

    if (
        !activeExamAttempt ||
        !examData ||
        examData.id !== selectedExamId
    ) {

        return;
    }


    activeExamAttempt.answers =
        userAnswers.slice();

    activeExamAttempt.currentQuestion =
        currentQuestion;

    activeExamAttempt.lastSavedAt =
        new Date().toISOString();


    localStorage.setItem(
        ACTIVE_EXAM_ATTEMPT_KEY,
        JSON.stringify(
            activeExamAttempt
        )
    );
}


function scheduleActiveExamAttemptSave() {

    if (activeAttemptSaveTimeout) {

        clearTimeout(
            activeAttemptSaveTimeout
        );
    }


    activeAttemptSaveTimeout =
        setTimeout(
            saveActiveExamAttempt,
            250
        );
}


function ensureIntegrityState() {

    if (
        !activeExamAttempt
    ) {

        return;
    }


    if (
        !activeExamAttempt.violations ||
        typeof activeExamAttempt.violations !==
        "object"
    ) {

        activeExamAttempt.violations = {

            fullscreenExit:
                0,

            visibilityHidden:
                0,

            focusLost:
                0,

            total:
                0,

            events:
                []

        };
    }


    activeExamAttempt.violations.events =
        Array.isArray(
            activeExamAttempt.violations.events
        )
            ? activeExamAttempt.violations.events
            : [];
}


function showExamModeWarning(
    message,
    kind,
    showFullscreenButton = false
) {

    if (
        !examModeWarning ||
        !examModeWarningMessage
    ) {

        return;
    }


    examModeWarningKind =
        kind ||
        "general";

    if (
        examModeWarningTimeout
    ) {

        clearTimeout(
            examModeWarningTimeout
        );
    }

    examModeWarningMessage.textContent =
        message;

    examModeWarning.hidden =
        false;


    if (
        returnFullscreenBtn
    ) {

        returnFullscreenBtn.hidden =
            !showFullscreenButton;
    }


    if (
        !showFullscreenButton
    ) {

        examModeWarningTimeout =
            setTimeout(
                hideExamModeWarning,
                8000
            );
    }
}


function hideExamModeWarning() {

    if (
        examModeWarning
    ) {

        examModeWarning.hidden =
            true;
    }

    examModeWarningKind =
        "";

    if (
        examModeWarningTimeout
    ) {

        clearTimeout(
            examModeWarningTimeout
        );

        examModeWarningTimeout =
            null;
    }
}


function recordIntegrityEvent(
    type
) {

    if (
        !examModeActive ||
        !activeExamAttempt
    ) {

        return;
    }


    const now =
        Date.now();

    const relatedInterruption =
        (
            type ===
            "visibility_hidden" ||
            type ===
            "focus_lost"
        ) &&
        now - lastIntegrityEventAt <
        1000;


    if (
        relatedInterruption
    ) {

        return;
    }


    ensureIntegrityState();


    if (
        type ===
        "fullscreen_exit"
    ) {

        activeExamAttempt.violations.fullscreenExit++;
    }

    else if (
        type ===
        "visibility_hidden"
    ) {

        activeExamAttempt.violations.visibilityHidden++;
    }

    else if (
        type ===
        "focus_lost"
    ) {

        activeExamAttempt.violations.focusLost++;
    }


    activeExamAttempt.violations.total++;

    activeExamAttempt.violations.events.push({

        type:
            type,

        timestamp:
            new Date(
                now
            ).toISOString()

    });

    lastIntegrityEventAt =
        now;

    saveActiveExamAttempt();

    console.log(
        "[Exam Mode] Integrity event saved:",
        type
    );
}


function requestExamFullscreen() {

    if (
        !document.fullscreenEnabled
    ) {

        console.warn(
            "[Exam Mode] Fullscreen unavailable: document.fullscreenEnabled is false."
        );

        return Promise.resolve(
            false
        );
    }


    if (
        !document.documentElement.requestFullscreen
    ) {

        console.warn(
            "[Exam Mode] Fullscreen unavailable: requestFullscreen is not supported."
        );

        return Promise.resolve(
            false
        );
    }


    return document.documentElement
        .requestFullscreen()
        .then(
            () => true
        )
        .catch(
            error => {

                console.warn(
                    "[Exam Mode] Fullscreen unavailable:",
                    error
                );

                return false;
            }
        );
}


function handleFullscreenChange() {

    if (
        !examModeActive
    ) {

        return;
    }


    if (
        document.fullscreenElement
    ) {

        if (
            examModeWarningKind ===
            "fullscreen"
        ) {

            hideExamModeWarning();
        }

        console.log(
            "[Exam Mode] Fullscreen entered"
        );

        return;
    }


    recordIntegrityEvent(
        "fullscreen_exit"
    );

    showExamModeWarning(
        "You have exited fullscreen. Please return to fullscreen to continue your examination.",
        "fullscreen",
        true
    );

    console.log(
        "[Exam Mode] Fullscreen exited"
    );
}


function handleVisibilityChange() {

    if (
        !examModeActive
    ) {

        return;
    }


    if (
        document.hidden
    ) {

        recordIntegrityEvent(
            "visibility_hidden"
        );

        pendingVisibilityWarning =
            true;

        saveActiveExamAttempt();

        console.log(
            "[Exam Mode] Visibility interruption"
        );

        return;
    }


    if (
        pendingVisibilityWarning
    ) {

        pendingVisibilityWarning =
            false;

        pendingFocusWarning =
            false;

        showExamModeWarning(
            "The examination page was temporarily hidden. Your examination has been saved. Please remain on the examination page.",
            "visibility"
        );
    }
}


function handleWindowBlur() {

    if (
        !examModeActive
    ) {

        return;
    }


    recordIntegrityEvent(
        "focus_lost"
    );

    pendingFocusWarning =
        true;

    saveActiveExamAttempt();

    console.log(
        "[Exam Mode] Focus lost"
    );
}


function handleWindowFocus() {

    if (
        !examModeActive
    ) {

        return;
    }


    if (
        pendingFocusWarning &&
        !document.hidden &&
        (
            !examModeWarning ||
            examModeWarning.hidden
        )
    ) {

        pendingFocusWarning =
            false;

        showExamModeWarning(
            "The examination window lost focus. Please remain on the examination page.",
            "focus"
        );
    }
}


function handleExamModePopState() {

    if (
        !examModeActive
    ) {

        return;
    }


    history.pushState(
        {
            gracextolExamMode:
                true
        },
        "",
        window.location.href
    );

    showExamModeWarning(
        "Your examination is still in progress. Please use the examination controls until you submit.",
        "navigation"
    );

    saveActiveExamAttempt();
}


function startExamMode() {

    if (
        examModeActive
    ) {

        return;
    }


    examModeActive =
        true;

    ensureIntegrityState();

    saveActiveExamAttempt();

    document.addEventListener(
        "fullscreenchange",
        handleFullscreenChange
    );

    document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
    );

    window.addEventListener(
        "blur",
        handleWindowBlur
    );

    window.addEventListener(
        "focus",
        handleWindowFocus
    );

    history.pushState(
        {
            gracextolExamMode:
                true
        },
        "",
        window.location.href
    );

    window.addEventListener(
        "popstate",
        handleExamModePopState
    );

    examModeListenersActive =
        true;

    console.log(
        "[Exam Mode] Started"
    );
}


function stopExamMode() {

    if (
        !examModeListenersActive
    ) {

        return;
    }


    document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
    );

    document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
    );

    window.removeEventListener(
        "blur",
        handleWindowBlur
    );

    window.removeEventListener(
        "focus",
        handleWindowFocus
    );

    window.removeEventListener(
        "popstate",
        handleExamModePopState
    );

    examModeListenersActive =
        false;

    examModeActive =
        false;

    pendingVisibilityWarning =
        false;

    pendingFocusWarning =
        false;

    hideExamModeWarning();

    if (
        document.fullscreenElement &&
        document.exitFullscreen
    ) {

        document.exitFullscreen()
            .catch(
                () => {}
            );
    }

    console.log(
        "[Exam Mode] Stopped"
    );
}


if (
    returnFullscreenBtn
) {

    returnFullscreenBtn.addEventListener(
        "click",
        function () {

            requestExamFullscreen();

        }
    );
}


function activateExamMode() {

    if (
        examModeGate
    ) {

        examModeGate.hidden =
            true;
    }


    displayQuestion();

    startExamMode();

    startTimer();
}


async function enterExamModeFromGate() {

    if (
        !enterExamModeBtn
    ) {

        return;
    }


    enterExamModeBtn.disabled =
        true;

    const fullscreenEntered =
        await requestExamFullscreen();


    if (
        fullscreenEntered
    ) {

        activateExamMode();

        return;
    }


    enterExamModeBtn.disabled =
        false;

    if (
        examModeGateMessage
    ) {

        examModeGateMessage.textContent =
            "Fullscreen could not be enabled. You can retry or continue without fullscreen.";
    }

    if (
        continueWithoutFullscreenBtn
    ) {

        continueWithoutFullscreenBtn.hidden =
            false;
    }
}


if (
    enterExamModeBtn
) {

    enterExamModeBtn.addEventListener(
        "click",
        enterExamModeFromGate
    );
}


if (
    continueWithoutFullscreenBtn
) {

    continueWithoutFullscreenBtn.addEventListener(
        "click",
        activateExamMode
    );
}


/* =========================================================
   CHECK EXAM ID
========================================================= */

if (!selectedExamId) {

    alert(
        "No examination was selected. Please enter your examination access code again."
    );

    window.location.href =
        "index.html";
}


/* =========================================================
   DISPLAY STUDENT NAME
========================================================= */

if (
    studentNameDisplay &&
    savedStudentName
) {

    studentNameDisplay.textContent =
        savedStudentName;
}


/* =========================================================
   SAFE RICH TEXT RENDERING
========================================================= */

function sanitizeRichText(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    const parser =
        new DOMParser();

    const documentFragment =
        parser.parseFromString(
            String(value),
            "text/html"
        );


    const allowedTags =
        new Set([
            "B",
            "STRONG",
            "I",
            "EM",
            "U",
            "S",
            "SUB",
            "SUP",
            "BR",
            "SPAN",
            "MARK",
            "SMALL"
        ]);


    function cleanNode(node) {

        if (
            node.nodeType ===
            Node.TEXT_NODE
        ) {

            return document.createTextNode(
                node.textContent
            );
        }


        if (
            node.nodeType !==
            Node.ELEMENT_NODE
        ) {

            return document.createTextNode(
                ""
            );
        }


        if (
            !allowedTags.has(
                node.tagName
            )
        ) {

            const fragment =
                document.createDocumentFragment();

            Array.from(
                node.childNodes
            ).forEach(
                child => {

                    fragment.appendChild(
                        cleanNode(child)
                    );

                }
            );

            return fragment;
        }


        const cleanElement =
            document.createElement(
                node.tagName.toLowerCase()
            );


        Array.from(
            node.childNodes
        ).forEach(
            child => {

                cleanElement.appendChild(
                    cleanNode(child)
                );

            }
        );


        return cleanElement;
    }


    const output =
        document.createElement(
            "div"
        );


    Array.from(
        documentFragment.body.childNodes
    ).forEach(
        node => {

            output.appendChild(
                cleanNode(node)
            );

        }
    );


    return output.innerHTML;
}


/* =========================================================
   LOAD EXAMINATION
========================================================= */

async function loadExamination() {

    try {

        console.log(
            "Loading examination:",
            selectedExamId
        );


        const studentExamSession =
            readStudentExamSession();

        const examAccessCode =
            studentExamSession?.examAccessCode ||
            "";


        if (!examAccessCode) {

            console.error(
                "Exam access code is missing."
            );

            alert(
                "Examination access information is missing. Please enter the examination access code again."
            );

            return;
        }


        const {
            data: exam,
            error: examError
        } =
            await supabaseClient
                .rpc(
                    "get_exam_for_student",
                    {
                        p_exam_id:
                            selectedExamId,

                        p_access_code:
                            examAccessCode
                    }
                );


        const examRecord =
            Array.isArray(exam)
                ? exam[0] || null
                : exam;


        if (examError) {

            console.error(
                "Exam loading error:",
                examError
            );

            alert(
                "Unable to load this examination."
            );

            return;
        }


        if (!examRecord) {

            console.error(
                "No examination found:",
                selectedExamId
            );

            alert(
                "This examination could not be found."
            );

            return;
        }


        examData =
            examRecord;


        console.log(
            "Correct examination loaded:",
            examData
        );


        if (
            examTitleDisplay
        ) {

            examTitleDisplay.textContent =
                examData.title ||
                "Examination";
        }


        await loadQuestions();

    } catch (error) {

        console.error(
            "Unexpected examination loading error:",
            error
        );

        alert(
            "Something went wrong while loading the examination."
        );
    }
}


/* =========================================================
   LOAD QUESTIONS SECURELY
========================================================= */

async function loadQuestions() {

    if (
        !examData
    ) {

        return;
    }


    try {

        console.log(
            "Loading questions securely for exam:",
            examData.id
        );


        const studentExamSession =
            readStudentExamSession() || {};

        const examAccessCode =
            studentExamSession.examAccessCode ||
            "";


        if (!examAccessCode) {

            console.error(
                "Exam access code is missing."
            );

            alert(
                "Examination access information is missing."
            );

            return;
        }


        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "get_student_exam_questions",
                {
                    p_exam_id:
                        examData.id,

                    p_access_code:
                        examAccessCode
                }
            );


        if (error) {

            console.error(
                "Question loading error:",
                error
            );

            alert(
                "Unable to load examination questions."
            );

            return;
        }


        if (
            !data ||
            data.length === 0
        ) {

            console.error(
                "No questions found for exam:",
                examData.id
            );

            alert(
                "This examination does not have any questions yet."
            );

            return;
        }


        /* =================================================
           GROUP RPC RESULTS BY QUESTION
        ================================================= */

        const questionsById = {};


        data.forEach(
            row => {

                if (
                    !questionsById[
                        row.question_id
                    ]
                ) {

                    questionsById[
                        row.question_id
                    ] = {

                        id:
                            row.question_id,

                        question_number:
                            row.question_number,

                        question_text:
                            row.question_text,

                        question_type:
                            row.question_type,

                        question_options:
                            []

                    };
                }


                /*
                 * IMPORTANT:
                 *
                 * Never add is_correct here.
                 */

                if (
                    row.option_label !== null &&
                    row.option_label !== undefined
                ) {

                    questionsById[
                        row.question_id
                    ]
                        .question_options
                        .push({

                            label:
                                row.option_label,

                            text:
                                row.option_text

                        });
                }

            }
        );


        questions =
            Object.values(
                questionsById
            ).sort(
                (
                    a,
                    b
                ) =>
                    Number(
                        a.question_number
                    ) -
                    Number(
                        b.question_number
                    )
            );


        console.log(
            "Questions loaded securely:",
            questions
        );


        /* =================================================
           TOTAL QUESTIONS
        ================================================= */

        if (
            totalQuestions
        ) {

            totalQuestions.textContent =
                questions.length;
        }


        /* =================================================
           CREATE / RESTORE ANSWER ARRAY
        ================================================= */

        initializeActiveExamAttempt();


        userAnswers =
            new Array(
                questions.length
            ).fill(null);


        if (
            Array.isArray(
                activeExamAttempt.answers
            )
        ) {

            activeExamAttempt.answers
                .slice(
                    0,
                    questions.length
                )
                .forEach(
                    (
                        answer,
                        index
                    ) => {

                        userAnswers[
                            index
                        ] =
                            answer;

                    }
                );
        }


        /* =================================================
           SET TIMER
        ================================================= */

        const duration =
            Number(
                examData.duration
            ) || 30;


        const endTime =
            Date.parse(
                activeExamAttempt.endAt
            );


        const remainingSeconds =
            Number.isFinite(
                endTime
            )
                ? Math.ceil(
                    (
                        endTime -
                        Date.now()
                    ) / 1000
                )
                : duration * 60;


        timeRemaining =
            Math.max(
                0,
                remainingSeconds
            );


        /* =================================================
           RESTORE CURRENT QUESTION
        ================================================= */

        const savedQuestion =
            Number(
                activeExamAttempt.currentQuestion
            );


        currentQuestion =
            Number.isInteger(
                savedQuestion
            ) &&
            savedQuestion >= 0 &&
            savedQuestion <
                questions.length
                ? savedQuestion
                : 0;


        saveActiveExamAttempt();


        if (
            examModeGate
        ) {

            examModeGate.hidden =
                false;
        }

    } catch (error) {

        console.error(
            "Unexpected question loading error:",
            error
        );

        alert(
            "Something went wrong while loading the questions."
        );
    }
}


/* =========================================================
   GET QUESTION TEXT
========================================================= */

function getQuestionText(
    question
) {

    return (
        question.question_text ||
        question.question ||
        question.text ||
        question.content ||
        "Question unavailable"
    );
}


/* =========================================================
   GET QUESTION TYPE
========================================================= */

function getQuestionType(
    question
) {

    const rawType =
        String(
            question.question_type ||
            question.type ||
            "multiple-choice"
        )
        .trim()
        .toLowerCase();


    /* =====================================================
       TRUE / FALSE
    ===================================================== */

    if (
        rawType === "true-false" ||
        rawType === "true_false" ||
        rawType === "true/false" ||
        rawType === "truefalse" ||
        rawType === "boolean"
    ) {

        return "true-false";
    }


    /* =====================================================
       FILL IN THE GAP
    ===================================================== */

    if (
        rawType === "fill-gap" ||
        rawType === "fill_gap" ||
        rawType === "fill-in-the-gap" ||
        rawType === "fill_in_the_gap" ||
        rawType === "fill-in-the-blank" ||
        rawType === "fill_in_the_blank" ||
        rawType === "fill-in" ||
        rawType === "fill_in" ||
        rawType === "fill" ||
        rawType === "short-answer" ||
        rawType === "short_answer" ||
        rawType === "short answer"
    ) {

        return "fill";
    }


    /* =====================================================
       MULTIPLE CHOICE
    ===================================================== */

    return "multiple";
}


/* =========================================================
   GET QUESTION OPTIONS
========================================================= */

function getQuestionOptions(
    question
) {

    /*
     * NEW SYSTEM:
     *
     * question_options table
     */

    if (
        Array.isArray(
            question.question_options
        ) &&
        question.question_options.length > 0
    ) {

        return question.question_options;
    }


    /*
     * OLD SYSTEM FALLBACK:
     *
     * questions.options
     */

    if (
        Array.isArray(
            question.options
        )
    ) {

        return question.options
            .filter(
                option =>
                    option !== null &&
                    option !== undefined &&
                    String(
                        option
                    ).trim() !== ""
            )
            .map(
                (
                    option,
                    index
                ) => {

                    return {

                        label:
                            String.fromCharCode(
                                65 + index
                            ),

                        text:
                            String(
                                option
                            )

                    };

                }
            );
    }


    return [];
}


/* =========================================================
   DISPLAY QUESTION
========================================================= */

function displayQuestion() {

    if (
        !questions.length
    ) {

        return;
    }


    const question =
        questions[
            currentQuestion
        ];


    if (!question) {

        return;
    }


    /* =====================================================
       QUESTION NUMBER
    ===================================================== */

    if (
        questionNumber
    ) {

        questionNumber.textContent =
            currentQuestion + 1;
    }


    /* =====================================================
       QUESTION LABEL
    ===================================================== */

    if (
        questionLabel
    ) {

        questionLabel.textContent =
            `Question ${currentQuestion + 1}`;
    }


    /* =====================================================
       QUESTION TEXT
    ===================================================== */

    if (
        questionText
    ) {

        questionText.innerHTML =
            sanitizeRichText(
                getQuestionText(
                    question
                )
            );
    }


    /* =====================================================
       CLEAR ANSWERS
    ===================================================== */

    if (
        answersContainer
    ) {

        answersContainer.innerHTML =
            "";
    }


    /* =====================================================
       QUESTION TYPE
    ===================================================== */

    const type =
        getQuestionType(
            question
        );


    if (
        questionTypeDisplay
    ) {

        if (
            type === "fill"
        ) {

            questionTypeDisplay.textContent =
                "Fill in the Gap";

        }

        else if (
            type === "true-false"
        ) {

            questionTypeDisplay.textContent =
                "True / False";

        }

        else {

            questionTypeDisplay.textContent =
                "Multiple Choice";
        }
    }


    /* =====================================================
       MULTIPLE CHOICE
    ===================================================== */

    if (
        type === "multiple"
    ) {

        renderMultipleChoice(
            question
        );
    }


    /* =====================================================
       TRUE / FALSE
    ===================================================== */

    else if (
        type === "true-false"
    ) {

        renderTrueFalse(
            question
        );
    }


    /* =====================================================
       FILL IN THE GAP
    ===================================================== */

    else if (
        type === "fill"
    ) {

        renderFillAnswer(
            question
        );
    }


    /* =====================================================
       UPDATE UI
    ===================================================== */

    updateProgress();

    updateNavigation();

    updateDots();
}


/* =========================================================
   NORMALIZE TEXT
========================================================= */

function normalizeText(
    value
) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            " "
        );
}


/* =========================================================
   RENDER MULTIPLE CHOICE
========================================================= */

function renderMultipleChoice(
    question
) {

    const options =
        getQuestionOptions(
            question
        );


    if (
        options.length === 0
    ) {

        const message =
            document.createElement(
                "p"
            );


        message.textContent =
            "No answer options are available for this question.";


        answersContainer.appendChild(
            message
        );


        return;
    }


    options.forEach(
        (
            option,
            index
        ) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "answer-option";


            /* =================================================
               OPTION LETTER
            ================================================= */

            const letter =
                document.createElement(
                    "span"
                );


            letter.className =
                "option-letter";


            letter.textContent =
                option.label ||
                String.fromCharCode(
                    65 + index
                );


            /* =================================================
               OPTION TEXT
            ================================================= */

            const text =
                document.createElement(
                    "span"
                );


            text.className =
                "option-text";


            text.innerHTML =
                sanitizeRichText(
                    option.text
                );


            button.appendChild(
                letter
            );


            button.appendChild(
                text
            );


            /* =================================================
               RESTORE ANSWER
            ================================================= */

            if (
                userAnswers[
                    currentQuestion
                ] !== null &&
                normalizeText(
                    userAnswers[
                        currentQuestion
                    ]
                ) ===
                normalizeText(
                    option.text
                )
            ) {

                button.classList.add(
                    "selected"
                );
            }


            /* =================================================
               SELECT ANSWER
            ================================================= */

            button.addEventListener(
                "click",
                function () {

                    selectAnswer(
                        option.text,
                        button
                    );

                }
            );


            answersContainer.appendChild(
                button
            );

        }
    );
}


/* =========================================================
   RENDER TRUE / FALSE
========================================================= */

function renderTrueFalse(
    question
) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "true-false-options";


    const values = [
        "True",
        "False"
    ];


    values.forEach(
        value => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "answer-option true-false-option";


            button.textContent =
                value;


            if (
                userAnswers[
                    currentQuestion
                ] !== null &&
                normalizeText(
                    userAnswers[
                        currentQuestion
                    ]
                ) ===
                normalizeText(
                    value
                )
            ) {

                button.classList.add(
                    "selected"
                );
            }


            button.addEventListener(
                "click",
                function () {

                    selectAnswer(
                        value,
                        button
                    );

                }
            );


            wrapper.appendChild(
                button
            );

        }
    );


    answersContainer.appendChild(
        wrapper
    );
}


/* =========================================================
   RENDER FILL IN THE GAP
========================================================= */

function renderFillAnswer(
    question
) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "fill-answer";


    const label =
        document.createElement(
            "label"
        );


    label.textContent =
        "Your Answer";


    const input =
        document.createElement(
            "input"
        );


    input.type =
        "text";


    input.className =
        "fill-answer-input";


    input.placeholder =
        "Type your answer here...";


    input.autocomplete =
        "off";


    input.value =
        userAnswers[
            currentQuestion
        ] || "";


    input.addEventListener(
        "input",
        function () {

            userAnswers[
                currentQuestion
            ] =
                input.value;


            scheduleActiveExamAttemptSave();

            updateDots();

        }
    );


    wrapper.appendChild(
        label
    );


    wrapper.appendChild(
        input
    );


    answersContainer.appendChild(
        wrapper
    );
}


/* =========================================================
   SELECT ANSWER
========================================================= */

function selectAnswer(
    answer,
    selectedButton
) {

    userAnswers[
        currentQuestion
    ] =
        answer;


    const allButtons =
        answersContainer.querySelectorAll(
            ".answer-option"
        );


    allButtons.forEach(
        button => {

            button.classList.remove(
                "selected"
            );

        }
    );


    selectedButton.classList.add(
        "selected"
    );


    saveActiveExamAttempt();

    updateDots();
}


/* =========================================================
   NEXT QUESTION
========================================================= */

function goToNextQuestion() {

    if (
        currentQuestion <
        questions.length - 1
    ) {

        currentQuestion++;

        displayQuestion();

        saveActiveExamAttempt();

        return;
    }


    const confirmSubmit =
        confirm(
            "You have reached the last question. Do you want to submit your examination?"
        );


    if (
        confirmSubmit
    ) {

        calculateResult();
    }
}


/* =========================================================
   PREVIOUS QUESTION
========================================================= */

function goToPreviousQuestion() {

    if (
        currentQuestion >
        0
    ) {

        currentQuestion--;

        displayQuestion();

        saveActiveExamAttempt();
    }
}


/* =========================================================
   NAVIGATION EVENTS
========================================================= */

if (
    nextBtn
) {

    nextBtn.addEventListener(
        "click",
        goToNextQuestion
    );
}


if (
    previousBtn
) {

    previousBtn.addEventListener(
        "click",
        goToPreviousQuestion
    );
}


/* =========================================================
   UPDATE PROGRESS
========================================================= */

function updateProgress() {

    if (
        !questions.length
    ) {

        return;
    }


    const percentage =
        (
            (
                currentQuestion + 1
            ) /
            questions.length
        ) * 100;


    if (
        progressFill
    ) {

        progressFill.style.width =
            `${percentage}%`;
    }


    if (
        progressText
    ) {

        progressText.textContent =
            `${currentQuestion + 1} / ${questions.length}`;
    }
}


/* =========================================================
   UPDATE NAVIGATION
========================================================= */

function updateNavigation() {

    if (
        previousBtn
    ) {

        previousBtn.disabled =
            currentQuestion === 0;
    }


    if (
        nextBtn
    ) {

        if (
            currentQuestion <
            questions.length - 1
        ) {

            nextBtn.textContent =
                "Next →";

        } else {

            nextBtn.textContent =
                "Submit Examination";
        }
    }
}


/* =========================================================
   UPDATE QUESTION DOTS
========================================================= */

function updateDots() {

    if (
        !questionDots
    ) {

        return;
    }


    questionDots.innerHTML =
        "";


    questions.forEach(
        (
            question,
            index
        ) => {

            const dot =
                document.createElement(
                    "button"
                );


            dot.type =
                "button";


            dot.className =
                "question-dot";


            dot.textContent =
                index + 1;


            if (
                index ===
                currentQuestion
            ) {

                dot.classList.add(
                    "active"
                );
            }


            if (
                userAnswers[
                    index
                ] !== null &&
                userAnswers[
                    index
                ] !== undefined &&
                String(
                    userAnswers[
                        index
                    ]
                ).trim() !== ""
            ) {

                dot.classList.add(
                    "answered"
                );
            }


            dot.addEventListener(
                "click",
                function () {

                    currentQuestion =
                        index;

                    displayQuestion();

                    saveActiveExamAttempt();

                }
            );


            questionDots.appendChild(
                dot
            );

        }
    );
}


/* =========================================================
   UPDATE TIMER DISPLAY
========================================================= */

function updateTimerDisplay() {

    if (
        !timerDisplay
    ) {

        return;
    }


    const totalSeconds =
        Math.max(
            0,
            Number(
                timeRemaining
            ) || 0
        );


    const minutes =
        Math.floor(
            totalSeconds / 60
        );


    const seconds =
        totalSeconds % 60;


    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


/* =========================================================
   START TIMER
========================================================= */

function startTimer() {

    if (
        timer
    ) {

        clearInterval(
            timer
        );
    }


    updateTimerDisplay();


    if (
        timeRemaining <= 0
    ) {

        alert(
            "Time is up! Your examination will now be submitted."
        );

        calculateResult();

        return;
    }


    timer =
        setInterval(
            function () {

                timeRemaining--;

                updateTimerDisplay();


                if (
                    timeRemaining <= 0
                ) {

                    clearInterval(
                        timer
                    );

                    timer =
                        null;

                    alert(
                        "Time is up! Your examination will now be submitted."
                    );

                    calculateResult();

                }

            },
            1000
        );
}


/* =========================================================
   BUILD SUBMISSION ANSWERS
========================================================= */

function buildSubmissionAnswers() {

    return questions.map(
        (
            question,
            index
        ) => {

            return {

                question_id:
                    question.id,

                question_number:
                    question.question_number,

                answer:
                    userAnswers[
                        index
                    ] ?? null

            };

        }
    );
}


/* =========================================================
   SAVE SUBMISSION
========================================================= */

async function saveSubmission() {

    if (
        !examData ||
        !examData.id
    ) {

        throw new Error(
            "Examination ID is missing."
        );
    }


    if (
        !savedStudentName
    ) {

        throw new Error(
            "Student name is missing."
        );
    }


    const studentExamSession =
        readStudentExamSession() || {};


    const examAccessCode =
        studentExamSession.examAccessCode ||
        "";


    if (
        !examAccessCode
    ) {

        throw new Error(
            "Examination access information is missing."
        );
    }


    /*
     * Only the student's answers are sent.
     *
     * Correct answers remain inside Supabase.
     */

    const submissionAnswers =
        buildSubmissionAnswers();


    console.log(
        "Submitting student answers:",
        submissionAnswers
    );


    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "submit_student_exam",
            {

                p_exam_id:
                    examData.id,

                p_access_code:
                    examAccessCode,

                p_student_name:
                    savedStudentName,

                p_answers:
                    submissionAnswers

            }
        );


    if (
        error
    ) {

        console.error(
            "Examination submission error:",
            error
        );

        throw new Error(
            "Your examination could not be submitted. Please try again."
        );
    }


    const result =
        Array.isArray(
            data
        )
            ? data[0]
            : data;


    if (
        !result
    ) {

        throw new Error(
            "The examination result could not be calculated."
        );
    }


    const score =
        Number(
            result.score || 0
        );


    const totalQuestions =
        Number(
            result.total_questions || 0
        );


    const percentage =
        Number(
            result.percentage || 0
        );


    console.log(
        "SERVER-SIDE EXAM RESULT:",
        {

            score,
            totalQuestions,
            percentage

        }
    );


    return {

        score,
        totalQuestions,
        percentage

    };
}


/* =========================================================
   CALCULATE RESULT
========================================================= */

async function calculateResult() {

    if (
        examSubmitted
    ) {

        return;
    }


    examSubmitted =
        true;


    if (
        timer
    ) {

        clearInterval(
            timer
        );

        timer =
            null;
    }


    saveActiveExamAttempt();


    if (
        submitBtn
    ) {

        submitBtn.disabled =
            true;
    }


    if (
        nextBtn
    ) {

        nextBtn.disabled =
            true;
    }


    try {

        const result =
            await saveSubmission();


        stopExamMode();


        localStorage.setItem(
            "examResult",
            JSON.stringify({

                examId:
                    examData.id,

                examTitle:
                    examData.title,

                studentName:
                    savedStudentName,

                score:
                    result.score,

                totalQuestions:
                    result.totalQuestions,

                percentage:
                    result.percentage,

                submittedAt:
                    new Date().toISOString(),

                answers:
                    userAnswers

            })
        );


        localStorage.removeItem(
            ACTIVE_EXAM_ATTEMPT_KEY
        );


        window.location.href =
            "result.html";


    } catch (error) {

        console.error(
            "Could not submit examination:",
            error
        );


        examSubmitted =
            false;


        if (
            submitBtn
        ) {

            submitBtn.disabled =
                false;
        }


        if (
            nextBtn
        ) {

            nextBtn.disabled =
                false;
        }


        alert(
            error.message ||
            "Your examination could not be submitted. Please try again."
        );
    }
}


/* =========================================================
   SUBMIT BUTTON
========================================================= */

if (
    submitBtn
) {

    submitBtn.addEventListener(
        "click",
        function () {

            if (
                confirm(
                    "Are you sure you want to submit your examination?"
                )
            ) {

                calculateResult();
            }

        }
    );
}


/* =========================================================
   INITIAL LOAD
========================================================= */

console.log(
    "Gracextol Examination Page Loaded."
);

console.log(
    "Selected Exam ID:",
    selectedExamId
);

console.log(
    "Student:",
    savedStudentName
);


loadExamination();