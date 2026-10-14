/* =========================================
   GRACEXTOL CBT
   TEACHER ACCESS GUARD
========================================= */

window.teacherAccessReady = (async function () {

    console.log(
        "Checking teacher authentication..."
    );


    /* =========================================
       CHECK SUPABASE
    ========================================= */

    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        console.error(
            "Supabase client is not available."
        );

        window.location.href =
            "login.html";

        return;

    }


    /* =========================================
       GET CURRENT SESSION
    ========================================= */

    const {
        data: sessionData,
        error: sessionError
    } =
        await supabaseClient.auth.getSession();


    if (sessionError) {

        console.error(
            "Session error:",
            sessionError
        );

        window.location.href =
            "login.html";

        return;

    }


    const session =
        sessionData.session;


    /* =========================================
       CHECK LOGIN
    ========================================= */

    if (!session) {

        console.warn(
            "No authenticated teacher."
        );

        window.location.href =
            "login.html";

        return;

    }


    const user =
        session.user;


    /* =========================================
       GET TEACHER PROFILE
    ========================================= */

    const {
        data: profile,
        error: profileError
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
                is_active,
                organization_id
                `
            )
            .eq(
                "auth_id",
                user.id
            )
            .maybeSingle();


    if (profileError) {

        console.error(
            "Unable to verify teacher profile:",
            profileError
        );

        alert(
            "Unable to verify your teacher account."
        );

        await supabaseClient.auth.signOut();

        window.location.href =
            "login.html";

        return;

    }


    /* =========================================
       PROFILE NOT FOUND
    ========================================= */

    if (!profile) {

        console.warn(
            "Teacher profile not found."
        );

        alert(
            "Your teacher profile could not be found."
        );

        await supabaseClient.auth.signOut();

        window.location.href =
            "login.html";

        return;

    }


    /* =========================================
       CHECK TEACHER ROLE
    ========================================= */

    if (profile.role !== "teacher") {

        console.warn(
            "User is not a teacher."
        );

        alert(
            "You do not have permission to access the teacher portal."
        );

        await supabaseClient.auth.signOut();

        window.location.href =
            "login.html";

        return;

    }


    /* =========================================
       CHECK ACCOUNT STATUS
    ========================================= */

    if (
        profile.is_active !== true
    ) {

        console.warn(
            "Teacher account is inactive."
        );

        alert(
            "Your Gracextol account has been deactivated. Please contact the platform administrator."
        );

        await supabaseClient.auth.signOut();

        window.location.href =
            "login.html";

        return;

    }


    /* =========================================
       CHECK ORGANIZATION STATUS
    ========================================= */

    if (profile.organization_id) {

        const {
            data: organization,
            error: organizationError
        } = await supabaseClient
            .from("organizations")
            .select("id, status")
            .eq("id", profile.organization_id)
            .maybeSingle();

        if (
            organizationError ||
            !organization ||
            organization.status !== "active"
        ) {

            console.warn(
                "Teacher organization is inactive or could not be verified:",
                organizationError
            );

            alert(
                "Your organization is inactive or could not be verified. Please contact your Organization Admin."
            );

            await supabaseClient.auth.signOut();

            window.location.href =
                "login.html";

            return;

        }

    }


    /* =========================================
       CHECK SUBSCRIPTION ACCESS
    ========================================= */

    const {
        data: subscriptionAccess,
        error: subscriptionError
    } = window.teacherGuardSkipSubscriptionCheck === true
        ? {
            data: {
                has_access: true,
                skipped: true
            },
            error: null
        }
        : await supabaseClient.rpc(
            "get_my_subscription_access"
        );


    /* =========================================
       SUBSCRIPTION CHECK ERROR
    ========================================= */

    if (subscriptionError) {

        console.error(
            "Subscription access check failed:",
            subscriptionError
        );

        alert(
            "Unable to verify your subscription. Please try again."
        );

        await supabaseClient.auth.signOut();

        window.location.href =
            "login.html";

        return;

    }


    /* =========================================
       SUBSCRIPTION ACCESS DENIED
    ========================================= */

    if (
        !subscriptionAccess ||
        subscriptionAccess.has_access !== true
    ) {

        console.warn(
            "Teacher subscription access denied:",
            subscriptionAccess
        );


        /* =========================================
           ORGANIZATION TEACHER
           Organization subscription is controlled
           by the Organization Admin.
        ========================================= */

        if (
            profile.organization_id
        ) {

            alert(
                "Your organization's Gracextol subscription has expired or is inactive. Please contact your Organization Admin."
            );

            await supabaseClient.auth.signOut();

            window.location.href =
                "login.html";

            return;

        }


        /* =========================================
           INDEPENDENT TEACHER
           Send teacher to payment page.
        ========================================= */

        alert(
            "Your Gracextol subscription has expired. Please renew your subscription to continue."
        );

        window.location.href =
            "payment.html";

        return;

    }


    /* =========================================
       TEACHER VERIFIED
    ========================================= */

    window.currentTeacher = {

        authId:
            user.id,

        userId:
            profile.id,

        username:
            profile.username,

        email:
            profile.email,

        role:
            profile.role ||
            "teacher",

        isActive:
            profile.is_active === true,

        organizationId:
            profile.organization_id || null,

        subscription:
            subscriptionAccess

    };


    console.log(
        "Teacher access verified:",
        profile.username
    );

    console.log(
        "Subscription access:",
        subscriptionAccess
    );


    if (profile.organization_id) {
        let organizationCheckInProgress = false;

        const recheckOrganizationStatus = async () => {
            if (organizationCheckInProgress) return;

            organizationCheckInProgress = true;

            try {
                const {
                    data: organization,
                    error
                } = await supabaseClient
                    .from("organizations")
                    .select("id, status")
                    .eq("id", profile.organization_id)
                    .maybeSingle();

                if (error || !organization || organization.status !== "active") {
                    console.warn(
                        "Organization access was revoked:",
                        error
                    );

                    await supabaseClient.auth.signOut();
                    window.location.href = "login.html";
                }
            } catch (error) {
                console.error(
                    "Unable to recheck organization access:",
                    error
                );

                await supabaseClient.auth.signOut();
                window.location.href = "login.html";
            } finally {
                organizationCheckInProgress = false;
            }
        };

        window.addEventListener("focus", recheckOrganizationStatus);
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                recheckOrganizationStatus();
            }
        });
        window.setInterval(recheckOrganizationStatus, 60000);
    }

    return true;

})().then(allowed => allowed === true).catch(error => {
    console.error("Teacher access verification failed:", error);
    window.location.href = "login.html";
    return false;
});