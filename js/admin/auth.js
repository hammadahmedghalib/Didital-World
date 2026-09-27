import {
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
} from "../config.js";


const supabase =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


const form =
    document.getElementById(
        "adminLoginForm"
    );


const errorElement =
    document.getElementById(
        "adminLoginError"
    );


async function checkExistingSession() {

    const {
        data,
        error
    } = await supabase.auth.getSession();


    if (error) {

        console.error(
            "Session check failed:",
            error
        );

        return;

    }


    if (data.session) {

        window.location.href =
            "dashboard.html";

    }

}


async function loginAdmin(event) {

    event.preventDefault();


    errorElement.textContent = "";


    const email =
        document
            .getElementById("adminEmail")
            .value
            .trim();


    const password =
        document
            .getElementById("adminPassword")
            .value;


    if (!email || !password) {

        errorElement.textContent =
            "Please enter your email and password.";

        return;

    }


    const {
        data,
        error
    } = await supabase.auth.signInWithPassword({

        email,

        password

    });


    if (error) {

        console.error(error);

        errorElement.textContent =
            "Invalid email or password.";

        return;

    }


    if (!data.session) {

        errorElement.textContent =
            "Login could not be completed.";

        return;

    }


    window.location.href =
        "dashboard.html";

}


form.addEventListener(
    "submit",
    loginAdmin
);


checkExistingSession();