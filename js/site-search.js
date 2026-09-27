import {
    supabaseClient
} from "./supabase.js";


/* =========================================================
   CREATE SEARCH UI
========================================================= */

const searchButton =
    document.getElementById(
        "searchButton"
    );


if (!searchButton) {
    console.warn(
        "Search button not found."
    );
}


/* =========================================================
   SEARCH OVERLAY
========================================================= */

const searchOverlay =
    document.createElement("div");

searchOverlay.id =
    "premiumSearchOverlay";

searchOverlay.className =
    "premium-search-overlay";

searchOverlay.innerHTML = `

    <div
        class="premium-search-backdrop"
        id="premiumSearchBackdrop"
    ></div>


    <div
        class="premium-search-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Search invitations"
    >

        <div class="premium-search-header">

            <div>

                <p class="section-label">
                    FIND YOUR DESIGN
                </p>

                <h2>
                    Search Invitations
                </h2>

            </div>


            <button
                type="button"
                id="closePremiumSearch"
                class="premium-search-close"
                aria-label="Close search"
            >
                ×
            </button>

        </div>


        <div class="premium-search-input-wrap">

            <span class="premium-search-icon">
                ⌕
            </span>

            <input
                type="search"
                id="premiumSearchInput"
                placeholder="Search Royal Gold, floral, luxury..."
                autocomplete="off"
            >

            <button
                type="button"
                id="clearPremiumSearch"
                class="premium-search-clear"
                aria-label="Clear search"
            >
                ×
            </button>

        </div>


        <div
            id="premiumSearchStatus"
            class="premium-search-status"
        >
            Start typing to search our invitations.
        </div>


        <div
            id="premiumSearchResults"
            class="premium-search-results"
        ></div>

    </div>

`;


document.body.appendChild(
    searchOverlay
);


/* =========================================================
   ELEMENTS
========================================================= */

const premiumSearchInput =
    document.getElementById(
        "premiumSearchInput"
    );


const premiumSearchResults =
    document.getElementById(
        "premiumSearchResults"
    );


const premiumSearchStatus =
    document.getElementById(
        "premiumSearchStatus"
    );


const closePremiumSearch =
    document.getElementById(
        "closePremiumSearch"
    );


const clearPremiumSearch =
    document.getElementById(
        "clearPremiumSearch"
    );


const premiumSearchBackdrop =
    document.getElementById(
        "premiumSearchBackdrop"
    );


let searchTimer =
    null;


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
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
   OPEN SEARCH
========================================================= */

function openSearch() {

    searchOverlay.classList.add(
        "active"
    );


    document.body.classList.add(
        "search-open"
    );


    setTimeout(
        () => {

            premiumSearchInput.focus();

        },
        100
    );

}


/* =========================================================
   CLOSE SEARCH
========================================================= */

function closeSearch() {

    searchOverlay.classList.remove(
        "active"
    );


    document.body.classList.remove(
        "search-open"
    );

}


/* =========================================================
   SEARCH PRODUCTS
========================================================= */

async function searchProducts(
    query
) {

    const cleanQuery =
        query
            .trim();


    if (
        !cleanQuery
    ) {

        premiumSearchStatus.textContent =
            "Start typing to search our invitations.";

        premiumSearchResults.innerHTML =
            "";

        return;

    }


    premiumSearchStatus.textContent =
        "Searching...";


    premiumSearchResults.innerHTML =
        "";


    const searchValue =
        `%${cleanQuery}%`;


    const {
        data,
        error
    } = await supabaseClient
        .from("products")
        .select(`
            id,
            name,
            slug,
            price,
            main_image_url,
            short_description,
            style,
            categories (
                name,
                slug
            )
        `)
        .eq(
            "status",
            "published"
        )
        .or(
            [
                `name.ilike.${searchValue}`,
                `slug.ilike.${searchValue}`,
                `short_description.ilike.${searchValue}`,
                `style.ilike.${searchValue}`
            ].join(",")
        )
        .order(
            "featured",
            {
                ascending: false
            }
        )
        .order(
            "sort_order",
            {
                ascending: true
            }
        )
        .limit(
            12
        );


    if (error) {

        console.error(
            "Search error:",
            error
        );


        premiumSearchStatus.textContent =
            "Unable to search right now. Please try again.";


        return;

    }


    if (
        !data ||
        !data.length
    ) {

        premiumSearchStatus.textContent =
            `No invitations found for "${cleanQuery}".`;


        premiumSearchResults.innerHTML = `

            <div class="premium-search-empty">

                <div>
                    ✦
                </div>

                <h3>
                    No matching designs
                </h3>

                <p>
                    Try another name, style or keyword.
                </p>

            </div>

        `;


        return;

    }


    premiumSearchStatus.textContent =
        `${data.length} invitation${
            data.length === 1
                ? ""
                : "s"
        } found`;


    premiumSearchResults.innerHTML =
        data
            .map(
                product => {

                    const image =
                        product.main_image_url ||
                        "";


                    const category =
                        product.categories?.name ||
                        "Invitation";


                    return `

                        <a
                            href="invitation.html?slug=${encodeURIComponent(
                                product.slug
                            )}"
                            class="premium-search-result"
                        >

                            <div class="premium-search-result-image">

                                ${
                                    image
                                        ? `
                                            <img
                                                src="${escapeHtml(
                                                    image
                                                )}"
                                                alt="${escapeHtml(
                                                    product.name
                                                )}"
                                                loading="lazy"
                                            >
                                        `
                                        : `
                                            <div
                                                class="premium-search-image-placeholder"
                                            >
                                                EverAfter
                                            </div>
                                        `
                                }

                            </div>


                            <div class="premium-search-result-info">

                                <span class="premium-search-category">
                                    ${escapeHtml(
                                        category
                                    )}
                                </span>


                                <h3>
                                    ${escapeHtml(
                                        product.name
                                    )}
                                </h3>


                                ${
                                    product.short_description
                                        ? `
                                            <p>
                                                ${escapeHtml(
                                                    product.short_description
                                                )}
                                            </p>
                                        `
                                        : ""
                                }


                                <strong>
                                    PKR ${
                                        Number(
                                            product.price
                                        ).toLocaleString()
                                    }
                                </strong>

                            </div>

                        </a>

                    `;

                }
            )
            .join("");


    premiumSearchResults
        .querySelectorAll(
            ".premium-search-result"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    closeSearch
                );

            }
        );

}


/* =========================================================
   SEARCH INPUT
========================================================= */

premiumSearchInput.addEventListener(
    "input",
    () => {

        clearTimeout(
            searchTimer
        );


        searchTimer =
            setTimeout(
                () => {

                    searchProducts(
                        premiumSearchInput.value
                    );

                },
                250
            );

    }
);


/* =========================================================
   SEARCH BUTTON
========================================================= */

if (
    searchButton
) {

    searchButton.addEventListener(
        "click",
        openSearch
    );

}


/* =========================================================
   CLOSE BUTTON
========================================================= */

closePremiumSearch.addEventListener(
    "click",
    closeSearch
);


premiumSearchBackdrop.addEventListener(
    "click",
    closeSearch
);


/* =========================================================
   CLEAR SEARCH
========================================================= */

clearPremiumSearch.addEventListener(
    "click",
    () => {

        premiumSearchInput.value =
            "";

        premiumSearchStatus.textContent =
            "Start typing to search our invitations.";

        premiumSearchResults.innerHTML =
            "";

        premiumSearchInput.focus();

    }
);


/* =========================================================
   ESC KEY
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            searchOverlay.classList.contains(
                "active"
            )
        ) {

            closeSearch();

        }

    }
);