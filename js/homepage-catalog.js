import {
    supabaseClient
} from "./supabase.js";


/* =============================================================
   EVERAFTER HOMEPAGE CATALOG
=============================================================

   HOMEPAGE STRUCTURE

   1. PREMIUM CATEGORY CARDS ONLY

      Luxury
      Affordable
      Traditional
      Modern

   2. SEPARATE FEATURED SECTION

      3 products from each category
      = 12 products total

   ADMIN CONTROLS

      homepage_enabled
      homepage_slot
      homepage_badge

============================================================= */


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


function normalizeArray(value) {

    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === "string") {

        try {

            const parsed =
                JSON.parse(value);

            if (Array.isArray(parsed)) {
                return parsed;
            }

        } catch (_) {}

        return value
            .split(",")
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);

    }

    return [];

}


function slugify(text) {

    return String(text || "")
        .toLowerCase()
        .trim()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            "");

}


function formatPrice(price) {

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {
        return "PKR 0";
    }

    const numeric =
        Number(price);

    if (
        Number.isNaN(numeric)
    ) {
        return `PKR ${price}`;
    }

    return `PKR ${numeric.toLocaleString("en-PK")}`;

}


function getImageUrl(value) {

    if (!value) {
        return "";
    }

    if (
        typeof value === "string"
    ) {
        return value;
    }

    if (
        typeof value === "object" &&
        value !== null
    ) {

        return (
            value.url ||
            value.image_url ||
            value.path ||
            value.publicUrl ||
            ""
        );

    }

    return "";

}


function getProductImage(product) {

    return (

        getImageUrl(
            product.main_image_url
        )

        ||

        getImageUrl(
            product.main_image
        )

        ||

        getImageUrl(
            product.image_url
        )

        ||

        getImageUrl(
            product.image
        )

        ||

        getImageUrl(
            product.thumbnail
        )

        ||

        ""

    );

}


function getCategoryImage(category) {

    return (

        getImageUrl(
            category.image
        )

        ||

        getImageUrl(
            category.image_url
        )

        ||

        getImageUrl(
            category.cover_image
        )

        ||

        getImageUrl(
            category.coverImage
        )

        ||

        getImageUrl(
            category.thumbnail
        )

        ||

        getImageUrl(
            category.hero_image
        )

        ||

        getImageUrl(
            category.banner_image
        )

        ||

        ""

    );

}


function getCategoryName(category) {

    return (
        category.name ||
        category.title ||
        category.label ||
        "Collection"
    );

}


function getCategorySlug(category) {

    return (
        category.slug ||
        slugify(
            getCategoryName(
                category
            )
        )
    );

}


function getProductName(product) {

    return (
        product.name ||
        product.title ||
        "Wedding Invitation"
    );

}


function getProductTags(product) {

    return normalizeArray(
        product.tags ||
        product.product_tags ||
        []
    )
        .map(
            tag =>
                String(tag).trim()
        )
        .filter(Boolean);

}


/* =============================================================
   VISIBILITY
============================================================= */

function isCategoryVisible(category) {

    if (

        category.active === false ||

        category.is_active === false ||

        category.published === false ||

        category.is_published === false

    ) {

        return false;

    }


    if (

        category.status &&

        ![
            "published",
            "active"
        ].includes(
            String(
                category.status
            ).toLowerCase()
        )

    ) {

        return false;

    }


    return true;

}


function isProductVisible(product) {

    if (
        product.archived === true
    ) {
        return false;
    }


    if (

        product.published === false ||

        product.is_published === false

    ) {
        return false;
    }


    if (

        product.status &&

        String(
            product.status
        ).toLowerCase() !==
        "published"

    ) {
        return false;
    }


    return true;

}


/* =============================================================
   HOMEPAGE BADGE
============================================================= */

function getBadge(product) {

    const customBadge =
        String(
            product.homepage_badge || ""
        ).trim();


    if (customBadge) {
        return customBadge;
    }


    const tags =
        getProductTags(
            product
        );


    const priorityBadges = [

        "Top Seller",
        "Top Selling",
        "Most Demanded",
        "Most Demanding",
        "Popular",
        "Trending",
        "New",
        "Editor's Pick",
        "Featured"

    ];


    for (
        const badgeName of
        priorityBadges
    ) {

        const match =
            tags.find(
                tag =>
                    tag.toLowerCase() ===
                    badgeName.toLowerCase()
            );


        if (match) {
            return match;
        }

    }


    if (
        product.popular === true
    ) {
        return "Popular";
    }


    if (
        product.featured === true
    ) {
        return "Featured";
    }


    return "";

}


/* =============================================================
   DYNAMIC STYLES
============================================================= */

function injectStyles() {

    if (
        document.getElementById(
            "everafter-home-catalog-styles"
        )
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "everafter-home-catalog-styles";


    style.textContent = `

        /* =====================================================
           HOMEPAGE
        ===================================================== */

        .everafter-homepage-catalog {

            background:
                var(
                    --ea-ivory,
                    #f8f5ef
                );

        }


        /* =====================================================
           SECTION
        ===================================================== */

        .everafter-home-section {

            padding:
                86px 0;

            border-top:
                1px solid
                var(
                    --ea-border,
                    #e6ded1
                );

        }


        .everafter-home-section:first-child {

            border-top:
                0;

        }


        /* =====================================================
           SECTION HEADING
        ===================================================== */

        .everafter-home-section-heading {

            display:
                flex;

            align-items:
                flex-end;

            justify-content:
                space-between;

            gap:
                30px;

            margin-bottom:
                34px;

        }


        .everafter-home-section-label {

            margin:
                0 0 10px;

            color:
                var(
                    --ea-gold-dark,
                    #8e7144
                );

            font-size:
                9px;

            font-weight:
                800;

            letter-spacing:
                3px;

            text-transform:
                uppercase;

        }


        .everafter-home-section-title {

            margin:
                0;

            color:
                var(
                    --ea-charcoal,
                    #1d1c1a
                );

            font:
                500
                clamp(
                    36px,
                    4vw,
                    57px
                )
                /
                1.02
                Georgia,
                "Times New Roman",
                serif;

            letter-spacing:
                -.5px;

        }


        .everafter-home-section-description {

            max-width:
                570px;

            margin:
                13px 0 0;

            color:
                var(
                    --ea-muted,
                    #756f67
                );

            font-size:
                12px;

            line-height:
                1.85;

        }


        .everafter-home-section-link {

            display:
                inline-flex;

            align-items:
                center;

            justify-content:
                center;

            min-height:
                43px;

            padding:
                0 19px;

            border:
                1px solid
                var(
                    --ea-border,
                    #e6ded1
                );

            border-radius:
                999px;

            background:
                #fff;

            color:
                var(
                    --ea-charcoal,
                    #1d1c1a
                );

            text-decoration:
                none;

            font-size:
                9px;

            font-weight:
                800;

            letter-spacing:
                .7px;

            white-space:
                nowrap;

            transition:
                transform .25s ease,
                background .25s ease,
                color .25s ease,
                border-color .25s ease;

        }


        .everafter-home-section-link:hover {

            transform:
                translateY(-2px);

            background:
                var(
                    --ea-charcoal,
                    #1d1c1a
                );

            border-color:
                var(
                    --ea-charcoal,
                    #1d1c1a
                );

            color:
                #fff;

        }


        /* =====================================================
           PREMIUM CATEGORY GRID
        ===================================================== */

        .everafter-home-category-grid {

            display:
                grid;

            grid-template-columns:
                repeat(
                    4,
                    minmax(0,1fr)
                );

            gap:
                15px;

        }


        /* =====================================================
           PREMIUM CATEGORY CARD
        ===================================================== */

        .everafter-home-category-card {

            position:
                relative;

            min-height:
                475px;

            display:
                flex;

            flex-direction:
                column;

            justify-content:
                flex-end;

            overflow:
                hidden;

            background:
                #201c18;

            color:
                #fff;

            text-decoration:
                none;

            border:
                1px solid
                rgba(
                    184,
                    154,
                    103,
                    .32
                );

            isolation:
                isolate;

            box-shadow:
                0 12px 35px
                rgba(
                    35,
                    28,
                    21,
                    .06
                );

            transition:
                transform .45s ease,
                border-color .45s ease,
                box-shadow .45s ease;

        }


        .everafter-home-category-card:hover {

            transform:
                translateY(-7px);

            border-color:
                rgba(
                    184,
                    154,
                    103,
                    .78
                );

            box-shadow:
                0 30px 70px
                rgba(
                    35,
                    28,
                    21,
                    .17
                );

        }


        /* =====================================================
           CATEGORY IMAGE
        ===================================================== */

        .everafter-home-category-card-image {

            position:
                absolute;

            inset:
                0;

            background:
                linear-gradient(
                    145deg,
                    #3a3128,
                    #191614
                )
                center /
                cover
                no-repeat;

            transform:
                scale(1.01);

            transition:
                transform 1s
                cubic-bezier(
                    .18,
                    .72,
                    .18,
                    1
                );

        }


        .everafter-home-category-card:hover
        .everafter-home-category-card-image {

            transform:
                scale(1.075);

        }


        /* =====================================================
           DARK PREMIUM OVERLAY
        ===================================================== */

        .everafter-home-category-card::before {

            content:
                "";

            position:
                absolute;

            inset:
                0;

            z-index:
                1;

            background:
                linear-gradient(
                    180deg,
                    rgba(
                        15,
                        12,
                        10,
                        .02
                    )
                    0%,

                    rgba(
                        15,
                        12,
                        10,
                        .12
                    )
                    30%,

                    rgba(
                        15,
                        12,
                        10,
                        .43
                    )
                    56%,

                    rgba(
                        15,
                        12,
                        10,
                        .95
                    )
                    100%
                );

        }


        /* =====================================================
           GOLD INNER FRAME
        ===================================================== */

        .everafter-home-category-card::after {

            content:
                "";

            position:
                absolute;

            inset:
                14px;

            z-index:
                2;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    .17
                );

            pointer-events:
                none;

            transition:
                border-color .4s ease;

        }


        .everafter-home-category-card:hover::after {

            border-color:
                rgba(
                    215,
                    188,
                    134,
                    .57
                );

        }


        /* =====================================================
           CATEGORY CONTENT
        ===================================================== */

        .everafter-home-category-card-content {

            position:
                relative;

            z-index:
                4;

            padding:
                35px 30px 31px;

        }


        /* =====================================================
           NUMBER
        ===================================================== */

        .everafter-home-category-number {

            display:
                block;

            margin:
                0 0 17px;

            color:
                rgba(
                    255,
                    255,
                    255,
                    .58
                );

            font-family:
                Georgia,
                "Times New Roman",
                serif;

            font-size:
                11px;

            letter-spacing:
                2px;

        }


        /* =====================================================
           LABEL
        ===================================================== */

        .everafter-home-category-card-label {

            margin:
                0 0 10px;

            color:
                #d6b97f;

            font-size:
                8px;

            font-weight:
                800;

            letter-spacing:
                3px;

            text-transform:
                uppercase;

        }


        /* =====================================================
           CATEGORY TITLE
        ===================================================== */

        .everafter-home-category-card-title {

            margin:
                0;

            color:
                #fffaf2;

            font:
                400
                clamp(
                    32px,
                    3vw,
                    44px
                )
                /
                1.02
                Georgia,
                "Times New Roman",
                serif;

            letter-spacing:
                -.5px;

        }


        /* =====================================================
           CATEGORY DESCRIPTION
        ===================================================== */

        .everafter-home-category-card-description {

            max-width:
                290px;

            margin:
                14px 0 22px;

            color:
                rgba(
                    255,
                    250,
                    242,
                    .78
                );

            font-size:
                11px;

            line-height:
                1.8;

            display:
                -webkit-box;

            -webkit-line-clamp:
                3;

            -webkit-box-orient:
                vertical;

            overflow:
                hidden;

        }


        /* =====================================================
           CATEGORY BUTTON
        ===================================================== */

        .everafter-home-category-card-button {

            display:
                inline-flex;

            align-items:
                center;

            justify-content:
                center;

            min-height:
                39px;

            padding:
                0 17px;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    .34
                );

            background:
                rgba(
                    255,
                    255,
                    255,
                    .06
                );

            color:
                #fffaf2;

            backdrop-filter:
                blur(
                    8px
                );

            font-size:
                8px;

            font-weight:
                800;

            letter-spacing:
                .9px;

            text-transform:
                uppercase;

            transition:
                background .3s ease,
                border-color .3s ease,
                color .3s ease;

        }


        .everafter-home-category-card:hover
        .everafter-home-category-card-button {

            background:
                #fffaf2;

            border-color:
                #fffaf2;

            color:
                #1d1c1a;

        }


        /* =====================================================
           FEATURED PRODUCTS
        ===================================================== */

        .everafter-home-featured-grid {

            display:
                grid;

            grid-template-columns:
                repeat(
                    4,
                    minmax(0,1fr)
                );

            gap:
                18px;

        }


        .everafter-home-product-card {

            position:
                relative;

            overflow:
                hidden;

            background:
                #fff;

            border:
                1px solid
                var(
                    --ea-border,
                    #e6ded1
                );

            transition:
                transform .24s ease,
                box-shadow .24s ease,
                border-color .24s ease;

        }


        .everafter-home-product-card:hover {

            transform:
                translateY(-5px);

            border-color:
                rgba(
                    184,
                    154,
                    103,
                    .55
                );

            box-shadow:
                0 18px 42px
                rgba(
                    40,
                    30,
                    20,
                    .10
                );

        }


        .everafter-home-product-image {

            position:
                relative;

            display:
                block;

            aspect-ratio:
                4 / 5;

            overflow:
                hidden;

            background:
                var(
                    --ea-cream,
                    #f1ebe1
                );

            text-decoration:
                none;

        }


        .everafter-home-product-image img {

            width:
                100%;

            height:
                100%;

            display:
                block;

            object-fit:
                cover;

            transition:
                transform .55s
                cubic-bezier(
                    .2,
                    .7,
                    .2,
                    1
                );

        }


        .everafter-home-product-card:hover
        .everafter-home-product-image img {

            transform:
                scale(1.045);

        }


        /* =====================================================
           PRODUCT BADGE
        ===================================================== */

        .everafter-home-product-badge {

            position:
                absolute;

            z-index:
                3;

            top:
                13px;

            left:
                13px;

            min-height:
                27px;

            padding:
                0 10px;

            display:
                inline-flex;

            align-items:
                center;

            justify-content:
                center;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    .45
                );

            background:
                rgba(
                    29,
                    28,
                    26,
                    .84
                );

            color:
                #fff;

            font-size:
                8px;

            font-weight:
                800;

            letter-spacing:
                .8px;

            text-transform:
                uppercase;

            backdrop-filter:
                blur(
                    7px
                );

        }


        /* =====================================================
           PRODUCT BODY
        ===================================================== */

        .everafter-home-product-body {

            padding:
                17px;

        }


        .everafter-home-product-category {

            margin:
                0 0 7px;

            color:
                var(
                    --ea-gold-dark,
                    #8e7144
                );

            font-size:
                8px;

            font-weight:
                800;

            letter-spacing:
                1.5px;

            text-transform:
                uppercase;

        }


        .everafter-home-product-title {

            margin:
                0;

            color:
                var(
                    --ea-charcoal,
                    #1d1c1a
                );

            font:
                500
                20px
                /
                1.2
                Georgia,
                "Times New Roman",
                serif;

        }


        .everafter-home-product-description {

            margin:
                9px 0 13px;

            color:
                var(
                    --ea-muted,
                    #756f67
                );

            font-size:
                10px;

            line-height:
                1.65;

            display:
                -webkit-box;

            -webkit-line-clamp:
                2;

            -webkit-box-orient:
                vertical;

            overflow:
                hidden;

        }


        .everafter-home-product-tags {

            display:
                flex;

            flex-wrap:
                wrap;

            gap:
                5px;

            margin-bottom:
                15px;

        }


        .everafter-home-product-tag {

            padding:
                5px 8px;

            background:
                #f6f0e7;

            color:
                var(
                    --ea-gold-dark,
                    #8e7144
                );

            font-size:
                7px;

            font-weight:
                800;

            letter-spacing:
                .3px;

        }


        .everafter-home-product-bottom {

            display:
                flex;

            align-items:
                center;

            justify-content:
                space-between;

            gap:
                10px;

        }


        .everafter-home-product-price {

            color:
                var(
                    --ea-charcoal,
                    #1d1c1a
                );

            font-size:
                12px;

            font-weight:
                800;

        }


        .everafter-home-product-button {

            display:
                inline-flex;

            align-items:
                center;

            justify-content:
                center;

            min-height:
                34px;

            padding:
                0 11px;

            border:
                1px solid
                var(
                    --ea-border,
                    #e6ded1
                );

            background:
                #fff;

            color:
                var(
                    --ea-charcoal,
                    #1d1c1a
                );

            text-decoration:
                none;

            font-size:
                8px;

            font-weight:
                800;

            white-space:
                nowrap;

            transition:
                background .2s ease,
                color .2s ease,
                border-color .2s ease;

        }


        .everafter-home-product-button:hover {

            background:
                var(
                    --ea-charcoal,
                    #1d1c1a
                );

            border-color:
                var(
                    --ea-charcoal,
                    #1d1c1a
                );

            color:
                #fff;

        }


        /* =====================================================
           NOTICE
        ===================================================== */

        .everafter-home-notice {

            margin-top:
                20px;

            padding:
                14px 16px;

            border:
                1px dashed
                var(
                    --ea-border,
                    #e6ded1
                );

            background:
                rgba(
                    255,
                    255,
                    255,
                    .5
                );

            color:
                var(
                    --ea-muted,
                    #756f67
                );

            font-size:
                10px;

            line-height:
                1.6;

        }


        /* =====================================================
           EMPTY
        ===================================================== */

        .everafter-home-empty {

            padding:
                55px 20px;

            border:
                1px dashed
                var(
                    --ea-border,
                    #e6ded1
                );

            background:
                #fff;

            color:
                var(
                    --ea-muted,
                    #756f67
                );

            text-align:
                center;

        }


        .everafter-home-empty strong {

            display:
                block;

            margin-bottom:
                7px;

            color:
                var(
                    --ea-charcoal,
                    #1d1c1a
                );

            font:
                500
                21px
                Georgia,
                "Times New Roman",
                serif;

        }


        /* =====================================================
           TABLET
        ===================================================== */

        @media (
            max-width: 1050px
        ) {

            .everafter-home-category-grid {

                grid-template-columns:
                    repeat(
                        2,
                        minmax(0,1fr)
                    );

            }


            .everafter-home-featured-grid {

                grid-template-columns:
                    repeat(
                        2,
                        minmax(0,1fr)
                    );

            }

        }


        /* =====================================================
           MOBILE
        ===================================================== */

        @media (
            max-width: 700px
        ) {

            .everafter-home-section {

                padding:
                    64px 0;

            }


            .everafter-home-section-heading {

                align-items:
                    flex-start;

                flex-direction:
                    column;

                gap:
                    18px;

            }


            .everafter-home-category-grid,
            .everafter-home-featured-grid {

                display:
                    flex;

                overflow-x:
                    auto;

                gap:
                    13px;

                padding:
                    2px
                    0
                    10px;

                scroll-snap-type:
                    x mandatory;

                scrollbar-width:
                    none;

            }


            .everafter-home-category-grid::-webkit-scrollbar,
            .everafter-home-featured-grid::-webkit-scrollbar {

                display:
                    none;

            }


            .everafter-home-category-card {

                flex:
                    0 0 78vw;

                max-width:
                    315px;

                min-height:
                    430px;

                scroll-snap-align:
                    start;

            }


            .everafter-home-category-card-content {

                padding:
                    32px 25px 27px;

            }


            .everafter-home-category-card-title {

                font-size:
                    34px;

            }


            .everafter-home-product-card {

                flex:
                    0 0 78vw;

                max-width:
                    285px;

                scroll-snap-align:
                    start;

            }

        }


        /* =====================================================
           SMALL MOBILE
        ===================================================== */

        @media (
            max-width: 480px
        ) {

            .everafter-home-category-card {

                min-height:
                    405px;

            }


            .everafter-home-category-card::after {

                inset:
                    11px;

            }


            .everafter-home-category-number {

                margin-bottom:
                    14px;

            }


            .everafter-home-category-card-content {

                padding:
                    28px 22px 24px;

            }


            .everafter-home-category-card-title {

                font-size:
                    31px;

            }


            .everafter-home-category-card-description {

                font-size:
                    10px;

            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* =============================================================
   LOAD CATEGORIES
============================================================= */

async function loadCategories() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("categories")
            .select("*");


    if (error) {
        throw error;
    }


    return (data || [])
        .filter(
            isCategoryVisible
        )
        .sort(
            (
                a,
                b
            ) =>

                Number(
                    a.sort_order ?? 0
                ) -

                Number(
                    b.sort_order ?? 0
                )
        );

}


/* =============================================================
   LOAD PRODUCTS
============================================================= */

async function loadProducts() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("products")
            .select("*")
            .eq(
                "archived",
                false
            );


    if (error) {
        throw error;
    }


    return (data || [])
        .filter(
            isProductVisible
        )
        .sort(
            (
                a,
                b
            ) =>

                Number(
                    a.sort_order ?? 0
                ) -

                Number(
                    b.sort_order ?? 0
                )
        );

}


/* =============================================================
   PREMIUM CATEGORY CARD
============================================================= */

function createCategoryCard(
    category,
    index = 0
) {

    const name =
        getCategoryName(
            category
        );


    const slug =
        getCategorySlug(
            category
        );


    const image =
        getCategoryImage(
            category
        );


    const description =
        category.description ||

        category.short_description ||

        `Explore our ${name.toLowerCase()} wedding invitation collection.`;


    const card =
        document.createElement(
            "a"
        );


    card.className =
        "everafter-home-category-card";


    card.href =
        `category.html?category=${encodeURIComponent(
            slug
        )}`;


    card.setAttribute(
        "aria-label",
        `View ${name} collection`
    );


    const imageLayer =
        document.createElement(
            "div"
        );


    imageLayer.className =
        "everafter-home-category-card-image";


    if (image) {

        imageLayer.style.backgroundImage =
            `url("${image.replaceAll(
                '"',
                "%22"
            )}")`;

    }


    card.appendChild(
        imageLayer
    );


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "everafter-home-category-card-content";


    const number =
        String(
            index + 1
        ).padStart(
            2,
            "0"
        );


    content.innerHTML = `

        <span
            class="everafter-home-category-number"
        >
            ${number}
        </span>


        <p
            class="everafter-home-category-card-label"
        >
            Collection
        </p>


        <h3
            class="everafter-home-category-card-title"
        >
            ${escapeHtml(
                name
            )}
        </h3>


        <p
            class="everafter-home-category-card-description"
        >
            ${escapeHtml(
                description
            )}
        </p>


        <span
            class="everafter-home-category-card-button"
        >
            Discover Collection →
        </span>

    `;


    card.appendChild(
        content
    );


    return card;

}


/* =============================================================
   PRODUCT CARD
============================================================= */

function createProductCard(
    product,
    category
) {

    const name =
        getProductName(
            product
        );


    const slug =
        product.slug ||
        slugify(
            name
        );


    const image =
        getProductImage(
            product
        );


    const description =
        product.short_description ||

        product.description ||

        "Elegant wedding invitation design.";


    const tags =
        getProductTags(
            product
        );


    const badge =
        getBadge(
            product
        );


    const categoryName =
        getCategoryName(
            category
        );


    const card =
        document.createElement(
            "article"
        );


    card.className =
        "everafter-home-product-card";


    const imageLink =
        document.createElement(
            "a"
        );


    imageLink.className =
        "everafter-home-product-image";


    imageLink.href =
        `invitation.html?slug=${encodeURIComponent(
            slug
        )}`;


    imageLink.setAttribute(
        "aria-label",
        `View ${name}`
    );


    if (badge) {

        const badgeElement =
            document.createElement(
                "span"
            );


        badgeElement.className =
            "everafter-home-product-badge";


        badgeElement.textContent =
            badge;


        imageLink.appendChild(
            badgeElement
        );

    }


    if (image) {

        const imageElement =
            document.createElement(
                "img"
            );


        imageElement.src =
            image;


        imageElement.alt =
            name;


        imageElement.loading =
            "lazy";


        imageLink.appendChild(
            imageElement
        );

    }

    else {

        imageLink.innerHTML += `

            <div
                style="
                    width:100%;
                    height:100%;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    text-align:center;
                    padding:20px;
                    background:#f1ebe1;
                    color:#8e7144;
                    font-family:Georgia,serif;
                    font-size:21px;
                "
            >
                ${escapeHtml(
                    name
                )}
            </div>

        `;

    }


    card.appendChild(
        imageLink
    );


    const body =
        document.createElement(
            "div"
        );


    body.className =
        "everafter-home-product-body";


    const tagsHtml =
        tags
            .slice(
                0,
                4
            )
            .map(
                tag => `

                    <span
                        class="everafter-home-product-tag"
                    >
                        ${escapeHtml(
                            tag
                        )}
                    </span>

                `
            )
            .join("");


    body.innerHTML = `

        <p
            class="everafter-home-product-category"
        >
            ${escapeHtml(
                categoryName
            )}
        </p>


        <h3
            class="everafter-home-product-title"
        >
            ${escapeHtml(
                name
            )}
        </h3>


        <p
            class="everafter-home-product-description"
        >
            ${escapeHtml(
                description
            )}
        </p>


        ${
            tagsHtml
                ? `

                    <div
                        class="everafter-home-product-tags"
                    >
                        ${tagsHtml}
                    </div>

                `
                : ""
        }


        <div
            class="everafter-home-product-bottom"
        >

            <span
                class="everafter-home-product-price"
            >
                ${formatPrice(
                    product.price
                )}
            </span>


            <a
                href="invitation.html?slug=${encodeURIComponent(
                    slug
                )}"
                class="everafter-home-product-button"
            >
                View Design →
            </a>

        </div>

    `;


    card.appendChild(
        body
    );


    return card;

}


/* =============================================================
   RENDER CATEGORY SECTION
============================================================= */

function renderCategories(
    wrapper,
    categories
) {

    const section =
        document.createElement(
            "section"
        );


    section.className =
        "everafter-home-section";


    section.innerHTML = `

        <div class="container">

            <div
                class="everafter-home-section-heading"
            >

                <div>

                    <p
                        class="everafter-home-section-label"
                    >
                        THE COLLECTIONS
                    </p>


                    <h2
                        class="everafter-home-section-title"
                    >
                        Wedding Invitations
                    </h2>


                    <p
                        class="everafter-home-section-description"
                    >
                        Four distinct collections,
                        thoughtfully designed for
                        every kind of celebration.
                    </p>

                </div>


                <a
                    href="category.html?category=all"
                    class="everafter-home-section-link"
                >
                    Explore All →
                </a>

            </div>


            <div
                class="everafter-home-category-grid"
            ></div>

        </div>

    `;


    const grid =
        section.querySelector(
            ".everafter-home-category-grid"
        );


    categories
        .slice(
            0,
            4
        )
        .forEach(
            (
                category,
                index
            ) => {

                grid.appendChild(
                    createCategoryCard(
                        category,
                        index
                    )
                );

            }
        );


    wrapper.appendChild(
        section
    );

}


/* =============================================================
   GET HOMEPAGE PRODUCTS
============================================================= */

function getSelectedHomepageProducts(
    categories,
    products
) {

    const firstFourCategories =
        categories.slice(
            0,
            4
        );


    const selectedByCategory =
        new Map();


    firstFourCategories.forEach(
        category => {

            const items =
                products
                    .filter(
                        product =>

                            product.homepage_enabled === true &&

                            String(
                                product.category_id
                            ) ===
                            String(
                                category.id
                            ) &&

                            [
                                1,
                                2,
                                3
                            ].includes(
                                Number(
                                    product.homepage_slot
                                )
                            )
                    )
                    .sort(
                        (
                            a,
                            b
                        ) =>

                            Number(
                                a.homepage_slot
                            ) -

                            Number(
                                b.homepage_slot
                            )
                    );


            selectedByCategory.set(
                String(
                    category.id
                ),
                items
            );

        }
    );


    const mixed = [];


    /*
        MIX ORDER

        Category 1 slot 1
        Category 2 slot 1
        Category 3 slot 1
        Category 4 slot 1

        Category 1 slot 2
        Category 2 slot 2
        Category 3 slot 2
        Category 4 slot 2

        Category 1 slot 3
        Category 2 slot 3
        Category 3 slot 3
        Category 4 slot 3
    */


    for (
        let slot = 1;
        slot <= 3;
        slot++
    ) {

        firstFourCategories.forEach(
            category => {

                const categoryProducts =
                    selectedByCategory.get(
                        String(
                            category.id
                        )
                    ) || [];


                const product =
                    categoryProducts.find(
                        item =>
                            Number(
                                item.homepage_slot
                            ) ===
                            slot
                    );


                if (!product) {
                    return;
                }


                mixed.push({
                    product,
                    category
                });

            }
        );

    }


    return {
        categories:
            firstFourCategories,

        mixed
    };

}


/* =============================================================
   FEATURED SECTION
============================================================= */

function renderFeaturedProducts(
    wrapper,
    selectedProducts
) {

    const section =
        document.createElement(
            "section"
        );


    section.className =
        "everafter-home-section";


    section.innerHTML = `

        <div class="container">

            <div
                class="everafter-home-section-heading"
            >

                <div>

                    <p
                        class="everafter-home-section-label"
                    >
                        FEATURED INVITATIONS
                    </p>


                    <h2
                        class="everafter-home-section-title"
                    >
                        Handpicked For You
                    </h2>


                    <p
                        class="everafter-home-section-description"
                    >
                        Three selected designs from
                        each collection, managed directly
                        from the admin panel.
                    </p>

                </div>

            </div>


            <div
                class="everafter-home-featured-grid"
            ></div>


            <div
                class="everafter-home-notice"
                hidden
            ></div>

        </div>

    `;


    const grid =
        section.querySelector(
            ".everafter-home-featured-grid"
        );


    const notice =
        section.querySelector(
            ".everafter-home-notice"
        );


    selectedProducts.forEach(
        ({
            product,
            category
        }) => {

            grid.appendChild(
                createProductCard(
                    product,
                    category
                )
            );

        }
    );


    if (
        selectedProducts.length <
        12
    ) {

        notice.hidden =
            false;


        notice.textContent =

            `The homepage currently has ` +

            `${selectedProducts.length} of 12 ` +

            `featured products configured. ` +

            `Select Position 1, 2 and 3 for one ` +

            `product in each of the four main categories.`;

    }


    if (
        selectedProducts.length ===
        0
    ) {

        notice.hidden =
            false;


        notice.textContent =

            "No homepage products are configured yet. " +

            "Open a product in the admin panel, " +

            "turn on Show on Homepage, and select " +

            "Position 1, 2 or 3.";

    }


    wrapper.appendChild(
        section
    );

}


/* =============================================================
   EMPTY STATE
============================================================= */

function createEmptyState(
    message
) {

    const section =
        document.createElement(
            "section"
        );


    section.className =
        "everafter-home-section";


    section.innerHTML = `

        <div class="container">

            <div
                class="everafter-home-empty"
            >

                <strong>
                    ${escapeHtml(
                        message
                    )}
                </strong>

                Add published categories
                and products from the admin panel.

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


    const target =
        document.getElementById(
            "featured"
        );


    if (!target) {

        console.error(
            "Homepage catalog target #featured not found."
        );

        return;

    }


    target.innerHTML =
        "";


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "everafter-homepage-catalog";


    target.appendChild(
        wrapper
    );


    try {

        const [
            categories,
            products
        ] =
            await Promise.all([
                loadCategories(),
                loadProducts()
            ]);


        if (
            !categories.length
        ) {

            wrapper.appendChild(
                createEmptyState(
                    "No collections available yet"
                )
            );

            return;

        }


        /* =====================================================
           SECTION 1
           CATEGORIES ONLY
        ===================================================== */

        renderCategories(
            wrapper,
            categories
        );


        /* =====================================================
           SECTION 2
           MIXED 12 PRODUCTS
        ===================================================== */

        const {
            mixed
        } =
            getSelectedHomepageProducts(
                categories,
                products
            );


        renderFeaturedProducts(
            wrapper,
            mixed
        );


        /* =====================================================
           DEBUG
        ===================================================== */

        console.log(
            "EverAfter homepage categories:",
            categories.map(
                category => ({
                    id:
                        category.id,

                    name:
                        getCategoryName(
                            category
                        )
                })
            )
        );


        console.log(
            "EverAfter homepage featured products:",
            mixed.map(
                ({
                    product,
                    category
                }) => ({

                    product:
                        getProductName(
                            product
                        ),

                    category:
                        getCategoryName(
                            category
                        ),

                    slot:
                        product.homepage_slot,

                    badge:
                        product.homepage_badge

                })
            )
        );

    }


    catch (error) {

        console.error(
            "Homepage catalog failed:",
            error
        );


        wrapper.innerHTML =
            "";


        wrapper.appendChild(
            createEmptyState(
                "Collections could not be loaded"
            )
        );

    }

}


/* =============================================================
   COMPACT BUTTONS
============================================================= */

function fixHomepageButtons() {

    const main =
        document.querySelector(
            "main"
        );


    if (!main) {
        return;
    }


    const compactTexts = [

        "Explore Designs",
        "View Collections",
        "View All",
        "View Collection",
        "View Collection →",
        "View Design",
        "View Design →",
        "Explore Luxury",
        "Browse Invitations",
        "Explore All",
        "Discover Collection →"

    ];


    main
        .querySelectorAll(
            "a,button"
        )
        .forEach(
            element => {

                const text =
                    element.textContent
                        .replace(
                            /\s+/g,
                            " "
                        )
                        .trim();


                const matched =
                    compactTexts.some(
                        label =>

                            text ===
                                label ||

                            text.startsWith(
                                label
                            )
                    );


                if (!matched) {
                    return;
                }


                element.style.setProperty(
                    "width",
                    "fit-content",
                    "important"
                );


                element.style.setProperty(
                    "min-width",
                    "0",
                    "important"
                );


                element.style.setProperty(
                    "max-width",
                    "max-content",
                    "important"
                );


                element.style.setProperty(
                    "flex",
                    "0 0 auto",
                    "important"
                );


                element.style.setProperty(
                    "white-space",
                    "nowrap",
                    "important"
                );

            }
        );

}


/* =============================================================
   START
============================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        loadHomepageCatalog
    );

}

else {

    loadHomepageCatalog();

}


fixHomepageButtons();


if (document.body) {

    const homepageObserver =
        new MutationObserver(
            fixHomepageButtons
        );


    homepageObserver.observe(
        document.body,
        {
            childList:
                true,

            subtree:
                true
        }
    );

}