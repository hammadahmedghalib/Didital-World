import { supabaseClient } from "./supabase.js";


// ================================================================
// STATE
// ================================================================

let currentProduct = null;
let selectedVariant = null;


// ================================================================
// HELPERS
// ================================================================

function getProductSlug() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return (
        params.get("slug") ||
        params.get("product") ||
        ""
    ).trim();
}


function formatPrice(price) {

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {
        return "PKR 0";
    }

    const numericPrice =
        Number(price);

    if (Number.isNaN(numericPrice)) {
        return `PKR ${price}`;
    }

    return `PKR ${numericPrice.toLocaleString("en-PK")}`;
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

        } catch (error) {
            // Continue below.
        }


        return value
            .split(",")
            .map(item => item.trim())
            .filter(Boolean);
    }


    return [];
}


function getImageUrl(value) {

    if (!value) {
        return "";
    }


    if (typeof value === "string") {
        return value;
    }


    if (typeof value === "object") {

        return (
            value.url ||
            value.path ||
            value.image_url ||
            value.publicUrl ||
            ""
        );
    }


    return "";
}


function getProductImage(product) {

    return (
        getImageUrl(product.main_image) ||
        getImageUrl(product.main_image_url) ||
        getImageUrl(product.image_url) ||
        getImageUrl(product.image) ||
        getImageUrl(product.thumbnail) ||
        ""
    );
}


function getProductGallery(product) {

    const gallery =
        normalizeArray(
            product.gallery_images ||
            product.gallery ||
            product.images ||
            []
        );


    return gallery
        .map(getImageUrl)
        .filter(Boolean);
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


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function getCategoryName(product) {

    const category =
        product.category_name ||
        product.category ||
        product.category_title ||
        "";


    if (
        typeof category === "object" &&
        category !== null
    ) {

        return (
            category.name ||
            category.title ||
            category.slug ||
            "Collection"
        );
    }


    return (
        String(category).trim() ||
        "Collection"
    );
}


function getProductTags(product) {

    return normalizeArray(
        product.tags ||
        product.product_tags ||
        []
    );
}


function getEventTypes(product) {

    return normalizeArray(
        product.event_types ||
        product.eventTypes ||
        product.events ||
        []
    );
}


function getVariants(product) {

    const raw =
        product.variants;


    if (!raw) {
        return [];
    }


    let items = [];


    if (Array.isArray(raw)) {

        items = raw;

    } else if (
        typeof raw === "string"
    ) {

        try {

            const parsed =
                JSON.parse(raw);

            if (Array.isArray(parsed)) {
                items = parsed;
            }

        } catch (error) {

            console.error(
                "Could not parse product variants:",
                error
            );

        }
    }


    return items
        .filter(Boolean)
        .map((variant, index) => ({

            id:
                variant.id ||
                `variant-${index + 1}`,

            name:
                variant.name ||
                variant.title ||
                `Design ${index + 1}`,

            colorName:
                variant.colorName ||
                variant.color_name ||
                "",

            colorHex:
                /^#[0-9a-fA-F]{6}$/.test(
                    variant.colorHex ||
                    variant.color_hex ||
                    ""
                )
                    ? (
                        variant.colorHex ||
                        variant.color_hex
                    )
                    : "#b89a67",

            price:
                variant.price === "" ||
                variant.price === undefined
                    ? null
                    : variant.price,

            images:
                normalizeArray(
                    variant.images ||
                    variant.gallery ||
                    variant.gallery_images ||
                    []
                )
                    .map(getImageUrl)
                    .filter(Boolean),

            active:
                variant.active !== false

        }))
        .filter(
            variant => variant.active
        );
}


// ================================================================
// CREATE / INSERT DYNAMIC DETAILS BLOCK
// ================================================================

function getDynamicInsertPoint() {

    const actionArea =
        document.querySelector(
            ".product-actions, .invitation-actions"
        );


    if (actionArea) {
        return {
            parent: actionArea.parentElement,
            before: actionArea
        };
    }


    const description =
        document.getElementById(
            "productDescription"
        );


    if (
        description &&
        description.parentElement
    ) {
        return {
            parent: description.parentElement,
            before: null
        };
    }


    const info =
        document.querySelector(
            ".product-information, .product-info, .invitation-info"
        );


    if (info) {
        return {
            parent: info,
            before: null
        };
    }


    return null;
}


function getOrCreateDynamicDetails() {

    let block =
        document.getElementById(
            "everafterProductExtra"
        );


    if (block) {
        return block;
    }


    const insertPoint =
        getDynamicInsertPoint();


    if (!insertPoint) {
        return null;
    }


    block =
        document.createElement("section");


    block.id =
        "everafterProductExtra";


    block.className =
        "everafter-product-extra";


    if (insertPoint.before) {

        insertPoint.parent.insertBefore(
            block,
            insertPoint.before
        );

    } else {

        insertPoint.parent.appendChild(
            block
        );
    }


    return block;
}


// ================================================================
// LOAD CATEGORY NAME IF PRODUCT ONLY HAS CATEGORY ID
// ================================================================

async function resolveCategoryName(
    product
) {

    const currentName =
        getCategoryName(product);


    if (
        currentName !== "Collection"
    ) {
        return currentName;
    }


    const categoryId =
        product.category_id ||
        product.categoryId;


    if (!categoryId) {
        return currentName;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("categories")
            .select("name, slug")
            .eq("id", categoryId)
            .maybeSingle();


        if (
            !error &&
            data
        ) {

            return (
                data.name ||
                data.slug ||
                currentName
            );
        }

    } catch (error) {

        console.error(
            "Category lookup error:",
            error
        );

    }


    return currentName;
}


// ================================================================
// UPDATE MAIN IMAGE + GALLERY
// ================================================================

function renderGallery(
    imageList,
    productName
) {

    const mainProductImage =
        document.getElementById(
            "mainProductImage"
        );


    const thumbnailContainer =
        document.getElementById(
            "productThumbnails"
        );


    if (!mainProductImage) {
        return;
    }


    const images =
        imageList
            .filter(Boolean)
            .filter(
                (
                    image,
                    index,
                    array
                ) =>
                    array.indexOf(image) ===
                    index
            );


    if (!images.length) {

        mainProductImage.removeAttribute(
            "src"
        );

        mainProductImage.alt =
            productName;

        if (thumbnailContainer) {
            thumbnailContainer.innerHTML = "";
        }

        return;
    }


    mainProductImage.src =
        images[0];

    mainProductImage.alt =
        productName;

    mainProductImage.style.display =
        "block";


    if (!thumbnailContainer) {
        return;
    }


    thumbnailContainer.innerHTML =
        "";


    images.forEach(
        (
            imageUrl,
            index
        ) => {

            const thumbnail =
                document.createElement(
                    "button"
                );


            thumbnail.type =
                "button";


            thumbnail.className =
                "product-thumbnail";


            thumbnail.innerHTML = `
                <img
                    src="${escapeHtml(imageUrl)}"
                    alt="${escapeHtml(
                        productName
                    )} preview ${index + 1}"
                    loading="lazy"
                >
            `;


            thumbnail.addEventListener(
                "click",
                () => {

                    mainProductImage.src =
                        imageUrl;

                    mainProductImage.alt =
                        productName;


                    thumbnailContainer
                        .querySelectorAll(
                            ".product-thumbnail"
                        )
                        .forEach(
                            button =>
                                button.classList
                                    .remove(
                                        "active"
                                    )
                        );


                    thumbnail.classList.add(
                        "active"
                    );

                }
            );


            if (index === 0) {

                thumbnail.classList.add(
                    "active"
                );

            }


            thumbnailContainer.appendChild(
                thumbnail
            );

        }
    );
}


// ================================================================
// UPDATE ORDER BUTTON
// ================================================================

function updateOrderButton(
    productSlug,
    variant = null
) {

    const orderButton =
        document.getElementById(
            "orderButton"
        );


    if (!orderButton) {
        return;
    }


    let url =
        `order.html?slug=${encodeURIComponent(
            productSlug
        )}`;


    if (variant) {

        url +=
            `&variant=${encodeURIComponent(
                variant.id
            )}`;

        sessionStorage.setItem(
            "selectedInvitationVariant",
            JSON.stringify({
                productSlug,
                variant
            })
        );

    }


    orderButton.href =
        url;
}


// ================================================================
// RENDER EXTRA DETAILS
// ================================================================

function renderExtraDetails(
    product,
    categoryName,
    productSlug,
    basePrice
) {

    const block =
        getOrCreateDynamicDetails();


    if (!block) {
        return;
    }


    const style =
        product.style ||
        product.design_style ||
        product.product_style ||
        "";


    const tags =
        getProductTags(
            product
        );


    const eventTypes =
        getEventTypes(
            product
        );


    const variants =
        getVariants(
            product
        );


    let html = "";


    html += `

        <h2 class="everafter-product-extra-heading">

            Design Details

        </h2>

    `;


    const hasDetails =
        style ||
        eventTypes.length ||
        tags.length;


    if (hasDetails) {

        html += `
            <div class="everafter-detail-grid">
        `;


        if (style) {

            html += `

                <div class="everafter-detail-item">

                    <span class="everafter-detail-label">
                        Style
                    </span>

                    <span class="everafter-detail-value">
                        ${escapeHtml(style)}
                    </span>

                </div>

            `;
        }


        if (eventTypes.length) {

            html += `

                <div class="everafter-detail-item">

                    <span class="everafter-detail-label">
                        Event Types
                    </span>

                    <span class="everafter-detail-value">
                        ${escapeHtml(
                            eventTypes.join(", ")
                        )}
                    </span>

                </div>

            `;
        }


        html += `

            <div class="everafter-detail-item">

                <span class="everafter-detail-label">
                    Collection
                </span>

                <span class="everafter-detail-value">
                    ${escapeHtml(categoryName)}
                </span>

            </div>

        `;


        html += `
            </div>
        `;


        if (tags.length) {

            html += `

                <span class="everafter-detail-label">
                    Tags
                </span>

                <div class="everafter-tags">

            `;


            tags.forEach(tag => {

                html += `

                    <span class="everafter-tag">
                        ${escapeHtml(tag)}
                    </span>

                `;

            });


            html += `
                </div>
            `;
        }

    } else {

        html += `

            <div class="everafter-detail-item">

                <span class="everafter-detail-label">
                    Collection
                </span>

                <span class="everafter-detail-value">
                    ${escapeHtml(categoryName)}
                </span>

            </div>

        `;

    }


    // ==========================================================
    // VARIATIONS
    // ==========================================================

    if (variants.length) {

        html += `

            <div class="everafter-variants">

                <h3 class="everafter-variants-heading">
                    Choose a Design
                </h3>


                <div class="everafter-variant-list">

        `;


        variants.forEach(
            (variant, index) => {

                const displayPrice =
                    variant.price !== null &&
                    variant.price !== undefined
                        ? formatPrice(
                            variant.price
                        )
                        : formatPrice(
                            basePrice
                        );


                html += `

                    <button
                        type="button"
                        class="everafter-variant-button ${
                            index === 0
                                ? "active"
                                : ""
                        }"
                        data-variant-id="${escapeHtml(
                            variant.id
                        )}"
                    >

                        <span
                            class="everafter-variant-dot"
                            style="background:${
                                escapeHtml(
                                    variant.colorHex
                                )
                            };"
                        ></span>


                        <span>
                            ${escapeHtml(
                                variant.name
                            )}
                        </span>


                        ${
                            variant.colorName
                                ? `
                                    <span>
                                        ${
                                            escapeHtml(
                                                variant.colorName
                                            )
                                        }
                                    </span>
                                  `
                                : ""
                        }


                        <span
                            class="everafter-variant-price"
                        >
                            ${displayPrice}
                        </span>

                    </button>

                `;

            }
        );


        html += `

                </div>


                <p class="everafter-variant-note">
                    Select a design variation to view
                    its images and price.
                </p>

            </div>

        `;

    }


    block.innerHTML =
        html;


    // ==========================================================
    // VARIANT EVENTS
    // ==========================================================

    if (variants.length) {

        const variantButtons =
            block.querySelectorAll(
                ".everafter-variant-button"
            );


        variantButtons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const variantId =
                            button.dataset.variantId;


                        const variant =
                            variants.find(
                                item =>
                                    String(
                                        item.id
                                    ) ===
                                    String(
                                        variantId
                                    )
                            );


                        if (!variant) {
                            return;
                        }


                        selectedVariant =
                            variant;


                        variantButtons.forEach(
                            item =>
                                item.classList
                                    .remove(
                                        "active"
                                    )
                        );


                        button.classList.add(
                            "active"
                        );


                        const variantImages =
                            variant.images.length
                                ? variant.images
                                : [
                                    getProductImage(
                                        product
                                    ),
                                    ...getProductGallery(
                                        product
                                    )
                                ];


                        renderGallery(
                            variantImages,
                            product.name ||
                            "Wedding Invitation"
                        );


                        const productPrice =
                            document.getElementById(
                                "productPrice"
                            );


                        if (productPrice) {

                            productPrice.textContent =
                                formatPrice(
                                    variant.price !==
                                    null &&
                                    variant.price !==
                                    undefined
                                        ? variant.price
                                        : basePrice
                                );

                        }


                        updateOrderButton(
                            productSlug,
                            variant
                        );

                    }
                );

            }
        );


        // Select first variation automatically.
        if (variants[0]) {

            selectedVariant =
                variants[0];


            const firstVariantImages =
                variants[0].images.length
                    ? variants[0].images
                    : [
                        getProductImage(
                            product
                        ),
                        ...getProductGallery(
                            product
                        )
                    ];


            renderGallery(
                firstVariantImages,
                product.name ||
                "Wedding Invitation"
            );


            const initialPrice =
                variants[0].price !== null &&
                variants[0].price !== undefined
                    ? variants[0].price
                    : basePrice;


            const productPrice =
                document.getElementById(
                    "productPrice"
                );


            if (productPrice) {

                productPrice.textContent =
                    formatPrice(
                        initialPrice
                    );

            }


            updateOrderButton(
                productSlug,
                variants[0]
            );

        }

    }
}


// ================================================================
// LOAD PRODUCT
// ================================================================

async function loadProduct() {

    const slug =
        getProductSlug();


    if (!slug) {

        showNotFound();

        return;
    }


    let product =
        null;


    let firstError =
        null;


    const publishedQuery =
        await supabaseClient
            .from("products")
            .select("*")
            .eq("slug", slug)
            .eq("published", true)
            .limit(1);


    if (publishedQuery.error) {

        firstError =
            publishedQuery.error;

    }


    if (
        !publishedQuery.error &&
        publishedQuery.data &&
        publishedQuery.data.length > 0
    ) {

        product =
            publishedQuery.data[0];

    } else {

        const fallbackQuery =
            await supabaseClient
                .from("products")
                .select("*")
                .eq("slug", slug)
                .limit(1);


        if (fallbackQuery.error) {

            console.error(
                "Product query failed:",
                fallbackQuery.error
            );


            if (firstError) {

                console.error(
                    "Published query error:",
                    firstError
                );

            }


            showNotFound();

            return;
        }


        if (
            fallbackQuery.data &&
            fallbackQuery.data.length > 0
        ) {

            product =
                fallbackQuery.data[0];

        }

    }


    if (!product) {

        console.warn(
            "No product found for slug:",
            slug
        );

        showNotFound();

        return;
    }


    if (
        product.published === false ||
        product.is_published === false
    ) {

        showNotFound();

        return;
    }


    currentProduct =
        product;


    await renderProduct(
        product
    );
}


// ================================================================
// RENDER PRODUCT
// ================================================================

async function renderProduct(
    product
) {

    const name =
        product.name ||
        product.title ||
        "Wedding Invitation";


    const slug =
        product.slug ||
        slugify(name);


    const categoryName =
        await resolveCategoryName(
            product
        );


    const price =
        product.price ??
        0;


    const shortDescription =
        product.short_description ||
        product.description ||
        "";


    const longDescription =
        product.long_description ||
        product.full_description ||
        product.description ||
        "";


    const mainImage =
        getProductImage(
            product
        );


    const galleryImages =
        getProductGallery(
            product
        );


    const features =
        normalizeArray(
            product.features
        );


    const demoUrl =
        product.demo_url ||
        product.preview_url ||
        product.demo ||
        "";


    const variants =
        getVariants(
            product
        );


    // ============================================================
    // TITLE / META
    // ============================================================

    document.title =
        `${name} | Digital World`;


    const metaDescription =
        document.getElementById(
            "productMetaDescription"
        );


    if (metaDescription) {

        metaDescription.setAttribute(
            "content",
            shortDescription ||
            `View ${name}, an elegant wedding invitation from Digital World Printing Press.`
        );

    }


    // ============================================================
    // BASIC INFO
    // ============================================================

    const productName =
        document.getElementById(
            "productName"
        );


    if (productName) {
        productName.textContent =
            name;
    }


    const productCategory =
        document.getElementById(
            "productCategory"
        );


    if (productCategory) {

        productCategory.textContent =
            String(
                categoryName
            ).toUpperCase();

    }


    const productPrice =
        document.getElementById(
            "productPrice"
        );


    if (productPrice) {

        productPrice.textContent =
            formatPrice(
                price
            );

    }


    const productDescription =
        document.getElementById(
            "productDescription"
        );


    if (productDescription) {

        productDescription.textContent =
            shortDescription;

    }


    const productLongDescription =
        document.getElementById(
            "productLongDescription"
        );


    if (productLongDescription) {

        productLongDescription.textContent =
            longDescription;

    }


    // ============================================================
    // BREADCRUMB
    // ============================================================

    const breadcrumbProduct =
        document.getElementById(
            "breadcrumbProduct"
        );


    if (breadcrumbProduct) {

        breadcrumbProduct.textContent =
            name;

    }


    const breadcrumbCategory =
        document.getElementById(
            "breadcrumbCategory"
        );


    if (breadcrumbCategory) {

        const categorySlug =
            slugify(
                categoryName
            );


        breadcrumbCategory.textContent =
            categoryName;


        breadcrumbCategory.href =
            `category.html?category=${encodeURIComponent(
                categorySlug
            )}`;

    }


    // ============================================================
    // DEFAULT GALLERY
    // ============================================================

    renderGallery(
        [
            mainImage,
            ...galleryImages
        ],
        name
    );


    // ============================================================
    // FEATURES
    // ============================================================

    const featureContainer =
        document.getElementById(
            "productFeatures"
        );


    if (featureContainer) {

        featureContainer.innerHTML =
            "";


        if (!features.length) {

            featureContainer.innerHTML = `

                <li>
                    Elegant premium design
                </li>

                <li>
                    Personalized wedding details
                </li>

                <li>
                    Mobile friendly invitation
                </li>

            `;

        } else {

            features.forEach(
                feature => {

                    const li =
                        document.createElement(
                            "li"
                        );


                    li.textContent =
                        String(
                            feature
                        );


                    featureContainer.appendChild(
                        li
                    );

                }
            );

        }

    }


    // ============================================================
    // EXTRA DETAILS + VARIATIONS
    // ============================================================

    renderExtraDetails(
        product,
        categoryName,
        slug,
        price
    );


    // ============================================================
    // ORDER BUTTON
    // ============================================================

    updateOrderButton(
        slug,
        variants[0] || null
    );


    // ============================================================
    // DEMO
    // ============================================================

    const demoButton =
        document.getElementById(
            "demoButton"
        );


    if (demoButton) {

        if (demoUrl) {

            demoButton.href =
                demoUrl;

            demoButton.target =
                "_blank";

            demoButton.rel =
                "noopener noreferrer";

            demoButton.style.display =
                "inline-flex";

        } else {

            demoButton.style.display =
                "none";

        }

    }


    // ============================================================
    // WHATSAPP
    // ============================================================

    const whatsappButton =
        document.getElementById(
            "whatsappProductButton"
        );


    if (whatsappButton) {

        const message =
            `Hello, I am interested in the "${name}" wedding invitation.`;


        whatsappButton.href =
            `https://wa.me/923005050947?text=${encodeURIComponent(
                message
            )}`;

    }


    // ============================================================
    // RELATED
    // ============================================================

    loadRelatedProducts(
        product,
        categoryName,
        slug
    );
}


// ================================================================
// RELATED PRODUCTS — rich card markup
// ================================================================

async function loadRelatedProducts(
    currentProduct,
    categoryName,
    currentSlug
) {

    const container =
        document.getElementById(
            "relatedProducts"
        );


    if (!container) {
        return;
    }


    try {

        let query =
            supabaseClient
                .from("products")
                .select("*")
                .eq("published", true)
                .neq("slug", currentSlug)
                .limit(4);


        const categoryValue =
            currentProduct.category;


        if (
            categoryValue &&
            typeof categoryValue === "string"
        ) {

            query =
                query.eq(
                    "category",
                    categoryValue
                );

        }


        const {
            data,
            error
        } =
            await query;


        if (error) {

            console.error(
                "Related products error:",
                error
            );

            return;
        }


        if (
            !data ||
            data.length === 0
        ) {

            container.innerHTML = "";

            return;
        }


        container.innerHTML =
            "";


        /* Feature trio used on every card */

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


        data.forEach(product => {

            const name =
                product.name ||
                product.title ||
                "Wedding Invitation";


            const slug =
                product.slug ||
                slugify(name);


            const image =
                getProductImage(
                    product
                );


            const description =
                product.short_description ||
                product.description ||
                "A perfect blend of tradition and elegance.";


            const badge =
                product.featured
                    ? "Featured"
                    : product.popular
                        ? "Popular"
                        : "";


            const relatedCategoryName =
                product.categories?.name ||
                categoryName ||
                "Invitation";


            const href =
                `invitation.html?slug=${encodeURIComponent(slug)}`;


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

                    <p class="dw-product-cat">${escapeHtml(relatedCategoryName)}</p>

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


            container.appendChild(card);

        });


    } catch (error) {

        console.error(
            "Related products exception:",
            error
        );

    }
}


// ================================================================
// NOT FOUND
// ================================================================

function showNotFound() {

    document.body.innerHTML = `

        <header class="site-header">

            <div class="header-inner">

                <a href="index.html" class="logo">
                    <span class="logo-main">Digital World</span>
                    <span class="logo-sub">Printing Press</span>
                </a>


                <nav class="desktop-nav">

                    <a href="index.html" class="premium-nav-link">
                        Home
                    </a>

                    <a href="category.html?category=all" class="premium-nav-link">
                        Collections
                    </a>

                    <a href="index.html#featured" class="premium-nav-link">
                        Invitations
                    </a>

                    <a href="index.html#how-it-works" class="premium-nav-link">
                        How It Works
                    </a>

                    <a href="index.html#contact" class="premium-nav-link">
                        Contact
                    </a>

                </nav>

            </div>

        </header>


        <main>

            <section class="premium-success-page">

                <div class="premium-success-container">

                    <span class="premium-success-kicker">
                        Digital World
                    </span>


                    <h1>
                        Invitation Not Found
                    </h1>


                    <p class="premium-success-message">
                        This invitation may have been
                        unpublished or removed.
                    </p>


                    <div class="premium-success-actions">

                        <a
                            href="category.html?category=all"
                            class="premium-success-whatsapp"
                        >
                            Browse Invitations
                        </a>

                    </div>

                </div>

            </section>

        </main>

    `;


    console.error(
        "Invitation could not be loaded."
    );
}


// ================================================================
// START
// ================================================================

document.addEventListener(
    "DOMContentLoaded",
    loadProduct
);