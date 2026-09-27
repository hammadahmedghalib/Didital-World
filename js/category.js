import {
    getCategories,
    getProducts
} from "./catalog.js";


/* =============================================================
   DIGITAL WORLD — CATEGORY PAGE
   Reads ?category=<slug> (falls back to ?slug=<slug>).
   When a specific category is selected, the hero title shows
   ONLY the category name (e.g. "Luxury"), not "All Collections".
============================================================= */


const params =
    new URLSearchParams(window.location.search);


/* Accept ?category=luxury (homepage links) OR ?slug=luxury (legacy) */

const selectedSlug =
    (
        params.get("category") ||
        params.get("slug") ||
        "all"
    )
    .trim()
    .toLowerCase();


let currentProducts = [];


const elements = {

    categoryTitle:
        document.getElementById("categoryTitle"),

    categoryDescription:
        document.getElementById("categoryDescription"),

    categoryLabel:
        document.getElementById("categoryLabel"),

    breadcrumbCategoryLink:
        document.getElementById("breadcrumbCategoryLink"),

    productCount:
        document.getElementById("productCount"),

    products:
        document.getElementById("categoryProducts"),

    empty:
        document.getElementById("catalogEmpty"),

    search:
        document.getElementById("catalogSearch"),

    price:
        document.getElementById("priceFilter"),

    style:
        document.getElementById("styleFilter"),

    sort:
        document.getElementById("sortProducts"),

    clear:
        document.getElementById("clearFilters"),

    mobileMenu:
        document.getElementById("mobileMenuButton"),

    mobileNav:
        document.getElementById("mobileNav")

};


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   CATEGORY HEADER
========================================================= */

function setCategoryHeader(category) {

    /* ---------------------------------------------
       ALL COLLECTIONS VIEW
    --------------------------------------------- */

    if (!category) {

        if (elements.categoryLabel)
            elements.categoryLabel.textContent = "All Collections";

        if (elements.categoryTitle)
            elements.categoryTitle.textContent = "Wedding Invitations";

        if (elements.categoryDescription)
            elements.categoryDescription.textContent =
                "Explore our complete collection of elegant wedding invitation designs.";

        if (elements.breadcrumbCategoryLink) {

            elements.breadcrumbCategoryLink.textContent = "Collections";
            elements.breadcrumbCategoryLink.href =
                "category.html?category=all";

        }

        document.title =
            "Wedding Invitations | Digital World";

        const meta =
            document.getElementById("categoryMetaDescription");

        if (meta) {

            meta.setAttribute(
                "content",
                "Explore our complete collection of elegant wedding invitation designs."
            );

        }

        return;

    }


    /* ---------------------------------------------
       SPECIFIC CATEGORY VIEW
       → Show ONLY the category name as the big title
    --------------------------------------------- */

    const name =
        category.name || "Collection";


    const description =
        category.description ||
        `Explore our ${name.toLowerCase()} wedding invitation collection — handpicked designs crafted with elegance.`;


    if (elements.categoryLabel)
        elements.categoryLabel.textContent = "Collection";


    if (elements.categoryTitle)
        elements.categoryTitle.textContent = name;   /* ← THE FIX */


    if (elements.categoryDescription)
        elements.categoryDescription.textContent = description;


    if (elements.breadcrumbCategoryLink) {

        elements.breadcrumbCategoryLink.textContent = name;
        elements.breadcrumbCategoryLink.href =
            `category.html?category=${encodeURIComponent(category.slug || "")}`;

    }


    document.title = `${name} | Digital World`;


    const meta =
        document.getElementById("categoryMetaDescription");

    if (meta) {

        meta.setAttribute("content", description);

    }

}


/* =========================================================
   PRODUCT RENDER
========================================================= */

function renderProducts(list) {

    if (elements.productCount) {

        elements.productCount.textContent =
            `${list.length} ${
                list.length === 1 ? "Design" : "Designs"
            }`;

    }


    if (!list.length) {

        if (elements.products) elements.products.innerHTML = "";
        if (elements.empty) elements.empty.hidden = false;

        return;

    }


    if (elements.empty) elements.empty.hidden = true;


    elements.products.innerHTML =

        list.map(product => {

            const categoryName =
                product.categories?.name || "";


            const badge =
                product.featured
                    ? "Featured"
                    : product.popular
                        ? "Popular"
                        : "";


            return `

                <article class="product-card">

                    <a href="invitation.html?slug=${encodeURIComponent(
                        product.slug
                    )}">

                        <div class="product-card-image">

                            ${
                                badge
                                    ? `<span class="product-card-badge">${escapeHtml(badge)}</span>`
                                    : ""
                            }

                            <img
                                src="${escapeHtml(product.main_image_url || "")}"
                                alt="${escapeHtml(product.name)} wedding invitation"
                                loading="lazy"
                            >

                        </div>


                        <div class="product-card-body">

                            <span class="product-card-category">
                                ${escapeHtml(categoryName)}
                            </span>

                            <h3>
                                ${escapeHtml(product.name)}
                            </h3>

                            <p class="product-card-price">
                                PKR ${Number(product.price || 0).toLocaleString()}
                            </p>

                            <span class="product-card-button">
                                View Design
                            </span>

                        </div>

                    </a>

                </article>

            `;

        }).join("");

}


/* =========================================================
   FILTERS
========================================================= */

function applyFilters() {

    let result = [...currentProducts];


    const search =
        elements.search.value.trim().toLowerCase();


    const price =
        elements.price.value;


    const style =
        elements.style.value;


    const sort =
        elements.sort.value;


    if (search) {

        result = result.filter(product => {

            const text = [

                product.name,
                product.description,
                product.short_description,
                product.style,
                ...(product.tags || [])

            ]
                .join(" ")
                .toLowerCase();

            return text.includes(search);

        });

    }


    if (price === "100-250") {

        result = result.filter(p => {

            const n = Number(p.price);
            return n >= 100 && n <= 250;

        });

    }


    if (price === "250-500") {

        result = result.filter(p => {

            const n = Number(p.price);
            return n > 250 && n <= 500;

        });

    }


    if (price === "500-1000") {

        result = result.filter(p => {

            const n = Number(p.price);
            return n > 500 && n <= 1000;

        });

    }


    if (price === "1000-2000") {

        result = result.filter(p => {

            const n = Number(p.price);
            return n > 1000 && n <= 2000;

        });

    }


    if (price === "above-2000") {

        result = result.filter(p => Number(p.price) > 2000);

    }


    if (style !== "all") {

        result = result.filter(p => p.style === style);

    }


    if (sort === "price-low") {

        result.sort((a, b) => Number(a.price) - Number(b.price));

    }


    if (sort === "price-high") {

        result.sort((a, b) => Number(b.price) - Number(a.price));

    }


    if (sort === "name") {

        result.sort((a, b) => a.name.localeCompare(b.name));

    }


    if (sort === "newest") {

        result.sort(
            (a, b) =>
                new Date(b.created_at || 0) -
                new Date(a.created_at || 0)
        );

    }


    renderProducts(result);

}


/* =========================================================
   RESET
========================================================= */

function resetFilters() {

    elements.search.value = "";
    elements.price.value = "all";
    elements.style.value = "all";
    elements.sort.value = "featured";

    applyFilters();

}


/* =========================================================
   MOBILE MENU
========================================================= */

function setupMobileMenu() {

    if (!elements.mobileMenu || !elements.mobileNav) return;

    elements.mobileMenu.addEventListener("click", () => {

        elements.mobileNav.classList.toggle("active");
        elements.mobileNav.classList.toggle("open");

    });

}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    elements.search.addEventListener("input", applyFilters);
    elements.price.addEventListener("change", applyFilters);
    elements.style.addEventListener("change", applyFilters);
    elements.sort.addEventListener("change", applyFilters);
    elements.clear.addEventListener("click", resetFilters);

}


/* =========================================================
   INIT
========================================================= */

async function init() {

    try {

        const categories = await getCategories();


        let category = null;


        if (selectedSlug !== "all") {

            category = categories.find(
                item =>
                    String(item.slug || "")
                        .trim()
                        .toLowerCase() === selectedSlug
            );

            if (!category) {

                console.warn(
                    `Category "${selectedSlug}" not found. Falling back to all.`
                );

            }

        }


        setCategoryHeader(category);


        currentProducts = await getProducts({

            categorySlug:
                category
                    ? category.slug
                    : null

        });


        renderProducts(currentProducts);


        setupEvents();
        setupMobileMenu();

    }

    catch (error) {

        console.error("Category page error:", error);

        elements.products.innerHTML = `

            <div class="catalog-empty" style="display:block;">

                <h2>Unable to load invitations</h2>

                <p>${escapeHtml(error.message)}</p>

            </div>

        `;

    }

}


document.addEventListener("DOMContentLoaded", init);