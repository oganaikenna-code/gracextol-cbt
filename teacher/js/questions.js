/* =========================================================
   GRACEXTOL CBT
   QUESTION BUILDER
   VANILLA JAVASCRIPT + SUPABASE

   OPTION ARCHITECTURE:
   questions
        ↓
   question_options

   Supports:
   - Multiple Choice
   - True / False
   - Fill in the Gap
   - Rich text
   - Bold / Italic / Underline
   - Superscript / Subscript
   - Scientific & mathematical symbols
   - Images / Video / Audio / Files / Links
   - Supabase persistence
========================================================= */

/* =========================================================
   AI QUESTION GENERATOR
    REAL N8N VERSION
========================================================= */

const openAiGeneratorBtn =
    document.getElementById(
        "openAiGeneratorBtn"
    );

const closeAiGeneratorBtn =
    document.getElementById(
        "closeAiGeneratorBtn"
    );

const cancelAiGeneratorBtn =
    document.getElementById(
        "cancelAiGeneratorBtn"
    );

const generateAiQuestionsBtn =
    document.getElementById(
        "generateAiQuestionsBtn"
    );

const aiGeneratorPanel =
    document.getElementById(
        "aiGeneratorPanel"
    );

const aiPrompt =
    document.getElementById(
        "aiPrompt"
    );

const aiQuestionCount =
    document.getElementById(
        "aiQuestionCount"
    );

const aiQuestionType =
    document.getElementById(
        "aiQuestionType"
    );

const aiDifficulty =
    document.getElementById(
        "aiDifficulty"
    );

const aiGeneratorStatus =
    document.getElementById(
        "aiGeneratorStatus"
    );


/* =========================================================
   OPEN AI PANEL
========================================================= */

if (
    openAiGeneratorBtn
) {

    openAiGeneratorBtn.addEventListener(
        "click",
        function () {

            if (
                aiGeneratorPanel
            ) {

                aiGeneratorPanel.style.display =
                    "block";

                aiGeneratorPanel.scrollIntoView({
                    behavior:
                        "smooth",

                    block:
                        "center"
                });

            }

        }
    );

}


/* =========================================================
   CLOSE AI PANEL
========================================================= */

function closeAiGenerator() {

    if (
        aiGeneratorPanel
    ) {

        aiGeneratorPanel.style.display =
            "none";

    }

}


/* =========================================================
   CLOSE BUTTON
========================================================= */

if (
    closeAiGeneratorBtn
) {

    closeAiGeneratorBtn.addEventListener(
        "click",
        closeAiGenerator
    );

}


/* =========================================================
   CANCEL BUTTON
========================================================= */

if (
    cancelAiGeneratorBtn
) {

    cancelAiGeneratorBtn.addEventListener(
        "click",
        closeAiGenerator
    );

}


/* =========================================================
   GENERATE BUTTON
========================================================= */

if (
    generateAiQuestionsBtn
) {

    generateAiQuestionsBtn.addEventListener(
        "click",
        generateAIQuestions
    );

}


/* =========================================================
   MOCK AI GENERATOR
========================================================= */

async function generateAIQuestions() {

    const prompt =
        aiPrompt?.value.trim() ||
        "";


    const count =
        Number(
            aiQuestionCount?.value
        ) || 5;


    const type =
        aiQuestionType?.value ||
        "mixed";


    const difficulty =
        aiDifficulty?.value ||
        "medium";


    const request = {

        prompt,

        count,

        questionType:
            type,

        difficulty,

        examTitle:
            examData.title || "",

        subject:
            examData.subject || "",

        classLevel:
            examData.classLevel || ""

    };


    /* -----------------------------------------------------
       VALIDATE PROMPT
    ----------------------------------------------------- */

    if (!prompt) {

        alert(
            "Please describe the questions you want the AI to generate."
        );

        aiPrompt?.focus();

        return;

    }


    /* -----------------------------------------------------
       VALIDATE COUNT
    ----------------------------------------------------- */

    if (
        count < 1 ||
        count > 50
    ) {

        alert(
            "Please enter between 1 and 50 questions."
        );

        return;

    }


    /* -----------------------------------------------------
       SHOW LOADING
    ----------------------------------------------------- */

    setAIGeneratorLoading(
        true
    );


    try {

        /*
         * Temporary mock delay.
         *
         * This simulates the time an AI request
         * would normally take.
         */

        const response =
            await fetch(
                "https://n8n.gracextol.com/webhook/gracextol-ai-questions",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(request)
                }
            );


        if (!response.ok) {

            throw new Error(
                `AI service returned status ${response.status}.`
            );
        }


        /* -------------------------------------------------
           CREATE MOCK QUESTIONS
        ------------------------------------------------- */

        const generatedQuestions =
            normalizeAIQuestions(
                await response.json(),
                type,
                difficulty
            );


        console.log(
            "Mock AI generated questions:",
            generatedQuestions
        );

        /* -------------------------------------------------
           ADD TO EXISTING QUESTION LIST
        ------------------------------------------------- */

        window.gracextolAIQuestions =
            generatedQuestions;

        renderAIQuestionReview();


        /* -------------------------------------------------
           CLOSE PANEL
        ------------------------------------------------- */

        closeAiGenerator();


        /* -------------------------------------------------
           CLEAR PROMPT
        ------------------------------------------------- */

        if (
            aiPrompt
        ) {

            aiPrompt.value =
                "";

        }


        alert(
            `${generatedQuestions.length} question${
                generatedQuestions.length === 1
                    ? ""
                    : "s"
            } generated successfully.`
        );


    } catch (error) {

        console.error(
            "AI generation error:",
            error
        );

        alert(
            error.name === "TypeError"
                ? "Unable to connect to the AI service. Please make sure n8n is running."
                : error.message ||
                    "Unable to generate questions."
        );

    } finally {

        setAIGeneratorLoading(
            false
        );

    }

}


/* =========================================================
   CREATE MOCK QUESTIONS
========================================================= */

function legacyQuestionFactory(
    count,
    type,
    prompt
) {

    const generated = [];

    for (
        let i = 0;
        i < count;
        i++
    ) {

        let selectedType = type;


        /* ---------------------------------------------
           MIXED MODE
        --------------------------------------------- */

        if (
            type === "mixed"
        ) {

            const types = [
                "multiple-choice",
                "true-false",
                "fill-gap"
            ];

            selectedType =
                types[
                    i % types.length
                ];
        }


        /* ---------------------------------------------
           QUESTION NUMBER
        --------------------------------------------- */

        const questionNumber =
            questions.length +
            generated.length +
            1;


        /* ---------------------------------------------
           MULTIPLE CHOICE
        --------------------------------------------- */

        if (
            selectedType ===
            "multiple-choice"
        ) {

            generated.push({

                exam_id:
                    examData.id,

                question_number:
                    questionNumber,

                question_text:
                    "",

                question_type:
                    "multiple-choice",

                options: [

                    "",

                    "",

                    "",

                    "",

                ],

                correct_answer:
                    0,

                answer:
                    `It is an important concept related to ${prompt}.`,

                marks:
                    1,

                media:
                    []

            });

        }


        /* ---------------------------------------------
           TRUE / FALSE
        --------------------------------------------- */

        else if (
            selectedType ===
            "true-false"
        ) {

            generated.push({

                exam_id:
                    examData.id,

                question_number:
                    questionNumber,

                question_text:
                    "",

                question_type:
                    "true-false",

                options: [
                    "True",
                    "False"
                ],

                correct_answer:
                    null,

                answer:
                    "True",

                marks:
                    1,

                media:
                    []

            });

        }


        /* ---------------------------------------------
           FILL IN THE GAP
        --------------------------------------------- */

        else {

            generated.push({

                exam_id:
                    examData.id,

                question_number:
                    questionNumber,

                question_text:
                    "",

                question_type:
                    "fill-gap",

                options:
                    [],

                correct_answer:
                    null,

                answer:
                    "",

                marks:
                    1,

                media:
                    []

            });

        }

    }


    return generated;

}


/* =========================================================
   ADD GENERATED QUESTIONS
========================================================= */

async function saveApprovedAIQuestions(
    generatedQuestions
) {

    if (
        !generatedQuestions ||
        generatedQuestions.length === 0
    ) {

        return;

    }


    for (
        const generatedQuestion
        of generatedQuestions
    ) {

        /* ---------------------------------------------
           PREPARE QUESTION DATA

           MCQ options are stored separately in
           question_options.
        --------------------------------------------- */

        const questionData = {

            exam_id:
                generatedQuestion.exam_id,

            question_number:
                generatedQuestion.question_number,

            question_text:
                generatedQuestion.question_text,

            question_type:
                generatedQuestion.question_type,

            options:
                [],

            correct_answer:
                generatedQuestion.correct_answer,

            answer:
                generatedQuestion.answer,

            marks:
                Number(
                    generatedQuestion.marks
                ) || 1,

            media:
                Array.isArray(
                    generatedQuestion.media
                )
                    ? generatedQuestion.media
                    : []

        };


        /* ---------------------------------------------
           SAVE QUESTION
        --------------------------------------------- */

        const {
            data: insertedQuestion,
            error: questionError
        } =
            await supabaseClient
                .from("questions")
                .insert(
                    questionData
                )
                .select()
                .single();


        if (
            questionError
        ) {

            console.error(
                "Unable to save generated question:"
            );

            console.error(
                "Code:",
                questionError.code
            );

            console.error(
                "Message:",
                questionError.message
            );

            console.error(
                "Details:",
                questionError.details
            );

            console.error(
                "Hint:",
                questionError.hint
            );

            throw questionError;

        }


        /* ---------------------------------------------
           SAVE MULTIPLE-CHOICE OPTIONS
        --------------------------------------------- */

        if (
            generatedQuestion.question_type ===
            "multiple-choice"
        ) {

            const options =
                Array.isArray(
                    generatedQuestion.options
                )
                    ? generatedQuestion.options
                    : [];


            const correctIndex =
                Number(
                    generatedQuestion.correct_answer
                );


            const optionRows =
                options.map(
                    (
                        optionText,
                        index
                    ) => ({

                        question_id:
                            insertedQuestion.id,

                        option_label:
                            String.fromCharCode(
                                65 + index
                            ),

                        option_text:
                            optionText || "",

                        is_correct:
                            index ===
                            correctIndex

                    })
                );


            if (
                optionRows.length > 0
            ) {

                const {
                    data:
                        insertedOptions,
                    error:
                        optionError
                } =
                    await supabaseClient
                        .from(
                            "question_options"
                        )
                        .insert(
                            optionRows
                        )
                        .select();


                if (
                    optionError
                ) {

                    console.error(
                        "Unable to save generated options:"
                    );

                    console.error(
                        "Code:",
                        optionError.code
                    );

                    console.error(
                        "Message:",
                        optionError.message
                    );

                    console.error(
                        "Details:",
                        optionError.details
                    );

                    /* ---------------------------------
                       REMOVE QUESTION IF OPTIONS FAIL
                    --------------------------------- */

                    await supabaseClient
                        .from("questions")
                        .delete()
                        .eq(
                            "id",
                            insertedQuestion.id
                        );

                    throw optionError;

                }


                /* ---------------------------------
                   ADD TO LOCAL QUESTION STATE
                --------------------------------- */

                questions.push({

                    ...insertedQuestion,

                    options:
                        options,

                    optionRows:
                        insertedOptions || [],

                    media:
                        Array.isArray(
                            insertedQuestion.media
                        )
                            ? insertedQuestion.media
                            : []

                });

            }

        }


        /* ---------------------------------------------
           TRUE / FALSE
        --------------------------------------------- */

        else if (
            generatedQuestion.question_type ===
            "true-false"
        ) {

            questions.push({

                ...insertedQuestion,

                options: [
                    "True",
                    "False"
                ],

                optionRows: [],

                media:
                    Array.isArray(
                        insertedQuestion.media
                    )
                        ? insertedQuestion.media
                        : []

            });

        }


        /* ---------------------------------------------
           FILL IN THE GAP
        --------------------------------------------- */

        else if (
            generatedQuestion.question_type ===
            "fill-gap"
        ) {

            questions.push({

                ...insertedQuestion,

                options: [],

                optionRows: [],

                media:
                    Array.isArray(
                        insertedQuestion.media
                    )
                        ? insertedQuestion.media
                        : []

            });

        }

    }


    /* ---------------------------------------------
       RENDER UPDATED QUESTIONS
    --------------------------------------------- */

    renderQuestions();

}


/* =========================================================
   AI LOADING STATE
========================================================= */

function setAIGeneratorLoading(
    loading
) {

    if (
        !generateAiQuestionsBtn
    ) {

        return;

    }


    if (
        loading
    ) {

        generateAiQuestionsBtn.disabled =
            true;

        generateAiQuestionsBtn.innerHTML =
            `
            <i class="fa-solid fa-circle-notch fa-spin"></i>

            Generating...
            `;


        if (
            aiGeneratorStatus
        ) {

            aiGeneratorStatus.style.display =
                "flex";

        }

    } else {

        generateAiQuestionsBtn.disabled =
            false;

        generateAiQuestionsBtn.innerHTML =
            `
            <i class="fa-solid fa-wand-magic-sparkles"></i>

            Generate Questions
            `;


        if (
            aiGeneratorStatus
        ) {

            aiGeneratorStatus.style.display =
                "none";

        }

    }

}
/* =========================================================
   ELEMENTS
========================================================= */

const questionsList =
    document.getElementById("questionsList");

const emptyState =
    document.getElementById("emptyState");

const addQuestionBtn =
    document.getElementById("addQuestionBtn");

const emptyAddBtn =
    document.getElementById("emptyAddBtn");

const continueReviewBtn =
    document.getElementById("continueReviewBtn");

const questionTotal =
    document.getElementById("questionTotal");

const plannedQuestions =
    document.getElementById("plannedQuestions");

const examTitleDisplay =
    document.getElementById("examTitleDisplay");

const subjectDisplay =
    document.getElementById("subjectDisplay");

const classDisplay =
    document.getElementById("classDisplay");


/* =========================================================
   DATA
========================================================= */

let examData = {};

let questions = [];


/* =========================================================
   UTILITY
========================================================= */

function createId() {

    if (
        typeof crypto !== "undefined" &&
        crypto.randomUUID
    ) {
        return crypto.randomUUID();
    }

    return (
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2)
    );
}
/* =========================================================
   FIX DISPLAY OF HTML ENTITIES
========================================================= */

function normalizeRichTextHTML(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "";
    }

    let html = String(value);

    const decoder =
        document.createElement("textarea");

    for (
        let i = 0;
        i < 2;
        i++
    ) {

        if (
            !html.includes("&")
        ) {
            break;
        }

        decoder.innerHTML =
            html;

        const decoded =
            decoder.value;

        if (
            decoded === html
        ) {
            break;
        }

        html =
            decoded;
    }

    return html;
}

function stripHTML(value) {

    const div =
        document.createElement("div");

    div.innerHTML =
        value || "";

    return (
        div.textContent ||
        div.innerText ||
        ""
    );
}


function normalizeAnswer(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/₀/g, "0")
        .replace(/₁/g, "1")
        .replace(/₂/g, "2")
        .replace(/₃/g, "3")
        .replace(/₄/g, "4")
        .replace(/₅/g, "5")
        .replace(/₆/g, "6")
        .replace(/₇/g, "7")
        .replace(/₈/g, "8")
        .replace(/₉/g, "9")
        .replace(/⁰/g, "0")
        .replace(/¹/g, "1")
        .replace(/²/g, "2")
        .replace(/³/g, "3")
        .replace(/⁴/g, "4")
        .replace(/⁵/g, "5")
        .replace(/⁶/g, "6")
        .replace(/⁷/g, "7")
        .replace(/⁸/g, "8")
        .replace(/⁹/g, "9");
}


function formatFileSize(bytes) {

    if (!bytes) {
        return "0 KB";
    }

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];

    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );

    return (
        Math.round(
            bytes /
            Math.pow(1024, index) *
            100
        ) / 100
    ) + " " + units[index];
}


/* =========================================================
   LOAD EXAM
========================================================= */

function loadExamData() {

    const savedExam =
        localStorage.getItem(
            "gracextolExam"
        );

    if (!savedExam) {

        alert(
            "No examination was found. Please create an examination first."
        );

        window.location.href =
            "create-exam.html";

        return false;
    }

    try {

        examData =
            JSON.parse(savedExam);

    } catch (error) {

        console.error(
            "Unable to read examination:",
            error
        );

        alert(
            "Unable to load the examination."
        );

        return false;
    }


    examTitleDisplay.textContent =
        examData.title ||
        "Untitled Examination";


    subjectDisplay.textContent =
        examData.subject ||
        "Not specified";


    classDisplay.textContent =
        examData.classLevel ||
        "Not specified";


    plannedQuestions.textContent =
        examData.questionCount ||
        0;


    return true;
}


/* =========================================================
   LOAD QUESTIONS
========================================================= */

async function loadQuestions() {

    if (!examData.id) {

        console.error(
            "No exam ID found."
        );

        return;
    }


    try {

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
                "Unable to load questions:",
                error
            );

            alert(
                "Unable to load questions."
            );

            return;
        }


        questions =
            Array.isArray(data)
                ? data.map(question => ({

                    ...question,

                    options:
                        Array.isArray(
                            question.options
                        )
                            ? question.options
                            : [],

                    optionRows:
                        [],

                    media:
                        Array.isArray(
                            question.media
                        )
                            ? question.media
                            : [],

                    question_type:
                        question.question_type ||
                        "multiple-choice",

                    marks:
                        Number(
                            question.marks
                        ) || 1

                }))
                : [];


        await loadQuestionOptions();


        renderQuestions();


    } catch (error) {

        console.error(
            "Unexpected question loading error:",
            error
        );
    }
}


/* =========================================================
   LOAD QUESTION_OPTIONS
========================================================= */

async function loadQuestionOptions() {

    const mcqQuestions =
        questions.filter(
            question =>
                question.question_type ===
                "multiple-choice"
        );


    if (
        mcqQuestions.length === 0
    ) {
        return;
    }


    const questionIds =
        mcqQuestions.map(
            question =>
                question.id
        );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("question_options")
            .select("*")
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


    if (error) {

        console.error(
            "Unable to load question options:",
            error
        );

        return;
    }


    const optionRows =
        Array.isArray(data)
            ? data
            : [];


    for (
        const question of mcqQuestions
    ) {

        let rows =
            optionRows.filter(
                option =>
                    option.question_id ===
                    question.id
            );


        /* -----------------------------------------
           MIGRATE OLD JSON OPTIONS IF NECESSARY

           This allows existing questions to continue
           working after moving to question_options.
        ----------------------------------------- */

        if (
            rows.length === 0 &&
            Array.isArray(
                question.options
            ) &&
            question.options.length > 0
        ) {

            rows =
                await migrateOldOptions(
                    question
                );
        }


        rows.sort(
            (a, b) =>
                a.option_label.localeCompare(
                    b.option_label
                )
        );


        question.optionRows =
            rows;


        question.options =
            rows.map(
                row =>
                    row.option_text || ""
            );


        const correctIndex =
            rows.findIndex(
                row =>
                    row.is_correct === true
            );


        question.correct_answer =
            correctIndex >= 0
                ? correctIndex
                : null;
    }
}


/* =========================================================
   MIGRATE OLD JSON OPTIONS
========================================================= */

async function migrateOldOptions(
    question
) {

    const oldOptions =
        Array.isArray(
            question.options
        )
            ? question.options
            : [];


    if (
        oldOptions.length === 0
    ) {
        return [];
    }


    const rows =
        oldOptions.map(
            (
                optionText,
                index
            ) => ({

                question_id:
                    question.id,

                option_label:
                    String.fromCharCode(
                        65 + index
                    ),

                option_text:
                    optionText || "",

                is_correct:
                    Number(
                        question.correct_answer
                    ) === index

            })
        );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("question_options")
            .insert(rows)
            .select();


    if (error) {

        console.error(
            "Option migration error:",
            error
        );

        return [];
    }


    console.log(
        "Migrated old options for question:",
        question.id
    );


    return data || [];
}


/* =========================================================
   CREATE QUESTION
========================================================= */

async function createQuestion() {

    if (!examData.id) {

        alert(
            "No examination is currently selected."
        );

        return;
    }


    const questionNumber =
        questions.length + 1;


    const newQuestion = {

        exam_id:
            examData.id,

        question_number:
            questionNumber,

        question_text:
            "",

        question_type:
            "multiple-choice",

        /*
         * Keep this temporarily for compatibility
         * with older pages.
         *
         * question_options is now the source of truth.
         */
        options:
            [],

        correct_answer:
            null,

        answer:
            "",

        marks:
            1,

        media:
            []

    };


    try {

        /* -----------------------------------------
           CREATE QUESTION
        ----------------------------------------- */

        const {
            data,
            error
        } =
            await supabaseClient
                .from("questions")
                .insert(
                    newQuestion
                )
                .select()
                .single();


        if (error) {

            console.error(
                "Unable to create question:",
                error
            );

            alert(
                "Unable to create question."
            );

            return;
        }


        const question =
            {

                ...data,

                options:
                    [],

                optionRows:
                    [],

                media:
                    []

            };


        /* -----------------------------------------
           CREATE FOUR OPTION ROWS
        ----------------------------------------- */

        const optionRows = [

            {
                question_id:
                    data.id,

                option_label:
                    "A",

                option_text:
                    "",

                is_correct:
                    false
            },

            {
                question_id:
                    data.id,

                option_label:
                    "B",

                option_text:
                    "",

                is_correct:
                    false
            },

            {
                question_id:
                    data.id,

                option_label:
                    "C",

                option_text:
                    "",

                is_correct:
                    false
            },

            {
                question_id:
                    data.id,

                option_label:
                    "D",

                option_text:
                    "",

                is_correct:
                    false
            }

        ];


        const {
            data:
                insertedOptions,

            error:
                optionError
        } =
            await supabaseClient
                .from("question_options")
                .insert(
                    optionRows
                )
                .select();


        if (optionError) {

            console.error(
                "Unable to create question options:",
                optionError
            );


            /*
             * Clean up the question if its
             * options could not be created.
             */

            await supabaseClient
                .from("questions")
                .delete()
                .eq(
                    "id",
                    data.id
                );


            alert(
                "Question was created, but its answer options could not be created."
            );

            return;
        }


        question.optionRows =
            insertedOptions || [];


        question.options =
            [
                "",
                "",
                "",
                ""
            ];


        questions.push(
            question
        );


        renderQuestions();


        setTimeout(
            () => {

                const cards =
                    document.querySelectorAll(
                        ".question-card"
                    );


                const lastCard =
                    cards[
                        cards.length - 1
                    ];


                if (lastCard) {

                    lastCard.scrollIntoView({
                        behavior:
                            "smooth",

                        block:
                            "center"
                    });
                }

            },
            100
        );


    } catch (error) {

        console.error(
            "Unexpected question creation error:",
            error
        );
    }
}


/* =========================================================
   UPDATE QUESTION
========================================================= */

async function updateQuestion(
    questionId,
    field,
    value
) {

    const question =
        questions.find(
            item =>
                item.id ===
                questionId
        );


    if (!question) {
        return;
    }


    question[field] =
        value;


    const {
        error
    } =
        await supabaseClient
            .from("questions")
            .update({

                [field]:
                    value

            })
            .eq(
                "id",
                questionId
            );


    if (error) {

        console.error(
            "Question update error:",
            error
        );
    }
}


/* =========================================================
   SYNC LEGACY OPTIONS JSON
========================================================= */

async function syncLegacyOptions(
    question
) {

    const optionTexts =
        Array.isArray(
            question.optionRows
        )
            ? question.optionRows
                .sort(
                    (a, b) =>
                        a.option_label
                            .localeCompare(
                                b.option_label
                            )
                )
                .map(
                    option =>
                        option.option_text ||
                        ""
                )
            : [];


    const correctIndex =
        Array.isArray(
            question.optionRows
        )
            ? question.optionRows.findIndex(
                option =>
                    option.is_correct ===
                    true
            )
            : -1;


    question.options =
        optionTexts;


    question.correct_answer =
        correctIndex >= 0
            ? correctIndex
            : null;


    /*
     * Keep old columns synchronized temporarily.
     * Later, once the student/review pages are migrated,
     * we can remove this compatibility layer.
     */

    const {
        error
    } =
        await supabaseClient
            .from("questions")
            .update({

                options:
                    optionTexts,

                correct_answer:
                    question.correct_answer

            })
            .eq(
                "id",
                question.id
            );


    if (error) {

        console.error(
            "Legacy option sync error:",
            error
        );
    }
}


/* =========================================================
   UPDATE OPTION
========================================================= */

async function updateOption(
    questionId,
    optionIndex,
    value
) {

    const question =
        questions.find(
            item =>
                item.id ===
                questionId
        );


    if (!question) {
        return;
    }


    if (
        !Array.isArray(
            question.optionRows
        )
    ) {

        return;
    }


    const option =
        question.optionRows[
            optionIndex
        ];


    if (!option) {

        console.error(
            "Option row not found:",
            optionIndex
        );

        return;
    }


    option.option_text =
        value;


    const {
        error
    } =
        await supabaseClient
            .from("question_options")
            .update({

                option_text:
                    value

            })
            .eq(
                "id",
                option.id
            );


    if (error) {

        console.error(
            "Option update error:",
            error
        );

        return;
    }


    await syncLegacyOptions(
        question
    );
}


/* =========================================================
   SET CORRECT ANSWER
========================================================= */

async function setCorrectAnswer(
    questionId,
    optionIndex
) {

    const question =
        questions.find(
            item =>
                item.id ===
                questionId
        );


    if (!question) {
        return;
    }


    if (
        !Array.isArray(
            question.optionRows
        )
    ) {
        return;
    }


    const selectedOption =
        question.optionRows[
            optionIndex
        ];


    if (!selectedOption) {
        return;
    }


    try {

        /* -----------------------------------------
           FIRST: SET ALL OPTIONS FALSE
        ----------------------------------------- */

        const {
            error:
                resetError
        } =
            await supabaseClient
                .from("question_options")
                .update({

                    is_correct:
                        false

                })
                .eq(
                    "question_id",
                    questionId
                );


        if (resetError) {

            console.error(
                "Unable to reset correct answers:",
                resetError
            );

            return;
        }


        /* -----------------------------------------
           SECOND: SET SELECTED OPTION TRUE
        ----------------------------------------- */

        const {
            error:
                selectError
        } =
            await supabaseClient
                .from("question_options")
                .update({

                    is_correct:
                        true

                })
                .eq(
                    "id",
                    selectedOption.id
                );


        if (selectError) {

            console.error(
                "Unable to set correct answer:",
                selectError
            );

            return;
        }


        /* -----------------------------------------
           UPDATE LOCAL DATA
        ----------------------------------------- */

        question.optionRows.forEach(
            (
                option,
                index
            ) => {

                option.is_correct =
                    index ===
                    optionIndex;

            }
        );


        question.correct_answer =
            optionIndex;


        await syncLegacyOptions(
            question
        );


        renderQuestions();


    } catch (error) {

        console.error(
            "Unexpected correct-answer error:",
            error
        );
    }
}


/* =========================================================
   TRUE / FALSE ANSWER
========================================================= */

async function setTrueFalseAnswer(
    questionId,
    value
) {

    const question =
        questions.find(
            item =>
                item.id ===
                questionId
        );


    if (!question) {
        return;
    }


    question.answer =
        value;


    await updateQuestion(
        questionId,
        "answer",
        value
    );
}


/* =========================================================
   DELETE QUESTION
========================================================= */

async function deleteQuestion(
    questionId
) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this question?"
        );


    if (!confirmed) {
        return;
    }


    const question =
        questions.find(
            item =>
                item.id ===
                questionId
        );


    if (!question) {
        return;
    }


    try {

        /* -----------------------------------------
           DELETE MEDIA
        ----------------------------------------- */

        if (
            Array.isArray(
                question.media
            )
        ) {

            const paths =
                question.media
                    .filter(
                        media =>
                            media.path
                    )
                    .map(
                        media =>
                            media.path
                    );


            if (
                paths.length > 0
            ) {

                const {
                    error
                } =
                    await supabaseClient
                        .storage
                        .from(
                            "question-media"
                        )
                        .remove(
                            paths
                        );


                if (error) {

                    console.error(
                        "Media deletion error:",
                        error
                    );
                }
            }
        }


        /* -----------------------------------------
           DELETE QUESTION OPTIONS
        ----------------------------------------- */

        const {
            error:
                optionDeleteError
        } =
            await supabaseClient
                .from(
                    "question_options"
                )
                .delete()
                .eq(
                    "question_id",
                    questionId
                );


        if (
            optionDeleteError
        ) {

            console.error(
                "Option deletion error:",
                optionDeleteError
            );

            alert(
                "Unable to delete the question options."
            );

            return;
        }


        /* -----------------------------------------
           DELETE QUESTION
        ----------------------------------------- */

        const {
            error:
                questionDeleteError
        } =
            await supabaseClient
                .from("questions")
                .delete()
                .eq(
                    "id",
                    questionId
                );


        if (
            questionDeleteError
        ) {

            console.error(
                "Question deletion error:",
                questionDeleteError
            );

            alert(
                "Unable to delete question."
            );

            return;
        }


        questions =
            questions.filter(
                question =>
                    question.id !==
                    questionId
            );


        /* -----------------------------------------
           RENUMBER
        ----------------------------------------- */

        for (
            let i = 0;
            i < questions.length;
            i++
        ) {

            questions[i].question_number =
                i + 1;


            await supabaseClient
                .from("questions")
                .update({

                    question_number:
                        i + 1

                })
                .eq(
                    "id",
                    questions[i].id
                );
        }


        renderQuestions();


    } catch (error) {

        console.error(
            "Unexpected delete error:",
            error
        );
    }
}


/* =========================================================
   INSERT TEXT AT CURSOR
========================================================= */

function insertTextAtCursor(
    text
) {

    const selection =
        window.getSelection();


    if (
        !selection ||
        selection.rangeCount === 0
    ) {
        return;
    }


    const range =
        selection.getRangeAt(0);


    range.deleteContents();


    const textNode =
        document.createTextNode(
            text
        );


    range.insertNode(
        textNode
    );


    range.setStartAfter(
        textNode
    );


    range.collapse(
        true
    );


    selection.removeAllRanges();


    selection.addRange(
        range
    );
}


/* =========================================================
   RICH TEXT EDITOR
========================================================= */

function createRichEditor(
    initialValue,
    onChange,
    placeholder
) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "rich-editor";


    const toolbar =
        document.createElement(
            "div"
        );


    toolbar.className =
        "rich-toolbar";


    const buttons = [

        [
            "bold",
            "fa-bold",
            "Bold"
        ],

        [
            "italic",
            "fa-italic",
            "Italic"
        ],

        [
            "underline",
            "fa-underline",
            "Underline"
        ],

        [
            "superscript",
            "fa-superscript",
            "Superscript"
        ],

        [
            "subscript",
            "fa-subscript",
            "Subscript"
        ]

    ];


    buttons.forEach(
        buttonData => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "rich-tool-btn";


            button.title =
                buttonData[2];


            button.innerHTML =
                `
                <i class="fa-solid ${buttonData[1]}"></i>
                `;


            button.addEventListener(
                "mousedown",
                event => {

                    event.preventDefault();


                    document.execCommand(
                        buttonData[0],
                        false,
                        null
                    );


                    editor.focus();


                    onChange(
                        editor.innerHTML
                    );
                }
            );


            toolbar.appendChild(
                button
            );
        }
    );


    const symbols = [

        "√",
        "π",
        "α",
        "β",
        "θ",
        "μ",
        "≤",
        "≥",
        "≠",
        "±",
        "×",
        "÷",
        "→",
        "∞",
        "°"

    ];


    symbols.forEach(
        symbol => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "rich-tool-btn symbol-btn";


            button.textContent =
                symbol;


            button.title =
                `Insert ${symbol}`;


            button.addEventListener(
                "mousedown",
                event => {

                    event.preventDefault();


                    editor.focus();


                    insertTextAtCursor(
                        symbol
                    );


                    onChange(
                        editor.innerHTML
                    );
                }
            );


            toolbar.appendChild(
                button
            );
        }
    );


    const clearButton =
        document.createElement(
            "button"
        );


    clearButton.type =
        "button";


    clearButton.className =
        "rich-tool-btn";


    clearButton.title =
        "Clear formatting";


    clearButton.innerHTML =
        `
        <i class="fa-solid fa-eraser"></i>
        `;


    clearButton.addEventListener(
        "mousedown",
        event => {

            event.preventDefault();


            document.execCommand(
                "removeFormat",
                false,
                null
            );


            editor.focus();


            onChange(
                editor.innerHTML
            );
        }
    );


    toolbar.appendChild(
        clearButton
    );


    wrapper.appendChild(
        toolbar
    );


    const editor =
        document.createElement(
            "div"
        );


    editor.className =
        "rich-editor-content";


    editor.contentEditable =
        "true";


    editor.dataset.placeholder =
        placeholder;


    editor.innerHTML =
    normalizeRichTextHTML(
        initialValue || ""
    );

    editor.addEventListener(
        "input",
        () => {

            onChange(
                editor.innerHTML
            );

        }
    );


    wrapper.appendChild(
        editor
    );


    const hint =
        document.createElement(
            "div"
        );


    hint.className =
        "rich-editor-hint";


    hint.innerHTML =
        `
        <span>
            <i class="fa-solid fa-keyboard"></i>
            Type normally and use the toolbar for
            superscript, subscript and scientific symbols.
        </span>
        `;


    wrapper.appendChild(
        hint
    );


    return wrapper;
}


/* =========================================================
   OPTION EDITOR
========================================================= */

function createOptionEditor(
    question,
    optionIndex
) {

    const option =
        question.optionRows[
            optionIndex
        ];


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "option-input-wrapper";


    const editor =
        document.createElement(
            "div"
        );


    editor.className =
        "option-rich-editor";


    editor.contentEditable =
        "true";


    editor.dataset.placeholder =
        `Option ${String.fromCharCode(
            65 + optionIndex
        )}`;


    editor.innerHTML =
    normalizeRichTextHTML(
        option
            ? option.option_text || ""
            : ""
    );

    let saveTimer;


    editor.addEventListener(
        "input",
        () => {

            clearTimeout(
                saveTimer
            );


            saveTimer =
                setTimeout(
                    () => {

                        updateOption(
                            question.id,
                            optionIndex,
                            editor.innerHTML
                        );

                    },
                    350
                );
        }
    );


    wrapper.appendChild(
        editor
    );


    const toolbar =
        document.createElement(
            "div"
        );


    toolbar.className =
        "option-format-toolbar";


    const tools = [

        [
            "superscript",
            "fa-superscript"
        ],

        [
            "subscript",
            "fa-subscript"
        ]

    ];


    tools.forEach(
        tool => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.innerHTML =
                `
                <i class="fa-solid ${tool[1]}"></i>
                `;


            button.addEventListener(
                "mousedown",
                event => {

                    event.preventDefault();


                    document.execCommand(
                        tool[0],
                        false,
                        null
                    );


                    editor.focus();


                    updateOption(
                        question.id,
                        optionIndex,
                        editor.innerHTML
                    );
                }
            );


            toolbar.appendChild(
                button
            );
        }
    );


    wrapper.appendChild(
        toolbar
    );


    return wrapper;
}


/* =========================================================
   QUESTION CARD
========================================================= */

function createQuestionCard(
    question,
    index
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "question-card";


    /* HEADER */

    const header =
        document.createElement(
            "div"
        );


    header.className =
        "question-card-header";


    const number =
        document.createElement(
            "div"
        );


    number.className =
        "question-number";


    number.innerHTML =
        `
        <div class="question-number-badge">
            ${index + 1}
        </div>

        <div>
            <span>
                Question ${index + 1}
            </span>
        </div>
        `;


    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "question-actions";


    const deleteBtn =
        document.createElement(
            "button"
        );


    deleteBtn.type =
        "button";


    deleteBtn.className =
        "question-action-btn delete";


    deleteBtn.innerHTML =
        `
        <i class="fa-solid fa-trash"></i>
        `;


    deleteBtn.addEventListener(
        "click",
        () =>
            deleteQuestion(
                question.id
            )
    );


    actions.appendChild(
        deleteBtn
    );


    header.appendChild(
        number
    );


    header.appendChild(
        actions
    );


    card.appendChild(
        header
    );


    /* BODY */

    const body =
        document.createElement(
            "div"
        );


    body.className =
        "question-card-body";


    /* SETTINGS */

    const settings =
        document.createElement(
            "div"
        );


    settings.className =
        "question-settings-row";


    /* TYPE */

    const typeGroup =
        document.createElement(
            "div"
        );


    typeGroup.className =
        "form-group";


    const typeLabel =
        document.createElement(
            "label"
        );


    typeLabel.className =
        "form-label";


    typeLabel.textContent =
        "Question Type";


    const typeSelect =
        document.createElement(
            "select"
        );


    typeSelect.className =
        "form-select";


    typeSelect.innerHTML =
        `
        <option value="multiple-choice">
            Multiple Choice
        </option>

        <option value="true-false">
            True / False
        </option>

        <option value="fill-gap">
            Fill in the Gap
        </option>
        `;


    typeSelect.value =
        question.question_type ||
        "multiple-choice";


    typeSelect.addEventListener(
        "change",
        async () => {

            const type =
                typeSelect.value;


            await updateQuestion(
                question.id,
                "question_type",
                type
            );


            renderQuestions();
        }
    );


    typeGroup.appendChild(
        typeLabel
    );


    typeGroup.appendChild(
        typeSelect
    );


    /* MARKS */

    const marksGroup =
        document.createElement(
            "div"
        );


    marksGroup.className =
        "form-group";


    const marksLabel =
        document.createElement(
            "label"
        );


    marksLabel.className =
        "form-label";


    marksLabel.textContent =
        "Marks";


    const marksInput =
        document.createElement(
            "input"
        );


    marksInput.type =
        "number";


    marksInput.min =
        "1";


    marksInput.step =
        "1";


    marksInput.className =
        "form-input";


    marksInput.value =
        Number(
            question.marks
        ) || 1;


    marksInput.addEventListener(
        "change",
        () => {

            updateQuestion(
                question.id,
                "marks",
                Number(
                    marksInput.value
                ) || 1
            );
        }
    );


    marksGroup.appendChild(
        marksLabel
    );


    marksGroup.appendChild(
        marksInput
    );


    settings.appendChild(
        typeGroup
    );


    settings.appendChild(
        marksGroup
    );


    body.appendChild(
        settings
    );


    /* QUESTION TEXT */

    const textGroup =
        document.createElement(
            "div"
        );


    textGroup.className =
        "form-group";


    const textLabel =
        document.createElement(
            "label"
        );


    textLabel.className =
        "form-label";


    textLabel.innerHTML =
        `
        <span>Question</span>

        <small>
            Text + mathematical/scientific formatting
        </small>
        `;


    const editor =
        createRichEditor(

            question.question_text ||
            "",

            value => {

                updateQuestion(
                    question.id,
                    "question_text",
                    value
                );

            },

            "Enter your question here..."
        );


    textGroup.appendChild(
        textLabel
    );


    textGroup.appendChild(
        editor
    );


    body.appendChild(
        textGroup
    );


    /* MEDIA */

    body.appendChild(
        renderMedia(
            question
        )
    );


    /* MCQ */

    if (
        question.question_type ===
        "multiple-choice"
    ) {

        body.appendChild(
            renderMultipleChoice(
                question
            )
        );
    }


    /* TRUE/FALSE */

    if (
        question.question_type ===
        "true-false"
    ) {

        body.appendChild(
            renderTrueFalse(
                question
            )
        );
    }


    /* FILL GAP */

    if (
        question.question_type ===
        "fill-gap"
    ) {

        body.appendChild(
            renderFillGap(
                question
            )
        );
    }


    card.appendChild(
        body
    );


    return card;
}


/* =========================================================
   MULTIPLE CHOICE
========================================================= */

function renderMultipleChoice(
    question
) {

    const group =
        document.createElement(
            "div"
        );


    group.className =
        "form-group";


    const label =
        document.createElement(
            "label"
        );


    label.className =
        "form-label";


    label.innerHTML =
        `
        <span>Answer Options</span>

        <small>
            Click ✓ to mark the correct answer
        </small>
        `;


    group.appendChild(
        label
    );


    const container =
        document.createElement(
            "div"
        );


    container.className =
        "options-container";


    const rows =
        Array.isArray(
            question.optionRows
        )
            ? question.optionRows
            : [];


    rows.forEach(
        (
            option,
            index
        ) => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "option-row";


            if (
                option.is_correct
            ) {

                row.classList.add(
                    "correct"
                );
            }


            const optionLabel =
                document.createElement(
                    "div"
                );


            optionLabel.className =
                "option-label";


            optionLabel.textContent =
                option.option_label ||
                String.fromCharCode(
                    65 + index
                );


            const editor =
                createOptionEditor(
                    question,
                    index
                );


            const correctBtn =
                document.createElement(
                    "button"
                );


            correctBtn.type =
                "button";


            correctBtn.className =
                "option-correct-btn";


            if (
                option.is_correct
            ) {

                correctBtn.classList.add(
                    "selected"
                );
            }


            correctBtn.innerHTML =
                `
                <i class="fa-solid fa-check"></i>
                `;


            correctBtn.title =
                "Mark as correct answer";


            correctBtn.addEventListener(
                "click",
                () => {

                    setCorrectAnswer(
                        question.id,
                        index
                    );
                }
            );


            row.appendChild(
                optionLabel
            );


            row.appendChild(
                editor
            );


            row.appendChild(
                correctBtn
            );


            container.appendChild(
                row
            );
        }
    );


    group.appendChild(
        container
    );


    return group;
}


/* =========================================================
   TRUE / FALSE
========================================================= */
function renderTrueFalse(question) {

    const group =
        document.createElement("div");

    group.className =
        "form-group true-false-group";


    const label =
        document.createElement("label");

    label.className =
        "form-label";

    label.textContent =
        "Correct Answer";


    const container =
        document.createElement("div");

    container.className =
        "true-false-options";


    ["true", "false"].forEach(value => {

        const button =
            document.createElement("button");

        button.type =
            "button";

        button.className =
            "tf-option";


        /* -----------------------------------------
           SHOW CURRENT SELECTION
        ----------------------------------------- */

        if (
            normalizeAnswer(question.answer) ===
            value
        ) {

            button.classList.add(
                "selected"
            );
        }


        /* -----------------------------------------
           BUTTON CONTENT
        ----------------------------------------- */

        button.innerHTML =
            `
            <span class="tf-check">
                <i class="fa-solid fa-check"></i>
            </span>

            <span>
                ${
                    value === "true"
                        ? "True"
                        : "False"
                }
            </span>
            `;


        /* -----------------------------------------
           CLICK
        ----------------------------------------- */

        button.addEventListener(
            "click",
            async () => {

                await setTrueFalseAnswer(
                    question.id,
                    value
                );

                /*
                 * Update local state immediately
                 */

                question.answer =
                    value;


                /*
                 * Refresh the question card
                 * so the selected state becomes visible.
                 */

                renderQuestions();

            }
        );


        container.appendChild(
            button
        );

    });


    group.appendChild(
        label
    );

    group.appendChild(
        container
    );


    return group;
}

/* =========================================================
   FILL IN GAP
========================================================= */

function renderFillGap(
    question
) {

    const group =
        document.createElement(
            "div"
        );


    group.className =
        "form-group fill-gap-wrapper";


    const label =
        document.createElement(
            "label"
        );


    label.className =
        "form-label";


    label.textContent =
        "Correct Answer";


    const input =
        document.createElement(
            "input"
        );


    input.type =
        "text";


    input.className =
        "form-input fill-gap-answer";


    input.placeholder =
        "Example: 49, H₂O, ₦5000, Abuja";


    input.value =
        stripHTML(
            question.answer ||
            ""
        );


    let saveTimer;


    input.addEventListener(
        "input",
        () => {

            question.answer =
                input.value;


            clearTimeout(
                saveTimer
            );


            saveTimer =
                setTimeout(
                    () => {

                        updateQuestion(
                            question.id,
                            "answer",
                            input.value
                        );

                    },
                    350
                );
        }
    );


    const note =
        document.createElement(
            "div"
        );


    note.className =
        "fill-gap-note";


    note.textContent =
        "Answers may be words, numbers, amounts, decimals or short answers. Capitalization and extra spaces will be normalized during grading.";


    group.appendChild(
        label
    );


    group.appendChild(
        input
    );


    group.appendChild(
        note
    );


    return group;
}

/* =========================================================
   RENDER QUESTIONS
   Includes Add Question button at the bottom
========================================================= */

function renderQuestions() {

    questionsList.innerHTML = "";


    /* -----------------------------------------------------
       RENDER ALL QUESTIONS
    ----------------------------------------------------- */

    questions.forEach(
        (
            question,
            index
        ) => {

            questionsList.appendChild(
                createQuestionCard(
                    question,
                    index
                )
            );

        }
    );


    /* -----------------------------------------------------
       BOTTOM ADD QUESTION BUTTON
    ----------------------------------------------------- */

    if (
        questions.length > 0
    ) {

        const bottomAddContainer =
            document.createElement(
                "div"
            );

        bottomAddContainer.className =
            "bottom-add-question";


        const bottomAddButton =
            document.createElement(
                "button"
            );

        bottomAddButton.type =
            "button";

        bottomAddButton.className =
            "add-question-btn bottom-add-btn";


        bottomAddButton.innerHTML = `
            <i class="fa-solid fa-plus"></i>
            Add Question
        `;


        bottomAddButton.addEventListener(
            "click",
            async function () {

                await createQuestion();

            }
        );


        bottomAddContainer.appendChild(
            bottomAddButton
        );


        questionsList.appendChild(
            bottomAddContainer
        );

    }


    /* -----------------------------------------------------
       UPDATE QUESTION COUNT
    ----------------------------------------------------- */

    updateQuestionCount();


    /* -----------------------------------------------------
       UPDATE EMPTY STATE
    ----------------------------------------------------- */

    updateEmptyState();

}


/* =========================================================
   QUESTION COUNT
========================================================= */

function updateQuestionCount() {

    questionTotal.textContent =
        questions.length;
}


/* =========================================================
   EMPTY STATE
========================================================= */

function updateEmptyState() {

    emptyState.style.display =
        questions.length === 0
            ? "block"
            : "none";
}


/* =========================================================
   VALIDATE
========================================================= */

function validateQuestions() {

    if (
        questions.length ===
        0
    ) {

        alert(
            "Please add at least one question."
        );

        return false;
    }


    for (
        let i = 0;
        i < questions.length;
        i++
    ) {

        const question =
            questions[i];


        if (
            !stripHTML(
                question.question_text
            ).trim()
        ) {

            alert(
                `Please enter the question text for Question ${i + 1}.`
            );

            return false;
        }


        /* MCQ */

        if (
            question.question_type ===
            "multiple-choice"
        ) {

            if (
                !Array.isArray(
                    question.optionRows
                ) ||
                question.optionRows.length !==
                4
            ) {

                alert(
                    `Question ${i + 1} must have four answer options.`
                );

                return false;
            }


            const emptyOption =
                question.optionRows.some(
                    option =>
                        !stripHTML(
                            option.option_text
                        ).trim()
                );


            if (emptyOption) {

                alert(
                    `Please complete all answer options for Question ${i + 1}.`
                );

                return false;
            }


            const hasCorrect =
                question.optionRows.some(
                    option =>
                        option.is_correct ===
                        true
                );


            if (!hasCorrect) {

                alert(
                    `Please select the correct answer for Question ${i + 1}.`
                );

                return false;
            }
        }


        /* TRUE/FALSE */

        if (
            question.question_type ===
            "true-false"
        ) {

            if (
                question.answer !==
                    "true" &&
                question.answer !==
                    "false"
            ) {

                alert(
                    `Please select True or False for Question ${i + 1}.`
                );

                return false;
            }
        }


        /* FILL GAP */

        if (
            question.question_type ===
            "fill-gap"
        ) {

            if (
                !normalizeAnswer(
                    question.answer
                )
            ) {

                alert(
                    `Please enter the correct answer for Question ${i + 1}.`
                );

                return false;
            }
        }


        if (
            Number(
                question.marks
            ) < 1
        ) {

            alert(
                `Question ${i + 1} must have at least 1 mark.`
            );

            return false;
        }
    }


    return true;
}


/* =========================================================
   CONTINUE
========================================================= */

function continueToReview() {

    if (
        !validateQuestions()
    ) {
        return;
    }


    const completeExam = {

        ...examData,

        questions:
            questions,

        totalQuestions:
            questions.length,

        createdAt:
            new Date().toISOString()

    };


    localStorage.setItem(
        "gracextolCompleteExam",
        JSON.stringify(
            completeExam
        )
    );


    window.location.href =
        "review-exam.html";
}


/* =========================================================
   MEDIA
========================================================= */

function getMediaIcon(type) {

    const icons = {

        image:
            "fa-image",

        video:
            "fa-video",

        audio:
            "fa-volume-high",

        file:
            "fa-file",

        link:
            "fa-link"

    };


    return (
        icons[type] ||
        "fa-paperclip"
    );
}


function createMediaItem(
    question,
    media
) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "media-item";


    const info =
        document.createElement(
            "div"
        );


    info.className =
        "media-item-info";


    info.innerHTML =
        `
        <i class="fa-solid ${getMediaIcon(
            media.type
        )}"></i>

        <span>
            ${escapeHTML(
                media.name ||
                "Attached media"
            )}
        </span>
        `;


    wrapper.appendChild(
        info
    );


    const removeBtn =
        document.createElement(
            "button"
        );


    removeBtn.type =
        "button";


    removeBtn.className =
        "remove-media-btn";


    removeBtn.innerHTML =
        `
        <i class="fa-solid fa-xmark"></i>
        `;


    removeBtn.addEventListener(
        "click",
        () => {

            removeMedia(
                question.id,
                media.id
            );
        }
    );


    wrapper.appendChild(
        removeBtn
    );


    const url =
        media.url ||
        media.data;


    if (
        media.type ===
        "image" &&
        url
    ) {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            url;


        image.alt =
            media.name ||
            "Question image";


        image.className =
            "question-media-image";


        wrapper.appendChild(
            image
        );
    }


    if (
        media.type ===
        "video" &&
        url
    ) {

        const video =
            document.createElement(
                "video"
            );


        video.controls =
            true;


        video.src =
            url;


        video.className =
            "question-media-video";


        wrapper.appendChild(
            video
        );
    }


    if (
        media.type ===
        "audio" &&
        url
    ) {

        const audio =
            document.createElement(
                "audio"
            );


        audio.controls =
            true;


        audio.src =
            url;


        wrapper.appendChild(
            audio
        );
    }


    if (
        media.type ===
        "file" &&
        url
    ) {

        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.target =
            "_blank";


        link.rel =
            "noopener noreferrer";


        link.textContent =
            `View ${media.name || "file"}`;


        wrapper.appendChild(
            link
        );
    }


    if (
        media.type ===
        "link" &&
        url
    ) {

        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.target =
            "_blank";


        link.rel =
            "noopener noreferrer";


        link.textContent =
            url;


        wrapper.appendChild(
            link
        );
    }


    return wrapper;
}


/* =========================================================
   MEDIA SECTION
========================================================= */

function renderMedia(
    question
) {

    const section =
        document.createElement(
            "div"
        );


    section.className =
        "media-section";


    const heading =
        document.createElement(
            "div"
        );


    heading.className =
        "media-heading";


    heading.innerHTML =
        "<strong>Question Media</strong>";


    section.appendChild(
        heading
    );


    const toolbar =
        document.createElement(
            "div"
        );


    toolbar.className =
        "media-buttons";


    function createFileButton(
        label,
        icon,
        accept,
        type
    ) {

        const input =
            document.createElement(
                "input"
            );


        input.type =
            "file";


        input.accept =
            accept;


        input.style.display =
            "none";


        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "media-btn";


        button.innerHTML =
            `
            <i class="fa-solid ${icon}"></i>
            ${label}
            `;


        button.addEventListener(
            "click",
            () =>
                input.click()
        );


        input.addEventListener(
            "change",
            () => {

                if (
                    input.files &&
                    input.files[0]
                ) {

                    addFileMedia(
                        question.id,
                        input.files[0],
                        type
                    );
                }
            }
        );


        toolbar.appendChild(
            button
        );


        toolbar.appendChild(
            input
        );
    }


    createFileButton(
        "Add Image",
        "fa-image",
        "image/*",
        "image"
    );


    createFileButton(
        "Add Video",
        "fa-video",
        "video/*",
        "video"
    );


    createFileButton(
        "Add Audio",
        "fa-volume-high",
        "audio/*",
        "audio"
    );


    createFileButton(
        "Attach File",
        "fa-paperclip",
        ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt",
        "file"
    );


    const linkButton =
        document.createElement(
            "button"
        );


    linkButton.type =
        "button";


    linkButton.className =
        "media-btn";


    linkButton.innerHTML =
        `
        <i class="fa-solid fa-link"></i>
        Add Link
        `;


    linkButton.addEventListener(
        "click",
        () => {

            const url =
                prompt(
                    "Paste the website or resource link:"
                );


            if (url) {

                addLinkMedia(
                    question.id,
                    url
                );
            }
        }
    );


    toolbar.appendChild(
        linkButton
    );


    section.appendChild(
        toolbar
    );


    const preview =
        document.createElement(
            "div"
        );


    preview.className =
        "media-preview";


    if (
        !Array.isArray(
            question.media
        ) ||
        question.media.length ===
        0
    ) {

        preview.innerHTML =
            `
            <div class="media-empty">
                <i class="fa-solid fa-paperclip"></i>
                No media attached. Media is optional.
            </div>
            `;

    } else {

        question.media.forEach(
            media => {

                preview.appendChild(
                    createMediaItem(
                        question,
                        media
                    )
                );
            }
        );
    }


    section.appendChild(
        preview
    );


    return section;
}


/* =========================================================
   UPLOAD MEDIA
========================================================= */

async function addFileMedia(
    questionId,
    file,
    mediaType
) {

    const question =
        questions.find(
            item =>
                item.id ===
                questionId
        );


    if (!question) {
        return;
    }


    const maxSize =
        50 *
        1024 *
        1024;


    if (
        file.size >
        maxSize
    ) {

        alert(
            "This file is too large. Maximum size is 50 MB."
        );

        return;
    }


    try {

        const uniqueId =
            createId();


        const safeName =
            file.name.replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );


        const path =
            `questions/${questionId}/${uniqueId}-${safeName}`;


        const {
            error:
                uploadError
        } =
            await supabaseClient
                .storage
                .from(
                    "question-media"
                )
                .upload(
                    path,
                    file,
                    {

                        cacheControl:
                            "3600",

                        upsert:
                            false,

                        contentType:
                            file.type

                    }
                );


        if (uploadError) {

            console.error(
                "Media upload error:",
                uploadError
            );

            alert(
                "Unable to upload media."
            );

            return;
        }


        const {
            data:
                publicData
        } =
            supabaseClient
                .storage
                .from(
                    "question-media"
                )
                .getPublicUrl(
                    path
                );


        if (
            !Array.isArray(
                question.media
            )
        ) {

            question.media =
                [];
        }


        question.media.push({

            id:
                uniqueId,

            type:
                mediaType,

            name:
                file.name,

            size:
                file.size,

            mimeType:
                file.type,

            path:
                path,

            url:
                publicData.publicUrl

        });


        const {
            error
        } =
            await supabaseClient
                .from("questions")
                .update({

                    media:
                        question.media

                })
                .eq(
                    "id",
                    questionId
                );


        if (error) {

            console.error(
                "Media information error:",
                error
            );

            return;
        }


        renderQuestions();


    } catch (error) {

        console.error(
            "Unexpected media error:",
            error
        );
    }
}


/* =========================================================
   REMOVE MEDIA
========================================================= */

async function removeMedia(
    questionId,
    mediaId
) {

    const question =
        questions.find(
            item =>
                item.id ===
                questionId
        );


    if (!question) {
        return;
    }


    const media =
        question.media.find(
            item =>
                item.id ===
                mediaId
        );


    if (!media) {
        return;
    }


    if (media.path) {

        await supabaseClient
            .storage
            .from(
                "question-media"
            )
            .remove([
                media.path
            ]);
    }


    question.media =
        question.media.filter(
            item =>
                item.id !==
                mediaId
        );


    const {
        error
    } =
        await supabaseClient
            .from("questions")
            .update({

                media:
                    question.media

            })
            .eq(
                "id",
                questionId
            );


    if (error) {

        console.error(
            "Media update error:",
            error
        );

        return;
    }


    renderQuestions();
}


/* =========================================================
   ADD LINK
========================================================= */

async function addLinkMedia(
    questionId,
    url
) {

    const question =
        questions.find(
            item =>
                item.id ===
                questionId
        );


    if (!question) {
        return;
    }


    url =
        url.trim();


    if (!url) {
        return;
    }


    if (
        !url.startsWith(
            "http://"
        ) &&
        !url.startsWith(
            "https://"
        )
    ) {

        url =
            "https://" +
            url;
    }


    if (
        !Array.isArray(
            question.media
        )
    ) {

        question.media =
            [];
    }


    question.media.push({

        id:
            createId(),

        type:
            "link",

        name:
            url,

        url:
            url

    });


    const {
        error
    } =
        await supabaseClient
            .from("questions")
            .update({

                media:
                    question.media

            })
            .eq(
                "id",
                questionId
            );


    if (error) {

        console.error(
            "Link save error:",
            error
        );

        return;
    }


    renderQuestions();
}


/* =========================================================
   BUTTON EVENTS
========================================================= */

function normalizeAIQuestions(
    result,
    type,
    difficulty
) {

    const source =
        Array.isArray(result)
            ? result
            : result?.questions ||
                result?.result?.questions;

    if (!Array.isArray(source) || source.length === 0) {

        throw new Error(
            "The AI response does not contain any questions."
        );
    }

    const teacherType =
        normalizeAIQuestionType(
            type
        );

    console.log(
        "[AI] Selected type:",
        type
    );

    return source.map(
        (item, index) => {

            console.log(
                "[AI] Raw question:",
                item
            );

            const responseTypes = [
                item.questionType,
                item.question_type,
                item.type
            ];

            const questionType =
                responseTypes
                    .map(
                        value =>
                            normalizeAIQuestionType(
                                value
                            )
                    )
                    .find(
                        value =>
                            Boolean(value) &&
                            value !== "mixed"
                    ) ||
                (
                    teacherType &&
                    teacherType !== "mixed"
                        ? teacherType
                        : inferAIQuestionType(
                            item
                        )
                );

            if (!questionType) {

                throw new Error(
                    `AI question ${index + 1} has no safely recognizable question type.`
                );
            }

            console.log(
                "[AI] Normalized type:",
                questionType
            );

            const options =
                questionType === "multiple-choice"
                    ? [
                        item.optionA,
                        item.optionB,
                        item.optionC,
                        item.optionD
                    ]
                    : [];

            const answer =
                String(
                    item.correctAnswer ??
                    item.correct_answer ??
                    ""
                ).trim();

            if (!String(item.question || "").trim()) {
                throw new Error(
                    `AI question ${index + 1} is missing question text.`
                );
            }

            if (questionType === "multiple-choice" &&
                (options.some(option => !String(option || "").trim()) ||
                    !["A", "B", "C", "D"].includes(answer.toUpperCase()))) {

                throw new Error(
                    `AI question ${index + 1} must contain options A-D and a valid correctAnswer.`
                );
            }

            const normalizedAnswer =
                questionType === "multiple-choice"
                    ? answer.toUpperCase().charAt(0)
                    : questionType === "true-false"
                        ? answer.toLowerCase()
                        : answer;

            if (questionType === "true-false" &&
                String(item.optionA || "").trim().toLowerCase() !== "true" ||
                questionType === "true-false" &&
                String(item.optionB || "").trim().toLowerCase() !== "false") {

                throw new Error(
                    `AI question ${index + 1} must contain True and False options.`
                );
            }

            if (questionType === "true-false" &&
                !["a", "b", "true", "false"].includes(
                    normalizedAnswer
                )) {

                throw new Error(
                    `AI question ${index + 1} must have correct answer A or B.`
                );
            }

            if (questionType === "fill-gap" && !normalizedAnswer) {

                throw new Error(
                    `AI question ${index + 1} must contain an answer.`
                );
            }

            const correctIndex =
                questionType === "multiple-choice"
                    ? normalizedAnswer.charCodeAt(0) - 65
                    : null;

            const trueFalseAnswer =
                questionType === "true-false"
                    ? normalizedAnswer === "a" ||
                        normalizedAnswer === "true"
                        ? "true"
                        : "false"
                    : normalizedAnswer;

            if (questionType === "fill-gap") {

                console.log(
                    "[AI DEBUG] Fill-gap answer:",
                    normalizedAnswer
                );
            }

            return {

                exam_id:
                    examData.id,

                question_number:
                    questions.length + index + 1,

                question_text:
                    String(item.question).trim(),

                question_type:
                    questionType,

                options,

                correct_answer:
                    correctIndex,

                answer:
                    questionType === "multiple-choice"
                        ? options[correctIndex]
                        : questionType === "true-false"
                            ? trueFalseAnswer
                            : normalizedAnswer,

                explanation:
                    item.explanation || "",

                difficulty:
                    item.difficulty || difficulty,

                marks:
                    Number(item.marks) || 1,

                media: []
            };
        }
    );
}


function normalizeAIQuestionType(
    value
) {

    const normalized =
        String(value || "")
            .toLowerCase()
            .trim()
            .replace(/[_ ]+/g, "-");

    if (normalized === "true/false" ||
        normalized === "true-false" ||
        normalized === "truefalse" ||
        normalized === "true-or-false" ||
        normalized === "boolean" ||
        normalized === "tf") {
        return "true-false";
    }

    if (normalized === "fill-in-the-gap" ||
        normalized === "fill-gap" ||
        normalized === "fill-in-gap" ||
        normalized === "fillgap" ||
        normalized === "fill-in-the-blank" ||
        normalized === "fillblank") {
        return "fill-gap";
    }

    if (normalized === "multiple-choice" ||
        normalized === "multiplechoice" ||
        normalized === "mcq") {
        return "multiple-choice";
    }

    if (normalized === "mixed") {
        return "mixed";
    }

    return "";
}


function inferAIQuestionType(
    item
) {

    const optionA =
        String(item.optionA || "").trim();

    const optionB =
        String(item.optionB || "").trim();

    const optionC =
        String(item.optionC || "").trim();

    const optionD =
        String(item.optionD || "").trim();

    const correctAnswer =
        String(
            item.correctAnswer ??
            item.correct_answer ??
            ""
        )
            .trim()
            .toUpperCase();

    const isMultipleChoice =
        Boolean(optionA) &&
        Boolean(optionB) &&
        Boolean(optionC) &&
        Boolean(optionD) &&
        ["A", "B", "C", "D"].includes(
            correctAnswer
        );

    if (isMultipleChoice) {
        return "multiple-choice";
    }

    const isTrueFalse =
        optionA.toLowerCase() === "true" &&
        optionB.toLowerCase() === "false" &&
        !optionC &&
        !optionD &&
        ["A", "B"].includes(
            correctAnswer
        );

    if (isTrueFalse) {
        return "true-false";
    }

    if (!optionA &&
        !optionB &&
        !optionC &&
        !optionD &&
        Boolean(correctAnswer)) {
        return "fill-gap";
    }

    return "";
}


function renderAIQuestionReview() {

    const review =
        document.getElementById(
            "aiQuestionReview"
        );

    const generatedQuestions =
        Array.isArray(window.gracextolAIQuestions)
            ? window.gracextolAIQuestions
            : [];

    if (!review) {
        return;
    }

    review.innerHTML = "";
    review.style.display =
        generatedQuestions.length > 0
            ? "block"
            : "none";

    generatedQuestions.forEach(
        (question, index) => {

            const item =
                document.createElement("article");

            item.className =
                "ai-review-item";

            item.innerHTML =
                `<h4>Question ${index + 1} | ${question.question_type} | ${question.difficulty}</h4>` +
                `<p class="ai-review-question"></p>`;

            item.querySelector(
                ".ai-review-question"
            ).textContent =
                question.question_text;

            if (question.options.length > 0) {

                const options =
                    document.createElement("ol");

                question.options.forEach(
                    (option, optionIndex) => {

                        const optionItem =
                            document.createElement("li");

                        optionItem.textContent =
                            option;

                        if (optionIndex === question.correct_answer) {
                            optionItem.className = "correct";
                        }

                        options.appendChild(optionItem);
                    }
                );

                item.appendChild(options);
            }

            const details =
                document.createElement("p");

            details.className =
                "ai-review-explanation";

            details.textContent =
                question.explanation
                    ? `Answer: ${question.answer} | Explanation: ${question.explanation}`
                    : `Answer: ${question.answer}`;

            item.appendChild(details);

            const actions =
                document.createElement("div");

            actions.className =
                "ai-review-actions";

            const approve =
                document.createElement("button");

            approve.type = "button";
            approve.textContent = "Approve and add";
            approve.className = "ai-review-approve";

            approve.addEventListener(
                "click",
                async () => {

                    approve.disabled = true;
                    question.question_number =
                        questions.length + 1;

                    try {

                        await saveApprovedAIQuestions([
                            question
                        ]);

                        window.gracextolAIQuestions =
                            window.gracextolAIQuestions.filter(
                                item => item !== question
                            );

                        renderAIQuestionReview();

                    } catch (error) {

                        approve.disabled = false;

                        alert(
                            "Unable to save this question. Please try again."
                        );
                    }
                }
            );

            const reject =
                document.createElement("button");

            reject.type = "button";
            reject.textContent = "Reject";
            reject.className = "ai-review-reject";

            reject.addEventListener(
                "click",
                () => {

                    window.gracextolAIQuestions =
                        window.gracextolAIQuestions.filter(
                            item => item !== question
                        );

                    renderAIQuestionReview();
                }
            );

            actions.appendChild(approve);
            actions.appendChild(reject);
            item.appendChild(actions);
            review.appendChild(item);
        }
    );
}

if (addQuestionBtn) {

    addQuestionBtn.addEventListener(
        "click",
        createQuestion
    );
}


if (emptyAddBtn) {

    emptyAddBtn.addEventListener(
        "click",
        createQuestion
    );
}


if (continueReviewBtn) {

    continueReviewBtn.addEventListener(
        "click",
        continueToReview
    );
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "Gracextol Question Builder Loaded."
        );


        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            alert(
                "Supabase is not connected."
            );

            return;
        }


        if (
            !loadExamData()
        ) {
            return;
        }


        await loadQuestions();
    }
);