/* =========================================================
   GRACEXTOL CBT
   TEACHER DASHBOARD
   SUPABASE VERSION
========================================================= */
/* =========================================
   ALWAYS START TEACHER DASHBOARD AT TOP
========================================= */

if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}

window.scrollTo(0, 0);

window.addEventListener("load", () => {
    window.scrollTo(0, 0);
});

const totalExamsElement = document.getElementById("totalExams");
const totalQuestionsElement = document.getElementById("totalQuestions");
const totalStudentsElement = document.getElementById("totalStudents");
const totalResultsElement = document.getElementById("totalResults");

let teacherExams = [];
let teacherSubmissions = [];

document.addEventListener("DOMContentLoaded", async function () {
    if (!(await window.teacherAccessReady)) return;

    console.log("Gracextol Teacher Dashboard Loaded.");

    await loadDashboard();

    const subscriptionAccessAllowed =
        await loadSubscriptionStatus();

    if (
        subscriptionAccessAllowed ===
        false
    ) {

        return;

    }
});


/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

    console.log("Loading teacher dashboard...");

    if (typeof supabaseClient === "undefined") {

        console.error(
            "Supabase client is not available."
        );

        return;
    }

    try {

        const {
            data: { user },
            error: authError
        } = await supabaseClient.auth.getUser();


        if (authError) {

            console.error(
                "Teacher authentication error:",
                authError
            );

            return;
        }


        if (!user) {

            console.error(
                "No authenticated teacher found."
            );

            return;
        }


        console.log(
            "Authenticated teacher:",
            user.id
        );


        /* =================================================
           LOAD TEACHER'S EXAMINATIONS
        ================================================= */

        const {
            data: exams,
            error: examsError
        } = await supabaseClient
            .from("exams")
            .select(`
                id,
                title,
                question_count,
                created_by,
                created_at
            `)
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


        if (examsError) {

            console.error(
                "Error loading teacher examinations:",
                examsError
            );

            return;
        }


        teacherExams =
            exams || [];


        console.log(
            "Teacher examinations:",
            teacherExams
        );


        /* =================================================
           UPDATE TOTAL EXAMS
        ================================================= */

        if (totalExamsElement) {

            totalExamsElement.textContent =
                teacherExams.length;

        }


        /* =================================================
           CALCULATE TOTAL QUESTIONS
        ================================================= */

        const totalQuestionCount =
            teacherExams.reduce(
                (
                    total,
                    exam
                ) => {

                    return (
                        total +
                        (
                            Number(
                                exam.question_count
                            ) || 0
                        )
                    );

                },
                0
            );


        if (totalQuestionsElement) {

            totalQuestionsElement.textContent =
                totalQuestionCount;

        }


        /* =================================================
           NO EXAMS
        ================================================= */

        if (
            teacherExams.length === 0
        ) {

            teacherSubmissions = [];

            updateStudentAndResultStatistics();

            return;
        }


        /* =================================================
           GET EXAM IDS
        ================================================= */

        const examIds =
            teacherExams.map(
                exam =>
                    exam.id
            );


        console.log(
            "Teacher exam IDs:",
            examIds
        );


        /* =================================================
           LOAD STUDENT SUBMISSIONS
        ================================================= */

        const {
            data: submissions,
            error: submissionsError
        } = await supabaseClient
            .from("submissions")
            .select(`
                id,
                exam_id,
                student_id,
                student_name,
                score,
                answers,
                created_at
            `)
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

            teacherSubmissions = [];

            updateStudentAndResultStatistics();

            return;
        }


        teacherSubmissions =
            submissions || [];


        console.log(
            "Teacher submissions:",
            teacherSubmissions
        );


        /* =================================================
           UPDATE STUDENT + RESULT STATISTICS
        ================================================= */

        updateStudentAndResultStatistics();


        /* =================================================
           LOAD RECENT EXAMINATIONS
        ================================================= */

        renderRecentExaminations();


    } catch (error) {

        console.error(
            "Unexpected dashboard error:",
            error
        );

    }

}


/* =========================================================
   LOAD SUBSCRIPTION STATUS
========================================================= */

async function loadSubscriptionStatus() {

    try {

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            console.error(
                "Supabase client is not available for subscription status."
            );

            return;

        }


        /* =================================================
           GET AUTHENTICATED USER
        ================================================= */

        const {
            data: {
                user
            },
            error: authError
        } =
            await supabaseClient
                .auth
                .getUser();


        if (
            authError ||
            !user
        ) {

            console.error(
                "Unable to get authenticated teacher for subscription:",
                authError
            );

            return;

        }


        /* =================================================
           GET TEACHER PROFILE
        ================================================= */

        const {
            data: teacherProfile,
            error: teacherError
        } =
            await supabaseClient
                .from("users")
                .select(`
                    id,
                    email,
                    role,
                    organization_id
                `)
                .eq(
                    "auth_id",
                    user.id
                )
                .eq(
                    "role",
                    "teacher"
                )
                .maybeSingle();


        if (teacherError) {

            console.error(
                "Error loading teacher profile for subscription:",
                teacherError
            );

            return false;

        }


        if (!teacherProfile) {

            console.warn(
                "No public teacher profile found for subscription."
            );

            return false;

        }


        const isOrganizationTeacher =
            teacherProfile.organization_id !==
            null &&
            teacherProfile.organization_id !==
            undefined;


        /* =================================================
           GET CURRENT SUBSCRIPTION
        ================================================= */

        let subscriptionQuery =
            supabaseClient
                .from("subscriptions")
                .select(`
                    id,
                    organization_id,
                    user_id,
                    status,
                    trial_start_date,
                    trial_end_date,
                    start_date,
                    end_date,
                    grace_period_start_date,
                    grace_period_end_date,
                    plan_id
                `);


        if (
            isOrganizationTeacher
        ) {

            subscriptionQuery =
                subscriptionQuery.eq(
                    "organization_id",
                    teacherProfile.organization_id
                );

        } else {

            subscriptionQuery =
                subscriptionQuery.eq(
                    "user_id",
                    teacherProfile.id
                );

        }


        const {
            data: subscription,
            error: subscriptionError
        } =
            await subscriptionQuery
                .in(
                    "status",
                    isOrganizationTeacher
                        ? [
                            "trial",
                            "active",
                            "grace_period",
                            "expired"
                        ]
                        : [
                            "trial",
                            "active",
                            "grace_period"
                        ]
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(1)
                .maybeSingle();


        if (subscriptionError) {

            console.error(
                "Error loading teacher subscription:",
                subscriptionError
            );

            return false;

        }


        if (!subscription) {

            renderSubscriptionStatus(
                null,
                null,
                isOrganizationTeacher
            );

            return true;

        }


        if (
            isOrganizationTeacher &&
            subscription.status ===
            "expired"
        ) {

            console.warn(
                "Organization teacher subscription has expired. Redirecting to Organization payment page."
            );

            window.location.replace(
                "../organization/pages/payment.html"
            );

            return false;

        }


        /* =================================================
           GET PLAN DETAILS
        ================================================= */

        const {
            data: plan,
            error: planError
        } =
            await supabaseClient
                .from("plans")
                .select(`
                    name,
                    plan_type,
                    price,
                    currency,
                    trial_days,
                    grace_period_days
                `)
                .eq(
                    "id",
                    subscription.plan_id
                )
                .maybeSingle();


        if (planError) {

            console.error(
                "Error loading subscription plan:",
                planError
            );

            renderSubscriptionStatus(
                subscription,
                null,
                isOrganizationTeacher
            );

            return true;

        }


        renderSubscriptionStatus(
            subscription,
            plan,
            isOrganizationTeacher
        );

        return true;


    } catch (error) {

        console.error(
            "Unexpected subscription status error:",
            error
        );

        return false;

    }

}


/* =========================================================
   RENDER SUBSCRIPTION STATUS
========================================================= */

function renderSubscriptionStatus(
    subscription,
    plan,
    isOrganizationTeacher = false
) {

    let card =
        document.getElementById(
            "teacherSubscriptionCard"
        );


    /* =================================================
       CREATE CARD IF IT DOES NOT EXIST
    ================================================= */

    if (!card) {

        const mainContent =
            document.querySelector(
                ".main-content"
            );


        const statsGrid =
            document.querySelector(
                ".stats-grid"
            );


        if (!mainContent) {

            return;

        }


        card =
            document.createElement(
                "section"
            );


        card.id =
            "teacherSubscriptionCard";


        card.className =
            "teacher-subscription-card";


        if (statsGrid) {

            mainContent.insertBefore(
                card,
                statsGrid
            );

        } else {

            mainContent.prepend(
                card
            );

        }

    }


    /* =================================================
       NO SUBSCRIPTION
    ================================================= */

    if (!subscription) {

        card.innerHTML = `

            <div class="subscription-card-icon">

                <i class="fa-solid fa-circle-exclamation"></i>

            </div>


            <div class="subscription-card-content">

                <span class="subscription-card-label">

                    SUBSCRIPTION

                </span>


                <h2>

                    No active subscription

                </h2>


                <p>

                    Your teacher account does not currently have
                    an active trial or subscription.

                </p>

            </div>

        `;


        addSubscriptionCardStyles();

        return;

    }


    /* =================================================
       DETERMINE SUBSCRIPTION STATUS
    ================================================= */

    const status =
        subscription.status ||
        "unknown";


    let statusText =
        "Subscription active";


    let statusClass =
        "status-active";


    let periodText =
        "";


    let endDate =
        null;


    /* =================================================
       TRIAL
    ================================================= */

    if (
        status === "trial"
    ) {

        statusText =
            "Free Trial";


        statusClass =
            "status-trial";


        endDate =
            subscription.trial_end_date;


        if (endDate) {

            const remainingDays =
                Math.max(
                    0,
                    Math.ceil(
                        (
                            new Date(
                                endDate
                            ).getTime() -
                            Date.now()
                        ) /
                        (
                            1000 *
                            60 *
                            60 *
                            24
                        )
                    )
                );


            periodText =
                `${remainingDays} ${
                    remainingDays === 1
                        ? "day"
                        : "days"
                } remaining`;

        }

    }


    /* =================================================
       GRACE PERIOD
    ================================================= */

    else if (
        status === "grace_period"
    ) {

        statusText =
            "Grace Period";


        statusClass =
            "status-grace";


        endDate =
            subscription.grace_period_end_date;


        if (endDate) {

            const remainingDays =
                Math.max(
                    0,
                    Math.ceil(
                        (
                            new Date(
                                endDate
                            ).getTime() -
                            Date.now()
                        ) /
                        (
                            1000 *
                            60 *
                            60 *
                            24
                        )
                    )
                );


            periodText =
                `${remainingDays} ${
                    remainingDays === 1
                        ? "day"
                        : "days"
                } remaining`;

        }

    }


    /* =================================================
       ACTIVE
    ================================================= */

    else if (
        status === "active"
    ) {

        statusText =
            "Active";


        statusClass =
            "status-active";


        endDate =
            subscription.end_date;


        periodText =
            endDate
                ? `Valid until ${formatDate(endDate)}`
                : "Your subscription is active.";

    }


    /* =================================================
       PLAN INFORMATION
    ================================================= */

    const planName =
        plan?.name ||
        (isOrganizationTeacher
            ? "Organization"
            : "Individual Teacher");


    const price =
        Number(
            plan?.price
        ) || 0;


    const currency =
        plan?.currency ||
        "NGN";


    const formattedPrice =
        new Intl.NumberFormat(
            "en-NG",
            {
                style: "currency",
                currency: currency,
                maximumFractionDigits: 0
            }
        ).format(
            price
        );


    const endDateText =
        endDate
            ? `Ends ${formatDate(endDate)}`
            : "";


    const paymentTarget =
        isOrganizationTeacher
            ? "../organization/pages/payment.html"
            : "payment.html";


    /* =================================================
       DISPLAY CARD
    ================================================= */

    card.innerHTML = `

        <div class="subscription-card-icon">

            <i class="fa-solid fa-crown"></i>

        </div>


        <div class="subscription-card-content">

            <span class="subscription-card-label">

                SUBSCRIPTION

            </span>


            <div class="subscription-card-title-row">

                <h2>

                    ${escapeHTML(
                        statusText
                    )}

                </h2>


                <span
                    class="subscription-status-badge ${statusClass}"
                >

                    ${escapeHTML(
                        statusText
                    )}

                </span>

            </div>


            <p>

                ${escapeHTML(
                    planName
                )}

                &nbsp;•&nbsp;

                ${escapeHTML(
                    formattedPrice
                )}/month

            </p>


            <div class="subscription-card-meta">

                <strong>

                    ${escapeHTML(
                        periodText
                    )}

                </strong>


                ${
                    endDateText
                        ? `

                            <span>

                                ${escapeHTML(
                                    endDateText
                                )}

                            </span>

                          `
                        : ""
                }

            </div>


            ${
                status === "trial"

                    ? `

                        <div class="subscription-card-action">

                            <button
                                type="button"
                                class="subscription-payment-btn"
                                onclick="window.location.href='${paymentTarget}'"
                            >

                                <i class="fa-solid fa-credit-card"></i>

                                Subscribe Now — ${escapeHTML(
                                    formattedPrice
                                )}

                            </button>

                        </div>

                      `

                    : status === "grace_period"

                    ? `

                        <div class="subscription-card-action">

                            <button
                                type="button"
                                class="subscription-payment-btn"
                                onclick="window.location.href='${paymentTarget}'"
                            >

                                <i class="fa-solid fa-credit-card"></i>

                                Renew Subscription — ${escapeHTML(
                                    formattedPrice
                                )}

                            </button>

                        </div>

                      `

                    : ""

            }

        </div>

    `;


    addSubscriptionCardStyles();

}


/* =========================================================
   SUBSCRIPTION CARD STYLES
========================================================= */

function addSubscriptionCardStyles() {

    if (
        document.getElementById(
            "teacherSubscriptionCardStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "teacherSubscriptionCardStyles";


    style.textContent = `

        .teacher-subscription-card {

            display: flex;

            align-items: center;

            gap: 18px;

            margin-bottom: 24px;

            padding: 20px 22px;

            border: 1px solid #e5e7eb;

            border-radius: 16px;

            background: #ffffff;

            box-shadow:
                0 4px 16px
                rgba(0, 0, 0, 0.05);

        }


        .subscription-card-icon {

            width: 48px;

            height: 48px;

            flex: 0 0 48px;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius: 12px;

            background: #f3e8ff;

            color: #7c3aed;

            font-size: 20px;

        }


        .subscription-card-content {

            flex: 1;

            min-width: 0;

        }


        .subscription-card-label {

            display: block;

            margin-bottom: 4px;

            font-size: 11px;

            font-weight: 700;

            letter-spacing: 0.08em;

            color: #6b7280;

        }


        .subscription-card-title-row {

            display: flex;

            align-items: center;

            gap: 10px;

            flex-wrap: wrap;

        }


        .subscription-card-title-row h2 {

            margin: 0;

            font-size: 20px;

            color: #111827;

        }


        .subscription-status-badge {

            display: inline-flex;

            align-items: center;

            padding: 4px 9px;

            border-radius: 999px;

            font-size: 11px;

            font-weight: 700;

        }


        .status-trial {

            background: #ecfdf5;

            color: #047857;

        }


        .status-active {

            background: #eff6ff;

            color: #1d4ed8;

        }


        .status-grace {

            background: #fff7ed;

            color: #c2410c;

        }


        .teacher-subscription-card p {

            margin: 5px 0 0;

            color: #6b7280;

            font-size: 14px;

        }


        .subscription-card-meta {

            display: flex;

            gap: 12px;

            align-items: center;

            flex-wrap: wrap;

            margin-top: 10px;

            font-size: 13px;

            color: #6b7280;

        }


        .subscription-card-meta strong {

            color: #111827;

        }


        .subscription-card-action {

            margin-top: 14px;

        }


        .subscription-payment-btn {

            border: none;

            border-radius: 10px;

            padding: 10px 16px;

            background: #7c3aed;

            color: #ffffff;

            font-size: 13px;

            font-weight: 700;

            cursor: pointer;

            display: inline-flex;

            align-items: center;

            gap: 8px;

            transition: 0.2s ease;

        }


        .subscription-payment-btn:hover {

            opacity: 0.9;

            transform: translateY(-1px);

        }


        .subscription-payment-btn:active {

            transform: translateY(0);

        }


        @media (max-width: 600px) {

            .teacher-subscription-card {

                align-items: flex-start;

                padding: 16px;

            }


            .subscription-card-title-row h2 {

                font-size: 18px;

            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* =========================================================
   UPDATE STUDENT + RESULT STATISTICS
========================================================= */

function updateStudentAndResultStatistics() {

    /* =====================================================
       TOTAL RESULTS
       Each submission = one result
    ===================================================== */

    if (
        totalResultsElement
    ) {

        totalResultsElement.textContent =
            teacherSubmissions.length;

    }


    /* =====================================================
       UNIQUE STUDENTS
    ===================================================== */

    const uniqueStudents =
        new Set();


    teacherSubmissions.forEach(
        submission => {

            const studentKey =
                submission.student_id ||
                submission.student_name;


            if (
                studentKey
            ) {

                uniqueStudents.add(
                    studentKey
                );

            }

        }
    );


    if (
        totalStudentsElement
    ) {

        totalStudentsElement.textContent =
            uniqueStudents.size;

    }


    console.log(
        "Total students:",
        uniqueStudents.size
    );


    console.log(
        "Total results:",
        teacherSubmissions.length
    );

}


/* =========================================================
   RENDER RECENT EXAMINATIONS
========================================================= */

function renderRecentExaminations() {

    const examTable =
        document.querySelector(
            ".exam-table"
        );


    if (!examTable) {

        console.warn(
            "Recent examinations container not found."
        );

        return;

    }


    /* =====================================================
       NO EXAMS
    ===================================================== */

    if (
        teacherExams.length === 0
    ) {

        examTable.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">

                    <i
                        class="fa-solid fa-file-circle-plus"
                    ></i>

                </div>


                <h3>

                    No examinations yet

                </h3>


                <p>

                    Create your first examination to see it here.

                </p>


                <button
                    class="primary-btn"
                    type="button"
                    onclick="window.location.href='create-exam.html'"
                >

                    <i class="fa-solid fa-plus"></i>

                    Create Examination

                </button>

            </div>

        `;

        return;

    }


    /* =====================================================
       SHOW RECENT EXAMS
    ===================================================== */

    const recentExams =
        teacherExams.slice(
            0,
            5
        );


    examTable.innerHTML = `

        <div class="recent-exams-list">

            ${recentExams

                .map(
                    exam => {

                        const questionCount =
                            Number(
                                exam.question_count
                            ) || 0;


                        const createdDate =
                            formatDate(
                                exam.created_at
                            );


                        return `

                            <div
                                class="recent-exam-row"
                                data-exam-id="${escapeHTML(
                                    exam.id
                                )}"
                            >

                                <div
                                    class="recent-exam-icon"
                                >

                                    <i
                                        class="fa-solid fa-file-lines"
                                    ></i>

                                </div>


                                <div
                                    class="recent-exam-info"
                                >

                                    <h3>

                                        ${escapeHTML(
                                            exam.title ||
                                            "Untitled Examination"
                                        )}

                                    </h3>


                                    <p>

                                        ${questionCount}

                                        ${
                                            questionCount === 1
                                                ? "Question"
                                                : "Questions"
                                        }

                                        &nbsp;•&nbsp;

                                        ${createdDate}

                                    </p>

                                </div>


                                <div
                                    class="recent-exam-action"
                                >

                                    <button
                                        type="button"
                                        onclick="openExam('${escapeHTML(
                                            exam.id
                                        )}')"
                                        aria-label="Open examination"
                                    >

                                        <i
                                            class="fa-solid fa-arrow-right"
                                        ></i>

                                    </button>

                                </div>

                            </div>

                        `;

                    }
                )

                .join("")}

        </div>

    `;

}


/* =========================================================
   OPEN EXAMINATION
========================================================= */

function openExam(
    examId
) {

    if (!examId) {

        return;

    }


    window.location.href =
        "my-exams.html";

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    dateValue
) {

    if (!dateValue) {

        return "Date unavailable";

    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Date unavailable";

    }


    return date.toLocaleDateString(
        "en-NG",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
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