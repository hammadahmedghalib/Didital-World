import { supabaseClient } from "./supabase.js";
import { getProductBySlug } from "./catalog.js";


/* ======================================================
   MINIMUM ORDER QUANTITY POLICY
====================================================== */

const MIN_QUANTITY = 100;
const QUANTITY_STEP = 25;
const DEFAULT_QUANTITY = 100;


/* ======================================================
   ELEMENTS
====================================================== */

const form = document.getElementById("orderForm");

const steps = document.querySelectorAll("[data-step-content]");
const nextButtons = document.querySelectorAll(".next-step");
const previousButtons = document.querySelectorAll(".previous-step");

const fullNameInput = document.getElementById("fullName");
const whatsappInput = document.getElementById("whatsapp");
const cityInput = document.getElementById("city");

const confirmationInput = document.getElementById("informationConfirmed");
const confirmationError = document.getElementById("confirmationError");

const orderReview = document.getElementById("orderReview");

const orderProductImage = document.getElementById("orderProductImage");
const orderProductCategory = document.getElementById("orderProductCategory");
const orderProductName = document.getElementById("orderProductName");
const orderProductPrice = document.getElementById("orderProductPrice");

const quantityInput = document.getElementById("orderQuantity");
const quantityMinusBtn = document.getElementById("orderQuantityMinus");
const quantityPlusBtn = document.getElementById("orderQuantityPlus");
const quantityError = document.getElementById("quantityError");
const orderTotalPrice = document.getElementById("orderTotalPrice");


/* ======================================================
   STATE
====================================================== */

let currentStep = 1;
let selectedProduct = null;


/* ======================================================
   HELPERS
====================================================== */

function safeValue(el) {
    return el ? el.value.trim() : "";
}

/* Converts "" to null — needed for DATE / TIME columns */

function orNull(value) {
    const v = String(value ?? "").trim();
    return v === "" ? null : v;
}

function getProductSlug() {
    const params = new URLSearchParams(window.location.search);

    return (
        params.get("product") ||
        params.get("slug") ||
        params.get("design")
    );
}

function formatPrice(price) {
    return `PKR ${Number(price || 0).toLocaleString("en-PK")}`;
}

function getQuantity() {
    const raw = Number(quantityInput?.value);
    if (!Number.isFinite(raw) || raw < MIN_QUANTITY) return MIN_QUANTITY;
    return Math.floor(raw);
}

function updateTotalPrice() {
    if (!orderTotalPrice) return;

    const unitPrice = Number(selectedProduct?.price) || 0;
    const qty = getQuantity();

    orderTotalPrice.textContent = formatPrice(unitPrice * qty);
}


/* ======================================================
   QUANTITY STEPPER — min 100, steps of 25
====================================================== */

function setupQuantityStepper() {

    if (!quantityInput) return;

    const initial = Number(quantityInput.value);

    if (!Number.isFinite(initial) || initial < MIN_QUANTITY) {
        quantityInput.value = DEFAULT_QUANTITY;
    }


    quantityMinusBtn?.addEventListener("click", () => {

        const current = getQuantity();
        const next = Math.max(MIN_QUANTITY, current - QUANTITY_STEP);

        quantityInput.value = next;

        if (quantityError) quantityError.textContent = "";

        updateTotalPrice();
    });


    quantityPlusBtn?.addEventListener("click", () => {

        const current = getQuantity();
        quantityInput.value = current + QUANTITY_STEP;

        if (quantityError) quantityError.textContent = "";

        updateTotalPrice();
    });


    quantityInput.addEventListener("input", () => {

        const value = Number(quantityInput.value);

        if (
            Number.isFinite(value) &&
            value < MIN_QUANTITY &&
            value !== 0
        ) {
            quantityInput.value = MIN_QUANTITY;

            if (quantityError) {
                quantityError.textContent =
                    `Minimum order is ${MIN_QUANTITY} cards.`;
            }
        } else {
            if (quantityError) quantityError.textContent = "";
        }

        updateTotalPrice();
    });


    quantityInput.addEventListener("blur", () => {

        let value = Number(quantityInput.value);

        if (!Number.isFinite(value) || value < MIN_QUANTITY) {
            value = MIN_QUANTITY;
        }

        value = Math.round(value);
        quantityInput.value = value;

        if (quantityError) quantityError.textContent = "";

        updateTotalPrice();
    });


    updateTotalPrice();
}


/* ======================================================
   SHOW STEP
====================================================== */

function showStep(stepNumber) {

    currentStep = stepNumber;

    steps.forEach((step) => {
        const stepValue = Number(step.dataset.stepContent);
        step.classList.toggle("active", stepValue === stepNumber);
    });

    document.querySelectorAll(".progress-step").forEach((item) => {
        const value = Number(item.dataset.step);
        item.classList.toggle("active", value === stepNumber);
        item.classList.toggle("completed", value < stepNumber);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
}


/* ======================================================
   VALIDATE STEP
====================================================== */

function validateStep(stepNumber) {

    if (stepNumber === 1) {

        if (!fullNameInput.value.trim()) {
            alert("Please enter your full name.");
            fullNameInput.focus();
            return false;
        }

        if (!whatsappInput.value.trim()) {
            alert("Please enter your WhatsApp number.");
            whatsappInput.focus();
            return false;
        }

        if (!cityInput.value.trim()) {
            alert("Please enter your city.");
            cityInput.focus();
            return false;
        }

        const qty = getQuantity();

        if (qty < MIN_QUANTITY) {

            if (quantityError) {
                quantityError.textContent =
                    `Minimum order is ${MIN_QUANTITY} cards.`;
            }

            quantityInput?.focus();
            alert(`Minimum order is ${MIN_QUANTITY} cards.`);
            return false;
        }

        if (quantityError) quantityError.textContent = "";
    }


    if (stepNumber === 2) {

        if (!confirmationInput.checked) {
            confirmationError.textContent =
                "Please confirm that the information above is correct.";
            confirmationInput.focus();
            return false;
        }

        confirmationError.textContent = "";
    }

    return true;
}


/* ======================================================
   LOAD PRODUCT
====================================================== */

async function loadProduct() {

    try {

        const slug = getProductSlug();

        if (!slug) throw new Error("No invitation was selected.");

        selectedProduct = await getProductBySlug(slug);

        if (!selectedProduct) throw new Error("Invitation not found.");


        if (orderProductName)
            orderProductName.textContent = selectedProduct.name;

        if (orderProductPrice)
            orderProductPrice.textContent = formatPrice(selectedProduct.price);

        if (selectedProduct.categories && orderProductCategory) {
            orderProductCategory.textContent =
                selectedProduct.categories.name || "";
        }

        if (selectedProduct.main_image_url && orderProductImage) {
            orderProductImage.style.backgroundImage =
                `url("${selectedProduct.main_image_url}")`;
        } else if (orderProductImage) {
            orderProductImage.style.backgroundImage = "none";
        }

        updateTotalPrice();
    }
    catch (error) {

        console.error("Product loading failed:", error);

        if (orderProductName)
            orderProductName.textContent = "Invitation unavailable";

        if (orderProductPrice)
            orderProductPrice.textContent = "PKR 0";

        alert(error.message || "Unable to load this invitation.");
    }
}


/* ======================================================
   NEXT / PREVIOUS
====================================================== */

nextButtons.forEach((button) => {
    button.addEventListener("click", () => {

        if (!validateStep(currentStep)) return;

        const nextStep = currentStep + 1;

        if (nextStep === 2) buildReview();

        showStep(nextStep);
    });
});

previousButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const previousStep = currentStep - 1;
        if (previousStep >= 1) showStep(previousStep);
    });
});


/* ======================================================
   COLLECT FORM DATA
====================================================== */

function collectFormData() {

    return {
        customer: {
            fullName: safeValue(fullNameInput),
            whatsapp: safeValue(whatsappInput),
            city: safeValue(cityInput)
        }
    };
}


/* ======================================================
   ESCAPE HTML
====================================================== */

function escapeHtml(value) {

    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ======================================================
   BUILD REVIEW
====================================================== */

function buildReview() {

    const data = collectFormData();

    const quantity = getQuantity();
    const unitPrice = Number(selectedProduct?.price) || 0;
    const totalPrice = unitPrice * quantity;

    if (!orderReview) return;

    orderReview.innerHTML = `

        <div class="review-section">
            <h3>Selected Invitation</h3>

            <div class="review-row">
                <span>Design</span>
                <strong>${escapeHtml(selectedProduct?.name)}</strong>
            </div>

            <div class="review-row">
                <span>Price per card</span>
                <strong>${formatPrice(selectedProduct?.price)}</strong>
            </div>

            <div class="review-row">
                <span>Quantity</span>
                <strong>${quantity} cards</strong>
            </div>

            <div class="review-row">
                <span>Estimated Total</span>
                <strong>${formatPrice(totalPrice)}</strong>
            </div>
        </div>


        <div class="review-section">
            <h3>Customer Information</h3>

            <div class="review-row">
                <span>Full Name</span>
                <strong>${escapeHtml(data.customer.fullName)}</strong>
            </div>

            <div class="review-row">
                <span>WhatsApp</span>
                <strong>${escapeHtml(data.customer.whatsapp)}</strong>
            </div>

            <div class="review-row">
                <span>City</span>
                <strong>${escapeHtml(data.customer.city)}</strong>
            </div>
        </div>

    `;
}


/* ======================================================
   SUBMIT ORDER — sends null (not "") for empty values
====================================================== */

async function submitOrder() {

    if (!selectedProduct) throw new Error("No invitation selected.");

    const formData = collectFormData();

    const quantity = getQuantity();
    const unitPrice = Number(selectedProduct.price) || 0;
    const totalPrice = unitPrice * quantity;


    const payload = {

        product: {
            id: selectedProduct.id,
            name: selectedProduct.name,
            slug: selectedProduct.slug,
            unit_price: unitPrice
        },

        quantity: quantity,
        total_price: totalPrice,

        customer: {
            fullName: formData.customer.fullName,
            whatsapp: formData.customer.whatsapp,
            email: null,                                  /* ← null, not "" */
            city: formData.customer.city,
            country: null                                 /* ← null, not "" */
        },

        wedding: {
            brideName: null,
            groomName: null,
            weddingDate: null,                            /* ← critical: date */
            weddingTime: null,                            /* ← critical: time */
            venue: null,
            eventType: null
        },

        additional: {
            customText: null,
            specialRequirements: null,
            notes: null
        }

    };


    const { data, error } =
        await supabaseClient.rpc("submit_order", { payload });


    if (error) {
        console.error("Order submission error:", error);
        throw new Error(error.message || "Unable to submit your order.");
    }

    if (!data?.success) throw new Error("Order could not be created.");

    return data;
}


/* ======================================================
   FORM SUBMIT
====================================================== */

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    if (!validateStep(2)) return;

    if (!selectedProduct) {
        alert("Please select an invitation first.");
        return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    try {

        submitButton.disabled = true;
        submitButton.textContent = "Submitting Order...";


        const result = await submitOrder();


        const formData = collectFormData();
        const quantity = getQuantity();
        const unitPrice = Number(selectedProduct.price) || 0;


        sessionStorage.setItem(

            "weddingOrder",

            JSON.stringify({

                orderId: result.order_id,
                orderNumber: result.order_number,
                status: result.status,

                quantity: quantity,
                totalPrice: unitPrice * quantity,

                product: {
                    id: selectedProduct.id,
                    name: selectedProduct.name,
                    slug: selectedProduct.slug,
                    price: selectedProduct.price,
                    image: selectedProduct.main_image_url
                },

                customer: {
                    fullName: formData.customer.fullName,
                    whatsapp: formData.customer.whatsapp,
                    email: null,
                    city: formData.customer.city,
                    country: null
                }

            })

        );


        window.location.href =
            `success.html?order=${encodeURIComponent(result.order_number)}`;
    }
    catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Something went wrong while placing your order."
        );

        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
});


/* ======================================================
   INIT
====================================================== */

async function init() {

    setupQuantityStepper();
    showStep(1);

    await loadProduct();
}


init();