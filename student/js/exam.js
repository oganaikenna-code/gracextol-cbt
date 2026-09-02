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
   - Automatic grading
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

/*
 * The teacher's editor stores formatting such as:
 *
 * <b>bold</b>
 * <i>italic</i>
 * <u>underline</u>
 * X<sup>2</sup>
 * H<sub>2</sub>O
 *
 * We allow those formatting tags while removing
 * potentially dangerous HTML.
 */

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


    const allowedTags = new Set([
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


    const elements =
        documentFragment.body.querySelectorAll("*");


    elements.forEach(
        element => {

            if (
                !allowedTags.has(
                    element.tagName
                )
            ) {

                element.replaceWith(
                    ...Array.from(
                        element.childNodes
                    )
                );

                return;
            }


            /*
             * Remove all attributes.
             *
             * This keeps formatting safe and prevents
             * javascript/event attributes.
             */

            Array.from(
                element.attributes
            ).forEach(
                attribute => {

                    element.removeAttribute(
                        attribute.name
                    );

                }
            );

        }
    );


    return documentFragment.body.innerHTML;
}


/* =========================================================
   LOAD EXAMINATION
========================================================= */

async function loadExamination() {

    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        console.error(
            "Supabase client is not available."
        );

        alert(
            "Unable to connect to the examination system."
        );

        return;
    }


    if (!selectedExamId) {

        return;
    }


    try {

        console.log(
            "Loading examination:",
            selectedExamId
        );


        /* =================================================
           LOAD EXACT EXAM
        ================================================= */

        const {
            data: exam,
            error: examError
        } =
            await supabaseClient
                .from("exams")
                .select("*")
                .eq(
                    "id",
                    selectedExamId
                )
                .maybeSingle();


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


        if (!exam) {

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
            exam;


        console.log(
            "Correct examination loaded:",
            examData
        );


        if (examTitleDisplay) {

            examTitleDisplay.textContent =
                exam.title ||
                "Examination";
        }


        await loadQuestions();

    } catch (error) {

        console.error(
            "Unexpected exam loading error:",
            error
        );

        alert(
            "Something went wrong while loading the examination."
        );
    }
}


/* =========================================================
   LOAD QUESTIONS
========================================================= */

async function loadQuestions() {

    try {

        console.log(
            "Loading questions for exam:",
            examData.id
        );


        /* =================================================
           LOAD QUESTIONS
        ================================================= */

        const {
            data,
            error
        } =
            await supabaseClient
                .from("questions")
                .select("*")
                .eq(
                    "exam_id",
                    examData.id
                )
                .order(
                    "question_number",
                    {
                        ascending: true
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
           LOAD QUESTION OPTIONS
        ================================================= */

        const questionIds =
            data
                .map(
                    question =>
                        question.id
                )
                .filter(Boolean);


        let optionRows = [];


        if (
            questionIds.length > 0
        ) {

            const {
                data: options,
                error: optionsError
            } =
                await supabaseClient
                    .from("question_options")
                    .select(
                        `
                        question_id,
                        option_label,
                        option_text,
                        is_correct
                        `
                    )
                    .in(
                        "question_id",
                        questionIds
                    )
                    .order(
                        "option_label",
                        {
                            ascending: true
                        }
                    );


            if (optionsError) {

                console.error(
                    "Question options loading error:",
                    optionsError
                );

                alert(
                    "Unable to load examination answer options."
                );

                return;
            }


            optionRows =
                options || [];
        }


        /* =================================================
           GROUP OPTIONS BY QUESTION
        ================================================= */

        const optionsByQuestion = {};


        optionRows.forEach(
            option => {

                if (
                    !optionsByQuestion[
                        option.question_id
                    ]
                ) {

                    optionsByQuestion[
                        option.question_id
                    ] = [];
                }


                optionsByQuestion[
                    option.question_id
                ].push({
                    label:
                        option.option_label,

                    text:
                        option.option_text,

                    is_correct:
                        Boolean(
                            option.is_correct
                        )
                });

            }
        );


        /* =================================================
           ATTACH OPTIONS TO QUESTIONS
        ================================================= */

        questions =
            data.map(
                question => {

                    return {

                        ...question,

                        question_options:
                            optionsByQuestion[
                                question.id
                            ] || []

                    };

                }
            );


        console.log(
            "Questions loaded:",
            questions
        );


        console.log(
            "Question options loaded:",
            optionsByQuestion
        );


        /* =================================================
           TOTAL QUESTIONS
        ================================================= */

        if (totalQuestions) {

            totalQuestions.textContent =
                questions.length;
        }


        /* =================================================
           CREATE ANSWER ARRAY
        ================================================= */

        userAnswers =
            new Array(
                questions.length
            ).fill(null);


        /* =================================================
           SET TIMER
        ================================================= */

        const duration =
            Number(
                examData.duration
            );


        if (
            duration &&
            duration > 0
        ) {

            timeRemaining =
                duration * 60;

        } else {

            timeRemaining =
                30 * 60;
        }


        /* =================================================
           FIRST QUESTION
        ================================================= */

        currentQuestion =
            0;


        displayQuestion();


        /* =================================================
           START TIMER
        ================================================= */

        startTimer();


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

function getQuestionText(question) {

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

function getQuestionType(question) {

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

function getQuestionOptions(question) {

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
                    String(option).trim() !== ""
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
                            String(option),

                        is_correct:
                            false

                    };

                }
            );
    }


    return [];
}


/* =========================================================
   GET CORRECT ANSWER
========================================================= */

function getCorrectAnswer(question) {

    const type =
        getQuestionType(
            question
        );


    /* =====================================================
       MULTIPLE CHOICE
    ===================================================== */

    if (
        type === "multiple"
    ) {

        const options =
            getQuestionOptions(
                question
            );


        const correctOption =
            options.find(
                option =>
                    option.is_correct === true
            );


        if (correctOption) {

            return (
                correctOption.text
            );
        }


        /*
         * Fallback to old database structure.
         */

        if (
            question.correct_answer !==
                null &&
            question.correct_answer !==
                undefined &&
            question.correct_answer !==
                ""
        ) {

            return question.correct_answer;
        }


        return null;
    }


    /* =====================================================
       TRUE / FALSE
    ===================================================== */

    if (
        type === "true-false"
    ) {

        if (
            question.answer !==
                null &&
            question.answer !==
                undefined &&
            question.answer !==
                ""
        ) {

            return question.answer;
        }


        if (
            question.correct_answer !==
                null &&
            question.correct_answer !==
                undefined &&
            question.correct_answer !==
                ""
        ) {

            return question.correct_answer;
        }


        return null;
    }


    /* =====================================================
       FILL IN THE GAP
    ===================================================== */

    if (
        question.answer !==
            null &&
        question.answer !==
            undefined &&
        question.answer !==
            ""
    ) {

        return question.answer;
    }


    if (
        question.correct_answer !==
            null &&
        question.correct_answer !==
            undefined &&
        question.correct_answer !==
            ""
    ) {

        return question.correct_answer;
    }


    return null;
}


/* =========================================================
   NORMALIZE TEXT
========================================================= */

function normalizeText(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            " "
        );
}


/* =========================================================
   NORMALIZE NUMERIC ANSWER
========================================================= */

function normalizeNumericAnswer(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    let text =
        String(value)
            .trim()
            .toLowerCase();


    /*
     * Remove common currency symbols.
     */

    text =
        text.replace(
            /₦|\$|£|€|,/g,
            ""
        );


    /*
     * Remove spaces.
     */

    text =
        text.replace(
            /\s+/g,
            ""
        );


    return text;
}


/* =========================================================
   CHECK MULTIPLE CHOICE
========================================================= */

function checkMultipleChoiceAnswer(
    question,
    userAnswer
) {

    if (
        userAnswer === null ||
        userAnswer === undefined ||
        String(userAnswer).trim() === ""
    ) {

        return false;
    }


    const correctAnswer =
        getCorrectAnswer(
            question
        );


    if (
        correctAnswer === null ||
        correctAnswer === undefined
    ) {

        return false;
    }


    return (
        normalizeText(
            userAnswer
        ) ===
        normalizeText(
            correctAnswer
        )
    );
}


/* =========================================================
   CHECK TRUE / FALSE
========================================================= */

function checkTrueFalseAnswer(
    question,
    userAnswer
) {

    if (
        userAnswer === null ||
        userAnswer === undefined
    ) {

        return false;
    }


    const correctAnswer =
        getCorrectAnswer(
            question
        );


    if (
        correctAnswer === null ||
        correctAnswer === undefined
    ) {

        return false;
    }


    return (
        normalizeText(
            userAnswer
        ) ===
        normalizeText(
            correctAnswer
        )
    );
}


/* =========================================================
   CHECK FILL IN THE GAP
========================================================= */

function checkFillAnswer(
    question,
    userAnswer
) {

    if (
        userAnswer === null ||
        userAnswer === undefined ||
        String(userAnswer).trim() === ""
    ) {

        return false;
    }


    const correctAnswer =
        getCorrectAnswer(
            question
        );


    if (
        correctAnswer === null ||
        correctAnswer === undefined
    ) {

        return false;
    }


    const userText =
        String(userAnswer).trim();


    const correctText =
        String(correctAnswer).trim();


    /*
     * First try normal text comparison.
     */

    if (
        normalizeText(
            userText
        ) ===
        normalizeText(
            correctText
        )
    ) {

        return true;
    }


    /*
     * Then try numeric comparison.
     *
     * This allows:
     *
     * 5000
     * 5,000
     * ₦5,000
     *
     * to be treated as the same numeric answer.
     */

    const normalizedUserNumber =
        normalizeNumericAnswer(
            userText
        );


    const normalizedCorrectNumber =
        normalizeNumericAnswer(
            correctText
        );


    if (
        normalizedUserNumber !== "" &&
        normalizedCorrectNumber !== "" &&
        !isNaN(
            Number(
                normalizedUserNumber
            )
        ) &&
        !isNaN(
            Number(
                normalizedCorrectNumber
            )
        )
    ) {

        return (
            Number(
                normalizedUserNumber
            ) ===
            Number(
                normalizedCorrectNumber
            )
        );
    }


    return false;
}


/* =========================================================
   CHECK QUESTION
========================================================= */

function isAnswerCorrect(
    question,
    userAnswer
) {

    const type =
        getQuestionType(
            question
        );


    if (
        type === "true-false"
    ) {

        return checkTrueFalseAnswer(
            question,
            userAnswer
        );
    }


    if (
        type === "fill"
    ) {

        return checkFillAnswer(
            question,
            userAnswer
        );
    }


    return checkMultipleChoiceAnswer(
        question,
        userAnswer
    );
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

    if (questionNumber) {

        questionNumber.textContent =
            currentQuestion + 1;
    }


    /* =====================================================
       QUESTION LABEL
    ===================================================== */

    if (questionLabel) {

        questionLabel.textContent =
            `Question ${currentQuestion + 1}`;
    }


    /* =====================================================
       QUESTION TEXT
    ===================================================== */

    if (questionText) {

        /*
         * IMPORTANT:
         *
         * innerHTML is required here so:
         *
         * 394<sub>4</sub>
         *
         * becomes:
         *
         * 394₄
         *
         * and:
         *
         * x<sup>2</sup>
         *
         * becomes:
         *
         * x²
         */

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

    if (answersContainer) {

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


    if (questionTypeDisplay) {

        if (
            type === "fill"
        ) {

            questionTypeDisplay.textContent =
                "Fill in the Gap";

        } else if (
            type === "true-false"
        ) {

            questionTypeDisplay.textContent =
                "True / False";

        } else {

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


            /*
             * IMPORTANT:
             *
             * Use innerHTML here so options can contain:
             *
             * 54<sub>5</sub>
             * x<sup>2</sup>
             */

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
    }
}


/* =========================================================
   NAVIGATION EVENTS
========================================================= */

if (nextBtn) {

    nextBtn.addEventListener(
        "click",
        goToNextQuestion
    );
}


if (previousBtn) {

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
            (currentQuestion + 1) /
            questions.length
        ) * 100;


    if (progressFill) {

        progressFill.style.width =
            `${percentage}%`;
    }


    if (progressText) {

        progressText.textContent =
            `${Math.round(percentage)}% Completed`;
    }
}


/* =========================================================
   UPDATE NAVIGATION
========================================================= */

function updateNavigation() {

    if (previousBtn) {

        previousBtn.disabled =
            currentQuestion === 0;
    }


    if (!nextBtn) {

        return;
    }


    if (
        currentQuestion ===
        questions.length - 1
    ) {

        nextBtn.innerHTML =
            `Finish <i class="fa-solid fa-check"></i>`;

    } else {

        nextBtn.innerHTML =
            `Next <i class="fa-solid fa-arrow-right"></i>`;
    }
}


/* =========================================================
   UPDATE QUESTION DOTS
========================================================= */

function updateDots() {

    if (!questionDots) {

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
                    "span"
                );


            if (
                index ===
                currentQuestion
            ) {

                dot.classList.add(
                    "active"
                );
            }


            if (
                userAnswers[index] !==
                    null &&
                userAnswers[index] !==
                    undefined &&
                String(
                    userAnswers[index]
                ).trim() !== ""
            ) {

                dot.classList.add(
                    "answered"
                );
            }


            questionDots.appendChild(
                dot
            );

        }
    );
}


/* =========================================================
   START TIMER
========================================================= */

function startTimer() {

    if (timer) {

        clearInterval(
            timer
        );
    }


    updateTimerDisplay();


    timer =
        setInterval(
            function () {

                if (
                    examSubmitted
                ) {

                    clearInterval(
                        timer
                    );

                    return;
                }


                timeRemaining--;


                updateTimerDisplay();


                if (
                    timeRemaining <=
                    300
                ) {

                    if (timerDisplay) {

                        timerDisplay.style.color =
                            "#ef4444";
                    }
                }


                if (
                    timeRemaining <=
                    0
                ) {

                    clearInterval(
                        timer
                    );


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
   UPDATE TIMER
========================================================= */

function updateTimerDisplay() {

    if (!timerDisplay) {

        return;
    }


    const minutes =
        Math.floor(
            timeRemaining / 60
        );


    const seconds =
        timeRemaining % 60;


    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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

            const userAnswer =
                userAnswers[index];


            const correctAnswer =
                getCorrectAnswer(
                    question
                );


            const isCorrect =
                isAnswerCorrect(
                    question,
                    userAnswer
                );


            return {

                question_id:
                    question.id ||
                    null,

                question_number:
                    question.question_number ||
                    index + 1,

                question_text:
                    getQuestionText(
                        question
                    ),

                answer:
                    userAnswer !== null &&
                    userAnswer !== undefined
                        ? userAnswer
                        : "",

                correct_answer:
                    correctAnswer !== null &&
                    correctAnswer !== undefined
                        ? correctAnswer
                        : "",

                is_correct:
                    isCorrect

            };

        }
    );
}


/* =========================================================
   SAVE SUBMISSION
========================================================= */

async function saveSubmission(
    score
) {

    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        throw new Error(
            "Supabase client is not available."
        );
    }


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


    const submissionAnswers =
        buildSubmissionAnswers();


    console.log(
        "Submission answers:",
        submissionAnswers
    );


    const {
        error: submissionError
    } =
        await supabaseClient
            .from("submissions")
            .insert({

                exam_id:
                    examData.id,

                student_name:
                    savedStudentName,

                answers:
                    submissionAnswers,

                score:
                    Number(score)

            });


    if (
        submissionError
    ) {

        console.error(
            "Submission save error:",
            submissionError
        );


        throw new Error(
            "Your examination was scored, but the result could not be saved. Please try again."
        );
    }


    console.log(
        "EXAMINATION SUBMISSION SAVED SUCCESSFULLY."
    );


    return true;
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


    if (timer) {

        clearInterval(
            timer
        );
    }


    if (submitBtn) {

        submitBtn.disabled =
            true;


        submitBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Saving Result...';
    }


    /* =====================================================
       CALCULATE SCORE
    ===================================================== */

    let score =
        0;


    questions.forEach(
        (
            question,
            index
        ) => {

            const userAnswer =
                userAnswers[index];


            if (
                userAnswer === null ||
                userAnswer === undefined ||
                String(
                    userAnswer
                ).trim() === ""
            ) {

                return;
            }


            const correct =
                isAnswerCorrect(
                    question,
                    userAnswer
                );


            console.log(
                `Question ${index + 1}:`,
                {

                    userAnswer:
                        userAnswer,

                    correctAnswer:
                        getCorrectAnswer(
                            question
                        ),

                    correct:
                        correct

                }
            );


            if (
                correct
            ) {

                score++;
            }

        }
    );


    const percentage =
        questions.length > 0
            ? Math.round(
                (
                    score /
                    questions.length
                ) * 100
            )
            : 0;


    console.log(
        "FINAL EXAM RESULT:",
        {

            score:
                score,

            total:
                questions.length,

            percentage:
                percentage

        }
    );


    /* =====================================================
       SAVE TO SUPABASE
    ===================================================== */

    try {

        await saveSubmission(
            score
        );


    } catch (error) {

        console.error(
            "Could not save examination submission:",
            error
        );


        examSubmitted =
            false;


        if (submitBtn) {

            submitBtn.disabled =
                false;


            submitBtn.innerHTML =
                '<i class="fa-solid fa-check"></i> Submit Examination';
        }


        alert(
            error.message ||
            "Your result could not be saved. Please try again."
        );


        return;
    }


    /* =====================================================
       SAVE RESULT LOCALLY
    ===================================================== */

    localStorage.setItem(
        "examScore",
        String(score)
    );


    localStorage.setItem(
        "totalQuestions",
        String(
            questions.length
        )
    );


    localStorage.setItem(
        "examPercentage",
        String(
            percentage
        )
    );


    localStorage.setItem(
        "examId",
        examData
            ? examData.id
            : ""
    );


    localStorage.setItem(
        "selectedExamId",
        examData
            ? examData.id
            : ""
    );


    localStorage.setItem(
        "examTitle",
        examData
            ? examData.title
            : ""
    );


    localStorage.setItem(
        "selectedExam",
        examData
            ? examData.title
            : ""
    );


    localStorage.setItem(
        "studentAnswers",
        JSON.stringify(
            userAnswers
        )
    );


    localStorage.setItem(
        "completedExam",
        JSON.stringify({

            examId:
                examData
                    ? examData.id
                    : "",

            examTitle:
                examData
                    ? examData.title
                    : "",

            score:
                score,

            totalQuestions:
                questions.length,

            percentage:
                percentage,

            studentName:
                savedStudentName,

            answers:
                userAnswers

        })
    );


    /* =====================================================
       GO TO RESULT
    ===================================================== */

    window.location.href =
        "result.html";
}


/* =========================================================
   SUBMIT BUTTON
========================================================= */

if (submitBtn) {

    submitBtn.addEventListener(
        "click",
        function () {

            if (
                examSubmitted
            ) {

                return;
            }


            const unanswered =
                userAnswers.filter(
                    answer =>
                        answer === null ||
                        answer === undefined ||
                        String(
                            answer
                        ).trim() === ""
                ).length;


            if (
                unanswered > 0
            ) {

                const proceed =
                    confirm(
                        `You have ${unanswered} unanswered question(s). Do you want to submit your examination?`
                    );


                if (
                    !proceed
                ) {

                    return;
                }
            }


            const confirmSubmit =
                confirm(
                    "Are you sure you want to submit your examination?"
                );


            if (
                confirmSubmit
            ) {

                calculateResult();
            }

        }
    );
}


/* =========================================================
   PREVENT ACCIDENTAL EXIT
========================================================= */

window.addEventListener(
    "beforeunload",
    function (event) {

        if (
            !examSubmitted &&
            questions.length > 0
        ) {

            event.preventDefault();

            event.returnValue =
                "";
        }

    }
);


/* =========================================================
   INITIALIZE EXAMINATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

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

    }
);