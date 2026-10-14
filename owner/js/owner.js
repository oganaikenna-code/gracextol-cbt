"use strict";

/* =========================================================
   GRACEXTOL OWNER PORTAL
========================================================= */

/* SUPABASE CLIENT */
const db =
    typeof supabaseClient !== "undefined"
        ? supabaseClient
        : null;

const pageType = document.body.dataset.page || "dashboard";

/* GLOBAL STATE */
let allUsers = [];

/* =========================================================
   DOM HELPERS
========================================================= */

function getElement(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const element = getElement(id);

    if (element) {
        element.textContent = String(value);
    }
}

/* =========================================================
   TOAST NOTIFICATIONS
========================================================= */

function showToast(message) {
    const toast = getElement("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(showToast.timer);

    showToast.timer = window.setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}

/* =========================================================
   LOADER
========================================================= */

function showLoader() {
    const loader = getElement("pageLoader");
    const app = getElement("app");

    if (loader) loader.classList.remove("hidden");
    if (app) app.classList.add("hidden");
}

function showApp() {
    const loader = getElement("pageLoader");
    const app = getElement("app");

    if (loader) loader.classList.add("hidden");
    if (app) app.classList.remove("hidden");
}

/* =========================================================
   AUTHENTICATION
========================================================= */

async function getCurrentUser() {
    if (!db || !db.auth) {
        throw new Error("Supabase client is unavailable.");
    }

    const { data, error } = await db.auth.getUser();

    if (error) throw error;

    if (!data?.user) {
        window.location.href = "../../index.html";
        return null;
    }

    return data.user;
}

/* =========================================================
   OWNER AUTHORIZATION
========================================================= */

async function verifyOwner(authUser) {
    const { data: ownerResult, error: ownerError } =
        await db.rpc("is_owner");

    if (ownerError) {
        console.error("Owner verification error:", ownerError);

        throw new Error(
            "Unable to verify Owner permissions."
        );
    }

    if (ownerResult !== true) {
        throw new Error(
            "This account is not authorized as a Gracextol Owner."
        );
    }

    const { data: profile, error: profileError } =
        await db
            .from("users")
            .select(`
                id,
                username,
                email,
                role,
                is_active,
                auth_id
            `)
            .eq("auth_id", authUser.id)
            .maybeSingle();

    if (profileError) throw profileError;

    if (!profile) {
        throw new Error("Owner profile could not be found.");
    }

    if (profile.role !== "owner") {
        throw new Error(
            "This account does not have Owner privileges."
        );
    }

    if (profile.is_active !== true) {
        throw new Error("This Owner account is inactive.");
    }

    return profile;
}

/* =========================================================
   OWNER PROFILE DISPLAY
========================================================= */

function renderOwnerProfile(profile) {
    const name = profile.username || "Iyke";

    const ownerName = getElement("ownerName");
    const welcomeName = getElement("welcomeName");

    if (ownerName) ownerName.textContent = name;
    if (welcomeName) welcomeName.textContent = name;
}

/* =========================================================
   DASHBOARD: USER STATISTICS
========================================================= */

async function loadDashboard() {
    const { data: users, error } = await db
        .from("users")
        .select(`
            id,
            username,
            email,
            role,
            is_active,
            created_at
        `);

    if (error) throw error;

    const rows = Array.isArray(users) ? users : [];

    const total = rows.length;

    const teachers = rows.filter(
        user => user.role === "teacher"
    ).length;

    const students = rows.filter(
        user => user.role === "student"
    ).length;

    const active = rows.filter(
        user => user.is_active === true
    ).length;

    const inactive = rows.filter(
        user => user.is_active !== true
    ).length;

    setText("totalUsers", total);
    setText("totalTeachers", teachers);
    setText("totalStudents", students);
    setText("activeUsers", active);
    setText("overviewTeachers", teachers);
    setText("overviewStudents", students);
    setText("overviewActive", active);
    setText("overviewInactive", inactive);

    await loadOwnerDashboardBusinessStats(rows);
}

/* =========================================================
   DASHBOARD: ORGANIZATIONS, SUBSCRIPTIONS AND PAYMENTS
========================================================= */

async function loadOwnerDashboardBusinessStats(userRows) {
    const container = getElement("pendingPaymentsContent");

    try {
        const [orgResult, subResult, payResult] =
            await Promise.all([
                db
                    .from("organizations")
                    .select("id, name, status"),

                db
                    .from("subscriptions")
                    .select(
                        "id, organization_id, user_id, status"
                    ),

                db
                    .from("payments")
                    .select(`
                        id,
                        organization_id,
                        user_id,
                        amount,
                        currency,
                        payment_reference,
                        status,
                        created_at
                    `)
                    .eq("status", "pending")
                    .order("created_at", {
                        ascending: false
                    })
                    .limit(5)
            ]);

        if (orgResult.error) throw orgResult.error;
        if (subResult.error) throw subResult.error;
        if (payResult.error) throw payResult.error;

        const organizations = orgResult.data || [];
        const subscriptions = subResult.data || [];
        const payments = payResult.data || [];

        /* ORGANIZATION COUNTS */

        const activeOrganizations = organizations.filter(
            organization =>
                String(organization.status || "").toLowerCase()
                === "active"
        );

        const pendingOrganizations = organizations.filter(
            organization =>
                String(organization.status || "").toLowerCase()
                === "pending"
        );

        /* SUBSCRIPTION COUNTS */

        const activeSubscriptions = subscriptions.filter(
            subscription => subscription.status === "active"
        );

        const trialSubscriptions = subscriptions.filter(
            subscription => subscription.status === "trial"
        );

        const graceSubscriptions = subscriptions.filter(
            subscription =>
                subscription.status === "grace_period"
        );

        const expiredSubscriptions = subscriptions.filter(
            subscription => subscription.status === "expired"
        );

        /* DISTINCT ORGANIZATIONS ON TRIAL */

        const trialOrganizationIds = new Set(
            subscriptions
                .filter(subscription =>
                    subscription.organization_id &&
                    subscription.status === "trial"
                )
                .map(subscription => subscription.organization_id)
        );

        /* DISTINCT ORGANIZATIONS WITH EXPIRED SUBSCRIPTIONS */

        const expiredOrganizationIds = new Set(
            subscriptions
                .filter(subscription =>
                    subscription.organization_id &&
                    subscription.status === "expired"
                )
                .map(subscription => subscription.organization_id)
        );

        /* UPDATE DASHBOARD */

        setText("totalOrganizations", organizations.length);
        setText(
            "activeOrganizations",
            activeOrganizations.length
        );
        setText(
            "pendingOrganizations",
            pendingOrganizations.length
        );

        setText(
            "summaryActiveOrganizations",
            activeOrganizations.length
        );
        setText(
            "summaryPendingOrganizations",
            pendingOrganizations.length
        );
        setText(
            "summaryTrialOrganizations",
            trialOrganizationIds.size
        );
        setText(
            "summaryExpiredOrganizations",
            expiredOrganizationIds.size
        );

        setText(
            "summaryActiveSubscriptions",
            activeSubscriptions.length
        );
        setText(
            "summaryTrialSubscriptions",
            trialSubscriptions.length
        );
        setText(
            "summaryGraceSubscriptions",
            graceSubscriptions.length
        );
        setText(
            "summaryExpiredSubscriptions",
            expiredSubscriptions.length
        );

        /* UPDATE PAYMENT PREVIEW */

        renderPendingPaymentPreview(
            payments,
            organizations,
            userRows
        );

    } catch (error) {
        console.error(
            "Owner dashboard business statistics error:",
            error
        );

        [
            "totalOrganizations",
            "activeOrganizations",
            "pendingOrganizations",
            "summaryActiveOrganizations",
            "summaryPendingOrganizations",
            "summaryTrialOrganizations",
            "summaryExpiredOrganizations",
            "summaryActiveSubscriptions",
            "summaryTrialSubscriptions",
            "summaryGraceSubscriptions",
            "summaryExpiredSubscriptions"
        ].forEach(id => setText(id, "—"));

        if (container) {
            container.innerHTML = `
                <p class="owner-empty-state">
                    Unable to load payment activity.
                    Open Payments to review submissions.
                </p>
            `;
        }
    }
}

/* =========================================================
   DASHBOARD: PENDING PAYMENT PREVIEW
========================================================= */

function renderPendingPaymentPreview(
    payments,
    organizations,
    users
) {
    const container = getElement("pendingPaymentsContent");

    if (!container) return;

    if (!payments.length) {
        container.innerHTML = `
            <p class="owner-empty-state">
                No payments are currently awaiting verification.
            </p>
        `;
        return;
    }

    const organizationMap = new Map(
        organizations.map(organization => [
            organization.id,
            organization
        ])
    );

    const userMap = new Map(
        users.map(user => [user.id, user])
    );

    container.innerHTML = payments.map(payment => {
        const organization = payment.organization_id
            ? organizationMap.get(payment.organization_id)
            : null;

        const user = payment.user_id
            ? userMap.get(payment.user_id)
            : null;

        const payerName =
            organization?.name ||
            user?.username ||
            user?.email ||
            (
                payment.organization_id
                    ? "Organization payment"
                    : "Teacher payment"
            );

        let amount = "—";

        try {
            const currency = payment.currency || "NGN";

            amount = new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency,
                maximumFractionDigits: 0
            }).format(Number(payment.amount) || 0);
        } catch (error) {
            amount = `${payment.currency || "NGN"} ${
                Number(payment.amount) || 0
            }`;
        }

        return `
            <div class="owner-payment-row">
                <div class="owner-payment-main">
                    <strong>${escapeHtml(payerName)}</strong>

                    <span>
                        ${escapeHtml(
                            payment.payment_reference || "No reference"
                        )}
                        ·
                        ${formatDate(payment.created_at)}
                    </span>
                </div>

                <div class="owner-payment-amount">
                    <strong>${escapeHtml(amount)}</strong>

                    <a href="payments.html">
                        Review payment →
                    </a>
                </div>
            </div>
        `;
    }).join("");
}

/* =========================================================
   LOAD USERS
========================================================= */

async function loadUsers() {
    const { data, error } = await db
        .from("users")
        .select(`
            id,
            username,
            email,
            role,
            is_active,
            created_at,
            deactivated_at
        `)
        .order("created_at", {
            ascending: false
        });

    if (error) throw error;

    allUsers = Array.isArray(data) ? data : [];

    updateUserCounters();
    renderUsers();
}

/* =========================================================
   USER COUNTERS
========================================================= */

function updateUserCounters() {
    const total = allUsers.length;

    const active = allUsers.filter(
        user => user.is_active === true
    ).length;

    setText("userCount", total);
    setText("activeCount", active);
}

/* =========================================================
   RENDER USERS
========================================================= */

function renderUsers() {
    const tableBody = getElement("usersTableBody");

    if (!tableBody) return;

    const searchInput = getElement("userSearch");
    const roleFilter = getElement("roleFilter");

    const search = (
        searchInput?.value || ""
    ).trim().toLowerCase();

    const selectedRole = roleFilter?.value || "all";

    const filtered = allUsers.filter(user => {
        const username = String(user.username || "").toLowerCase();
        const email = String(user.email || "").toLowerCase();

        const matchesSearch =
            !search ||
            username.includes(search) ||
            email.includes(search);

        const matchesRole =
            selectedRole === "all" ||
            user.role === selectedRole;

        return matchesSearch && matchesRole;
    });

    if (!filtered.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-row">
                    No users found.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filtered
        .map(user => renderUserRow(user))
        .join("");

    attachUserActions();
}

/* =========================================================
   RENDER USER ROW
========================================================= */

function renderUserRow(user) {
    const name = escapeHtml(
        user.username || "Unnamed user"
    );

    const email = escapeHtml(
        user.email || "No email"
    );

    const role = String(user.role || "").toLowerCase();

    const status = user.is_active ? "Active" : "Inactive";

    const created = formatDate(user.created_at);

    const isOwner = role === "owner";

    let actionHtml = "";

    if (isOwner) {
        actionHtml = `
            <button
                type="button"
                class="user-action disabled"
                disabled
            >
                Protected
            </button>
        `;
    } else if (user.is_active) {
        actionHtml = `
            <button
                type="button"
                class="user-action deactivate"
                data-action="deactivate"
                data-user-id="${escapeHtml(user.id)}"
            >
                Deactivate
            </button>
        `;
    } else {
        actionHtml = `
            <button
                type="button"
                class="user-action activate"
                data-action="activate"
                data-user-id="${escapeHtml(user.id)}"
            >
                Activate
            </button>
        `;
    }

    return `
        <tr>
            <td>
                <div class="user-name">${name}</div>
                <div class="user-email">${email}</div>
            </td>

            <td>
                <span class="role-badge role-${escapeHtml(role)}">
                    ${escapeHtml(role || "unknown")}
                </span>
            </td>

            <td>
                <span class="status-badge ${
                    user.is_active
                        ? "status-active"
                        : "status-inactive"
                }">
                    ${status}
                </span>
            </td>

            <td>${created}</td>

            <td>${actionHtml}</td>
        </tr>
    `;
}

/* =========================================================
   USER ACTION BUTTONS
========================================================= */

function attachUserActions() {
    document.querySelectorAll("[data-action]").forEach(button => {
        button.addEventListener("click", async () => {
            const action = button.dataset.action;
            const userId = button.dataset.userId;

            if (!userId) return;

            if (action === "deactivate") {
                const confirmed = window.confirm(
                    "Deactivate this user?"
                );

                if (!confirmed) return;

                await changeUserStatus(userId, "deactivate");

            } else if (action === "activate") {
                const confirmed = window.confirm(
                    "Reactivate this user?"
                );

                if (!confirmed) return;

                await changeUserStatus(userId, "activate");
            }
        });
    });
}

/* =========================================================
   ACTIVATE OR DEACTIVATE USER
========================================================= */

async function changeUserStatus(userId, action) {
    try {
        const functionName =
            action === "deactivate"
                ? "deactivate_user"
                : "activate_user";

        const { data, error } = await db.rpc(functionName, {
            p_user_id: userId
        });

        if (error) throw error;

        if (data !== true) {
            throw new Error(
                "The operation was not completed."
            );
        }

        showToast(
            action === "deactivate"
                ? "User deactivated successfully."
                : "User activated successfully."
        );

        await loadUsers();

    } catch (error) {
        console.error("User status error:", error);

        showToast(
            error?.message ||
            "Unable to update user status."
        );
    }
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* =========================================================
   LOGOUT
========================================================= */

async function logout() {
    try {
        const { error } = await db.auth.signOut();

        if (error) throw error;

        window.location.href = "../../index.html";

    } catch (error) {
        console.error("Logout error:", error);

        showToast("Unable to sign out.");
    }
}

/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEvents() {
    const logoutBtn = getElement("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }

    const search = getElement("userSearch");

    if (search) {
        search.addEventListener("input", renderUsers);
    }

    const roleFilter = getElement("roleFilter");

    if (roleFilter) {
        roleFilter.addEventListener("change", renderUsers);
    }
}

/* =========================================================
   ACCESS ERROR PAGE
========================================================= */

function showErrorPage(message) {
    const loader = getElement("pageLoader");

    if (!loader) return;

    loader.innerHTML = `
        <div style="
            width: min(420px, 90%);
            padding: 32px;
            text-align: center;
        ">
            <img
                src="../../assets/images/graextolcbt-logo.png"
                alt="Gracextol CBT"
                style="
                    width: 90px;
                    max-width: 100%;
                    margin-bottom: 20px;
                "
            >

            <h2 style="margin: 0 0 10px;">
                Owner Access Required
            </h2>

            <p style="
                color: #77747f;
                line-height: 1.6;
                margin: 0;
            ">
                ${escapeHtml(message)}
            </p>

            <button
                type="button"
                id="returnHomeBtn"
                style="
                    margin-top: 20px;
                    padding: 11px 18px;
                    border: 0;
                    border-radius: 8px;
                    background: #6d3df5;
                    color: white;
                    cursor: pointer;
                    font-weight: 700;
                "
            >
                Return
            </button>
        </div>
    `;

    const returnButton = getElement("returnHomeBtn");

    if (returnButton) {
        returnButton.addEventListener("click", () => {
            window.location.href = "../../index.html";
        });
    }
}

/* =========================================================
   INITIALIZE OWNER PORTAL
========================================================= */

async function initializeOwnerPortal() {
    try {
        showLoader();

        if (!db) {
            throw new Error(
                "Supabase client is unavailable."
            );
        }

        const authUser = await getCurrentUser();

        if (!authUser) return;

        const ownerProfile = await verifyOwner(authUser);

        if (!ownerProfile) return;

        renderOwnerProfile(ownerProfile);

        setupEvents();

        if (pageType === "dashboard") {
            await loadDashboard();

        } else if (pageType === "users") {
            await loadUsers();
        }

        showApp();

    } catch (error) {
        console.error(
            "Owner portal initialization error:",
            error
        );

        showErrorPage(
            error?.message ||
            "Unable to load Owner portal."
        );
    }
}

/* =========================================================
   START OWNER PORTAL
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeOwnerPortal
);