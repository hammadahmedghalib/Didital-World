import {
    getCategories,
    getProducts
} from "./catalog.js";


const params = new URLSearchParams(window.location.search);

const selectedSlug =
    (params.get("category") || params.get("slug") || "all")
    .trim().toLowerCase();

let currentProducts = [];

const elements = {
    categoryTitle: document.getElementById("categoryTitle"),
    categoryDescription: document.getElementById("categoryDescription"),
    categoryLabel: document.getElementById("categoryLabel"),
    breadcrumbCategoryLink: document.getElementById("breadcrumbCategoryLink"),
    productCount: document.getElementById("productCount"),
    products: document.getElementById("categoryProducts"),
    empty: document.getElementById("catalogEmpty"),
    search: document.getElementById("catalogSearch"),
    price: document.getElementById("priceFilter"),
    style: document.getElementById("styleFilter"),
    sort: document.getElementById("sortProducts"),
    clear: document.getElementById("clearFilters"),
    mobileMenu: document.getElementById("mobileMenuButton"),
    mobileNav: document.getElementById("mobileNav")
};


function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatPrice(price) {
    if (price === null || price === undefined || price === "") return "PKR 0";
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
   STYLES
============================================================= */

function injectStyles() {

    if (document.getElementById("dw-category-styles")) return;

    const style = document.createElement("style");
    style.id = "dw-category-styles";

    style.textContent = `

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

        /* FORCE 2 COLUMNS ON MOBILE */
        @media (max-width: 700px) {
            .catalog-section #categoryProducts,
            #categoryProducts.product-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: 10px !important;
                padding: 0 8px !important;
                margin-bottom: 55px;
            }
        }

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

        .dw-product-media {
            position: relative;
            width: 100%;
            aspect-ratio: 4 / 3;
            overflow: hidden;
            background: radial-gradient(circle at 30% 20%, #fbf5e8, #f0e8d8);
        }

        .dw-product-media img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transition: transform .8s cubic-bezier(.2, .7, .2, 1);
        }

        .dw-product-card:hover .dw-product-media img {
            transform: scale(1.03);
        }

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
            margin: 0 0 18px;
            color: var(--dw-charcoal, #1d1c1a);
            font: 500 clamp(22px, 2.2vw, 28px) / 1.15 Georgia, "Times New Roman", serif;
            letter-spacing: -.4px;
        }

        .dw-product-name a {
            color: inherit;
            text-decoration: none;
        }

        /* FOOTER LAYOUT (Price Left, Button Right) */
        .dw-product-footer {
            display: flex;
            flex-direction: row;
            justify-content: space-between; /* Pushes price to left, button to right */
            align-items: center;
            margin-top: auto;
            gap: 10px;
            width: 100%;
            padding-top: 16px;
            border-top: 1px dashed rgba(184, 154, 103, .35);
        }

        .dw-product-price {
            color: var(--dw-charcoal, #1d1c1a);
            font: 600 18px/1 Georgia, "Times New Roman", serif;
            letter-spacing: -.3px;
        }

        .dw-product-cta {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 42px;
            padding: 0 20px;
            width: auto;
            border-radius: 999px;
            border: 1px solid transparent;
            background: linear-gradient(135deg, #b59155 0%, #8a6d3f 100%);
            color: #fffaf2;
            text-decoration: none;
            font-size: 11px;
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

        @media (max-width: 700px) {
            .dw-product-card { border-radius: 12px; }
            
            /* Make image square on mobile to save vertical space */
            .dw-product-media { aspect-ratio: 1 / 1; }
            
            .dw-product-badge {
                top: 8px; left: 8px;
                min-height: 20px; padding: 0 6px;
                font-size: 7px; letter-spacing: 0.8px;
            }
            .dw-product-body { padding: 12px 10px 14px; }
            .dw-product-cat { font-size: 7px; letter-spacing: 1px; margin-bottom: 4px; }
            .dw-product-name { font-size: 13px; margin-bottom: 8px; line-height: 1.15; }
            
            .dw-product-footer { padding-top: 8px; gap: 6px; }
            .dw-product-price { font-size: 11px; }
            .dw-product-cta { min-height: 26px; font-size: 7px; padding: 0 8px; letter-spacing: 0.5px; gap: 4px; }
            .dw-product-cta svg { width: 10px; height: 10px; }
        }

        @media (max-width: 380px) {
            .dw-product-list { padding: 0 6px !important; gap: 8px !important; }
            .dw-product-name { font-size: 12px; }
            .dw-product-price { font-size: 10px; }
            .dw-product-cta { font-size: 6px; padding: 0 6px; }
        }

    `;

    document.head.appendChild(style);
}


/* =========================================================
   HEADER
========================================================= */

function setCategoryHeader(category) {

    if (!category) {

        if (elements.categoryLabel) elements.categoryLabel.textContent = "All Collections";
        if (elements.categoryTitle) elements.categoryTitle.textContent = "Wedding Invitations";
        if (elements.categoryDescription) elements.categoryDescription.textContent =
            "Explore our complete collection of elegant wedding invitation designs.";

        if (elements.breadcrumbCategoryLink) {
            elements.breadcrumbCategoryLink.textContent = "Collections";
            elements.breadcrumbCategoryLink.href = "category.html?category=all";
        }

        document.title = "Wedding Invitations | Digital World";

        const meta = document.getElementById("categoryMetaDescription");
        if (meta) meta.setAttribute("content",
            "Explore our complete collection of elegant wedding invitation designs.");

        return;
    }

    const name = category.name || "Collection";
    const description =
        category.description ||
        `Explore our ${name.toLowerCase()} wedding invitation collection — handpicked designs crafted with elegance.`;

    if (elements.categoryLabel) elements.categoryLabel.textContent = "Collection";
    if (elements.categoryTitle) elements.categoryTitle.textContent = name;
    if (elements.categoryDescription) elements.categoryDescription.textContent = description;

    if (elements.breadcrumbCategoryLink) {
        elements.breadcrumbCategoryLink.textContent = name;
        elements.breadcrumbCategoryLink.href =
            `category.html?category=${encodeURIComponent(category.slug || "")}`;
    }

    document.title = `${name} | Digital World`;

    const meta = document.getElementById("categoryMetaDescription");
    if (meta) meta.setAttribute("content", description);
}


/* =========================================================
   CREATE PRODUCT CARD
========================================================= */

function createRichProductCard(product, categoryName) {

    const name = product.name || "Wedding Invitation";
    const slug = product.slug || slugify(name);

    const badge =
        product.featured ? "Featured" :
        product.popular  ? "Popular"  : "";

    const image = getProductImage(product);
    const href = `invitation.html?slug=${encodeURIComponent(slug)}`;

    const imageMarkup = image
        ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy">`
        : `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#8a6d3f;font-family:Georgia,serif;font-size:20px;padding:20px;text-align:center;">${escapeHtml(name)}</div>`;

    const badgeMarkup = badge
        ? `<span class="dw-product-badge">${escapeHtml(badge)}</span>`
        : "";

    const card = document.createElement("article");
    card.className = "dw-product-card";

    card.innerHTML = `

        <div class="dw-product-media">
            ${imageMarkup}
            ${badgeMarkup}
        </div>

        <div class="dw-product-body">

            <p class="dw-product-cat">${escapeHtml(categoryName || "Invitation")}</p>

            <h3 class="dw-product-name">
                <a href="${href}">${escapeHtml(name)}</a>
            </h3>

            <div class="dw-product-footer">
                <span class="dw-product-price">${formatPrice(product.price)}</span>
                <a href="${href}" class="dw-product-cta">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12h14"/>
                        <path d="M13 5l7 7-7 7"/>
                    </svg>
                    View Design
                </a>
            </div>

        </div>
    `;

    return card;
}


/* =========================================================
   RENDER
========================================================= */

function renderProducts(list) {

    if (elements.productCount) {
        elements.productCount.textContent =
            `${list.length} ${list.length === 1 ? "Design" : "Designs"}`;
    }

    if (!list.length) {
        if (elements.products) elements.products.innerHTML = "";
        if (elements.empty) elements.empty.hidden = false;
        return;
    }

    if (elements.empty) elements.empty.hidden = true;

    elements.products.innerHTML = "";

    list.forEach(product => {
        const categoryName = product.categories?.name || "Invitation";
        elements.products.appendChild(
            createRichProductCard(product, categoryName)
        );
    });
}


/* =========================================================
   FILTERS
========================================================= */

function applyFilters() {

    let result = [...currentProducts];

    const search = elements.search.value.trim().toLowerCase();
    const price = elements.price.value;
    const style = elements.style.value;
    const sort = elements.sort.value;

    if (search) {
        result = result.filter(product => {
            const text = [
                product.name, product.description, product.short_description,
                product.style, ...(product.tags || [])
            ].join(" ").toLowerCase();
            return text.includes(search);
        });
    }

    if (price === "100-250")   result = result.filter(p => { const n = Number(p.price); return n >= 100 && n <= 250; });
    if (price === "250-500")   result = result.filter(p => { const n = Number(p.price); return n >  250 && n <= 500; });
    if (price === "500-1000")  result = result.filter(p => { const n = Number(p.price); return n >  500 && n <= 1000; });
    if (price === "1000-2000") result = result.filter(p => { const n = Number(p.price); return n > 1000 && n <= 2000; });
    if (price === "above-2000")result = result.filter(p => Number(p.price) > 2000);

    if (style !== "all") result = result.filter(p => p.style === style);

    if (sort === "price-low")  result.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-high") result.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "name")       result.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "newest")     result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    renderProducts(result);
}


function resetFilters() {
    elements.search.value = "";
    elements.price.value = "all";
    elements.style.value = "all";
    elements.sort.value = "featured";
    applyFilters();
}


function setupMobileMenu() {
    if (!elements.mobileMenu || !elements.mobileNav) return;
    elements.mobileMenu.addEventListener("click", () => {
        elements.mobileNav.classList.toggle("active");
        elements.mobileNav.classList.toggle("open");
    });
}


function setupEvents() {
    elements.search.addEventListener("input", applyFilters);
    elements.price.addEventListener("change", applyFilters);
    elements.style.addEventListener("change", applyFilters);
    elements.sort.addEventListener("change", applyFilters);
    elements.clear.addEventListener("click", resetFilters);
}


async function init() {

    injectStyles();

    try {

        const categories = await getCategories();

        let category = null;

        if (selectedSlug !== "all") {
            category = categories.find(
                item =>
                    String(item.slug || "").trim().toLowerCase() === selectedSlug
            );
            if (!category) {
                console.warn(`Category "${selectedSlug}" not found. Falling back to all.`);
            }
        }

        setCategoryHeader(category);

        currentProducts = await getProducts({
            categorySlug: category ? category.slug : null
        });

        renderProducts(currentProducts);

        setupEvents();
        setupMobileMenu();

    } catch (error) {

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