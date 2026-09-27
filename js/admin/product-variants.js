import { supabaseClient } from "../supabase.js";

const productIdInput =
    document.getElementById("productId");

const variantsContainer =
    document.getElementById("productVariants");

const addVariantButton =
    document.getElementById("addVariantButton");

const saveVariantsButton =
    document.getElementById("saveVariantsButton");

const variantMessage =
    document.getElementById("variantMessage");

let variants = [];


// =========================================================
// HELPERS
// =========================================================

function getProductId() {

    const urlId =
        new URLSearchParams(
            window.location.search
        ).get("id");

    const hiddenId =
        productIdInput?.value?.trim();

    return hiddenId || urlId || "";
}


function createVariant() {

    return {
        id: crypto.randomUUID(),

        name: "",

        colorName: "",

        colorHex: "#b89a67",

        price: "",

        images: [],

        newFiles: []
    };
}


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function showMessage(
    message,
    type = ""
) {

    if (!variantMessage) {
        return;
    }

    variantMessage.textContent =
        message;

    variantMessage.className =
        `admin-variant-message ${type}`;
}


// =========================================================
// RENDER VARIATIONS
// =========================================================

function renderVariants() {

    if (!variantsContainer) {
        return;
    }


    if (!variants.length) {

        variantsContainer.innerHTML = `
            <div class="admin-variant-empty">
                No design variations yet.
                Click
                <strong>+ Add Variation</strong>
                to add different colours or designs.
            </div>
        `;

        return;
    }


    variantsContainer.innerHTML =
        variants.map(
            (variant, index) => {

                const imagesHtml =
                    variant.images?.length
                        ? variant.images
                            .map(
                                (url, imageIndex) => `
                                    <div class="admin-variant-image">

                                        <img
                                            src="${escapeHtml(url)}"
                                            alt="${escapeHtml(
                                                variant.name ||
                                                "Variation"
                                            )}"
                                        >

                                        <button
                                            type="button"
                                            data-action="remove-image"
                                            data-variant="${index}"
                                            data-image="${imageIndex}"
                                            aria-label="Remove image"
                                        >
                                            ×
                                        </button>

                                    </div>
                                `
                            )
                            .join("")
                        : `
                            <div class="admin-variant-empty">
                                No images added yet.
                            </div>
                        `;


                return `
                    <article
                        class="admin-variant-card"
                        data-variant-index="${index}"
                    >

                        <div class="admin-variant-top">

                            <span class="admin-variant-number">
                                ${index + 1}
                            </span>


                            <span class="admin-variant-title">
                                ${
                                    escapeHtml(
                                        variant.name ||
                                        `Variation ${index + 1}`
                                    )
                                }
                            </span>


                            <button
                                type="button"
                                class="admin-variant-remove"
                                data-action="remove-variant"
                                data-variant="${index}"
                            >
                                Remove
                            </button>

                        </div>


                        <div class="admin-variant-grid">


                            <!-- VARIATION NAME -->

                            <div class="admin-variant-field">

                                <label>
                                    Variation Name
                                </label>

                                <input
                                    type="text"
                                    data-field="name"
                                    data-variant="${index}"
                                    value="${escapeHtml(
                                        variant.name
                                    )}"
                                    placeholder="Gold"
                                >

                                <small>
                                    Example:
                                    Gold, Black, White, Floral
                                </small>

                            </div>



                            <!-- COLOUR NAME -->

                            <div class="admin-variant-field">

                                <label>
                                    Colour Name
                                </label>

                                <input
                                    type="text"
                                    data-field="colorName"
                                    data-variant="${index}"
                                    value="${escapeHtml(
                                        variant.colorName
                                    )}"
                                    placeholder="Champagne Gold"
                                >

                            </div>



                            <!-- COLOUR -->

                            <div class="admin-variant-field">

                                <label>
                                    Colour
                                </label>

                                <input
                                    type="color"
                                    data-field="colorHex"
                                    data-variant="${index}"
                                    value="${
                                        /^#[0-9a-fA-F]{6}$/.test(
                                            variant.colorHex
                                        )
                                            ? variant.colorHex
                                            : "#b89a67"
                                    }"
                                >

                            </div>



                            <!-- PRICE -->

                            <div class="admin-variant-field">

                                <label>
                                    Price Override
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    data-field="price"
                                    data-variant="${index}"
                                    value="${escapeHtml(
                                        variant.price
                                    )}"
                                    placeholder="Use main price"
                                >

                                <small>
                                    Leave empty to use the main product price.
                                </small>

                            </div>



                            <!-- IMAGES -->

                            <div class="admin-variant-field full">

                                <label>
                                    Variation Images
                                </label>

                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    multiple
                                    data-action="select-images"
                                    data-variant="${index}"
                                >

                                <small>
                                    Select multiple images for this
                                    variation.
                                </small>


                                <div class="admin-variant-images">
                                    ${imagesHtml}
                                </div>

                            </div>

                        </div>

                    </article>
                `;
            }
        )
        .join("");


    attachVariantEvents();
}


// =========================================================
// EVENTS
// =========================================================

function attachVariantEvents() {

    variantsContainer
        .querySelectorAll("[data-field]")
        .forEach(input => {

            input.addEventListener(
                "input",
                () => {

                    const index =
                        Number(
                            input.dataset.variant
                        );

                    const field =
                        input.dataset.field;

                    if (!variants[index]) {
                        return;
                    }


                    variants[index][field] =
                        input.value;


                    if (field === "name") {

                        const title =
                            input
                                .closest(
                                    ".admin-variant-card"
                                )
                                ?.querySelector(
                                    ".admin-variant-title"
                                );

                        if (title) {

                            title.textContent =
                                input.value.trim() ||
                                `Variation ${index + 1}`;

                        }

                    }

                }
            );

        });


    variantsContainer
        .querySelectorAll(
            '[data-action="remove-variant"]'
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.variant
                        );

                    variants.splice(
                        index,
                        1
                    );

                    renderVariants();

                }
            );

        });


    variantsContainer
        .querySelectorAll(
            '[data-action="select-images"]'
        )
        .forEach(input => {

            input.addEventListener(
                "change",
                () => {

                    const index =
                        Number(
                            input.dataset.variant
                        );

                    if (!variants[index]) {
                        return;
                    }


                    variants[index].newFiles =
                        Array.from(
                            input.files || []
                        );


                    showMessage(
                        `${variants[index].newFiles.length} image(s) selected.`
                    );

                }
            );

        });


    variantsContainer
        .querySelectorAll(
            '[data-action="remove-image"]'
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const variantIndex =
                        Number(
                            button.dataset.variant
                        );

                    const imageIndex =
                        Number(
                            button.dataset.image
                        );


                    if (
                        !variants[
                            variantIndex
                        ]
                    ) {
                        return;
                    }


                    variants[
                        variantIndex
                    ].images.splice(
                        imageIndex,
                        1
                    );


                    renderVariants();

                }
            );

        });

}


// =========================================================
// LOAD EXISTING VARIATIONS
// =========================================================

async function loadVariants() {

    const productId =
        getProductId();


    if (!productId) {

        variants = [];

        renderVariants();

        showMessage(
            "Save the main product first."
        );

        return;
    }


    showMessage(
        "Loading variations..."
    );


    const {
        data,
        error
    } = await supabaseClient
        .from("products")
        .select("variants")
        .eq("id", productId)
        .single();


    if (error) {

        console.error(
            "Variation load error:",
            error
        );

        renderVariants();

        showMessage(
            "Could not load variations.",
            "error"
        );

        return;
    }


    const storedVariants =
        Array.isArray(data?.variants)
            ? data.variants
            : [];


    variants =
        storedVariants.map(
            variant => ({

                id:
                    variant.id ||
                    crypto.randomUUID(),

                name:
                    variant.name || "",

                colorName:
                    variant.colorName || "",

                colorHex:
                    /^#[0-9a-fA-F]{6}$/.test(
                        variant.colorHex
                    )
                        ? variant.colorHex
                        : "#b89a67",

                price:
                    variant.price ?? "",

                images:
                    Array.isArray(
                        variant.images
                    )
                        ? variant.images
                        : [],

                newFiles: []

            })
        );


    renderVariants();


    showMessage(
        variants.length
            ? `${variants.length} variation(s) loaded.`
            : "No variations yet."
    );

}


// =========================================================
// UPLOAD VARIATION IMAGE
// =========================================================

async function uploadVariantImage(
    productId,
    variantId,
    file
) {

    const safeName =
        file.name
            .toLowerCase()
            .replace(
                /[^a-z0-9._-]/g,
                "-"
            );


    const path =
        `products/${productId}/variants/${variantId}/${Date.now()}-${safeName}`;


    const {
        error
    } =
        await supabaseClient
            .storage
            .from("product-images")
            .upload(
                path,
                file,
                {
                    cacheControl: "3600",
                    upsert: false
                }
            );


    if (error) {
        throw error;
    }


    const {
        data
    } =
        supabaseClient
            .storage
            .from("product-images")
            .getPublicUrl(path);


    return data.publicUrl;
}


// =========================================================
// SAVE VARIATIONS
// =========================================================

async function saveVariants() {

    const productId =
        getProductId();


    if (!productId) {

        showMessage(
            "Save the main product first.",
            "error"
        );

        return;
    }


    addVariantButton.disabled = true;

    saveVariantsButton.disabled = true;


    showMessage(
        "Saving variations..."
    );


    try {

        const cleanedVariants = [];


        for (
            const variant of variants
        ) {

            const variantId =
                variant.id ||
                crypto.randomUUID();


            const uploadedUrls = [];


            for (
                const file of
                variant.newFiles || []
            ) {

                const url =
                    await uploadVariantImage(
                        productId,
                        variantId,
                        file
                    );

                uploadedUrls.push(url);

            }


            const images = [
                ...(variant.images || []),
                ...uploadedUrls
            ];


            cleanedVariants.push({

                id: variantId,

                name:
                    variant.name.trim(),

                colorName:
                    variant.colorName.trim(),

                colorHex:
                    variant.colorHex,

                price:
                    variant.price === ""
                        ? null
                        : Number(
                            variant.price
                        ),

                images,

                active: true

            });

        }


        const {
            error
        } =
            await supabaseClient
                .from("products")
                .update({

                    variants:
                        cleanedVariants,

                    updated_at:
                        new Date()
                            .toISOString()

                })
                .eq(
                    "id",
                    productId
                );


        if (error) {
            throw error;
        }


        variants =
            cleanedVariants.map(
                variant => ({
                    ...variant,
                    newFiles: []
                })
            );


        renderVariants();


        showMessage(
            "Variations saved successfully.",
            "success"
        );

    } catch (error) {

        console.error(
            "Variation save error:",
            error
        );

        showMessage(
            error?.message ||
            "Could not save variations.",
            "error"
        );

    } finally {

        addVariantButton.disabled =
            false;

        saveVariantsButton.disabled =
            false;

    }

}


// =========================================================
// ADD VARIATION
// =========================================================

addVariantButton.addEventListener(
    "click",
    () => {

        variants.push(
            createVariant()
        );

        renderVariants();


        variantsContainer
            .lastElementChild
            ?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

    }
);


// =========================================================
// SAVE BUTTON
// =========================================================

saveVariantsButton.addEventListener(
    "click",
    saveVariants
);


// =========================================================
// INITIAL LOAD
// =========================================================

loadVariants();