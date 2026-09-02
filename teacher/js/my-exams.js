/* =========================================================
   GRACEXTOL CBT
   MY EXAMINATIONS
   SUPABASE VERSION
   ========================================================= */


/* =========================================================
   GET ELEMENTS
   ========================================================= */

const examsList =
    document.getElementById("examsList");

const loadingState =
    document.getElementById("loadingState");

const emptyState =
    document.getElementById("emptyState");

const errorState =
    document.getElementById("errorState");

const errorMessage =
    document.getElementById("errorMessage");

const retryBtn =
    document.getElementById("retryBtn");


/* =========================================================
   LOAD EXAMINATIONS
   ========================================================= */

async function loadExaminations() {

    showLoading();

    try {

        /* =========================================
           CHECK SUPABASE CLIENT
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
           GET AUTHENTICATED TEACHER
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

            console.error(
                "Teacher authentication error:",
                authError
            );

            throw new Error(
                "Unable to verify your teacher account."
            );
        }


        if (!user) {

            throw new Error(
                "No authenticated teacher found. Please sign in again."
            );
        }


        console.log(
            "Authenticated teacher:",
            user.id
        );


        /* =========================================
           FETCH ONLY THIS TEACHER'S EXAMS
        ========================================= */

        const {
            data,
            error
        } =
            await supabaseClient
                .from("exams")
                .select("*")
                .eq(
                    "created_by",
                    user.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        /* =========================================
           HANDLE SUPABASE ERROR
        ========================================= */

        if (error) {

            console.error(
                "Unable to load examinations:",
                error
            );

            throw error;
        }


        console.log(
            "Teacher examinations loaded:",
            data
        );


        /* =========================================
           DISPLAY RESULTS
        ========================================= */

        if (
            !data ||
            data.length === 0
        ) {

            showEmpty();

            return;
        }


        renderExaminations(
            data
        );


    } catch (error) {

        console.error(
            "My examinations error:",
            error
        );

        showError(
            error.message ||
            "Unable to load examinations."
        );

    }

}


/* =========================================================
   RENDER EXAMINATIONS
   ========================================================= */

function renderExaminations(
    exams
) {

    if (!examsList) {
        return;
    }


    examsList.innerHTML =
        "";


    exams.forEach(
        exam => {

            const card =
                createExamCard(
                    exam
                );


            examsList.appendChild(
                card
            );

        }
    );


    showExamList();

}


/* =========================================================
   CREATE EXAM CARD
   ========================================================= */

function createExamCard(
    exam
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "exam-card";


    /* =========================================
       NORMALIZE STATUS
    ========================================= */

    const rawStatus =
        String(
            exam.status ||
            ""
        )
            .trim()
            .toLowerCase();


    let statusText =
        "Draft";

    let statusClass =
        "draft";


    if (
        exam.published === true ||
        rawStatus === "published"
    ) {

        statusText =
            "Published";

        statusClass =
            "published";

    } else if (
        rawStatus === "archived"
    ) {

        statusText =
            "Archived";

        statusClass =
            "archived";

    } else if (
        rawStatus === "draft"
    ) {

        statusText =
            "Draft";

        statusClass =
            "draft";

    }


    /* =========================================
       HEADER
    ========================================= */

    const header =
        document.createElement(
            "div"
        );


    header.className =
        "exam-card-header";


    const title =
        document.createElement(
            "h2"
        );


    title.textContent =
        exam.title ||
        "Untitled Examination";


    const status =
        document.createElement(
            "span"
        );


    status.className =
        `exam-status ${statusClass}`;


    status.textContent =
        statusText;


    header.appendChild(
        title
    );

    header.appendChild(
        status
    );


    /* =========================================
       DETAILS
    ========================================= */

    const details =
        document.createElement(
            "div"
        );


    details.className =
        "exam-details";


    details.innerHTML = `

        <div class="exam-detail">

            <i class="fa-solid fa-book"></i>

            <span>

                <strong>Subject</strong>

                ${escapeHTML(
                    exam.subject ||
                    "Not specified"
                )}

            </span>

        </div>


        <div class="exam-detail">

            <i class="fa-solid fa-users"></i>

            <span>

                <strong>Class / Level</strong>

                ${escapeHTML(
                    exam.class_level ||
                    "Not specified"
                )}

            </span>

        </div>


        <div class="exam-detail">

            <i class="fa-solid fa-clock"></i>

            <span>

                <strong>Duration</strong>

                ${
                    Number(
                        exam.duration
                    ) || 0
                } minutes

            </span>

        </div>


        <div class="exam-detail">

            <i class="fa-solid fa-list-ol"></i>

            <span>

                <strong>Questions</strong>

                ${
                    Number(
                        exam.question_count
                    ) || 0
                }

            </span>

        </div>

    `;


    /* =========================================
       ACCESS CODE
    ========================================= */

    const accessCode =
        exam.access_code ||
        exam.accessCode ||
        "";


    if (accessCode) {

        const accessCodeDetail =
            document.createElement(
                "div"
            );


        accessCodeDetail.className =
            "exam-detail";


        accessCodeDetail.innerHTML = `

            <i class="fa-solid fa-key"></i>

            <span>

                <strong>Access Code</strong>

                ${escapeHTML(
                    accessCode
                )}

            </span>

        `;


        details.appendChild(
            accessCodeDetail
        );

    }


    /* =========================================
       CREATED DATE
    ========================================= */

    const date =
        document.createElement(
            "div"
        );


    date.className =
        "exam-created-date";


    date.innerHTML = `

        <i class="fa-regular fa-calendar"></i>

        Created:

        ${formatDate(
            exam.created_at
        )}

    `;


    /* =========================================
       ACTIONS
    ========================================= */

    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "exam-actions";


    /* =========================================
       CONTINUE EDITING
    ========================================= */

    const continueBtn =
        document.createElement(
            "button"
        );


    continueBtn.type =
        "button";


    continueBtn.className =
        "exam-action-btn view-btn";


    continueBtn.innerHTML = `

        <i class="fa-solid fa-pen-to-square"></i>

        Continue Editing

    `;


    continueBtn.addEventListener(
        "click",
        () => {

            continueEditing(
                exam
            );

        }
    );


    /* =========================================
       VIEW
    ========================================= */

    const viewBtn =
        document.createElement(
            "button"
        );


    viewBtn.type =
        "button";


    viewBtn.className =
        "exam-action-btn view-btn";


    viewBtn.innerHTML = `

        <i class="fa-solid fa-eye"></i>

        View

    `;


    viewBtn.addEventListener(
        "click",
        () => {

            viewExam(
                exam
            );

        }
    );


    /* =========================================
       COPY ACCESS CODE
    ========================================= */

    if (accessCode) {

        const copyBtn =
            document.createElement(
                "button"
            );


        copyBtn.type =
            "button";


        copyBtn.className =
            "exam-action-btn";


        copyBtn.innerHTML = `

            <i class="fa-solid fa-copy"></i>

            Copy Code

        `;


        copyBtn.addEventListener(
            "click",
            () => {

                copyAccessCode(
                    accessCode,
                    copyBtn
                );

            }
        );


        actions.appendChild(
            copyBtn
        );

    }


    /* =========================================
       DELETE
    ========================================= */

    const deleteBtn =
        document.createElement(
            "button"
        );


    deleteBtn.type =
        "button";


    deleteBtn.className =
        "exam-action-btn delete-btn";


    deleteBtn.innerHTML = `

        <i class="fa-solid fa-trash"></i>

        Delete

    `;


    deleteBtn.addEventListener(
        "click",
        () => {

            deleteExam(
                exam
            );

        }
    );


    /* =========================================
       ADD ACTION BUTTONS
    ========================================= */

    actions.appendChild(
        continueBtn
    );

    actions.appendChild(
        viewBtn
    );

    actions.appendChild(
        deleteBtn
    );


    /* =========================================
       BUILD CARD
    ========================================= */

    card.appendChild(
        header
    );

    card.appendChild(
        details
    );

    card.appendChild(
        date
    );

    card.appendChild(
        actions
    );


    return card;

}


/* =========================================================
   CONTINUE EDITING
   ========================================================= */

function continueEditing(
    exam
) {

    try {

        /* =========================================
           SAVE EXACT EXAMINATION
        ========================================= */

        localStorage.setItem(
            "currentExam",
            JSON.stringify(
                exam
            )
        );


        localStorage.setItem(
            "gracextolExam",
            JSON.stringify(
                exam
            )
        );


        /* =========================================
           ALSO SAVE BASIC INFORMATION
           FOR EXISTING PAGES
        ========================================= */

        localStorage.setItem(
            "examName",
            exam.title ||
            ""
        );


        localStorage.setItem(
            "examSubject",
            exam.subject ||
            ""
        );


        localStorage.setItem(
            "examClass",
            exam.class_level ||
            ""
        );


        localStorage.setItem(
            "examDuration",
            String(
                exam.duration ||
                ""
            )
        );


        localStorage.setItem(
            "plannedQuestions",
            String(
                exam.question_count ||
                ""
            )
        );


        localStorage.setItem(
            "shuffleQuestions",
            String(
                exam.shuffle_questions ??
                false
            )
        );


        localStorage.setItem(
            "showResult",
            String(
                exam.show_result ??
                true
            )
        );


        localStorage.setItem(
            "allowRetake",
            String(
                exam.allow_retake ??
                false
            )
        );


        console.log(
            "Continuing examination:",
            exam
        );


        /* =========================================
           GO TO QUESTION BUILDER
        ========================================= */

        window.location.href =
            "questions.html";


    } catch (error) {

        console.error(
            "Unable to continue examination:",
            error
        );


        alert(
            "Unable to continue editing this examination."
        );

    }

}


/* =========================================================
   VIEW EXAM
   ========================================================= */

function viewExam(
    exam
) {

    try {

        localStorage.setItem(
            "selectedExam",
            JSON.stringify(
                exam
            )
        );


        localStorage.setItem(
            "currentExam",
            JSON.stringify(
                exam
            )
        );


        window.location.href =
            "review-exam.html";


    } catch (error) {

        console.error(
            "Unable to open examination:",
            error
        );


        alert(
            "Unable to open this examination."
        );

    }

}


/* =========================================================
   COPY ACCESS CODE
   ========================================================= */

async function copyAccessCode(
    accessCode,
    button
) {

    try {

        if (
            !navigator.clipboard
        ) {

            throw new Error(
                "Clipboard API unavailable."
            );

        }


        await navigator.clipboard.writeText(
            accessCode
        );


        const originalHTML =
            button.innerHTML;


        button.innerHTML = `

            <i class="fa-solid fa-check"></i>

            Copied

        `;


        setTimeout(
            () => {

                button.innerHTML =
                    originalHTML;

            },
            1500
        );


    } catch (error) {

        console.error(
            "Copy access code error:",
            error
        );


        alert(
            `Access Code: ${accessCode}`
        );

    }

}


/* =========================================================
   DELETE EXAM
   ========================================================= */

async function deleteExam(
    exam
) {

    const confirmed =
        confirm(
            `Are you sure you want to delete "${exam.title || "this examination"}"?\n\nThis action cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


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
           DELETE EXAM
        ========================================= */

        const {
            error
        } =
            await supabaseClient
                .from("exams")
                .delete()
                .eq(
                    "id",
                    exam.id
                );


        if (error) {

            console.error(
                "Delete examination error:",
                error
            );


            alert(
                "Unable to delete the examination."
            );


            return;
        }


        /* =========================================
           CLEAR LOCAL DATA IF THIS WAS
           THE CURRENT EXAM
        ========================================= */

        const currentExam =
            localStorage.getItem(
                "currentExam"
            );


        if (currentExam) {

            try {

                const parsedExam =
                    JSON.parse(
                        currentExam
                    );


                if (
                    parsedExam.id ===
                    exam.id
                ) {

                    localStorage.removeItem(
                        "currentExam"
                    );

                    localStorage.removeItem(
                        "gracextolExam"
                    );

                }

            } catch (
                parseError
            ) {

                console.warn(
                    "Unable to compare current exam:",
                    parseError
                );

            }

        }


        alert(
            "Examination deleted successfully."
        );


        /* =========================================
           RELOAD EXAMINATION LIST
        ========================================= */

        await loadExaminations();


    } catch (error) {

        console.error(
            "Unexpected delete error:",
            error
        );


        alert(
            "Something went wrong while deleting the examination."
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


    if (examsList) {

        examsList.style.display =
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


    if (examsList) {

        examsList.style.display =
            "none";

    }


    if (emptyState) {

        emptyState.style.display =
            "flex";

    }

}


/* =========================================================
   SHOW EXAM LIST
   ========================================================= */

function showExamList() {

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


    if (examsList) {

        examsList.style.display =
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


    if (examsList) {

        examsList.style.display =
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
   FORMAT DATE
   ========================================================= */

function formatDate(
    dateString
) {

    if (!dateString) {

        return "Unknown";

    }


    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Unknown";

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
   RETRY BUTTON
   ========================================================= */

if (retryBtn) {

    retryBtn.addEventListener(
        "click",
        loadExaminations
    );

}


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadExaminations();

    }
);