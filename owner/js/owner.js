"use strict";


/* =========================================================
   GRACEXTOL OWNER PORTAL
========================================================= */


/* =========================================================
   SUPABASE CLIENT
========================================================= */

const db =
    typeof supabaseClient !== "undefined"
        ? supabaseClient
        : null;


const pageType =
    document.body.dataset.page ||
    "dashboard";


/* =========================================================
   GLOBAL STATE
========================================================= */

let allUsers = [];


/* =========================================================
   DOM HELPER
========================================================= */

function getElement(id) {

    return document.getElementById(id);

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    const toast =
        getElement("toast");


    if (!toast) {

        return;

    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    window.clearTimeout(
        showToast.timer
    );


    showToast.timer =
        window.setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/* =========================================================
   LOADER
========================================================= */

function showLoader() {

    const loader =
        getElement(
            "pageLoader"
        );


    const app =
        getElement(
            "app"
        );


    if (loader) {

        loader.classList.remove(
            "hidden"
        );

    }


    if (app) {

        app.classList.add(
            "hidden"
        );

    }

}


function showApp() {

    const loader =
        getElement(
            "pageLoader"
        );


    const app =
        getElement(
            "app"
        );


    if (loader) {

        loader.classList.add(
            "hidden"
        );

    }


    if (app) {

        app.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function getCurrentUser() {

    if (
        !db ||
        !db.auth
    ) {

        throw new Error(
            "Supabase client is unavailable."
        );

    }


    const {
        data,
        error
    } =
        await db.auth.getUser();


    if (error) {

        throw error;

    }


    if (!data?.user) {

        window.location.href =
            "../../index.html";

        return null;

    }


    return data.user;

}


/* =========================================================
   OWNER AUTHORIZATION
========================================================= */

async function verifyOwner(
    authUser
) {


    /* -----------------------------------------
       DATABASE OWNER CHECK
    ----------------------------------------- */

    const {
        data: ownerResult,
        error: ownerError
    } =
        await db.rpc(
            "is_owner"
        );


    if (ownerError) {

        console.error(
            "Owner verification error:",
            ownerError
        );


        throw new Error(
            "Unable to verify Owner permissions."
        );

    }


    if (
        ownerResult !== true
    ) {

        throw new Error(
            "This account is not authorized as a Gracextol Owner."
        );

    }


    /* -----------------------------------------
       OWNER PROFILE
    ----------------------------------------- */

    const {
        data: profile,
        error: profileError
    } =
        await db
            .from("users")
            .select(
                `
                id,
                username,
                email,
                role,
                is_active,
                auth_id
                `
            )
            .eq(
                "auth_id",
                authUser.id
            )
            .maybeSingle();


    if (profileError) {

        throw profileError;

    }


    if (!profile) {

        throw new Error(
            "Owner profile could not be found."
        );

    }


    if (
        profile.role !== "owner"
    ) {

        throw new Error(
            "This account does not have Owner privileges."
        );

    }


    if (
        profile.is_active !== true
    ) {

        throw new Error(
            "This Owner account is inactive."
        );

    }


    return profile;

}


/* =========================================================
   OWNER PROFILE DISPLAY
========================================================= */

function renderOwnerProfile(
    profile
) {

    const name =
        profile.username ||
        "Iyke";


    const ownerName =
        getElement(
            "ownerName"
        );


    const welcomeName =
        getElement(
            "welcomeName"
        );


    if (ownerName) {

        ownerName.textContent =
            name;

    }


    if (welcomeName) {

        welcomeName.textContent =
            name;

    }

}


/* =========================================================
   TEXT HELPER
========================================================= */

function setText(
    id,
    value
) {

    const element =
        getElement(id);


    if (element) {

        element.textContent =
            String(value);

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {


    const {
        data: users,
        error
    } =
        await db
            .from("users")
            .select(
                `
                id,
                username,
                email,
                role,
                is_active,
                created_at
                `
            );


    if (error) {

        throw error;

    }


    const rows =
        Array.isArray(users)
            ? users
            : [];


    const total =
        rows.length;


    const teachers =
        rows.filter(
            user =>
                user.role === "teacher"
        ).length;


    const students =
        rows.filter(
            user =>
                user.role === "student"
        ).length;


    const active =
        rows.filter(
            user =>
                user.is_active === true
        ).length;


    const inactive =
        rows.filter(
            user =>
                user.is_active !== true
        ).length;


    setText(
        "totalUsers",
        total
    );


    setText(
        "totalTeachers",
        teachers
    );


    setText(
        "totalStudents",
        students
    );


    setText(
        "activeUsers",
        active
    );


    setText(
        "overviewTeachers",
        teachers
    );


    setText(
        "overviewStudents",
        students
    );


    setText(
        "overviewActive",
        active
    );


    setText(
        "overviewInactive",
        inactive
    );

}


/* =========================================================
   LOAD USERS
========================================================= */

async function loadUsers() {


    const {
        data,
        error
    } =
        await db
            .from("users")
            .select(
                `
                id,
                username,
                email,
                role,
                is_active,
                created_at,
                deactivated_at
                `
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        throw error;

    }


    allUsers =
        Array.isArray(data)
            ? data
            : [];


    updateUserCounters();


    renderUsers();

}


/* =========================================================
   USER COUNTERS
========================================================= */

function updateUserCounters() {

    const total =
        allUsers.length;


    const active =
        allUsers.filter(
            user =>
                user.is_active === true
        ).length;


    setText(
        "userCount",
        total
    );


    setText(
        "activeCount",
        active
    );

}


/* =========================================================
   RENDER USERS
========================================================= */

function renderUsers() {

    const tableBody =
        getElement(
            "usersTableBody"
        );


    if (!tableBody) {

        return;

    }


    const searchInput =
        getElement(
            "userSearch"
        );


    const roleFilter =
        getElement(
            "roleFilter"
        );


    const search =
        (
            searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const selectedRole =
        roleFilter?.value ||
        "all";


    const filtered =
        allUsers.filter(
            user => {


                const matchesSearch =
                    !search ||
                    String(
                        user.username ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            search
                        ) ||
                    String(
                        user.email ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            search
                        );


                const matchesRole =
                    selectedRole ===
                        "all" ||
                    user.role ===
                        selectedRole;


                return (
                    matchesSearch &&
                    matchesRole
                );


            }
        );


    if (!filtered.length) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="empty-row"
                >
                    No users found.
                </td>
            </tr>
        `;

        return;

    }


    tableBody.innerHTML =
        filtered
            .map(
                user =>
                    renderUserRow(
                        user
                    )
            )
            .join("");


    attachUserActions();

}


/* =========================================================
   USER ROW
========================================================= */

function renderUserRow(
    user
) {


    const name =
        escapeHtml(
            user.username ||
            "Unnamed user"
        );


    const email =
        escapeHtml(
            user.email ||
            "No email"
        );


    const role =
        String(
            user.role ||
            ""
        )
            .toLowerCase();


    const status =
        user.is_active
            ? "Active"
            : "Inactive";


    const created =
        formatDate(
            user.created_at
        );


    const isOwner =
        role === "owner";


    let actionHtml =
        "";


    /* OWNER PROTECTION */

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

    }


    /* DEACTIVATE */

    else if (
        user.is_active
    ) {

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

    }


    /* ACTIVATE */

    else {

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

                <div class="user-name">
                    ${name}
                </div>

                <div class="user-email">
                    ${email}
                </div>

            </td>


            <td>

                <span
                    class="role-badge role-${escapeHtml(role)}"
                >
                    ${
                        escapeHtml(
                            role ||
                            "unknown"
                        )
                    }
                </span>

            </td>


            <td>

                <span
                    class="
                        status-badge
                        ${
                            user.is_active
                                ? "status-active"
                                : "status-inactive"
                        }
                    "
                >
                    ${status}
                </span>

            </td>


            <td>
                ${created}
            </td>


            <td>
                ${actionHtml}
            </td>


        </tr>

    `;

}


/* =========================================================
   ACTION BUTTONS
========================================================= */

function attachUserActions() {


    document
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(
            button => {


                button.addEventListener(
                    "click",
                    async () => {


                        const action =
                            button.dataset.action;


                        const userId =
                            button.dataset.userId;


                        if (!userId) {

                            return;

                        }


                        /* DEACTIVATE */

                        if (
                            action ===
                            "deactivate"
                        ) {


                            const confirmed =
                                window.confirm(
                                    "Deactivate this user?"
                                );


                            if (!confirmed) {

                                return;

                            }


                            await changeUserStatus(
                                userId,
                                "deactivate"
                            );

                        }


                        /* ACTIVATE */

                        else if (
                            action ===
                            "activate"
                        ) {


                            const confirmed =
                                window.confirm(
                                    "Reactivate this user?"
                                );


                            if (!confirmed) {

                                return;

                            }


                            await changeUserStatus(
                                userId,
                                "activate"
                            );

                        }


                    }
                );


            }
        );


}


/* =========================================================
   CHANGE STATUS
========================================================= */

async function changeUserStatus(
    userId,
    action
) {


    try {


        const functionName =
            action === "deactivate"
                ? "deactivate_user"
                : "activate_user";


        const {
            data,
            error
        } =
            await db.rpc(
                functionName,
                {
                    p_user_id:
                        userId
                }
            );


        if (error) {

            throw error;

        }


        if (data !== true) {

            throw new Error(
                "The operation was not completed."
            );

        }


        showToast(

            action ===
                "deactivate"

                ? "User deactivated successfully."

                : "User activated successfully."

        );


        await loadUsers();


    } catch (error) {


        console.error(
            "User status error:",
            error
        );


        showToast(
            error?.message ||
            "Unable to update user status."
        );


    }

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
    value
) {


    if (!value) {

        return "—";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleDateString(
        "en-NG",
        {
            year:
                "numeric",

            month:
                "short",

            day:
                "numeric"
        }
    );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(
    value
) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {


    try {


        const {
            error
        } =
            await db.auth.signOut();


        if (error) {

            throw error;

        }


        window.location.href =
            "../../index.html";


    } catch (error) {


        console.error(
            "Logout error:",
            error
        );


        showToast(
            "Unable to sign out."
        );


    }

}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {


    const logoutBtn =
        getElement(
            "logoutBtn"
        );


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            logout
        );

    }


    const search =
        getElement(
            "userSearch"
        );


    if (search) {

        search.addEventListener(
            "input",
            renderUsers
        );

    }


    const roleFilter =
        getElement(
            "roleFilter"
        );


    if (roleFilter) {

        roleFilter.addEventListener(
            "change",
            renderUsers
        );

    }

}


/* =========================================================
   ERROR PAGE
========================================================= */

function showErrorPage(
    message
) {


    const loader =
        getElement(
            "pageLoader"
        );


    if (!loader) {

        return;

    }


    loader.innerHTML = `

        <div
            style="
                width: min(420px, 90%);
                padding: 32px;
                text-align: center;
            "
        >


            <img
                src="../../assets/images/graextolcbt-logo.png"
                alt="Gracextol CBT"
                style="
                    width: 90px;
                    max-width: 100%;
                    margin-bottom: 20px;
                "
            >


            <h2
                style="
                    margin: 0 0 10px;
                "
            >
                Owner Access Required
            </h2>


            <p
                style="
                    color: #77747f;
                    line-height: 1.6;
                    margin: 0;
                "
            >
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


    const returnButton =
        getElement(
            "returnHomeBtn"
        );


    if (returnButton) {

        returnButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "../../index.html";

            }
        );

    }

}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeOwnerPortal() {


    try {


        showLoader();


        /* -----------------------------------------
           SUPABASE CLIENT
        ----------------------------------------- */

        if (!db) {

            throw new Error(
                "Supabase client is unavailable."
            );

        }


        /* -----------------------------------------
           AUTH USER
        ----------------------------------------- */

        const authUser =
            await getCurrentUser();


        if (!authUser) {

            return;

        }


        /* -----------------------------------------
           OWNER AUTHORIZATION
        ----------------------------------------- */

        const ownerProfile =
            await verifyOwner(
                authUser
            );


        if (!ownerProfile) {

            return;

        }


        /* -----------------------------------------
           PROFILE
        ----------------------------------------- */

        renderOwnerProfile(
            ownerProfile
        );


        /* -----------------------------------------
           EVENTS
        ----------------------------------------- */

        setupEvents();


        /* -----------------------------------------
           LOAD PAGE DATA
        ----------------------------------------- */

        if (
            pageType ===
            "dashboard"
        ) {

            await loadDashboard();

        }


        else if (
            pageType ===
            "users"
        ) {

            await loadUsers();

        }


        /* -----------------------------------------
           SHOW APP
        ----------------------------------------- */

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