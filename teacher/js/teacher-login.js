/* =========================================
   GRACEXTOL CBT
   TEACHER LOGIN
   SUPABASE AUTHENTICATION
========================================= */

const teacherLoginForm =
    document.getElementById("teacherLoginForm");

const teacherEmail =
    document.getElementById("teacherEmail");

const teacherPassword =
    document.getElementById("teacherPassword");

const loginMessage =
    document.getElementById("loginMessage");


if (teacherLoginForm) {

    teacherLoginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                teacherEmail.value.trim();

            const password =
                teacherPassword.value;


            /* ================================
               CLEAR MESSAGE
            ================================= */

            loginMessage.textContent = "";

            loginMessage.style.color = "#64748b";


            /* ================================
               DISABLE BUTTON
            ================================= */

            const loginButton =
                teacherLoginForm.querySelector(
                    ".login-btn"
                );

            loginButton.disabled = true;

            loginButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Signing In...
            `;


            try {

                /* ============================
                   SUPABASE LOGIN
                ============================ */

                const {
                    data,
                    error
                } = await supabaseClient.auth.signInWithPassword({

                    email: email,

                    password: password

                });


                /* ============================
                   LOGIN ERROR
                ============================ */

                if (error) {

                    console.error(
                        "Teacher login error:",
                        error
                    );

                    loginMessage.textContent =
                        error.message;

                    loginMessage.style.color =
                        "#dc2626";

                    return;

                }


                /* ============================
                   LOGIN SUCCESS
                ============================ */

                console.log(
                    "Teacher authenticated:",
                    data.user
                );


                loginMessage.textContent =
                    "Login successful. Redirecting...";

                loginMessage.style.color =
                    "#16a34a";


                /* ============================
                   GO TO TEACHER AREA
                ============================ */

                setTimeout(
                    function () {

                        window.location.href =
                            "create-exam.html";

                    },
                    800
                );


            } catch (error) {

                console.error(
                    "Unexpected login error:",
                    error
                );

                loginMessage.textContent =
                    "Something went wrong. Please try again.";

                loginMessage.style.color =
                    "#dc2626";

            }

            finally {

                loginButton.disabled = false;

                loginButton.innerHTML = `
                    <i class="fa-solid fa-right-to-bracket"></i>
                    Sign In
                `;

            }

        }
    );

}