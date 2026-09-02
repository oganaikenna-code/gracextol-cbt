/* =========================================================
   GRACEXTOL CBT
   REVIEW & PUBLISH JAVASCRIPT
   SUPABASE / MEDIA ENABLED VERSION
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const examTitle =
        document.getElementById("reviewExamTitle");

    const subject =
        document.getElementById("reviewSubject");

    const examClass =
        document.getElementById("reviewClass");

    const duration =
        document.getElementById("reviewDuration");

    const questionCount =
        document.getElementById("reviewQuestionCount");

    const totalMarks =
        document.getElementById("reviewTotalMarks");

    const instructions =
        document.getElementById("reviewInstructions");

    const questionBadgeCount =
        document.getElementById("questionBadgeCount");

    const questionsList =
        document.getElementById("reviewQuestionsList");

    const publishButton =
        document.getElementById("publishExamBtn");

    const successModal =
        document.getElementById("successModal");

    const closeSuccessModal =
        document.getElementById("closeSuccessModal");

    /* =====================================================
       ACCESS CODE ELEMENTS
    ===================================================== */

    const examAccessCode =
        document.getElementById("examAccessCode");

    const copyAccessCodeBtn =
        document.getElementById("copyAccessCodeBtn");

    const copyCodeMessage =
        document.getElementById("copyCodeMessage");


    /* =====================================================
       VERIFY SUPABASE CONNECTION
    ===================================================== */

    if (
        typeof supabaseClient === "undefined"
    ) {

        console.error(
            "Supabase client was not found."
        );

        alert(
            "Supabase connection is not available. Please check that your shared Supabase configuration is loaded before review-exam.js."
        );

        return;

    }


    console.log(
        "Review Exam: Supabase client detected."
    );


    /* =====================================================
       LOCAL STORAGE HELPER
    ===================================================== */

    function getStorageValue(keys) {

        for (const key of keys) {

            const value =
                localStorage.getItem(key);

            if (value !== null) {

                try {

                    return JSON.parse(value);

                }

                catch (error) {

                    return value;

                }

            }

        }


        return null;

    }


    /* =====================================================
       PARSE JSON SAFELY
    ===================================================== */

    function parseJSON(value, fallback) {

        if (
            value === null ||
            value === undefined
        ) {

            return fallback;

        }


        if (
            Array.isArray(value) ||
            typeof value === "object"
        ) {

            return value;

        }


        if (
            typeof value === "string"
        ) {

            try {

                return JSON.parse(value);

            }

            catch (error) {

                return fallback;

            }

        }


        return fallback;

    }


    /* =====================================================
       GET EXAM DATA
    ===================================================== */

    let examData =
        getStorageValue([
            "gracextolCompleteExam",
            "gracextolExam",
            "currentExam",
            "examData",
            "examDetails",
            "createdExam"
        ]);


    if (
        !examData ||
        typeof examData !== "object"
    ) {

        examData = {};

    }


    /* =====================================================
       GET EXAM ID
    ===================================================== */

    const examId =
        examData.id ||
        examData.exam_id ||
        null;


    console.log(
        "Current examination ID:",
        examId
    );


    /* =====================================================
       EXAM DETAILS
    ===================================================== */

    const title =
        examData.title ||
        examData.examTitle ||
        examData.name ||
        examData.examinationTitle ||
        "Untitled Examination";


    const examSubject =
        examData.subject ||
        examData.course ||
        examData.subjectName ||
        examData.courseName ||
        "Not specified";


    const level =
        examData.classLevel ||
        examData.class_level ||
        examData.class ||
        examData.level ||
        examData.category ||
        examData.examCategory ||
        "Not specified";


    const examDuration =
        examData.duration ||
        examData.time ||
        examData.durationMinutes ||
        "Not specified";


    const examInstructions =
        examData.instructions ||
        examData.instruction ||
        examData.examInstructions ||
        "No instructions provided.";


    /* =====================================================
       DISPLAY EXAM DETAILS
    ===================================================== */

    if (examTitle) {

        examTitle.textContent =
            title;

    }


    if (subject) {

        subject.textContent =
            examSubject;

    }


    if (examClass) {

        examClass.textContent =
            level;

    }


    if (duration) {

        duration.textContent =
            typeof examDuration === "number"
                ? `${examDuration} minutes`
                : examDuration;

    }


    if (instructions) {

        instructions.textContent =
            examInstructions;

    }


    /* =====================================================
       GET QUESTIONS
    ===================================================== */

    let questions =
        examData.questions;


    if (!Array.isArray(questions)) {

        questions =
            getStorageValue([
                "gracextolQuestions",
                "gracextol_questions",
                "examQuestions",
                "questions",
                "currentQuestions",
                "createdQuestions"
            ]);

    }


    if (
        questions &&
        !Array.isArray(questions)
    ) {

        if (
            Array.isArray(
                questions.questions
            )
        ) {

            questions =
                questions.questions;

        }

        else if (
            Array.isArray(
                questions.items
            )
        ) {

            questions =
                questions.items;

        }

    }


    if (!Array.isArray(questions)) {

        questions = [];

    }


    /* =====================================================
       NORMALIZE QUESTIONS
    ===================================================== */

    questions =
        questions.map(function (question) {

            if (
                !question ||
                typeof question !== "object"
            ) {

                return {};

            }


            let options =
                question.options ||
                question.answers ||
                [];


            options =
                parseJSON(
                    options,
                    []
                );


            if (!Array.isArray(options)) {

                options = [];

            }


            let media =
                question.media ||
                question.attachments ||
                [];


            media =
                parseJSON(
                    media,
                    []
                );


            if (!Array.isArray(media)) {

                media = [];

            }


            return {

                ...question,

                options:
                    options,

                media:
                    media

            };

        });


    /* =====================================================
       QUESTION COUNT
    ===================================================== */

    if (questionCount) {

        questionCount.textContent =
            questions.length;

    }


    if (questionBadgeCount) {

        questionBadgeCount.textContent =
            questions.length;

    }


    /* =====================================================
       TOTAL MARKS
    ===================================================== */

    let marks = 0;


    questions.forEach(
        function (question) {

            const mark =
                Number(
                    question.marks ??
                    question.mark ??
                    question.points ??
                    question.score ??
                    1
                );


            if (!isNaN(mark)) {

                marks += mark;

            }

        }
    );


    if (totalMarks) {

        totalMarks.textContent =
            marks;

    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

        return String(value)

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
    /* =====================================================
   RENDER RICH TEXT
   Decodes stored HTML entities and renders formatting
===================================================== */

function renderRichText(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "";
    }


    /* -------------------------------------------------
       STEP 1: DECODE HTML ENTITIES
       Handles:
       &lt;b&gt;EXCEPT&lt;/b&gt;
       &amp;nbsp;
       &nbsp;
    ------------------------------------------------- */

    let html =
        String(value);

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


    /* -------------------------------------------------
       STEP 2: PUT DECODED HTML INTO A CONTAINER
    ------------------------------------------------- */

    const container =
        document.createElement("div");


    container.innerHTML =
        html;


    /* -------------------------------------------------
       STEP 3: REMOVE DANGEROUS ELEMENTS
    ------------------------------------------------- */

    container
        .querySelectorAll(
            "script, style, iframe, object, embed, link, meta"
        )
        .forEach(
            element =>
                element.remove()
        );


    /* -------------------------------------------------
       STEP 4: REMOVE DANGEROUS ATTRIBUTES
    ------------------------------------------------- */

    container
        .querySelectorAll("*")
        .forEach(
            element => {

                Array
                    .from(
                        element.attributes
                    )
                    .forEach(
                        attribute => {

                            const name =
                                attribute.name
                                    .toLowerCase();

                            const attributeValue =
                                attribute.value;


                            /* Remove onclick,
                               onerror, onload, etc. */

                            if (
                                name.startsWith("on")
                            ) {

                                element.removeAttribute(
                                    attribute.name
                                );

                                return;

                            }


                            /* Remove javascript URLs */

                            if (
                                (
                                    name === "href" ||
                                    name === "src"
                                ) &&
                                /^\s*javascript:/i.test(
                                    attributeValue
                                )
                            ) {

                                element.removeAttribute(
                                    attribute.name
                                );

                            }

                        }
                    );

            }
        );


    /* -------------------------------------------------
       STEP 5: RETURN CLEAN HTML
    ------------------------------------------------- */

    return container.innerHTML;

}
    /* =====================================================
       MEDIA HELPERS
    ===================================================== */

    function normalizeMedia(question) {

        let media =
            question.media ||
            question.attachments ||
            [];


        media =
            parseJSON(
                media,
                []
            );


        if (!Array.isArray(media)) {

            media = [];

        }


        return media;

    }


    function getMediaType(item) {

        const type =
            String(
                item.type ||
                item.mediaType ||
                item.fileType ||
                ""
            ).toLowerCase();


        const name =
            String(
                item.name ||
                item.fileName ||
                ""
            ).toLowerCase();


        const mime =
            String(
                item.mimeType ||
                item.mime ||
                ""
            ).toLowerCase();


        if (
            type.includes("image") ||
            mime.startsWith("image/") ||
            /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(
                name
            )
        ) {

            return "image";

        }


        if (
            type.includes("video") ||
            mime.startsWith("video/") ||
            /\.(mp4|webm|ogg|mov)$/i.test(
                name
            )
        ) {

            return "video";

        }


        if (
            type.includes("audio") ||
            mime.startsWith("audio/") ||
            /\.(mp3|wav|ogg|m4a)$/i.test(
                name
            )
        ) {

            return "audio";

        }


        if (
            type.includes("pdf") ||
            mime.includes("pdf") ||
            /\.pdf$/i.test(name)
        ) {

            return "pdf";

        }


        if (
            type.includes("link") ||
            item.url ||
            item.href
        ) {

            return "link";

        }


        return "file";

    }


    function getMediaSource(item) {

        return (
            item.data ||
            item.src ||
            item.url ||
            item.href ||
            item.dataUrl ||
            item.fileData ||
            ""
        );

    }


    function buildMediaHTML(question) {

        const media =
            normalizeMedia(question);


        if (media.length === 0) {

            return "";

        }


        let html = `

            <div class="review-media">

                <div class="review-media-title">

                    <i class="fa-solid fa-paperclip"></i>

                    Attached Media

                </div>

                <div class="review-media-list">

        `;


        media.forEach(
            function (item) {

                const mediaType =
                    getMediaType(item);


                const source =
                    getMediaSource(item);


                const fileName =
                    item.name ||
                    item.fileName ||
                    item.title ||
                    "Attached file";


                if (
                    mediaType === "image" &&
                    source
                ) {

                    html += `

                        <div class="review-media-item review-image-item">

                            <div class="review-media-file-name">

                                <i class="fa-solid fa-image"></i>

                                ${escapeHTML(
                                    fileName
                                )}

                            </div>

                            <img
                                src="${escapeHTML(
                                    source
                                )}"
                                alt="${escapeHTML(
                                    fileName
                                )}"
                                class="review-image"
                            >

                        </div>

                    `;

                    return;

                }


                if (
                    mediaType === "video" &&
                    source
                ) {

                    html += `

                        <div class="review-media-item">

                            <div class="review-media-file-name">

                                <i class="fa-solid fa-video"></i>

                                ${escapeHTML(
                                    fileName
                                )}

                            </div>

                            <video
                                class="review-video"
                                controls
                                preload="metadata"
                            >

                                <source
                                    src="${escapeHTML(
                                        source
                                    )}"
                                    type="${escapeHTML(
                                        item.mimeType || ""
                                    )}"
                                >

                                Your browser does not support video playback.

                            </video>

                        </div>

                    `;

                    return;

                }


                if (
                    mediaType === "audio" &&
                    source
                ) {

                    html += `

                        <div class="review-media-item">

                            <div class="review-media-file-name">

                                <i class="fa-solid fa-volume-high"></i>

                                ${escapeHTML(
                                    fileName
                                )}

                            </div>

                            <audio
                                class="review-audio"
                                controls
                            >

                                <source
                                    src="${escapeHTML(
                                        source
                                    )}"
                                    type="${escapeHTML(
                                        item.mimeType || ""
                                    )}"
                                >

                                Your browser does not support audio playback.

                            </audio>

                        </div>

                    `;

                    return;

                }


                if (
                    mediaType === "pdf" &&
                    source
                ) {

                    html += `

                        <div class="review-media-item">

                            <div class="review-media-file-name">

                                <i class="fa-solid fa-file-pdf"></i>

                                ${escapeHTML(
                                    fileName
                                )}

                            </div>

                            <div class="review-media-actions">

                                <a
                                    href="${escapeHTML(
                                        source
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="review-media-btn"
                                >

                                    <i class="fa-solid fa-eye"></i>

                                    View PDF

                                </a>


                                <a
                                    href="${escapeHTML(
                                        source
                                    )}"
                                    download="${escapeHTML(
                                        fileName
                                    )}"
                                    class="review-media-btn secondary"
                                >

                                    <i class="fa-solid fa-download"></i>

                                    Download

                                </a>

                            </div>

                        </div>

                    `;

                    return;

                }


                if (
                    mediaType === "link" &&
                    source
                ) {

                    html += `

                        <div class="review-media-item">

                            <div class="review-media-file-name">

                                <i class="fa-solid fa-link"></i>

                                ${escapeHTML(
                                    fileName
                                )}

                            </div>

                            <a
                                href="${escapeHTML(
                                    source
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="review-media-btn"
                            >

                                <i class="fa-solid fa-arrow-up-right-from-square"></i>

                                Open Link

                            </a>

                        </div>

                    `;

                    return;

                }


                if (source) {

                    html += `

                        <div class="review-media-item">

                            <div class="review-media-file-name">

                                <i class="fa-solid fa-file"></i>

                                ${escapeHTML(
                                    fileName
                                )}

                            </div>

                            <a
                                href="${escapeHTML(
                                    source
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="review-media-btn"
                            >

                                <i class="fa-solid fa-folder-open"></i>

                                Open File

                            </a>

                        </div>

                    `;

                }

            }
        );


        html += `

                </div>

            </div>

        `;


        return html;

    }


    /* =====================================================
       GET QUESTION TEXT
    ===================================================== */

    function getQuestionText(question) {

        return (
            question.question_text ||
            question.question ||
            question.questionText ||
            question.text ||
            question.title ||
            "Question text not available."
        );

    }


    /* =====================================================
       GET QUESTION TYPE
    ===================================================== */

    function getQuestionType(question) {

        return (
            question.question_type ||
            question.type ||
            question.questionType ||
            "Multiple Choice"
        );

    }


    /* =====================================================
       GET CORRECT ANSWER
    ===================================================== */

    function getCorrectAnswer(question) {

        return (
            question.correct_answer ??
            question.correctAnswer ??
            question.answer ??
            question.correct ??
            question.correctOption ??
            question.correctIndex ??
            ""
        );

    }


    /* =====================================================
       DISPLAY QUESTIONS
    ===================================================== */

    function displayQuestions() {

        if (!questionsList) {

            return;

        }


        questionsList.innerHTML =
            "";


        if (questions.length === 0) {

            questionsList.innerHTML = `

                <div class="empty-review">

                    <i class="fa-solid fa-file-circle-xmark"></i>

                    <h3>No questions found</h3>

                    <p>
                        Go back to the Questions page
                        and add questions.
                    </p>

                </div>

            `;

            return;

        }


        questions.forEach(
            function (question, index) {

                const questionCard =
                    document.createElement(
                        "div"
                    );


                questionCard.className =
                    "review-question";


                const questionText =
                    getQuestionText(
                        question
                    );


                const questionType =
                    getQuestionType(
                        question
                    );


                const mark =
                    Number(
                        question.marks ??
                        question.mark ??
                        question.points ??
                        question.score ??
                        1
                    );


                let options =
                    question.options ||
                    question.answers ||
                    [];


                options =
                    parseJSON(
                        options,
                        []
                    );


                if (!Array.isArray(options)) {

                    options = [];

                }


                const correctAnswer =
                    getCorrectAnswer(
                        question
                    );


                let optionsHTML =
                    "";


                if (options.length > 0) {

                    optionsHTML = `

                        <div class="review-options">

                            ${options.map(
                                function (
                                    option,
                                    optionIndex
                                ) {

                                    let optionText =
                                        option;


                                    if (
                                        typeof option ===
                                        "object" &&
                                        option !== null
                                    ) {

                                        optionText =
                                            option.text ||
                                            option.value ||
                                            option.answer ||
                                            "";

                                    }


                                    const letter =
                                        String.fromCharCode(
                                            65 +
                                            optionIndex
                                        );


                                    let isCorrect =
                                        false;


                                    if (
                                        typeof correctAnswer ===
                                        "number" &&
                                        correctAnswer ===
                                        optionIndex
                                    ) {

                                        isCorrect =
                                            true;

                                    }


                                    if (
                                        typeof correctAnswer ===
                                        "string"
                                    ) {

                                        const normalizedCorrect =
                                            correctAnswer
                                                .trim()
                                                .toLowerCase();


                                        const normalizedOption =
                                            String(
                                                optionText
                                            )
                                                .trim()
                                                .toLowerCase();


                                        if (
                                            normalizedCorrect ===
                                            normalizedOption
                                        ) {

                                            isCorrect =
                                                true;

                                        }


                                        if (
                                            normalizedCorrect ===
                                            letter.toLowerCase()
                                        ) {

                                            isCorrect =
                                                true;

                                        }


                                        if (
                                            normalizedCorrect ===
                                            String(
                                                optionIndex
                                            )
                                        ) {

                                            isCorrect =
                                                true;

                                        }

                                    }


                                    return `

                                        <div class="review-option ${
                                            isCorrect
                                                ? "correct"
                                                : ""
                                        }">

                                            <div class="review-option-label">

                                                ${letter}

                                            </div>

                                            <span>

                                                ${escapeHTML(
                                                    optionText
                                                )}

                                            </span>

                                        </div>

                                    `;

                                }
                            ).join("")}

                        </div>

                    `;

                }


                let correctAnswerText =
                    "";


                if (
                    correctAnswer !== "" &&
                    correctAnswer !== null &&
                    correctAnswer !== undefined
                ) {

                    let displayedAnswer =
                        correctAnswer;


                    let numericAnswer =
                        Number(
                            correctAnswer
                        );


                    if (
                        !isNaN(
                            numericAnswer
                        ) &&
                        options[
                            numericAnswer
                        ] !== undefined
                    ) {

                        if (
                            typeof correctAnswer ===
                            "number" ||
                            /^\d+$/.test(
                                String(
                                    correctAnswer
                                )
                            )
                        ) {

                            displayedAnswer =
                                options[
                                    numericAnswer
                                ];

                        }

                    }


                    if (
                        typeof displayedAnswer ===
                        "object" &&
                        displayedAnswer !== null
                    ) {

                        displayedAnswer =
                            displayedAnswer.text ||
                            displayedAnswer.value ||
                            displayedAnswer.answer ||
                            "";

                    }


                    correctAnswerText = `

                        <div class="correct-answer">

                            <i class="fa-solid fa-circle-check"></i>

                            Correct Answer:

                            ${escapeHTML(
                                displayedAnswer
                            )}

                        </div>

                    `;

                }


                const mediaHTML =
                    buildMediaHTML(
                        question
                    );


                questionCard.innerHTML = `

                    <div class="review-question-header">

                        <div class="review-question-number">

                            <span>
                                ${index + 1}
                            </span>

                            Question ${index + 1}

                        </div>


                        <div class="question-type-badge">

                            ${escapeHTML(
                                questionType
                            )}

                        </div>

                    </div>


                    <div class="review-question-text">

                        ${escapeHTML(
                            questionText
                        )}

                    </div>


                    ${mediaHTML}


                    ${optionsHTML}


                    ${correctAnswerText}


                    <div class="question-footer">

                        <span class="question-marks">

                            ${mark}

                            ${
                                mark === 1
                                    ? "mark"
                                    : "marks"
                            }

                        </span>


                        <button
                            type="button"
                            class="edit-question-btn"
                            data-question-index="${index}"
                        >

                            <i class="fa-solid fa-pen"></i>

                            Edit Question

                        </button>

                    </div>

                `;


                questionsList.appendChild(
                    questionCard
                );

            }
        );


        /* =================================================
           EDIT BUTTONS
        ================================================= */

        const editButtons =
            document.querySelectorAll(
                ".edit-question-btn"
            );


        editButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            this.getAttribute(
                                "data-question-index"
                            );


                        sessionStorage.setItem(
                            "editQuestionIndex",
                            index
                        );


                        window.location.href =
                            "questions.html";

                    }
                );

            }
        );

    }


    /* =====================================================
       DISPLAY QUESTIONS
    ===================================================== */

    displayQuestions();


    /* =====================================================
       PUBLISH EXAMINATION
    ===================================================== */

    if (publishButton) {

        publishButton.addEventListener(
            "click",
            async function () {

                console.log(
                    "Publish button clicked."
                );


                /* =================================================
                   VALIDATE QUESTIONS
                ================================================= */

                if (
                    questions.length === 0
                ) {

                    alert(
                        "Please add at least one question before publishing the examination."
                    );

                    return;

                }


                /* =================================================
                   VALIDATE EXAM ID
                ================================================= */

                if (!examId) {

                    alert(
                        "This examination does not have a valid exam ID."
                    );


                    console.error(
                        "Exam ID is missing from examData:",
                        examData
                    );


                    return;

                }


                /* =================================================
                   DISABLE BUTTON
                ================================================= */

                publishButton.disabled =
                    true;


                publishButton.innerHTML = `

                    <i class="fa-solid fa-spinner fa-spin"></i>

                    Publishing...

                `;


                try {

                    /* =================================================
                       CHECK QUESTIONS IN SUPABASE
                    ================================================= */

                    const {
                        data: databaseQuestions,
                        error: questionsError
                    } = await supabaseClient

                        .from("questions")

                        .select(
                            "id, exam_id, question_number"
                        )

                        .eq(
                            "exam_id",
                            examId
                        );


                    if (questionsError) {

                        throw questionsError;

                    }


                    console.log(
                        "Questions found for this exam:",
                        databaseQuestions
                    );


                    /* =================================================
                       MAKE SURE QUESTIONS EXIST
                    ================================================= */

                    if (
                        !databaseQuestions ||
                        databaseQuestions.length === 0
                    ) {

                        throw new Error(
                            "No questions were found in Supabase for this examination. Make sure the questions have been saved with the correct exam_id before publishing."
                        );

                    }


                    /* =================================================
                       PUBLISH EXISTING EXAM
                    ================================================= */

                    const {
                        data: updatedExam,
                        error: examError
                    } = await supabaseClient

                        .from("exams")

                        .update({

                            question_count:
                                databaseQuestions.length,

                            status:
                                "published",

                            published:
                                true,

                            published_at:
                                new Date().toISOString()

                        })

                        .eq(
                            "id",
                            examId
                        )

                        .select()

                        .single();


                    if (examError) {

                        throw examError;

                    }


                    if (!updatedExam) {

                        throw new Error(
                            "Supabase did not return the published examination."
                        );

                    }


                    console.log(
                        "Exam successfully published:",
                        updatedExam
                    );


                    /* =================================================
                       GET ACCESS CODE
                    ================================================= */

                    const accessCode =
                        updatedExam.access_code;


                    if (!accessCode) {

                        throw new Error(
                            "The examination was published, but no access code was returned."
                        );

                    }


                    console.log(
                        "Exam access code:",
                        accessCode
                    );


                    /* =================================================
                       DISPLAY ACCESS CODE
                    ================================================= */

                    if (examAccessCode) {

                        examAccessCode.textContent =
                            accessCode;

                    }


                    /* =================================================
                       CREATE LOCAL COMPATIBILITY OBJECT
                    ================================================= */

                    const publishedExam = {

                        ...examData,

                        ...updatedExam,

                        id:
                            updatedExam.id,

                        title:
                            updatedExam.title,

                        subject:
                            updatedExam.subject,

                        classLevel:
                            updatedExam.class_level,

                        class:
                            updatedExam.class_level,

                        duration:
                            updatedExam.duration,

                        instructions:
                            updatedExam.instructions,

                        questions:
                            questions,

                        questionCount:
                            databaseQuestions.length,

                        totalMarks:
                            marks,

                        status:
                            "published",

                        published:
                            true,

                        publishedAt:
                            updatedExam.published_at,

                        accessCode:
                            updatedExam.access_code

                    };


                    /* =================================================
                       SAVE PUBLISHED EXAM
                    ================================================= */

                    localStorage.setItem(
                        "publishedExam",
                        JSON.stringify(
                            publishedExam
                        )
                    );


                    /* =================================================
                       SAVE PUBLISHED EXAMS ARRAY
                    ================================================= */

                    let publishedExams =
                        getStorageValue([
                            "publishedExams"
                        ]);


                    if (
                        !Array.isArray(
                            publishedExams
                        )
                    ) {

                        publishedExams = [];

                    }


                    const existingIndex =
                        publishedExams.findIndex(
                            function (exam) {

                                return (
                                    exam &&
                                    (
                                        exam.id ===
                                        examId ||

                                        exam.exam_id ===
                                        examId
                                    )
                                );

                            }
                        );


                    if (
                        existingIndex >= 0
                    ) {

                        publishedExams[
                            existingIndex
                        ] =
                            publishedExam;

                    }

                    else {

                        publishedExams.push(
                            publishedExam
                        );

                    }


                    localStorage.setItem(
                        "publishedExams",
                        JSON.stringify(
                            publishedExams
                        )
                    );


                    /* =================================================
                       UPDATE CURRENT EXAM
                    ================================================= */

                    localStorage.setItem(
                        "currentExam",
                        JSON.stringify(
                            publishedExam
                        )
                    );


                    localStorage.setItem(
                        "gracextolCompleteExam",
                        JSON.stringify(
                            publishedExam
                        )
                    );


                    /* =================================================
                       UPDATE BUTTON
                    ================================================= */

                    publishButton.innerHTML = `

                        <i class="fa-solid fa-check"></i>

                        Published

                    `;


                    /* =================================================
                       SHOW SUCCESS MODAL
                    ================================================= */

                    if (successModal) {

                        successModal.classList.add(
                            "show"
                        );

                    }

                    else {

                        alert(
                            "Examination published successfully!\n\nAccess Code: " +
                            accessCode
                        );


                        window.location.href =
                            "teacher.html";

                    }

                }


                catch (error) {

                    console.error(
                        "Error publishing examination:",
                        error
                    );


                    alert(
                        "Unable to publish the examination.\n\n" +
                        error.message
                    );


                    /* =================================================
                       RESTORE BUTTON
                    ================================================= */

                    publishButton.disabled =
                        false;


                    publishButton.innerHTML = `

                        <i class="fa-solid fa-cloud-arrow-up"></i>

                        Publish Examination

                    `;

                }

            }
        );

    }


    else {

        console.error(
            'Publish button not found. Check that the HTML button has id="publishExamBtn".'
        );

    }


    /* =====================================================
       COPY ACCESS CODE
    ===================================================== */

    if (copyAccessCodeBtn) {

        copyAccessCodeBtn.addEventListener(
            "click",
            async function () {

                const code =
                    examAccessCode
                        ? examAccessCode.textContent.trim()
                        : "";


                if (!code || code === "Loading...") {

                    return;

                }


                try {

                    await navigator.clipboard.writeText(
                        code
                    );


                    if (copyCodeMessage) {

                        copyCodeMessage.textContent =
                            "Access code copied successfully!";

                        copyCodeMessage.style.color =
                            "#16a34a";

                    }


                    copyAccessCodeBtn.innerHTML = `

                        <i class="fa-solid fa-check"></i>

                        Copied

                    `;


                    setTimeout(
                        function () {

                            copyAccessCodeBtn.innerHTML = `

                                <i class="fa-regular fa-copy"></i>

                                Copy

                            `;

                        },
                        2000
                    );

                }


                catch (error) {

                    console.error(
                        "Unable to copy access code:",
                        error
                    );


                    /* =========================================
                       FALLBACK COPY METHOD
                    ========================================= */

                    try {

                        const temporaryInput =
                            document.createElement(
                                "input"
                            );


                        temporaryInput.value =
                            code;


                        document.body.appendChild(
                            temporaryInput
                        );


                        temporaryInput.select();


                        document.execCommand(
                            "copy"
                        );


                        document.body.removeChild(
                            temporaryInput
                        );


                        if (copyCodeMessage) {

                            copyCodeMessage.textContent =
                                "Access code copied successfully!";

                            copyCodeMessage.style.color =
                                "#16a34a";

                        }

                    }

                    catch (fallbackError) {

                        console.error(
                            "Copy failed:",
                            fallbackError
                        );


                        if (copyCodeMessage) {

                            copyCodeMessage.textContent =
                                "Please copy the code manually.";

                            copyCodeMessage.style.color =
                                "#dc2626";

                        }

                    }

                }

            }
        );

    }


    /* =====================================================
       CLOSE SUCCESS MODAL
    ===================================================== */

    if (closeSuccessModal) {

        closeSuccessModal.addEventListener(
            "click",
            function () {

                if (successModal) {

                    successModal.classList.remove(
                        "show"
                    );

                }


                window.location.href =
                    "teacher.html";

            }
        );

    }


    /* =====================================================
       CLICK OUTSIDE MODAL
    ===================================================== */

    if (successModal) {

        successModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    successModal
                ) {

                    successModal.classList.remove(
                        "show"
                    );

                }

            }
        );

    }

});