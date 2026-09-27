import {
    supabaseClient
} from "./supabase.js";


/* =============================================================
   DIGITAL WORLD — HOMEPAGE CATALOG
============================================================= */


function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
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

function slugify(text) {
    return String(text || "")
        .toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function formatPrice(price) {
    if (price === null || price === undefined || price === "") return "PKR 0";
    const n = Number(price);
    if (Number.isNaN(n)) return `PKR ${price}`;
    return `PKR ${n.toLocaleString("en-PK")}`;
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

function getCategoryImage(category) {
    return (
        getImageUrl(category.image) ||
        getImageUrl(category.image_url) ||
        getImageUrl(category.cover_image) ||
        getImageUrl(category.coverImage) ||
        getImageUrl(category.thumbnail) ||
        getImageUrl(category.hero_image) ||
        getImageUrl(category.banner_image) ||
        ""
    );
}

function getCategoryName(category) {
    return category.name || category.title || category.label || "Collection";
}

function getCategorySlug(category) {
    return category.slug || slugify(getCategoryName(category));
}

function getProductName(product) {
    return product.name || product.title || "Wedding Invitation";
}

function getProductTags(product) {
    return normalizeArray(product.tags || product.product_tags || [])
        .map(tag => String(tag).trim())
        .filter(Boolean);
}

function isCategoryVisible(category) {
    if (
        category.active === false ||
        category.is_active === false ||
        category.published === false ||
        category.is_published === false
    ) return false;

    if (
        category.status &&
        !["published", "active"].includes(String(category.status).toLowerCase())
    ) return false;

    return true;
}

function isProductVisible(product) {
    if (product.archived === true) return false;
    if (product.published === false || product.is_published === false) return false;
    if (product.status && String(product.status).toLowerCase() !== "published") return false;
    return true;
}

function getBadge(product) {
    const customBadge = String(product.homepage_badge || "").trim();
    if (customBadge) return customBadge;

    const tags = getProductTags(product);
    const priorityBadges = [
        "Top Seller", "Top Selling", "Most Demanded", "Most Demanding",
        "Popular", "Trending", "New", "Editor's Pick", "Featured"
    ];

    for (const name of priorityBadges) {
        const match = tags.find(t => t.toLowerCase() === name.toLowerCase());
        if (match) return match;
    }

    if (product.popular === true) return "Popular";
    if (product.featured === true) return "Featured";
    return "";
}


/* =============================================================
   DYNAMIC STYLES
============================================================= */

function injectStyles() {
    if (document.getElementById("everafter-home-catalog-styles")) return;

    const style = document.createElement("style");
    style.id = "everafter-home-catalog-styles";

    style.textContent = `

        .everafter-homepage-catalog {
            background: var(--ea-ivory, #f8f5ef);
        }

        .everafter-home-section {
            padding: 86px 0;
            border-top: 1px solid var(--ea-border, #e6ded1);
        }

        .everafter-home-section:first-child { border-top: 0; }

        .everafter-home-section-heading {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 30px;
            margin-bottom: 34px;
        }

        .everafter-home-section-label {
            margin: 0 0 10px;
            color: var(--ea-gold-dark, #8e7144);
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 3px;
            text-transform: uppercase;
        }

        .everafter-home-section-title {
            margin: 0;
            color: var(--ea-charcoal, #1d1c1a);
            font: 500 clamp(36px, 4vw, 57px) / 1.02 Georgia, "Times New Roman", serif;
            letter-spacing: -.5px;
        }

        .everafter-home-section-description {
            max-width: 570px;
            margin: 13px 0 0;
            color: var(--ea-muted, #756f67);
            font-size: 12px;
            line-height: 1.85;
        }

        .everafter-home-section-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 43px;
            padding: 0 19px;
            border: 1px solid var(--ea-border, #e6ded1);
            border-radius: 999px;
            background: #fff;
            color: var(--ea-charcoal, #1d1c1a);
            text-decoration: none;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: .7px;
            white-space: nowrap;
            transition: transform .25s ease, background .25s ease, color .25s ease, border-color .25s ease;
        }

        .everafter-home-section-link:hover {
            transform: translateY(-2px);
            background: var(--ea-charcoal, #1d1c1a);
            border-color: var(--ea-charcoal, #1d1c1a);
            color: #fff;
        }

        /* CATEGORY GRID */

        .everafter-home-category-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 15px;
        }

        .everafter-home-category-card {
            position: relative;
            min-height: 475px;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            overflow: hidden;
            background: #201c18;
            color: #fff;
            text-decoration: none;
            border: 1px solid rgba(184, 154, 103, .32);
            isolation: isolate;
            box-shadow: 0 12px 35px rgba(35, 28, 21, .06);
            transition: transform .45s ease, border-color .45s ease, box-shadow .45s ease;
        }

        .everafter-home-category-card:hover {
            transform: translateY(-7px);
            border-color: rgba(184, 154, 103, .78);
            box-shadow: 0 30px 70px rgba(35, 28, 21, .17);
        }

        .everafter-home-category-card-image {
            position: absolute;
            inset: 0;
            background: linear-gradient(145deg, #3a3128, #191614) center / cover no-repeat;
            transform: scale(1.01);
            transition: transform 1s cubic-bezier(.18, .72, .18, 1);
        }

        .everafter-home-category-card:hover .everafter-home-category-card-image {
            transform: scale(1.075);
        }

        .everafter-home-category-card::before {
            content: "";
            position: absolute;
            inset: 0;
            z-index: 1;
            background: linear-gradient(180deg,
                rgba(15, 12, 10, .02) 0%,
                rgba(15, 12, 10, .12) 30%,
                rgba(15, 12, 10, .43) 56%,
                rgba(15, 12, 10, .95) 100%);
        }

        .everafter-home-category-card::after {
            content: "";
            position: absolute;
            inset: 14px;
            z-index: 2;
            border: 1px solid rgba(255, 255, 255, .17);
            pointer-events: none;
            transition: border-color .4s ease;
        }

        .everafter-home-category-card:hover::after {
            border-color: rgba(215, 188, 134, .57);
        }

        .everafter-home-category-card-content {
            position: relative;
            z-index: 4;
            padding: 35px 30px 31px;
        }

        .everafter-home-category-number {
            display: block;
            margin: 0 0 17px;
            color: rgba(255, 255, 255, .58);
            font-family: Georgia, "Times New Roman", serif;
            font-size: 11px;
            letter-spacing: 2px;
        }

        .everafter-home-category-card-label {
            margin: 0 0 10px;
            color: #d6b97f;
            font-size: 8px;
            font-weight: 800;
            letter-spacing: 3px;
            text-transform: uppercase;
        }

        .everafter-home-category-card-title {
            margin: 0;
            color: #fffaf2;
            font: 400 clamp(32px, 3vw, 44px) / 1.02 Georgia, "Times New Roman", serif;
            letter-spacing: -.5px;
        }

        .everafter-home-category-card-description {
            max-width: 290px;
            margin: 14px 0 22px;
            color: rgba(255, 250, 242, .78);
            font-size: 11px;
            line-height: 1.8;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .everafter-home-category-card-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 39px;
            padding: 0 17px;
            border: 1px solid rgba(255, 255, 255, .34);
            background: rgba(255, 255, 255, .06);
            color: #fffaf2;
            backdrop-filter: blur(8px);
            font-size: 8px;
            font-weight: 800;
            letter-spacing: .9px;
            text-transform: uppercase;
            transition: background .3s ease, border-color .3s ease, color .3s ease;
        }

        .everafter-home-category-card:hover .everafter-home-category-card-button {
            background: #fffaf2;
            border-color: #fffaf2;
            color: #1d1c1a;
        }

        /* SHOP FILTER BAR */

        .dw-shop-bar {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 22px;
        }

        .dw-shop-filter {
            position: relative;
            display: flex;
            align-items: center;
            gap: 10px;
            min-height: 52px;
            padding: 0 18px;
            border: 1px solid var(--ea-border, #e6ded1);
            border-radius: 999px;
            background: #fff;
            cursor: pointer;
            transition: border-color .25s ease, box-shadow .25s ease;
        }

        .dw-shop-filter:hover { border-color: rgba(184, 154, 103, .65); }

        .dw-shop-filter:focus-within {
            border-color: var(--ea-gold, #b89a67);
            box-shadow: 0 0 0 4px rgba(184, 154, 103, .10);
        }

        .dw-shop-filter-icon {
            flex: 0 0 auto;
            width: 18px;
            height: 18px;
            color: var(--ea-gold-dark, #8e7144);
        }

        .dw-shop-filter select {
            flex: 1 1 auto;
            width: 100%;
            min-width: 0;
            height: 50px;
            border: 0;
            outline: 0;
            background: transparent;
            color: var(--ea-charcoal, #1d1c1a);
            font: inherit;
            font-size: 12.5px;
            font-weight: 600;
            letter-spacing: .2px;
            appearance: none;
            -webkit-appearance: none;
            cursor: pointer;
            padding: 0 18px 0 0;
        }

        .dw-shop-filter-chev {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
            color: #9c948a;
            font-size: 10px;
            line-height: 1;
        }

        /* PRODUCT CARDS */

        .dw-product-list {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 22px;
        }

        .dw-product-card {
            position: relative;
            display: flex;
            flex-direction: column;
            background: #ffffff;
            border: 1px solid var(--ea-border, #e6ded1);
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
            color: var(--ea-gold-dark, #8e7144);
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 2.6px;
            text-transform: uppercase;
        }

        .dw-product-name {
            margin: 0 0 18px;
            color: var(--ea-charcoal, #1d1c1a);
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
            color: var(--ea-charcoal, #1d1c1a);
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

        .everafter-home-notice {
            margin-top: 20px;
            padding: 14px 16px;
            border: 1px dashed var(--ea-border, #e6ded1);
            background: rgba(255, 255, 255, .5);
            color: var(--ea-muted, #756f67);
            font-size: 10px;
            line-height: 1.6;
        }

        .everafter-home-empty {
            padding: 55px 20px;
            border: 1px dashed var(--ea-border, #e6ded1);
            background: #fff;
            color: var(--ea-muted, #756f67);
            text-align: center;
        }

        .everafter-home-empty strong {
            display: block;
            margin-bottom: 7px;
            color: var(--ea-charcoal, #1d1c1a);
            font: 500 21px Georgia, "Times New Roman", serif;
        }

        /* TABLET */

        @media (max-width: 1050px) {
            .everafter-home-category-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }

        /* MOBILE */
        @media (max-width: 700px) {

            .everafter-home-section { padding: 52px 0; }

            .everafter-home-section-heading {
                align-items: flex-start;
                flex-direction: column;
                gap: 14px;
                margin-bottom: 24px;
            }

            .everafter-home-section-title {
                font-size: 30px;
                letter-spacing: -.6px;
                line-height: 1.05;
            }

            .everafter-home-section-description {
                font-size: 12px;
                line-height: 1.7;
                margin-top: 8px;
            }

            .everafter-home-section-link {
                min-height: 38px;
                padding: 0 16px;
                font-size: 9px;
                letter-spacing: 1.2px;
            }

            .everafter-home-category-grid {
                display: grid !important;
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: 12px !important;
                padding: 0 12px !important;
                overflow-x: visible !important;
                scroll-snap-type: none !important;
            }

            .everafter-home-category-card {
                flex: none !important;
                width: auto !important;
                max-width: none !important;
                min-height: 0 !important;
                scroll-snap-align: none !important;
            }

            .everafter-home-category-card::after { inset: 8px; }
            .everafter-home-category-card-content { padding: 18px 14px 16px; }
            .everafter-home-category-number { margin: 0 0 10px; font-size: 9px; letter-spacing: 1.6px; }
            .everafter-home-category-card-label { margin: 0 0 6px; font-size: 7px; letter-spacing: 2px; }
            .everafter-home-category-card-title { font-size: 19px; letter-spacing: -.3px; line-height: 1.05; }
            .everafter-home-category-card-description { margin: 8px 0 12px; font-size: 10px; line-height: 1.5; -webkit-line-clamp: 2; }
            .everafter-home-category-card-button { min-height: 32px; padding: 0 12px; font-size: 7px; letter-spacing: .6px; }

            .dw-shop-bar {
                grid-template-columns: 1fr;
                gap: 10px;
                margin-bottom: 18px;
                padding: 0 14px;
            }

            .dw-shop-filter {
                min-height: 48px;
                padding: 0 16px;
            }

            .dw-shop-filter select {
                height: 46px;
                font-size: 12px;
            }

            /* FORCE 2 COLUMNS ON MOBILE */
            .dw-product-list {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: 10px !important;
                padding: 0 8px !important;
            }

            .dw-product-card { border-radius: 12px; }
            
            /* Make image square on mobile to save vertical space */
            .dw-product-media { aspect-ratio: 1 / 1; }

            .dw-product-badge {
                top: 8px; left: 8px;
                min-height: 20px; padding: 0 6px;
                font-size: 7px; letter-spacing: 0.8px;
            }

            .dw-product-body { padding: 12px 10px 14px; }

            .dw-product-cat {
                font-size: 7px; letter-spacing: 1px; margin-bottom: 4px;
            }
            .dw-product-name { font-size: 13px; margin-bottom: 8px; line-height: 1.15; }
            
            .dw-product-footer {
                padding-top: 8px;
                gap: 6px;
            }
            .dw-product-price {
                font-size: 11px;
            }
            .dw-product-cta {
                min-height: 26px; font-size: 7px; padding: 0 8px; letter-spacing: 0.5px; gap: 4px;
            }
            .dw-product-cta svg {
                width: 10px; height: 10px;
            }
        }

        @media (max-width: 380px) {
            .everafter-home-category-grid {
                gap: 10px !important; padding: 0 10px !important;
            }
            .everafter-home-category-card-title { font-size: 17px; }
            .everafter-home-category-card-description { font-size: 9.5px; }

            .dw-product-list { padding: 0 6px !important; gap: 8px !important; }
            .dw-product-name { font-size: 12px; }
            .dw-product-price { font-size: 10px; }
            .dw-product-cta { font-size: 6px; padding: 0 6px; }
        }

    `;

    document.head.appendChild(style);
}


/* =============================================================
   LOAD DATA
============================================================= */

async function loadCategories() {
    const { data, error } = await supabaseClient
        .from("categories")
        .select("*");

    if (error) throw error;

    return (data || [])
        .filter(isCategoryVisible)
        .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
}

async function loadProducts() {
    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .eq("archived", false);

    if (error) throw error;

    return (data || [])
        .filter(isProductVisible)
        .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
}


/* =============================================================
   CATEGORY CARD
============================================================= */

function createCategoryCard(category, index = 0) {
    const name = getCategoryName(category);
    const slug = getCategorySlug(category);
    const image = getCategoryImage(category);

    const description =
        category.description ||
        category.short_description ||
        `Explore our ${name.toLowerCase()} wedding invitation collection.`;

    const card = document.createElement("a");
    card.className = "everafter-home-category-card";
    card.href = `category.html?category=${encodeURIComponent(slug)}`;
    card.setAttribute("aria-label", `View ${name} collection`);

    const imageLayer = document.createElement("div");
    imageLayer.className = "everafter-home-category-card-image";
    if (image) {
        imageLayer.style.backgroundImage = `url("${image.replaceAll('"', "%22")}")`;
    }
    card.appendChild(imageLayer);

    const content = document.createElement("div");
    content.className = "everafter-home-category-card-content";

    const number = String(index + 1).padStart(2, "0");

    content.innerHTML = `
        <span class="everafter-home-category-number">${number}</span>
        <p class="everafter-home-category-card-label">Collection</p>
        <h3 class="everafter-home-category-card-title">${escapeHtml(name)}</h3>
        <p class="everafter-home-category-card-description">${escapeHtml(description)}</p>
        <span class="everafter-home-category-card-button">Discover Collection →</span>
    `;

    card.appendChild(content);
    return card;
}


/* =============================================================
   PRODUCT CARD
============================================================= */

function createProductCard(product, category) {

    const name = getProductName(product);
    const slug = product.slug || slugify(name);
    const badge = getBadge(product);
    const categoryName = getCategoryName(category);
    const image = getProductImage(product);

    const href = `invitation.html?slug=${encodeURIComponent(slug)}`;

    const card = document.createElement("article");
    card.className = "dw-product-card";

    const imageMarkup = image
        ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy">`
        : `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#8a6d3f;font-family:Georgia,serif;font-size:20px;padding:20px;text-align:center;">${escapeHtml(name)}</div>`;

    const badgeMarkup = badge
        ? `<span class="dw-product-badge">${escapeHtml(badge)}</span>`
        : "";

    card.innerHTML = `

        <div class="dw-product-media">
            ${imageMarkup}
            ${badgeMarkup}
        </div>

        <div class="dw-product-body">

            <p class="dw-product-cat">${escapeHtml(categoryName)}</p>

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


/* =============================================================
   RENDER CATEGORY SECTION
============================================================= */

function renderCategories(wrapper, categories) {

    const section = document.createElement("section");
    section.className = "everafter-home-section";

    section.innerHTML = `
        <div class="container">
            <div class="everafter-home-section-heading">
                <div>
                    <p class="everafter-home-section-label">THE COLLECTIONS</p>
                    <h2 class="everafter-home-section-title">Wedding Invitations</h2>
                    <p class="everafter-home-section-description">
                        Four distinct collections, thoughtfully designed for every kind of celebration.
                    </p>
                </div>
                <a href="category.html?category=all" class="everafter-home-section-link">
                    Explore All →
                </a>
            </div>
            <div class="everafter-home-category-grid"></div>
        </div>
    `;

    const grid = section.querySelector(".everafter-home-category-grid");

    categories.slice(0, 4).forEach((category, index) => {
        grid.appendChild(createCategoryCard(category, index));
    });

    wrapper.appendChild(section);
}


/* =============================================================
   HOMEPAGE PRODUCTS SELECTOR
============================================================= */

function getSelectedHomepageProducts(categories, products) {

    const firstFourCategories = categories.slice(0, 4);
    const selectedByCategory = new Map();

    firstFourCategories.forEach(category => {
        const items = products
            .filter(product =>
                product.homepage_enabled === true &&
                String(product.category_id) === String(category.id) &&
                [1, 2, 3].includes(Number(product.homepage_slot))
            )
            .sort((a, b) => Number(a.homepage_slot) - Number(b.homepage_slot));

        selectedByCategory.set(String(category.id), items);
    });

    const mixed = [];

    for (let slot = 1; slot <= 3; slot++) {
        firstFourCategories.forEach(category => {
            const items = selectedByCategory.get(String(category.id)) || [];
            const product = items.find(item => Number(item.homepage_slot) === slot);
            if (product) mixed.push({ product, category });
        });
    }

    return { categories: firstFourCategories, mixed };
}


/* =============================================================
   FEATURED SECTION
============================================================= */

let currentStyleFilter = "all";
let currentSortFilter = "featured";

function getStyleOptions(products) {
    const set = new Set();
    products.forEach(p => {
        const s = String(p.style || "").trim();
        if (s) set.add(s);
    });
    return Array.from(set).sort();
}

function filterAndSort(products) {
    let result = [...products];

    if (currentStyleFilter !== "all") {
        result = result.filter(p => String(p.style || "") === currentStyleFilter);
    }

    if (currentSortFilter === "price-low") {
        result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (currentSortFilter === "price-high") {
        result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (currentSortFilter === "newest") {
        result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else {
        result.sort((a, b) => {
            const af = a.featured ? 1 : 0;
            const bf = b.featured ? 1 : 0;
            if (af !== bf) return bf - af;
            return Number(a.sort_order || 0) - Number(b.sort_order || 0);
        });
    }

    return result;
}


function renderFeaturedProducts(wrapper, selectedProducts) {

    const section = document.createElement("section");
    section.className = "everafter-home-section";

    const allProducts = selectedProducts.map(x => x.product);
    const styleOptions = getStyleOptions(allProducts);

    section.innerHTML = `
        <div class="container">

            <div class="everafter-home-section-heading">
                <div>
                    <p class="everafter-home-section-label">FEATURED INVITATIONS</p>
                    <h2 class="everafter-home-section-title">Handpicked For You</h2>
                    <p class="everafter-home-section-description">
                        Three selected designs from each collection, managed directly from the admin panel.
                    </p>
                </div>
            </div>

            <div class="dw-shop-bar">

                <label class="dw-shop-filter">
                    <svg class="dw-shop-filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                    </svg>
                    <select id="dwStyleFilter" aria-label="Filter by style">
                        <option value="all">All Styles</option>
                        ${styleOptions.map(s =>
                            `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`
                        ).join("")}
                    </select>
                    <span class="dw-shop-filter-chev">▾</span>
                </label>

                <label class="dw-shop-filter">
                    <svg class="dw-shop-filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2l2.9 6.9L22 9.7l-5.4 5.1L18 22l-6-3.6L6 22l1.4-7.2L2 9.7l7.1-.8z"/>
                    </svg>
                    <select id="dwSortFilter" aria-label="Sort products">
                        <option value="featured">Featured</option>
                        <option value="newest">Newest</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                    </select>
                    <span class="dw-shop-filter-chev">▾</span>
                </label>

            </div>

            <div class="dw-product-list" id="dwProductList"></div>

            <div class="everafter-home-notice" hidden></div>

        </div>
    `;

    const list = section.querySelector("#dwProductList");
    const notice = section.querySelector(".everafter-home-notice");
    const styleSelect = section.querySelector("#dwStyleFilter");
    const sortSelect = section.querySelector("#dwSortFilter");

    currentStyleFilter = "all";
    currentSortFilter = "featured";

    const render = () => {

        list.innerHTML = "";

        const filtered = filterAndSort(allProducts);

        if (!filtered.length) {
            list.innerHTML = `
                <div class="everafter-home-empty" style="grid-column: 1 / -1;">
                    <strong>No invitations match your filter</strong>
                    Try a different style or sort option.
                </div>
            `;
            return;
        }

        const productLookup = new Map();
        selectedProducts.forEach(({ product, category }) => {
            productLookup.set(String(product.id), category);
        });

        filtered.forEach(product => {
            const category = productLookup.get(String(product.id));
            list.appendChild(createProductCard(product, category));
        });
    };

    styleSelect?.addEventListener("change", () => {
        currentStyleFilter = styleSelect.value;
        render();
    });

    sortSelect?.addEventListener("change", () => {
        currentSortFilter = sortSelect.value;
        render();
    });

    render();

    if (allProducts.length < 12) {
        notice.hidden = false;
        notice.textContent =
            `The homepage currently has ${allProducts.length} of 12 ` +
            `featured products configured. Select Position 1, 2 and 3 ` +
            `for one product in each of the four main categories.`;
    }

    if (allProducts.length === 0) {
        notice.hidden = false;
        notice.textContent =
            "No homepage products are configured yet.";
    }

    wrapper.appendChild(section);
}


/* =============================================================
   EMPTY STATE
============================================================= */

function createEmptyState(message) {
    const section = document.createElement("section");
    section.className = "everafter-home-section";

    section.innerHTML = `
        <div class="container">
            <div class="everafter-home-empty">
                <strong>${escapeHtml(message)}</strong>
                Add published categories and products from the admin panel.
            </div>
        </div>
    `;

    return section;
}


/* =============================================================
   LOAD HOMEPAGE
============================================================= */

async function loadHomepageCatalog() {

    injectStyles();

    const target = document.getElementById("featured");

    if (!target) {
        console.error("Homepage catalog target #featured not found.");
        return;
    }

    target.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "everafter-homepage-catalog";
    target.appendChild(wrapper);

    try {

        const [categories, products] = await Promise.all([
            loadCategories(),
            loadProducts()
        ]);

        if (!categories.length) {
            wrapper.appendChild(createEmptyState("No collections available yet"));
            return;
        }

        renderCategories(wrapper, categories);

        const { mixed } = getSelectedHomepageProducts(categories, products);

        renderFeaturedProducts(wrapper, mixed);

    } catch (error) {

        console.error("Homepage catalog failed:", error);

        wrapper.innerHTML = "";
        wrapper.appendChild(createEmptyState("Collections could not be loaded"));
    }
}


if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadHomepageCatalog);
} else {
    loadHomepageCatalog();
}