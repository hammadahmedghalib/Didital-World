import {
    supabaseClient
} from "./supabase.js";


const googleButton =
    document.getElementById("googleButton");

const phoneInput =
    document.getElementById("phoneInput");

const sendOtpButton =
    document.getElementById("sendOtpButton");

const otpSection =
    document.getElementById("otpSection");

const otpInput =
    document.getElementById("otpInput");

const verifyOtpButton =
    document.getElementById("verifyOtpButton");

const authMessage =
    document.getElementById("authMessage");


function showMessage(
    message,
    type = ""
) {

    authMessage.textContent = message;

    authMessage.className =
        `auth-message ${type}`;

}


/* =========================================================
   GOOGLE LOGIN
========================================================= */

googleButton.addEventListener(
    "click",
    async () => {

        showMessage(
            "Opening Google..."
        );

        const redirectTo =
            `${window.location.origin}/account.html`;

        const {
            error
        } = await supabaseClient.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo
            }
        });

        if (error) {

            console.error(error);

            showMessage(
                error.message,
                "error"
            );

        }

    }
);


/* =========================================================
   SEND PHONE OTP
========================================================= */

sendOtpButton.addEventListener(
    "click",
    async () => {

        const phone =
            phoneInput.value.trim();

        if (!phone) {

            showMessage(
                "Please enter your phone number.",
                "error"
            );

            return;

        }

        sendOtpButton.disabled = true;

        sendOtpButton.textContent =
            "Sending OTP...";


        const {
            error
        } = await supabaseClient.auth.signInWithOtp({
            phone
        });


        sendOtpButton.disabled = false;

        sendOtpButton.textContent =
            "Continue with Phone";


        if (error) {

            console.error(error);

            showMessage(
                error.message,
                "error"
            );

            return;

        }


        otpSection.style.display =
            "block";

        otpInput.focus();

        showMessage(
            "OTP sent to your phone.",
            "success"
        );

    }
);


/* =========================================================
   VERIFY PHONE OTP
========================================================= */

verifyOtpButton.addEventListener(
    "click",
    async () => {

        const phone =
            phoneInput.value.trim();

        const token =
            otpInput.value.trim();


        if (!phone || !token) {

            showMessage(
                "Enter your phone number and OTP.",
                "error"
            );

            return;

        }


        verifyOtpButton.disabled =
            true;

        verifyOtpButton.textContent =
            "Verifying...";


        const {
            data,
            error
        } = await supabaseClient.auth.verifyOtp({
            phone,
            token,
            type: "sms"
        });


        verifyOtpButton.disabled =
            false;

        verifyOtpButton.textContent =
            "Verify OTP";


        if (error) {

            console.error(error);

            showMessage(
                error.message,
                "error"
            );

            return;

        }


        if (data.session) {

            showMessage(
                "Login successful.",
                "success"
            );

            window.location.href =
                "account.html";

        }

    }
);