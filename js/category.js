import {
    getCategories,
    getProducts
} from "./catalog.js";


/* =============================================================
   DIGITAL WORLD — CATEGORY PAGE
   Reads ?category=<slug> (falls back to ?slug=<slug>).
   Product cards use the same rich shop-style design as
   the homepage featured section.
============================================================= */


const params =
    new URLSearchParams(window.location.search);


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


/* =============================================================
   HELPERS
============================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function formatPrice(price) {

    if (price === null || price === undefined || price === "") {
        return "PKR 0";
    }

    const n = Number(price);

    if (Number.isNaN(n)) return `PKR ${price}`;

    return `PKR ${n.toLocaleString("en-PK")}`;

}


function slugify(text) {

    return String(text || "")
        .toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

}


function normalizeArray(value) {

    if (!value) return [];

    if (Array.isArray(value)) return value;

    if (typeof value === "string") {

        try {

            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed;

        } catch (_) {}

        return value.split(",").map(x => x.trim()).filter(Boolean);

    }

    return [];

}


function getImageUrl(value) {

    if (!value) return "";

    if (typeof value === "string") return value;

    if (typeof value === "object" && value !== null) {

        return value.url || value.image_url || value.path || value.publicUrl || "";

    }

    return "";

}


function getProductImage(product) {

    return (
        getImageUrl(product.main_image_url) ||
        getImageUrl(product.main_image) ||
        getImageUrl(product.image_url) ||
        getImageUrl(product.image) ||
        getImageUrl(product.thumbnail) ||
        ""
    );

}


/* =============================================================
   DYNAMIC STYLES — rich shop cards
============================================================= */

function injectStyles() {

    if (document.getElementById("dw-category-styles")) return;

    const style = document.createElement("style");
    style.id = "dw-category-styles";

    style.textContent = `

        /* =====================================================
           CATEGORY PRODUCT GRID — 2 columns desktop
        ===================================================== */

        .catalog-section #categoryProducts,
        #categoryProducts.product-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 22px;
            width: 100%;
            max-width: 1240px;
            margin: 0 auto 80px;
            padding: 0 26px;
            box-sizing: border-box;
        }

        @media (max-width: 1050px) {
            .catalog-section #categoryProducts,
            #categoryProducts.product-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 20px;
            }
        }

        @media (max-width: 700px) {
            .catalog-section #categoryProducts,
            #categoryProducts.product-grid {
                grid-template-columns: 1fr;
                gap: 18px;
                padding: 0 14px;
                margin-bottom: 55px;
            }
        }


        /* =====================================================
           PRODUCT CARD — rich shop-style
        ===================================================== */

        .dw-product-card {
            position: relative;
            display: flex;
            flex-direction: column;
            background: #ffffff;
            border: 1px solid var(--dw-border, #e7ddcd);
            border-radius: 22px;
            overflow: hidden;
            box-shadow:
                0 1px 2px rgba(31, 25, 19, .04),
                0 16px 40px rgba(31, 25, 19, .06);
            transition: transform .35s ease, box-shadow .35s ease, border-color .35s ease;
        }

        .dw-product-card:hover {
            transform: translateY(-6px);
            border-color: rgba(184, 154, 103, .55);
            box-shadow:
                0 1px 2px rgba(31, 25, 19, .04),
                0 30px 65px rgba(31, 25, 19, .12);
        }


        /* MEDIA */

        .dw-product-media {
            position: relative;
            width: 100%;
            aspect-ratio: 4 / 3;
            overflow: hidden;
            background:
                radial-gradient(circle at 30% 20%, #fbf5e8, #f0e8d8);
        }

        .dw-product-media img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            opacity: 0;
            transition: opacity .35s ease, transform .8s cubic-bezier(.2, .7, .2, 1);
        }

        .dw-product-media img.is-active {
            opacity: 1;
        }

        .dw-product-card:hover .dw-product-media img.is-active {
            transform: scale(1.03);
        }


        /* FEATURED BADGE */

        .dw-product-badge {
            position: absolute;
            top: 14px;
            left: 14px;
            z-index: 3;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            min-height: 28px;
            padding: 0 11px;
            border-radius: 999px;
            background: linear-gradient(135deg, #b59155, #8a6d3f);
            color: #fffaf2;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 1.4px;
            text-transform: uppercase;
            box-shadow: 0 6px 16px rgba(138, 109, 63, .35);
        }

        .dw-product-badge::before {
            content: "★";
            font-size: 9px;
            line-height: 1;
            color: #fdf1cf;
        }


        /* PAGER */

        .dw-product-pager {
            position: absolute;
            right: 14px;
            bottom: 14px;
            z-index: 3;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 6px;
            border-radius: 999px;
            background: rgba(29, 28, 26, .78);
            backdrop-filter: blur(8px);
            color: #fffaf2;
            font-size: 10.5px;
            font-weight: 700;
            letter-spacing: .5px;
        }

        .dw-product-pager-count {
            padding: 0 8px 0 6px;
        }

        .dw-product-pager-btn {
            width: 26px;
            height: 26px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, .12);
            color: #fffaf2;
            font-size: 13px;
            font-weight: 400;
            line-height: 1;
            cursor: pointer;
            transition: background .2s ease, color .2s ease;
        }

        .dw-product-pager-btn:hover {
            background: #fffaf2;
            color: #1d1c1a;
        }

        .dw-product-pager-btn:disabled {
            opacity: .35;
            cursor: not-allowed;
        }


        /* BODY */

        .dw-product-body {
            display: flex;
            flex-direction: column;
            flex: 1 1 auto;
            padding: 22px 24px 24px;
        }

        .dw-product-cat {
            margin: 0 0 8px;
            color: var(--dw-gold-dark, #8a6d3f);
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 2.6px;
            text-transform: uppercase;
        }

        .dw-product-name {
            margin: 0 0 8px;
            color: var(--dw-charcoal, #1d1c1a);
            font: 500 clamp(22px, 2.2vw, 28px) / 1.15 Georgia, "Times New Roman", serif;
            letter-spacing: -.4px;
        }

        .dw-product-name a {
            color: inherit;
            text-decoration: none;
        }

        .dw-product-desc {
            margin: 0 0 14px;
            color: var(--dw-muted, #746d63);
            font-size: 12.5px;
            line-height: 1.7;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }


        /* PRICE ROW */

        .dw-product-price-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            margin: 0 0 18px;
            padding-bottom: 18px;
            border-bottom: 1px dashed rgba(184, 154, 103, .35);
        }

        .dw-product-price {
            color: var(--dw-charcoal, #1d1c1a);
            font: 600 clamp(22px, 2.4vw, 26px) / 1 Georgia, "Times New Roman", serif;
            letter-spacing: -.3px;
        }

        .dw-product-custom {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            min-height: 30px;
            padding: 0 12px;
            border-radius: 999px;
            background: #f5efe2;
            color: #8a6d3f;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: .2px;
            white-space: nowrap;
        }

        .dw-product-custom svg {
            width: 13px;
            height: 13px;
            flex: 0 0 auto;
        }


        /* FEATURE TRIO */

        .dw-product-features {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            margin: 0 0 22px;
        }

        .dw-product-feature {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            min-width: 0;
        }

        .dw-product-feature-icon {
            flex: 0 0 auto;
            width: 30px;
            height: 30px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: linear-gradient(135deg, #fdf4e2, #f0e2c4);
            color: #8a6d3f;
        }

        .dw-product-feature-icon svg {
            width: 14px;
            height: 14px;
        }

        .dw-product-feature-text {
            min-width: 0;
            color: #4e4941;
            font-size: 10.5px;
            font-weight: 600;
            line-height: 1.35;
            letter-spacing: .1px;
        }


        /* CTA ROW */

        .dw-product-cta-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 10px;
            margin-top: auto;
        }

        .dw-product-cta {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            min-height: 54px;
            padding: 0 22px;
            border-radius: 999px;
            border: 1px solid transparent;
            background: linear-gradient(135deg, #b59155 0%, #8a6d3f 100%);
            color: #fffaf2;
            text-decoration: none;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 1.2px;
            text-transform: uppercase;
            transition: transform .25s ease, box-shadow .25s ease, filter .25s ease;
        }

        .dw-product-cta:hover {
            transform: translateY(-2px);
            filter: brightness(1.05);
            box-shadow: 0 14px 30px rgba(138, 109, 63, .30);
        }

        .dw-product-cta svg {
            width: 15px;
            height: 15px;
            flex: 0 0 auto;
        }

        .dw-product-fav {
            width: 54px;
            height: 54px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--dw-border, #e7ddcd);
            border-radius: 999px;
            background: #fff;
            color: #a89070;
            cursor: pointer;
            transition: border-color .25s ease, color .25s ease, background .25s ease, transform .25s ease;
        }

        .dw-product-fav:hover {
            border-color: rgba(184, 154, 103, .7);
            color: #b59155;
            transform: translateY(-2px);
        }

        .dw-product-fav.is-active {
            background: #f8efdd;
            border-color: rgba(184, 154, 103, .8);
            color: #b59155;
        }

        .dw-product-fav svg {
            width: 20px;
            height: 20px;
        }


        /* MOBILE TWEAKS */

        @media (max-width: 700px) {

            .dw-product-media {
                aspect-ratio: 4 / 3;
            }

            .dw-product-badge {
                top: 12px;
                left: 12px;
                min-height: 26px;
                padding: 0 10px;
                font-size: 8.5px;
                letter-spacing: 1.2px;
            }

            .dw-product-pager {
                right: 12px;
                bottom: 12px;
                font-size: 10px;
            }

            .dw-product-pager-btn {
                width: 24px;
                height: 24px;
                font-size: 12px;
            }

            .dw-product-body {
                padding: 18px 18px 20px;
            }

            .dw-product-cat {
                font-size: 9px;
                letter-spacing: 2.2px;
                margin-bottom: 6px;
            }

            .dw-product-name {
                font-size: 22px;
                margin-bottom: 6px;
            }

            .dw-product-desc {
                font-size: 12px;
                margin-bottom: 12px;
            }

            .dw-product-price-row {
                gap: 10px;
                margin-bottom: 14px;
                padding-bottom: 14px;
            }

            .dw-product-price {
                font-size: 22px;
            }

            .dw-product-custom {
                padding: 0 10px;
                font-size: 9.5px;
                min-height: 28px;
            }

            .dw-product-features {
                gap: 8px;
                margin-bottom: 18px;
            }

            .dw-product-feature-icon {
                width: 26px;
                height: 26px;
            }

            .dw-product-feature-icon svg {
                width: 12px;
                height: 12px;
            }

            .dw-product-feature-text {
                font-size: 9.5px;
            }

            .dw-product-cta-row {
                gap: 8px;
            }

            .dw-product-cta {
                min-height: 50px;
                font-size: 11px;
                letter-spacing: 1px;
            }

            .dw-product-fav {
                width: 50px;
                height: 50px;
            }

            .dw-product-fav svg {
                width: 18px;
                height: 18px;
            }

        }

        @media (max-width: 380px) {

            .dw-product-features {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .dw-product-feature:last-child {
                display: none;
            }

            .dw-product-name {
                font-size: 20px;
            }

            .dw-product-price {
                font-size: 20px;
            }

        }

    `;

    document.head.appendChild(style);

}


/* =========================================================
   CATEGORY HEADER
========================================================= */

function setCategoryHeader(category) {

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


    const name =
        category.name || "Collection";

    const description =
        category.description ||
        `Explore our ${name.toLowerCase()} wedding invitation collection — handpicked designs crafted with elegance.`;


    if (elements.categoryLabel)
        elements.categoryLabel.textContent = "Collection";


    if (elements.categoryTitle)
        elements.categoryTitle.textContent = name;


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
   CREATE RICH PRODUCT CARD
========================================================= */

function createRichProductCard(product, categoryName) {

    const name =
        product.name || "Wedding Invitation";

    const slug =
        product.slug || slugify(name);

    const description =
        product.short_description ||
        product.description ||
        "A perfect blend of tradition and elegance.";

    const image =
        getProductImage(product);

    const badge =
        product.featured
            ? "Featured"
            : product.popular
                ? "Popular"
                : "";

    const href =
        `invitation.html?slug=${encodeURIComponent(slug)}`;


    /* Feature trio */

    const features = [
        {
            label: "Premium Quality Card",
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 7v10l8 5 8-5V7z"/><path d="M4 7l8 5 8-5"/><path d="M12 12v10"/></svg>`
        },
        {
            label: "Elegant Designs",
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M3 12h18"/></svg>`
        },
        {
            label: "Secure Packaging",
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l7 3v6c0 5-3 8-7 11-4-3-7-6-7-11V5z"/><path d="M9 12l2 2 4-4"/></svg>`
        }
    ];


    /* Image markup */

    const imageMarkup = image
        ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy" class="is-active">`
        : `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#8a6d3f;font-family:Georgia,serif;font-size:20px;padding:20px;text-align:center;">${escapeHtml(name)}</div>`;


    const badgeMarkup = badge
        ? `<span class="dw-product-badge">${escapeHtml(badge)}</span>`
        : "";


    const featureMarkup = features.map(f => `
        <div class="dw-product-feature">
            <span class="dw-product-feature-icon">${f.icon}</span>
            <span class="dw-product-feature-text">${f.label}</span>
        </div>
    `).join("");


    const card = document.createElement("article");
    card.className = "dw-product-card";

    card.innerHTML = `

        <div class="dw-product-media" data-media>
            ${imageMarkup}
            ${badgeMarkup}
        </div>

        <div class="dw-product-body">

            <p class="dw-product-cat">${escapeHtml(categoryName || "Invitation")}</p>

            <h3 class="dw-product-name">
                <a href="${href}">${escapeHtml(name)}</a>
            </h3>

            <p class="dw-product-desc">${escapeHtml(description)}</p>

            <div class="dw-product-price-row">

                <span class="dw-product-price">${formatPrice(product.price)}</span>

                <span class="dw-product-custom">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 20h9"/>
                        <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4z"/>
                    </svg>
                    Custom Designs Available
                </span>

            </div>

            <div class="dw-product-features">
                ${featureMarkup}
            </div>

            <div class="dw-product-cta-row">

                <a href="${href}" class="dw-product-cta">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12h14"/>
                        <path d="M13 5l7 7-7 7"/>
                    </svg>
                    View Design
                </a>

                <button type="button" class="dw-product-fav" aria-label="Add to favourites">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                </button>

            </div>

        </div>
    `;


    /* Favourite toggle */

    const favBtn = card.querySelector(".dw-product-fav");

    favBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        favBtn.classList.toggle("is-active");
    });


    return card;
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


    elements.products.innerHTML = "";

    list.forEach(product => {

        const categoryName =
            product.categories?.name || "Invitation";

        const card =
            createRichProductCard(product, categoryName);

        elements.products.appendChild(card);

    });

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

    injectStyles();

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
            categorySlug: category ? category.slug : null
        });


        renderProducts(currentProducts);


        setupEvents();
        setupMobileMenu();

    }

    catch (error) {

        console.error("Category page error:", error);

        if (elements.products) {

            elements.products.innerHTML = "";

            const err = document.createElement("div");
            err.className = "catalog-empty";
            err.style.display = "block";
            err.innerHTML = `
                <h2>Unable to load invitations</h2>
                <p>${escapeHtml(error.message)}</p>
            `;
            elements.products.appendChild(err);

        }

    }

}


document.addEventListener("DOMContentLoaded", init);