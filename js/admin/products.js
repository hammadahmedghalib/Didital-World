import {
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
} from "../config.js";


const supabase =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


const params =
    new URLSearchParams(
        window.location.search
    );


const editId =
    params.get("id");


let editingProduct = null;

let allProducts = [];

let allCategories = [];

let selectedGalleryFiles = [];


const isEditorPage =
    Boolean(
        document.getElementById(
            "productForm"
        )
    );


const elements = {

    logout:
        document.getElementById(
            "logoutButton"
        ),

    table:
        document.getElementById(
            "productsTable"
        ),

    count:
        document.getElementById(
            "productCount"
        ),

    search:
        document.getElementById(
            "productSearch"
        ),

    statusFilter:
        document.getElementById(
            "productStatusFilter"
        ),

    categoryFilter:
        document.getElementById(
            "productCategoryFilter"
        ),

    form:
        document.getElementById(
            "productForm"
        ),

    editorTitle:
        document.getElementById(
            "editorTitle"
        ),

    productId:
        document.getElementById(
            "productId"
        ),

    productName:
        document.getElementById(
            "productName"
        ),

    productSlug:
        document.getElementById(
            "productSlug"
        ),

    productCategory:
        document.getElementById(
            "productCategory"
        ),

    productPrice:
        document.getElementById(
            "productPrice"
        ),

    shortDescription:
        document.getElementById(
            "productShortDescription"
        ),

    description:
        document.getElementById(
            "productDescription"
        ),

    mainImage:
        document.getElementById(
            "mainImage"
        ),

    mainImagePreview:
        document.getElementById(
            "mainImagePreview"
        ),

    galleryImages:
        document.getElementById(
            "galleryImages"
        ),

    galleryPreview:
        document.getElementById(
            "galleryPreview"
        ),

    features:
        document.getElementById(
            "productFeatures"
        ),

    style:
        document.getElementById(
            "productStyle"
        ),

    demoUrl:
        document.getElementById(
            "productDemoUrl"
        ),

    tags:
        document.getElementById(
            "productTags"
        ),

    eventTypes:
        document.getElementById(
            "productEventTypes"
        ),

    sortOrder:
        document.getElementById(
            "productSortOrder"
        ),

    status:
        document.getElementById(
            "productStatus"
        ),

    featured:
        document.getElementById(
            "productFeatured"
        ),

    popular:
        document.getElementById(
            "productPopular"
        ),

    seoTitle:
        document.getElementById(
            "seoTitle"
        ),

    seoDescription:
        document.getElementById(
            "seoDescription"
        ),

    homepageEnabled:
        document.getElementById(
            "homepageEnabled"
        ),

    homepageSlot:
        document.getElementById(
            "homepageSlot"
        ),

    homepageBadge:
        document.getElementById(
            "homepageBadge"
        ),

    error:
        document.getElementById(
            "productFormError"
        ),

    saveButton:
        document.getElementById(
            "saveProductButton"
        )

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


function slugify(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

}


function splitCsv(value) {

    return String(value || "")
        .split(",")
        .map(
            item => item.trim()
        )
        .filter(Boolean);

}


/* =============================================================
   GALLERY
============================================================= */

function syncGalleryInput() {

    if (!elements.galleryImages) {
        return;
    }


    const dataTransfer =
        new DataTransfer();


    selectedGalleryFiles.forEach(
        file =>
            dataTransfer.items.add(file)
    );


    elements.galleryImages.files =
        dataTransfer.files;

}


function validateImageFile(file) {

    if (!file) {
        return false;
    }


    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        throw new Error(
            `"${file.name}" is not a valid image. Use JPG, PNG or WEBP.`
        );

    }


    if (
        file.size >
        6 * 1024 * 1024
    ) {

        throw new Error(
            `"${file.name}" is larger than 6MB.`
        );

    }


    return true;

}


/* =============================================================
   HOMEPAGE CONTROLS
============================================================= */

function setupHomepageControls() {

    if (!elements.homepageEnabled) {
        return;
    }


    const enabled =
        elements.homepageEnabled.value === "true";


    if (elements.homepageSlot) {

        elements.homepageSlot.disabled =
            !enabled;

    }


    if (elements.homepageBadge) {

        elements.homepageBadge.disabled =
            !enabled;

    }


    if (!enabled) {

        if (elements.homepageSlot) {
            elements.homepageSlot.value = "";
        }

    }

}


/* =============================================================
   AUTH
============================================================= */

async function requireAdmin() {

    const {
        data,
        error
    } =
        await supabase.auth.getSession();


    if (
        error ||
        !data.session
    ) {

        window.location.href =
            "login.html";

        return false;

    }


    const {
        data: admin,
        error: adminError
    } =
        await supabase
            .from("admin_profiles")
            .select(
                "user_id,role,is_active"
            )
            .eq(
                "user_id",
                data.session.user.id
            )
            .eq(
                "is_active",
                true
            )
            .maybeSingle();


    if (
        adminError ||
        !admin
    ) {

        await supabase.auth.signOut();

        window.location.href =
            "login.html";

        return false;

    }


    return true;

}


/* =============================================================
   LOAD CATEGORIES
============================================================= */

async function loadCategories() {

    const {
        data,
        error
    } =
        await supabase
            .from("categories")
            .select(
                "id,name,slug,status,sort_order"
            )
            .order(
                "sort_order",
                {
                    ascending: true
                }
            );


    if (error) {
        throw error;
    }


    allCategories =
        data || [];


    if (elements.productCategory) {

        elements.productCategory.innerHTML =

            `<option value="">
                Select category
            </option>` +

            allCategories
                .map(
                    category => `

                        <option
                            value="${escapeHtml(category.id)}"
                        >
                            ${escapeHtml(category.name)}
                        </option>

                    `
                )
                .join("");

    }


    if (elements.categoryFilter) {

        elements.categoryFilter.innerHTML =

            `<option value="all">
                All Categories
            </option>` +

            allCategories
                .map(
                    category => `

                        <option
                            value="${escapeHtml(category.id)}"
                        >
                            ${escapeHtml(category.name)}
                        </option>

                    `
                )
                .join("");

    }

}


/* =============================================================
   LOAD ACTIVE PRODUCTS
============================================================= */

async function loadProducts() {

    if (!elements.table) {
        return;
    }


    elements.table.textContent =
        "Loading...";


    const {
        data,
        error
    } =
        await supabase
            .from("products")
            .select(`
                id,
                name,
                slug,
                price,
                main_image_url,
                main_image_path,
                status,
                featured,
                popular,
                sort_order,
                category_id,
                archived,
                homepage_enabled,
                homepage_slot,
                homepage_badge,
                categories (
                    name
                )
            `)
            .eq(
                "archived",
                false
            )
            .order(
                "sort_order",
                {
                    ascending: true
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {
        throw error;
    }


    allProducts =
        data || [];


    renderProductTable();

}


/* =============================================================
   FILTER
============================================================= */

function getFilteredProducts() {

    let result =
        [...allProducts];


    const searchText =
        elements.search
            ?.value
            ?.trim()
            .toLowerCase() ||
        "";


    const status =
        elements.statusFilter
            ?.value ||
        "all";


    const category =
        elements.categoryFilter
            ?.value ||
        "all";


    if (searchText) {

        result =
            result.filter(
                product =>

                    String(
                        product.name || ""
                    )
                        .toLowerCase()
                        .includes(
                            searchText
                        ) ||

                    String(
                        product.slug || ""
                    )
                        .toLowerCase()
                        .includes(
                            searchText
                        )
            );

    }


    if (
        status !== "all"
    ) {

        result =
            result.filter(
                product =>
                    product.status ===
                    status
            );

    }


    if (
        category !== "all"
    ) {

        result =
            result.filter(
                product =>
                    String(
                        product.category_id
                    ) ===
                    String(
                        category
                    )
            );

    }


    return result;

}


/* =============================================================
   PRODUCT TABLE
============================================================= */

function renderProductTable() {

    if (!elements.table) {
        return;
    }


    const products =
        getFilteredProducts();


    if (elements.count) {

        elements.count.textContent =

            `${products.length} ${
                products.length === 1
                    ? "product"
                    : "products"
            }`;

    }


    if (!products.length) {

        elements.table.innerHTML = `

            <div class="admin-empty-state">

                No active products found.

            </div>

        `;

        return;

    }


    elements.table.innerHTML = `

        <table class="admin-table">

            <thead>

                <tr>

                    <th>
                        Image
                    </th>

                    <th>
                        Product
                    </th>

                    <th>
                        Category
                    </th>

                    <th>
                        Price
                    </th>

                    <th>
                        Status
                    </th>

                    <th>
                        Homepage
                    </th>

                    <th>
                        Actions
                    </th>

                </tr>

            </thead>


            <tbody>

                ${
                    products
                        .map(
                            product => `

                                <tr>

                                    <td>

                                        ${
                                            product.main_image_url

                                                ? `

                                                    <img
                                                        src="${escapeHtml(
                                                            product.main_image_url
                                                        )}"
                                                        class="admin-table-product-image"
                                                        alt=""
                                                    >

                                                `

                                                : `

                                                    <div
                                                        class="
                                                            admin-table-product-image
                                                            admin-no-image
                                                        "
                                                    >
                                                        —
                                                    </div>

                                                `
                                        }

                                    </td>


                                    <td>

                                        <strong>
                                            ${escapeHtml(
                                                product.name
                                            )}
                                        </strong>

                                        <small
                                            class="admin-table-subtext"
                                        >
                                            /
                                            ${escapeHtml(
                                                product.slug
                                            )}
                                        </small>

                                    </td>


                                    <td>

                                        ${escapeHtml(
                                            product.categories?.name ||
                                            "Unassigned"
                                        )}

                                    </td>


                                    <td>

                                        PKR ${
                                            Number(
                                                product.price ||
                                                0
                                            ).toLocaleString()
                                        }

                                    </td>


                                    <td>

                                        <span
                                            class="
                                                admin-status
                                                ${escapeHtml(
                                                    product.status ||
                                                    ""
                                                )}
                                            "
                                        >

                                            ${escapeHtml(
                                                product.status ||
                                                ""
                                            )}

                                        </span>

                                    </td>


                                    <td>

                                        ${
                                            product.homepage_enabled

                                                ? `

                                                    <strong>
                                                        Yes
                                                    </strong>

                                                    <br>

                                                    <small>

                                                        Slot
                                                        ${
                                                            Number(
                                                                product.homepage_slot ||
                                                                0
                                                            )
                                                        }

                                                        ${
                                                            product.homepage_badge
                                                                ? ` · ${escapeHtml(
                                                                    product.homepage_badge
                                                                )}`
                                                                : ""
                                                        }

                                                    </small>

                                                `

                                                : "No"
                                        }

                                    </td>


                                    <td>

                                        <div
                                            class="admin-row-actions"
                                        >

                                            <a
                                                href="product-edit.html?id=${encodeURIComponent(
                                                    product.id
                                                )}"
                                                class="admin-small-button"
                                            >
                                                Edit
                                            </a>


                                            <button
                                                type="button"
                                                class="admin-small-button danger"
                                                data-archive-product="${escapeHtml(
                                                    product.id
                                                )}"
                                            >
                                                Archive
                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            `
                        )
                        .join("")
                }

            </tbody>

        </table>

    `;


    elements.table
        .querySelectorAll(
            "[data-archive-product]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const product =
                            allProducts.find(
                                item =>
                                    String(
                                        item.id
                                    ) ===
                                    String(
                                        button.dataset
                                            .archiveProduct
                                    )
                            );


                        if (product) {

                            await archiveProduct(
                                product
                            );

                        }

                    }
                );

            }
        );

}


/* =============================================================
   UPLOAD PRODUCT FILE
============================================================= */

async function uploadProductFile(
    file,
    folder
) {

    if (!file) {
        return null;
    }


    validateImageFile(
        file
    );


    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const path =
        `${folder}/${crypto.randomUUID()}.${extension}`;


    const {
        data,
        error
    } =
        await supabase.storage
            .from(
                "product-images"
            )
            .upload(
                path,
                file,
                {
                    cacheControl:
                        "31536000",

                    upsert:
                        false,

                    contentType:
                        file.type
                }
            );


    if (error) {
        throw error;
    }


    const {
        data: publicData
    } =
        supabase.storage
            .from(
                "product-images"
            )
            .getPublicUrl(
                data.path
            );


    return {

        path:
            data.path,

        url:
            publicData.publicUrl

    };

}


/* =============================================================
   LOAD SINGLE PRODUCT
============================================================= */

async function loadProductForEdit() {

    if (!editId) {
        return;
    }


    const {
        data,
        error
    } =
        await supabase
            .from("products")
            .select(`
                *,
                product_images (
                    id,
                    image_url,
                    storage_path,
                    alt_text,
                    sort_order
                ),
                product_features (
                    id,
                    feature,
                    sort_order
                )
            `)
            .eq(
                "id",
                editId
            )
            .single();


    if (error) {
        throw error;
    }


    editingProduct =
        data;


    populateEditor(
        data
    );

}


/* =============================================================
   POPULATE EDITOR
============================================================= */

function populateEditor(
    product
) {

    elements.editorTitle.textContent =
        "Edit Product";


    elements.productId.value =
        product.id || "";


    elements.productName.value =
        product.name || "";


    elements.productSlug.value =
        product.slug || "";


    elements.productCategory.value =
        product.category_id || "";


    elements.productPrice.value =
        product.price ?? "";


    elements.shortDescription.value =
        product.short_description || "";


    elements.description.value =
        product.description || "";


    elements.style.value =
        product.style || "";


    elements.demoUrl.value =
        product.demo_url || "";


    elements.tags.value =
        Array.isArray(product.tags)

            ? product.tags.join(
                ", "
            )

            : (
                product.tags ||
                ""
            );


    elements.eventTypes.value =
        Array.isArray(
            product.event_types
        )

            ? product.event_types.join(
                ", "
            )

            : (
                product.event_types ||
                ""
            );


    elements.sortOrder.value =
        product.sort_order ?? 0;


    elements.status.value =
        product.status ||
        "draft";


    elements.featured.checked =
        Boolean(
            product.featured
        );


    elements.popular.checked =
        Boolean(
            product.popular
        );


    elements.seoTitle.value =
        product.seo_title ||
        "";


    elements.seoDescription.value =
        product.seo_description ||
        "";


    if (elements.homepageEnabled) {

        elements.homepageEnabled.value =

            product.homepage_enabled === true

                ? "true"

                : "false";

    }


    if (elements.homepageSlot) {

        elements.homepageSlot.value =

            product.homepage_slot === null ||
            product.homepage_slot === undefined

                ? ""

                : String(
                    product.homepage_slot
                );

    }


    if (elements.homepageBadge) {

        elements.homepageBadge.value =
            product.homepage_badge ||
            "";

    }


    setupHomepageControls();


    if (
        product.main_image_url
    ) {

        elements.mainImagePreview.innerHTML = `

            <img
                src="${escapeHtml(
                    product.main_image_url
                )}"
                alt="Main product image"
            >

        `;

    }


    if (
        product.product_images?.length
    ) {

        const images =
            [
                ...product.product_images
            ]
                .sort(
                    (
                        a,
                        b
                    ) =>
                        Number(
                            a.sort_order ||
                            0
                        ) -

                        Number(
                            b.sort_order ||
                            0
                        )
                );


        elements.galleryPreview.innerHTML =

            images
                .map(
                    image => `

                        <div
                            class="admin-gallery-item"
                            data-gallery-id="${escapeHtml(
                                image.id
                            )}"
                            data-existing-gallery="true"
                        >

                            <img
                                src="${escapeHtml(
                                    image.image_url
                                )}"
                                alt="${escapeHtml(
                                    image.alt_text ||
                                    ""
                                )}"
                            >


                            <button
                                type="button"
                                class="admin-gallery-remove"
                                data-remove-gallery="${escapeHtml(
                                    image.id
                                )}"
                            >
                                ×
                            </button>

                        </div>

                    `
                )
                .join("");

    }


    if (
        product.product_features?.length
    ) {

        elements.features.value =

            [
                ...product.product_features
            ]
                .sort(
                    (
                        a,
                        b
                    ) =>
                        Number(
                            a.sort_order ||
                            0
                        ) -

                        Number(
                            b.sort_order ||
                            0
                        )
                )
                .map(
                    feature =>
                        feature.feature
                )
                .join(
                    "\n"
                );

    }


    setupGalleryDeleteButtons();

}


/* =============================================================
   GALLERY PREVIEW
============================================================= */

function renderSelectedGalleryFiles() {

    if (!elements.galleryPreview) {
        return;
    }


    const existing =
        Array.from(
            elements.galleryPreview
                .querySelectorAll(
                    "[data-existing-gallery]"
                )
        )
            .map(
                item =>
                    item.outerHTML
            )
            .join("");


    const newFiles =
        selectedGalleryFiles
            .map(
                (
                    file,
                    index
                ) => {

                    const url =
                        URL.createObjectURL(
                            file
                        );


                    return `

                        <div
                            class="admin-gallery-item"
                            data-new-gallery-index="${index}"
                        >

                            <img
                                src="${url}"
                                alt="${escapeHtml(
                                    file.name
                                )}"
                            >

                            <button
                                type="button"
                                class="admin-gallery-remove"
                                data-remove-new-gallery="${index}"
                            >
                                ×
                            </button>

                        </div>

                    `;

                }
            )
            .join("");


    elements.galleryPreview.innerHTML =
        existing +
        newFiles;


    setupGalleryDeleteButtons();

}


/* =============================================================
   REMOVE NEW GALLERY
============================================================= */

function removeSelectedGalleryFile(
    index
) {

    if (
        index < 0 ||
        index >=
            selectedGalleryFiles.length
    ) {
        return;
    }


    selectedGalleryFiles.splice(
        index,
        1
    );


    syncGalleryInput();

    renderSelectedGalleryFiles();

}


/* =============================================================
   GALLERY DELETE BUTTONS
============================================================= */

function setupGalleryDeleteButtons() {

    if (
        !elements.galleryPreview
    ) {
        return;
    }


    elements.galleryPreview
        .querySelectorAll(
            "[data-remove-gallery]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await removeGalleryImage(
                            button.dataset
                                .removeGallery
                        );

                    }
                );

            }
        );


    elements.galleryPreview
        .querySelectorAll(
            "[data-remove-new-gallery]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        removeSelectedGalleryFile(
                            Number(
                                button.dataset
                                    .removeNewGallery
                            )
                        );

                    }
                );

            }
        );

}


/* =============================================================
   REMOVE EXISTING GALLERY
============================================================= */

async function removeGalleryImage(
    imageId
) {

    if (!editingProduct) {
        return;
    }


    const image =
        editingProduct
            .product_images
            ?.find(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        imageId
                    )
            );


    if (!image) {
        return;
    }


    try {

        if (
            image.storage_path
        ) {

            await supabase.storage
                .from(
                    "product-images"
                )
                .remove([
                    image.storage_path
                ]);

        }


        const {
            error
        } =
            await supabase
                .from(
                    "product_images"
                )
                .delete()
                .eq(
                    "id",
                    imageId
                );


        if (error) {
            throw error;
        }


        editingProduct.product_images =

            editingProduct.product_images
                .filter(
                    item =>
                        String(
                            item.id
                        ) !==
                        String(
                            imageId
                        )
                );


        elements.galleryPreview
            .querySelector(
                `[data-gallery-id="${CSS.escape(
                    String(imageId)
                )}"]`
            )
            ?.remove();

    }
    catch (error) {

        console.error(
            error
        );

        elements.error.textContent =
            error.message;

    }

}


/* =============================================================
   SAVE FEATURES
============================================================= */

async function saveFeatures(
    productId
) {

    const features =
        elements.features.value
            .split("\n")
            .map(
                feature =>
                    feature.trim()
            )
            .filter(Boolean);


    const {
        error: deleteError
    } =
        await supabase
            .from(
                "product_features"
            )
            .delete()
            .eq(
                "product_id",
                productId
            );


    if (deleteError) {
        throw deleteError;
    }


    if (!features.length) {
        return;
    }


    const rows =
        features.map(
            (
                feature,
                index
            ) => ({

                product_id:
                    productId,

                feature,

                sort_order:
                    index + 1

            })
        );


    const {
        error
    } =
        await supabase
            .from(
                "product_features"
            )
            .insert(
                rows
            );


    if (error) {
        throw error;
    }

}


/* =============================================================
   SAVE GALLERY
============================================================= */

async function saveGallery(
    productId,
    files
) {

    if (
        !files ||
        !files.length
    ) {
        return;
    }


    const {
        count,
        error: countError
    } =
        await supabase
            .from(
                "product_images"
            )
            .select(
                "id",
                {
                    count:
                        "exact",
                    head:
                        true
                }
            )
            .eq(
                "product_id",
                productId
            );


    if (countError) {
        throw countError;
    }


    let sortOrder =
        (count || 0) +
        1;


    for (
        let index = 0;
        index < files.length;
        index++
    ) {

        const file =
            files[index];


        validateImageFile(
            file
        );


        const upload =
            await uploadProductFile(
                file,
                `products/${productId}/gallery`
            );


        if (!upload) {

            throw new Error(
                `Unable to upload "${file.name}".`
            );

        }


        const {
            error: insertError
        } =
            await supabase
                .from(
                    "product_images"
                )
                .insert({

                    product_id:
                        productId,

                    image_url:
                        upload.url,

                    storage_path:
                        upload.path,

                    alt_text:
                        elements.productName
                            .value
                            .trim(),

                    sort_order:
                        sortOrder++

                });


        if (insertError) {

            try {

                await supabase.storage
                    .from(
                        "product-images"
                    )
                    .remove([
                        upload.path
                    ]);

            }
            catch (_) {}

            throw insertError;

        }

    }

}


/* =============================================================
   VALIDATE HOMEPAGE POSITION
============================================================= */

async function validateHomepagePlacement({
    productId,
    categoryId,
    homepageEnabled,
    homepageSlot
}) {

    if (!homepageEnabled) {
        return;
    }


    if (
        ![1, 2, 3].includes(
            homepageSlot
        )
    ) {

        throw new Error(
            "Please select homepage position 1, 2, or 3."
        );

    }


    let slotQuery =
        supabase
            .from(
                "products"
            )
            .select(
                "id,name"
            )
            .eq(
                "category_id",
                categoryId
            )
            .eq(
                "homepage_enabled",
                true
            )
            .eq(
                "homepage_slot",
                homepageSlot
            )
            .eq(
                "archived",
                false
            );


    if (productId) {

        slotQuery =
            slotQuery.neq(
                "id",
                productId
            );

    }


    const {
        data: slotProducts,
        error: slotError
    } =
        await slotQuery;


    if (slotError) {
        throw slotError;
    }


    if (
        slotProducts?.length
    ) {

        throw new Error(
            `Homepage position ${homepageSlot} is already used by "${slotProducts[0].name}" in this category.`
        );

    }


    let countQuery =
        supabase
            .from(
                "products"
            )
            .select(
                "id"
            )
            .eq(
                "category_id",
                categoryId
            )
            .eq(
                "homepage_enabled",
                true
            )
            .eq(
                "archived",
                false
            );


    if (productId) {

        countQuery =
            countQuery.neq(
                "id",
                productId
            );

    }


    const {
        data: selectedProducts,
        error: countError
    } =
        await countQuery;


    if (countError) {
        throw countError;
    }


    if (
        (selectedProducts?.length || 0) >=
        3
    ) {

        throw new Error(
            "This category already has 3 homepage products. Disable one first or edit one of the existing homepage products."
        );

    }

}


/* =============================================================
   SAVE PRODUCT
============================================================= */

async function saveProduct(
    event
) {

    event.preventDefault();


    elements.error.textContent =
        "";


    const name =
        elements.productName.value
            .trim();


    const slug =
        slugify(
            elements.productSlug.value ||
            name
        );


    const categoryId =
        elements.productCategory.value;


    const price =
        Number(
            elements.productPrice.value
        );


    if (!name) {

        elements.error.textContent =
            "Product name is required.";

        return;

    }


    if (!slug) {

        elements.error.textContent =
            "Product slug is required.";

        return;

    }


    if (!categoryId) {

        elements.error.textContent =
            "Please select a category.";

        return;

    }


    if (
        Number.isNaN(price) ||
        price < 0
    ) {

        elements.error.textContent =
            "Please enter a valid price.";

        return;

    }


    const homepageEnabled =
        elements.homepageEnabled?.value ===
        "true";


    const homepageSlotValue =
        elements.homepageSlot?.value ||
        "";


    const homepageSlot =
        homepageSlotValue
            ? Number(
                homepageSlotValue
            )
            : null;


    const homepageBadge =
        elements.homepageBadge
            ?.value
            .trim() ||
        null;


    elements.saveButton.disabled =
        true;


    elements.saveButton.textContent =
        "Saving...";


    try {

        let productId =
            editingProduct?.id ||
            null;


        let mainImageUrl =
            editingProduct?.main_image_url ||
            null;


        let mainImagePath =
            editingProduct?.main_image_path ||
            null;


        if (
            elements.mainImage
                ?.files
                ?.length
        ) {

            const upload =
                await uploadProductFile(
                    elements.mainImage
                        .files[0],
                    "products/main"
                );


            mainImageUrl =
                upload.url;


            mainImagePath =
                upload.path;


            if (
                editingProduct
                    ?.main_image_path
            ) {

                try {

                    await supabase.storage
                        .from(
                            "product-images"
                        )
                        .remove([
                            editingProduct
                                .main_image_path
                        ]);

                }
                catch (storageError) {

                    console.warn(
                        "Old main image could not be removed:",
                        storageError
                    );

                }

            }

        }


        await validateHomepagePlacement({
            productId,
            categoryId,
            homepageEnabled,
            homepageSlot
        });


        const payload = {

            category_id:
                categoryId,

            name,

            slug,

            price,

            short_description:
                elements.shortDescription
                    .value
                    .trim() ||
                null,

            description:
                elements.description
                    .value
                    .trim() ||
                null,

            main_image_url:
                mainImageUrl,

            main_image_path:
                mainImagePath,

            demo_url:
                elements.demoUrl
                    .value
                    .trim() ||
                null,

            style:
                elements.style
                    .value
                    .trim() ||
                null,

            tags:
                splitCsv(
                    elements.tags.value
                ),

            event_types:
                splitCsv(
                    elements.eventTypes.value
                ),

            status:
                elements.status.value,

            featured:
                elements.featured.checked,

            popular:
                elements.popular.checked,

            sort_order:
                Number(
                    elements.sortOrder.value
                ) || 0,

            seo_title:
                elements.seoTitle
                    .value
                    .trim() ||
                null,

            seo_description:
                elements.seoDescription
                    .value
                    .trim() ||
                null,

            homepage_enabled:
                homepageEnabled,

            homepage_slot:
                homepageEnabled &&
                homepageSlot
                    ? homepageSlot
                    : null,

            homepage_badge:
                homepageEnabled
                    ? homepageBadge
                    : null,

            updated_at:
                new Date()
                    .toISOString()

        };


        if (productId) {

            const {
                error
            } =
                await supabase
                    .from(
                        "products"
                    )
                    .update(
                        payload
                    )
                    .eq(
                        "id",
                        productId
                    );


            if (error) {
                throw error;
            }

        }


        else {

            const {
                data,
                error
            } =
                await supabase
                    .from(
                        "products"
                    )
                    .insert({

                        ...payload,

                        archived:
                            false

                    })
                    .select(
                        "id"
                    )
                    .single();


            if (error) {
                throw error;
            }


            productId =
                data.id;

        }


        await saveFeatures(
            productId
        );


        await saveGallery(
            productId,
            selectedGalleryFiles
        );


        window.location.href =
            "products.html";

    }


    catch (error) {

        console.error(
            "SAVE PRODUCT ERROR:",
            error
        );


        elements.error.textContent =
            error.message ||
            "Unable to save product.";

    }


    finally {

        elements.saveButton.disabled =
            false;


        elements.saveButton.textContent =
            "Save Product";

    }

}


/* =============================================================
   ARCHIVE PRODUCT
============================================================= */

async function archiveProduct(
    product
) {

    const confirmed =
        window.confirm(
            `Archive "${product.name}"? This will hide it from the website and active products. Existing orders will remain safe.`
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await supabase
                .from(
                    "products"
                )
                .update({

                    archived:
                        true,

                    homepage_enabled:
                        false,

                    homepage_slot:
                        null,

                    updated_at:
                        new Date()
                            .toISOString()

                })
                .eq(
                    "id",
                    product.id
                );


        if (error) {
            throw error;
        }


        await loadProducts();

    }


    catch (error) {

        console.error(
            "ARCHIVE PRODUCT ERROR:",
            error
        );


        alert(
            error.message
        );

    }

}


/* =============================================================
   MAIN IMAGE PREVIEW
============================================================= */

if (
    elements.mainImage
) {

    elements.mainImage.addEventListener(
        "change",
        () => {

            const file =
                elements.mainImage
                    .files[0];


            if (!file) {
                return;
            }


            try {

                validateImageFile(
                    file
                );


                const url =
                    URL.createObjectURL(
                        file
                    );


                elements.mainImagePreview.innerHTML = `

                    <img
                        src="${url}"
                        alt="Selected main image"
                    >

                `;

            }

            catch (error) {

                elements.mainImage.value =
                    "";

                elements.error.textContent =
                    error.message;

            }

        }
    );

}


/* =============================================================
   GALLERY FILE INPUT
============================================================= */

if (
    elements.galleryImages
) {

    elements.galleryImages.addEventListener(
        "change",
        event => {

            try {

                const files =
                    Array.from(
                        event.target.files ||
                        []
                    );


                files.forEach(
                    file => {

                        validateImageFile(
                            file
                        );


                        const duplicate =
                            selectedGalleryFiles.some(
                                existing =>

                                    existing.name ===
                                    file.name &&

                                    existing.size ===
                                    file.size &&

                                    existing.lastModified ===
                                    file.lastModified
                            );


                        if (!duplicate) {

                            selectedGalleryFiles.push(
                                file
                            );

                        }

                    }
                );


                syncGalleryInput();

                renderSelectedGalleryFiles();

            }


            catch (error) {

                elements.error.textContent =
                    error.message;

            }

        }
    );

}


/* =============================================================
   AUTO SLUG
============================================================= */

if (
    elements.productName
) {

    elements.productName.addEventListener(
        "input",
        () => {

            if (editingProduct) {
                return;
            }


            elements.productSlug.value =
                slugify(
                    elements.productName.value
                );

        }
    );

}


/* =============================================================
   HOMEPAGE CONTROL EVENTS
============================================================= */

if (
    elements.homepageEnabled
) {

    elements.homepageEnabled.addEventListener(
        "change",
        setupHomepageControls
    );

}


/* =============================================================
   FILTER EVENTS
============================================================= */

if (
    elements.search
) {

    elements.search.addEventListener(
        "input",
        renderProductTable
    );

}


if (
    elements.statusFilter
) {

    elements.statusFilter.addEventListener(
        "change",
        renderProductTable
    );

}


if (
    elements.categoryFilter
) {

    elements.categoryFilter.addEventListener(
        "change",
        renderProductTable
    );

}


/* =============================================================
   LOGOUT
============================================================= */

if (
    elements.logout
) {

    elements.logout.addEventListener(
        "click",
        async () => {

            await supabase.auth.signOut();

            window.location.href =
                "login.html";

        }
    );

}


/* =============================================================
   FORM SUBMIT
============================================================= */

if (
    elements.form
) {

    elements.form.addEventListener(
        "submit",
        saveProduct
    );

}


/* =============================================================
   INIT
============================================================= */

async function init() {

    const isAdmin =
        await requireAdmin();


    if (!isAdmin) {
        return;
    }


    try {

        await loadCategories();


        setupHomepageControls();


        if (isEditorPage) {

            await loadProductForEdit();

        }


        else {

            await loadProducts();

        }

    }


    catch (error) {

        console.error(
            error
        );


        if (
            elements.error
        ) {

            elements.error.textContent =
                error.message;

        }


        if (
            elements.table
        ) {

            elements.table.innerHTML = `

                <div
                    class="admin-empty-state"
                >

                    Unable to load products.

                    <br><br>

                    ${escapeHtml(
                        error.message
                    )}

                </div>

            `;

        }

    }

}


init();