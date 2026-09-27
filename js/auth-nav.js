import { supabaseClient } from "./supabase.js";


async function updateAuthNavigation() {

    const desktopAccountLink =
        document.querySelector(
            '.premium-signin-button[href="login.html"]'
        );


    const mobileAccountLink =
        document.querySelector(
            '.premium-mobile-nav a[href="login.html"]'
        );


    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getUser();


        if (error) {
            console.error("Auth navigation error:", error);
            return;
        }


        const user = data?.user;


        if (user) {

            // Desktop
            if (desktopAccountLink) {

                desktopAccountLink.href =
                    "account.html";

                desktopAccountLink.textContent =
                    "My Account";

                desktopAccountLink.setAttribute(
                    "aria-label",
                    "My Account"
                );
            }


            // Mobile
            if (mobileAccountLink) {

                mobileAccountLink.href =
                    "account.html";

                mobileAccountLink.textContent =
                    "My Account";
            }

        } else {

            // Desktop
            if (desktopAccountLink) {

                desktopAccountLink.href =
                    "login.html";

                desktopAccountLink.textContent =
                    "Sign In";
            }


            // Mobile
            if (mobileAccountLink) {

                mobileAccountLink.href =
                    "login.html";

                mobileAccountLink.textContent =
                    "Sign In";
            }
        }


    } catch (error) {

        console.error(
            "Unable to update authentication navigation:",
            error
        );

    }
}


/*
 * Update immediately
 */
updateAuthNavigation();


/*
 * Also update whenever Supabase auth state changes.
 */
supabaseClient.auth.onAuthStateChange(
    () => {

        updateAuthNavigation();

    }
);