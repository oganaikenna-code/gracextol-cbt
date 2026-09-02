/* =========================================
   GRACEXTOL CBT
   TEACHER ACCESS GUARD
========================================= */

(async function () {

    console.log("Checking teacher authentication...");


    /* =========================================
       CHECK SUPABASE
    ========================================= */

    if (typeof supabaseClient === "undefined") {

        console.error(
            "Supabase client is not available."
        );

        window.location.href = "login.html";

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

        window.location.href = "login.html";

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
                "id, auth_id, username, email, teacher"
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

    if (
        profile.teacher !== "teacher"
    ) {

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
            profile.email

    };


    console.log(
        "Teacher access verified:",
        profile.username
    );


})();