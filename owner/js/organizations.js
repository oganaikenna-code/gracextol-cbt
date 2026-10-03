/* =========================================================
   GRACEXTOL CBT
   OWNER - ORGANIZATIONS MANAGEMENT
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const organizationForm =
    document.getElementById(
        "organizationForm"
    );


const organizationName =
    document.getElementById(
        "organizationName"
    );


const organizationSlug =
    document.getElementById(
        "organizationSlug"
    );


const createOrganizationButton =
    document.getElementById(
        "createOrganizationButton"
    );


const organizationMessage =
    document.getElementById(
        "organizationMessage"
    );


const organizationsTableBody =
    document.getElementById(
        "organizationsTableBody"
    );


const organizationCount =
    document.getElementById(
        "organizationCount"
    );


const organizationFilters =
    document.querySelectorAll(
        ".organization-filter"
    );


/* =========================================================
   STATE
========================================================= */

let allOrganizations = [];

let currentStatusFilter =
    "all";


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    message,
    type = ""
) {

    organizationMessage.textContent =
        message;


    organizationMessage.className =
        "organization-message";


    if (type) {

        organizationMessage.classList.add(
            type
        );

    }

}


/* =========================================================
   HELPERS
========================================================= */

function createSlug(
    value
) {

    return value

        .toLowerCase()

        .trim()

        .replace(
            /[^a-z0-9]+/g,
            "-"
        )

        .replace(
            /(^-|-$)/g,
            "");

}


function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


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


function formatDate(
    value
) {

    if (!value) {

        return "-";

    }


    return new Date(
        value
    ).toLocaleDateString(
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
   VERIFY OWNER
========================================================= */

async function verifyOwner() {

    try {

        const {
            data: sessionData,
            error: sessionError
        } =
            await supabaseClient.auth.getSession();


        if (
            sessionError ||
            !sessionData.session
        ) {

            window.location.href =
                "login.html";

            return false;

        }


        const user =
            sessionData.session.user;


        const {
            data: ownerProfile,
            error: ownerError
        } =
            await supabaseClient

                .from("users")

                .select(
                    `
                    id,
                    auth_id,
                    username,
                    email,
                    role,
                    is_active
                    `
                )

                .eq(
                    "auth_id",
                    user.id
                )

                .maybeSingle();


        if (
            ownerError ||
            !ownerProfile
        ) {

            await supabaseClient.auth.signOut();

            window.location.href =
                "login.html";

            return false;

        }


        if (
            ownerProfile.role !==
            "owner"
        ) {

            await supabaseClient.auth.signOut();

            window.location.href =
                "login.html";

            return false;

        }


        if (
            ownerProfile.is_active !==
            true
        ) {

            await supabaseClient.auth.signOut();

            window.location.href =
                "login.html";

            return false;

        }


        return true;

    }

    catch (
        error
    ) {

        console.error(
            "Owner verification error:",
            error
        );

        window.location.href =
            "login.html";

        return false;

    }

}


/* =========================================================
   LOAD ORGANIZATIONS
========================================================= */

async function loadOrganizations() {

    organizationsTableBody.innerHTML = `

        <tr>

            <td
                colspan="5"
                class="organizations-empty"
            >

                <i
                    class="fa-solid fa-spinner fa-spin"
                ></i>

                <p>
                    Loading organizations...
                </p>

            </td>

        </tr>

    `;


    /* =============================================
       LOAD ORGANIZATIONS
    ============================================== */

    const {
        data: organizations,
        error: organizationsError
    } =
        await supabaseClient

            .from("organizations")

            .select(
                `
                id,
                name,
                slug,
                status,
                created_at,
                updated_at
                `
            )

            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (
        organizationsError
    ) {

        console.error(
            "Organizations load error:",
            organizationsError
        );


        showOrganizationError();

        return;

    }


    /* =============================================
       LOAD ORGANIZATION ADMINS
    ============================================== */

    const {
        data: admins,
        error: adminsError
    } =
        await supabaseClient

            .from("users")

            .select(
                `
                id,
                auth_id,
                username,
                email,
                role,
                organization_id,
                is_active
                `
            )

            .eq(
                "role",
                "organization_admin"
            );


    if (
        adminsError
    ) {

        console.error(
            "Organization admin load error:",
            adminsError
        );

        showOrganizationError();

        return;

    }


    /* =============================================
       MAP ADMINS
    ============================================== */

    const adminMap =
        new Map();


    (
        admins || []
    ).forEach(
        admin => {

            if (
                !adminMap.has(
                    admin.organization_id
                )
            ) {

                adminMap.set(
                    admin.organization_id,
                    admin
                );

            }

        }
    );


    /* =============================================
       COMBINE DATA
    ============================================== */

    allOrganizations =
        (
            organizations || []
        ).map(
            organization => ({

                ...organization,

                admin:
                    adminMap.get(
                        organization.id
                    ) || null

            })
        );


    renderOrganizations();

}


/* =========================================================
   RENDER
========================================================= */

function renderOrganizations() {

    const filteredOrganizations =
        currentStatusFilter ===
        "all"

            ? allOrganizations

            : allOrganizations.filter(
                organization =>
                    organization.status ===
                    currentStatusFilter
            );


    organizationCount.textContent =
        `${filteredOrganizations.length} ${
            filteredOrganizations.length === 1
                ? "Organization"
                : "Organizations"
        }`;


    if (
        filteredOrganizations.length ===
        0
    ) {

        organizationsTableBody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="organizations-empty"
                >

                    <i
                        class="fa-solid fa-building"
                    ></i>

                    <p>
                        No organizations found in this category.
                    </p>

                </td>

            </tr>

        `;

        return;

    }


    organizationsTableBody.innerHTML =
        filteredOrganizations
            .map(
                organization =>
                    renderOrganizationRow(
                        organization
                    )
            )
            .join("");


    attachOrganizationActions();

}


/* =========================================================
   ORGANIZATION ROW
========================================================= */

function renderOrganizationRow(
    organization
) {

    const admin =
        organization.admin;


    const status =
        organization.status;


    const statusClass =
        `status-${status}`;


    let actionHtml =
        "";


    /* =============================================
       PENDING
    ============================================== */

    if (
        status === "pending"
    ) {

        actionHtml = `

            <button
                type="button"
                class="organization-action-btn approve"
                data-action="approve"
                data-id="${organization.id}"
            >
                Approve
            </button>

            <button
                type="button"
                class="organization-action-btn reject"
                data-action="reject"
                data-id="${organization.id}"
            >
                Reject
            </button>

        `;

    }


    /* =============================================
       ACTIVE
    ============================================== */

    else if (
        status === "active"
    ) {

        actionHtml = `

            <button
                type="button"
                class="organization-action-btn deactivate"
                data-action="deactivate"
                data-id="${organization.id}"
            >
                Deactivate
            </button>

        `;

    }


    /* =============================================
       INACTIVE
    ============================================== */

    else if (
        status === "inactive"
    ) {

        actionHtml = `

            <button
                type="button"
                class="organization-action-btn activate"
                data-action="activate"
                data-id="${organization.id}"
            >
                Activate
            </button>

        `;

    }


    /* =============================================
       REJECTED
    ============================================== */

    else {

        actionHtml = `

            <span
                class="organization-slug"
            >
                No action
            </span>

        `;

    }


    return `

        <tr>

            <td>

                <div
                    class="organization-name-cell"
                >

                    <span
                        class="organization-name"
                    >
                        ${escapeHtml(
                            organization.name
                        )}
                    </span>

                    <span
                        class="organization-slug"
                    >
                        ${escapeHtml(
                            organization.slug ||
                            "No slug"
                        )}
                    </span>

                </div>

            </td>


            <td>

                <div
                    class="organization-admin-cell"
                >

                    ${
                        admin

                            ? `

                                <span
                                    class="organization-admin-name"
                                >
                                    ${escapeHtml(
                                        admin.username ||
                                        "Organization Admin"
                                    )}
                                </span>

                                <span
                                    class="organization-admin-email"
                                >
                                    ${escapeHtml(
                                        admin.email ||
                                        "-"
                                    )}
                                </span>

                                ${
                                    status === "pending" &&
                                    !admin.is_active

                                        ? `
                                            <span
                                                class="organization-admin-unverified"
                                            >
                                                Awaiting approval
                                            </span>
                                          `

                                        : ""
                                }

                              `

                            : `

                                <span
                                    class="organization-admin-email"
                                >
                                    No organization admin found
                                </span>

                              `
                    }

                </div>

            </td>


            <td>

                <span
                    class="status-badge ${statusClass}"
                >
                    ${escapeHtml(
                        status
                    )}
                </span>

            </td>


            <td>
                ${formatDate(
                    organization.created_at
                )}
            </td>


            <td>

                <div
                    class="organization-actions"
                >

                    ${actionHtml}

                </div>

            </td>

        </tr>

    `;

}


/* =========================================================
   EMPTY / ERROR
========================================================= */

function showOrganizationError() {

    organizationsTableBody.innerHTML = `

        <tr>

            <td
                colspan="5"
                class="organizations-empty"
            >

                <i
                    class="fa-solid fa-triangle-exclamation"
                ></i>

                <p>
                    Unable to load organizations.
                </p>

            </td>

        </tr>

    `;


    organizationCount.textContent =
        "0 Organizations";

}


/* =========================================================
   APPROVE
========================================================= */

async function approveOrganization(
    organizationId
) {

    const confirmed =
        window.confirm(
            "Approve this organization? Its Organization Admin will become active after approval."
        );


    if (
        !confirmed
    ) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient

                .rpc(
                    "approve_organization",
                    {
                        p_organization_id:
                            organizationId
                    }
                );


        if (
            error
        ) {

            console.error(
                "Approve organization error:",
                error
            );


            alert(
                error.message ||
                "Unable to approve organization."
            );

            return;

        }


        console.log(
            "Organization approved:",
            data
        );


        await loadOrganizations();

    }

    catch (
        error
    ) {

        console.error(
            "Unexpected approval error:",
            error
        );


        alert(
            "Unable to approve organization."
        );

    }

}


/* =========================================================
   REJECT
========================================================= */

async function rejectOrganization(
    organizationId
) {

    const confirmed =
        window.confirm(
            "Reject this organization registration?"
        );


    if (
        !confirmed
    ) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient

                .rpc(
                    "reject_organization",
                    {
                        p_organization_id:
                            organizationId
                    }
                );


        if (
            error
        ) {

            console.error(
                "Reject organization error:",
                error
            );


            alert(
                error.message ||
                "Unable to reject organization."
            );

            return;

        }


        console.log(
            "Organization rejected:",
            data
        );


        await loadOrganizations();

    }

    catch (
        error
    ) {

        console.error(
            "Unexpected rejection error:",
            error
        );


        alert(
            "Unable to reject organization."
        );

    }

}


/* =========================================================
   ACTIVATE / DEACTIVATE
   Manual Owner control for existing organizations
========================================================= */

async function updateOrganizationStatus(
    organizationId,
    nextStatus
) {

    const action =
        nextStatus === "active"
            ? "activate"
            : "deactivate";


    const confirmed =
        window.confirm(
            `Are you sure you want to ${action} this organization?`
        );


    if (
        !confirmed
    ) {

        return;

    }


    try {

        const {
            error
        } =
            await supabaseClient

                .from("organizations")

                .update({

                    status:
                        nextStatus,

                    updated_at:
                        new Date().toISOString()

                })

                .eq(
                    "id",
                    organizationId
                );


        if (
            error
        ) {

            throw error;

        }


        /*
         * When an organization is manually deactivated,
         * deactivate its Organization Admin too.
         */

        await supabaseClient

            .from("users")

            .update({

                is_active:
                    nextStatus === "active"

            })

            .eq(
                "organization_id",
                organizationId
            )

            .eq(
                "role",
                "organization_admin"
            );


        await loadOrganizations();

    }

    catch (
        error
    ) {

        console.error(
            "Organization status update error:",
            error
        );


        alert(
            error.message ||
            "Unable to update organization status."
        );

    }

}


/* =========================================================
   ACTION LISTENERS
========================================================= */

function attachOrganizationActions() {

    const buttons =
        document.querySelectorAll(
            ".organization-action-btn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                async function () {

                    const action =
                        this.dataset.action;


                    const organizationId =
                        this.dataset.id;


                    if (
                        action === "approve"
                    ) {

                        await approveOrganization(
                            organizationId
                        );

                    }

                    else if (
                        action === "reject"
                    ) {

                        await rejectOrganization(
                            organizationId
                        );

                    }

                    else if (
                        action === "activate"
                    ) {

                        await updateOrganizationStatus(
                            organizationId,
                            "active"
                        );

                    }

                    else if (
                        action === "deactivate"
                    ) {

                        await updateOrganizationStatus(
                            organizationId,
                            "inactive"
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   FILTERS
========================================================= */

organizationFilters.forEach(
    filter => {

        filter.addEventListener(
            "click",
            function () {

                organizationFilters.forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                this.classList.add(
                    "active"
                );


                currentStatusFilter =
                    this.dataset.status;


                renderOrganizations();

            }
        );

    }
);


/* =========================================================
   AUTO SLUG
========================================================= */

organizationName.addEventListener(
    "input",
    function () {

        if (
            !organizationSlug.value.trim()
        ) {

            organizationSlug.value =
                createSlug(
                    organizationName.value
                );

        }

    }
);


/* =========================================================
   CREATE ORGANIZATION
========================================================= */

organizationForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const name =
            organizationName.value.trim();


        let slug =
            organizationSlug.value.trim();


        if (!name) {

            showMessage(
                "Please enter the organization name.",
                "error"
            );

            organizationName.focus();

            return;

        }


        if (!slug) {

            slug =
                createSlug(
                    name
                );

        }

        else {

            slug =
                createSlug(
                    slug
                );

        }


        if (!slug) {

            showMessage(
                "Please provide a valid organization slug.",
                "error"
            );

            return;

        }


        createOrganizationButton.disabled =
            true;


        createOrganizationButton.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Creating...

        `;


        showMessage("");


        try {

            const {
                data: sessionData,
                error: sessionError
            } =
                await supabaseClient.auth.getSession();


            if (
                sessionError ||
                !sessionData.session
            ) {

                throw new Error(
                    "Your Owner session has expired. Please log in again."
                );

            }


            const ownerAuthId =
                sessionData.session.user.id;


            const {
                data,
                error
            } =
                await supabaseClient

                    .from("organizations")

                    .insert({

                        name,

                        slug,

                        status:
                            "active",

                        created_by:
                            ownerAuthId,

                        updated_at:
                            new Date().toISOString()

                    })

                    .select()

                    .single();


            if (
                error
            ) {

                if (
                    error.code ===
                    "23505"
                ) {

                    throw new Error(
                        "That organization slug already exists. Please use a different slug."
                    );

                }


                throw error;

            }


            console.log(
                "Organization created:",
                data
            );


            showMessage(
                "Organization created successfully.",
                "success"
            );


            organizationForm.reset();


            await loadOrganizations();

        }

        catch (
            error
        ) {

            console.error(
                "Create organization error:",
                error
            );


            showMessage(
                error.message ||
                "Unable to create the organization.",
                "error"
            );

        }

        finally {

            createOrganizationButton.disabled =
                false;


            createOrganizationButton.innerHTML = `

                <i class="fa-solid fa-plus"></i>

                Create Organization

            `;

        }

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeOrganizationsPage() {

    const ownerVerified =
        await verifyOwner();


    if (
        !ownerVerified
    ) {

        return;

    }


    await loadOrganizations();

}


initializeOrganizationsPage();