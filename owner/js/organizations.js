/* =========================================================
   GRACEXTOL CBT — OWNER ORGANIZATIONS MANAGEMENT
   Includes organization teacher counts and a View Details modal.
========================================================= */

const organizationsTableBody = document.getElementById("organizationsTableBody");
const organizationCount = document.getElementById("organizationCount");
const organizationFilters = document.querySelectorAll(".organization-filter");

let allOrganizations = [];
let currentStatusFilter = "all";
let organizationLoadRequestId = 0;

/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(value) {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

/* =========================================================
   VERIFY OWNER
========================================================= */

async function verifyOwner() {
    try {
        const {
            data: sessionData,
            error: sessionError
        } = await supabaseClient.auth.getSession();

        if (sessionError || !sessionData.session) {
            window.location.href = "login.html";
            return false;
        }

        const {
            data: ownerProfile,
            error: ownerError
        } = await supabaseClient
            .from("users")
            .select("id, auth_id, username, email, role, is_active")
            .eq("auth_id", sessionData.session.user.id)
            .maybeSingle();

        if (
            ownerError ||
            !ownerProfile ||
            ownerProfile.role !== "owner" ||
            ownerProfile.is_active !== true
        ) {
            await supabaseClient.auth.signOut();
            window.location.href = "login.html";
            return false;
        }

        return true;

    } catch (error) {
        console.error("Owner verification error:", error);
        window.location.href = "login.html";
        return false;
    }
}

/* =========================================================
   LOAD ORGANIZATIONS, ADMINS AND TEACHERS
========================================================= */

async function loadOrganizations() {
    const requestId = ++organizationLoadRequestId;

    organizationsTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="organizations-empty">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <p>Loading organizations...</p>
            </td>
        </tr>`;

    try {
        // Load organizations.
        const {
            data: organizations,
            error: organizationsError
        } = await supabaseClient
            .from("organizations")
            .select("id, name, slug, status, created_at, updated_at")
            .order("created_at", { ascending: false });

        if (organizationsError) throw organizationsError;
    if (requestId !== organizationLoadRequestId) return;

        // Load organization administrators.
        const {
            data: admins,
            error: adminsError
        } = await supabaseClient
            .from("users")
            .select("id, auth_id, username, email, role, organization_id, is_active")
            .eq("role", "organization_admin");

        if (adminsError) throw adminsError;
    if (requestId !== organizationLoadRequestId) return;

        // Load teachers assigned to organizations.
        // Individual teachers with organization_id = NULL are excluded.
        const {
            data: teachers,
            error: teachersError
        } = await supabaseClient
            .from("users")
            .select("id, username, email, organization_id, is_active, role")
            .eq("role", "teacher")
            .not("organization_id", "is", null);

        if (teachersError) throw teachersError;
    if (requestId !== organizationLoadRequestId) return;

        // Group administrators by organization.
        const adminMap = new Map();

        (admins || []).forEach(admin => {
            if (!adminMap.has(admin.organization_id)) {
                adminMap.set(admin.organization_id, admin);
            }
        });

        // Group teachers by organization.
        const teacherMap = new Map();

        (teachers || []).forEach(teacher => {
            if (!teacherMap.has(teacher.organization_id)) {
                teacherMap.set(teacher.organization_id, []);
            }

            teacherMap.get(teacher.organization_id).push(teacher);
        });

        // Combine organization information with its admin and teachers.
        allOrganizations = (organizations || []).map(organization => {
            const organizationTeachers =
                teacherMap.get(organization.id) || [];

            return {
                ...organization,
                admin: adminMap.get(organization.id) || null,
                teachers: organizationTeachers,
                teacherCount: organizationTeachers.length
            };
        });

        renderOrganizations();

    } catch (error) {
        if (requestId !== organizationLoadRequestId) return;

        console.error("Unable to load organizations:", error);
        showOrganizationError();
    }
}

/* =========================================================
   RENDER ORGANIZATIONS
========================================================= */

function renderOrganizations() {
    const filteredOrganizations = currentStatusFilter === "all"
        ? allOrganizations
        : allOrganizations.filter(
            organization => organization.status === currentStatusFilter
        );

    organizationCount.textContent =
        `${filteredOrganizations.length} ${
            filteredOrganizations.length === 1
                ? "Organization"
                : "Organizations"
        }`;

    if (!filteredOrganizations.length) {
        organizationsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="organizations-empty">
                    <i class="fa-solid fa-building"></i>
                    <p>No organizations found in this category.</p>
                </td>
            </tr>`;
        return;
    }

    organizationsTableBody.innerHTML =
        filteredOrganizations.map(renderOrganizationRow).join("");

    attachOrganizationActions();
}

/* =========================================================
   ORGANIZATION TABLE ROW
========================================================= */

function renderOrganizationRow(organization) {
    const admin = organization.admin;
    const status = organization.status;
    const statusClass = `status-${status}`;

    let actionHtml = "";

    if (status === "pending") {
        actionHtml = `
            <button
                type="button"
                class="organization-action-btn approve"
                data-action="approve"
                data-id="${escapeHtml(organization.id)}">
                Approve
            </button>

            <button
                type="button"
                class="organization-action-btn reject"
                data-action="reject"
                data-id="${escapeHtml(organization.id)}">
                Reject
            </button>`;

    } else if (status === "active") {
        actionHtml = `
            <button
                type="button"
                class="organization-action-btn deactivate"
                data-action="deactivate"
                data-id="${escapeHtml(organization.id)}">
                Deactivate
            </button>`;

    } else if (status === "inactive") {
        actionHtml = `
            <button
                type="button"
                class="organization-action-btn activate"
                data-action="activate"
                data-id="${escapeHtml(organization.id)}">
                Activate
            </button>`;

    } else {
        actionHtml = `
            <span class="organization-slug">No action</span>`;
    }

    return `
        <tr>
            <td>
                <div class="organization-name-cell">
                    <span class="organization-name">
                        ${escapeHtml(organization.name)}
                    </span>

                    <span class="organization-slug">
                        ${escapeHtml(organization.slug || "No slug")}
                    </span>
                </div>
            </td>

            <td>
                <div class="organization-admin-cell">
                    ${admin ? `
                        <span class="organization-admin-name">
                            ${escapeHtml(admin.username || "Organization Admin")}
                        </span>

                        <span class="organization-admin-email">
                            ${escapeHtml(admin.email || "-")}
                        </span>

                        ${
                            status === "pending" && !admin.is_active
                                ? `<span class="organization-admin-unverified">
                                       Awaiting approval
                                   </span>`
                                : ""
                        }
                    ` : `
                        <span class="organization-admin-email">
                            No organization admin found
                        </span>
                    `}
                </div>
            </td>

            <td>
                <span class="organization-teacher-count">
                    ${organization.teacherCount || 0}
                </span>

                <button
                    type="button"
                    class="organization-action-btn view-details"
                    data-action="details"
                    data-id="${escapeHtml(organization.id)}">
                    View Details
                </button>
            </td>

            <td>
                <span class="status-badge ${escapeHtml(statusClass)}">
                    ${escapeHtml(status)}
                </span>
            </td>

            <td>${formatDate(organization.created_at)}</td>

            <td>
                <div class="organization-actions">
                    ${actionHtml}
                </div>
            </td>
        </tr>`;
}

/* =========================================================
   ORGANIZATION DETAILS MODAL
========================================================= */

function showOrganizationDetails(organizationId) {
    const organization = allOrganizations.find(
        item => item.id === organizationId
    );

    if (!organization) return;

    // Add modal styling once.
    if (!document.getElementById("organizationDetailsStyles")) {
        const style = document.createElement("style");
        style.id = "organizationDetailsStyles";

        style.textContent = `
            .organization-details-overlay {
                position: fixed;
                inset: 0;
                z-index: 9999;
                background: rgba(22,15,39,.58);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 18px;
                overflow-y: auto;
            }

            .organization-details-modal {
                position: relative;
                width: min(680px,100%);
                max-height: 90vh;
                overflow-y: auto;
                overflow-x: hidden;
                scrollbar-width: thin;
                scrollbar-color: #9b8ac0 #f3effa;
                background: #fff;
                border-radius: 18px;
                padding: 28px;
                box-shadow: 0 20px 60px rgba(0,0,0,.22);
                color: #29213b;
            }

            .organization-details-modal::-webkit-scrollbar {
                width: 8px;
            }

            .organization-details-modal::-webkit-scrollbar-track {
                background: #f3effa;
                border-radius: 8px;
            }

            .organization-details-modal::-webkit-scrollbar-thumb {
                background: #9b8ac0;
                border-radius: 8px;
            }

            .organization-details-close {
                position: sticky;
                top: 0;
                display: block;
                z-index: 1;
                margin: -12px -16px -36px auto;
                border: 0;
                background: #f3effa;
                border-radius: 50%;
                width: 36px;
                height: 36px;
                font-size: 25px;
                cursor: pointer;
            }

            .organization-details-eyebrow {
                color: #7650d8;
                text-transform: uppercase;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: .08em;
            }

            .organization-details-modal h2 {
                font-size: 24px;
                margin: 8px 40px 20px 0;
            }

            .organization-details-modal h3 {
                font-size: 15px;
                margin: 22px 0 8px;
            }

            .organization-details-modal p {
                margin: 5px 0;
                color: #635c70;
            }

            .organization-details-stats {
                display: grid;
                grid-template-columns: repeat(3,minmax(0,1fr));
                gap: 10px;
            }

            .organization-details-stats div {
                background: #f7f4fc;
                border-radius: 12px;
                padding: 14px;
                min-width: 0;
            }

            .organization-details-stats span,
            .organization-details-stats strong {
                display: block;
            }

            .organization-details-stats span {
                font-size: 12px;
                color: #716981;
            }

            .organization-details-stats strong {
                margin-top: 6px;
                font-size: 17px;
                overflow-wrap: anywhere;
            }

            .organization-details-teachers {
                list-style: none;
                margin: 0;
                padding: 0;
            }

            .organization-details-teachers li {
                display: flex;
                flex-direction: column;
                gap: 4px;
                padding: 12px 0;
                border-bottom: 1px solid #eeeaf4;
            }

            .organization-details-teachers li span {
                font-size: 12px;
                color: #716981;
            }

            .organization-teacher-count {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 30px;
                padding: 5px 9px;
                margin-right: 8px;
                background: #f0eaff;
                color: #6540c7;
                border-radius: 8px;
                font-weight: 800;
            }

            .organization-action-btn.view-details {
                background: #f0eaff;
                color: #6540c7;
                border: 1px solid #ded0ff;
            }

            @media(max-width:480px) {
                .organization-details-modal {
                    padding: 22px 17px;
                }

                .organization-details-stats {
                    grid-template-columns: 1fr;
                }

                .organization-details-modal h2 {
                    font-size: 20px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // Remove any existing modal before opening a new one.
    let modal = document.getElementById("organizationDetailsModal");
    if (modal) modal.remove();

    modal = document.createElement("div");
    modal.id = "organizationDetailsModal";
    modal.className = "organization-details-overlay";

    modal.innerHTML = `
        <section
            class="organization-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="organizationDetailsTitle">

            <button
                type="button"
                class="organization-details-close"
                aria-label="Close">
                &times;
            </button>

            <div id="organizationDetailsContent"></div>
        </section>`;

    document.body.appendChild(modal);

    modal.addEventListener("click", event => {
        if (
            event.target === modal ||
            event.target.closest(".organization-details-close")
        ) {
            modal.remove();
        }
    });

    const teachers = organization.teachers || [];
    const admin = organization.admin;

    const teacherRows = teachers.length
        ? teachers.map(teacher => `
            <li>
                <strong>${escapeHtml(teacher.username || "Teacher")}</strong>
                <span>
                    ${escapeHtml(teacher.email || "No email")}
                    ·
                    ${teacher.is_active ? "Active" : "Inactive"}
                </span>
            </li>
        `).join("")
        : `<li>No teachers are currently assigned to this organization.</li>`;

    document.getElementById("organizationDetailsContent").innerHTML = `
        <p class="organization-details-eyebrow">
            Organization Overview
        </p>

        <h2 id="organizationDetailsTitle">
            ${escapeHtml(organization.name)}
        </h2>

        <div class="organization-details-stats">
            <div>
                <span>Teachers</span>
                <strong>${teachers.length}</strong>
            </div>

            <div>
                <span>Status</span>
                <strong>${escapeHtml(organization.status || "Unknown")}</strong>
            </div>

            <div>
                <span>Created</span>
                <strong>${formatDate(organization.created_at)}</strong>
            </div>
        </div>

        <h3>Organization Administrator</h3>

        <p>
            ${escapeHtml(admin?.username || "No organization admin found")}
        </p>

        <p>${escapeHtml(admin?.email || "")}</p>

        <h3>Teachers</h3>

        <ul class="organization-details-teachers">
            ${teacherRows}
        </ul>`;
}

/* =========================================================
   EMPTY / ERROR STATE
========================================================= */

function showOrganizationError() {
    organizationsTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="organizations-empty">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Unable to load organizations.</p>
            </td>
        </tr>`;

    organizationCount.textContent = "0 Organizations";
}

/* =========================================================
   APPROVE ORGANIZATION
========================================================= */

async function approveOrganization(organizationId) {
    const confirmed = window.confirm(
        "Approve this organization? Its Organization Admin will become active after approval."
    );

    if (!confirmed) return;

    try {
        const { data, error } = await supabaseClient.rpc(
            "approve_organization",
            { p_organization_id: organizationId }
        );

        if (error) throw error;

        console.log("Organization approved:", data);
        await loadOrganizations();

    } catch (error) {
        console.error("Approve organization error:", error);
        alert(error.message || "Unable to approve organization.");
    }
}

/* =========================================================
   REJECT ORGANIZATION
========================================================= */

async function rejectOrganization(organizationId) {
    const confirmed = window.confirm(
        "Reject this organization registration?"
    );

    if (!confirmed) return;

    try {
        const { data, error } = await supabaseClient.rpc(
            "reject_organization",
            { p_organization_id: organizationId }
        );

        if (error) throw error;

        console.log("Organization rejected:", data);
        await loadOrganizations();

    } catch (error) {
        console.error("Reject organization error:", error);
        alert(error.message || "Unable to reject organization.");
    }
}

/* =========================================================
   ACTIVATE / DEACTIVATE ORGANIZATION
========================================================= */

async function updateOrganizationStatus(organizationId, nextStatus) {
    const action = nextStatus === "active" ? "activate" : "deactivate";

    const confirmed = window.confirm(
        `Are you sure you want to ${action} this organization?`
    );

    if (!confirmed) return;

    try {
        const {
            data: updatedOrganization,
            error
        } = await supabaseClient
            .from("organizations")
            .update({
                status: nextStatus,
                updated_at: new Date().toISOString()
            })
            .eq("id", organizationId)
            .select("id, status")
            .maybeSingle();

        if (error) throw error;
        if (!updatedOrganization) {
            throw new Error("Organization status update did not modify a row.");
        }
        if (updatedOrganization.status !== nextStatus) {
            throw new Error("Organization status update was not confirmed.");
        }

        const organization = allOrganizations.find(
            item => item.id === organizationId
        );

        if (organization) {
            organization.status = updatedOrganization.status;
            renderOrganizations();
        }

        await loadOrganizations();

    } catch (error) {
        console.error("Organization status update error:", error);
        alert(error.message || "Unable to update organization status.");
    }
}

/* =========================================================
   ORGANIZATION ACTION LISTENERS
========================================================= */

function attachOrganizationActions() {
    document.querySelectorAll(".organization-action-btn").forEach(button => {
        button.addEventListener("click", async function () {
            const action = this.dataset.action;
            const organizationId = this.dataset.id;

            if (action === "details") {
                showOrganizationDetails(organizationId);
            } else if (action === "approve") {
                await approveOrganization(organizationId);
            } else if (action === "reject") {
                await rejectOrganization(organizationId);
            } else if (action === "activate") {
                await updateOrganizationStatus(organizationId, "active");
            } else if (action === "deactivate") {
                await updateOrganizationStatus(organizationId, "inactive");
            }
        });
    });
}

/* =========================================================
   STATUS FILTERS
========================================================= */

organizationFilters.forEach(filter => {
    filter.addEventListener("click", function () {
        organizationFilters.forEach(item => {
            item.classList.remove("active");
        });

        this.classList.add("active");
        currentStatusFilter = this.dataset.status;

        renderOrganizations();
    });
});

/* =========================================================
   INITIALIZE PAGE
========================================================= */

async function initializeOrganizationsPage() {
    const ownerVerified = await verifyOwner();

    if (!ownerVerified) return;

    await loadOrganizations();
}

initializeOrganizationsPage();