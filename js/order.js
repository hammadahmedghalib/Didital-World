import { supabaseClient } from "./supabase.js";
import { getProductBySlug } from "./catalog.js";


/* ======================================================
   MINIMUM ORDER QUANTITY POLICY
====================================================== */

const MIN_QUANTITY = 100;
const QUANTITY_STEP = 1;             /* ← was 50, now 1 */
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
const emailInput = document.getElementById("email");
const cityInput = document.getElementById("city");
const countryInput = document.getElementById("country");

const brideNameInput = document.getElementById("brideName");
const groomNameInput = document.getElementById("groomName");
const weddingDateInput = document.getElementById("weddingDate");
const weddingTimeInput = document.getElementById("weddingTime");
const eventTypeInput = document.getElementById("eventType");
const venueInput = document.getElementById("venue");

const customTextInput = document.getElementById("customText");
const specialRequirementsInput = document.getElementById("specialRequirements");
const orderNotesInput = document.getElementById("orderNotes");

const referenceFileInput = document.getElementById("referenceFile");
const selectedFileEl = document.getElementById("selectedFile");

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
    if (!Number.isFinite(raw) || raw < MIN_QUANTITY) {
        return MIN_QUANTITY;
    }
    return Math.floor(raw);
}


function updateTotalPrice() {

    if (!orderTotalPrice) return;

    const unitPrice = Number(selectedProduct?.price) || 0;
    const qty = getQuantity();

    orderTotalPrice.textContent = formatPrice(unitPrice * qty);
}


/* ======================================================
   QUANTITY STEPPER — MIN 100, + / − BY 1
====================================================== */

function setupQuantityStepper() {

    if (!quantityInput) return;

    const initial = Number(quantityInput.value);

    if (!Number.isFinite(initial) || initial < MIN_QUANTITY) {
        quantityInput.value = DEFAULT_QUANTITY;
    }


    /* MINUS — subtract by 1, never below 100 */

    quantityMinusBtn?.addEventListener("click", () => {

        const current = getQuantity();

        const next = Math.max(
            MIN_QUANTITY,
            current - QUANTITY_STEP
        );

        quantityInput.value = next;

        if (quantityError) quantityError.textContent = "";

        updateTotalPrice();

    });


    /* PLUS — add by 1 */

    quantityPlusBtn?.addEventListener("click", () => {

        const current = getQuantity();

        quantityInput.value = current + QUANTITY_STEP;

        if (quantityError) quantityError.textContent = "";

        updateTotalPrice();

    });


    /* MANUAL INPUT — snap to 100 if typed below */

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


    /* BLUR — final clamp */

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

        if (!emailInput.value.trim()) {
            alert("Please enter your email address.");
            emailInput.focus();
            return false;
        }

        if (!cityInput.value.trim()) {
            alert("Please enter your city.");
            cityInput.focus();
            return false;
        }

        if (!countryInput.value.trim()) {
            alert("Please enter your country.");
            countryInput.focus();
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

        if (!brideNameInput.value.trim()) {
            alert("Please enter the bride's name.");
            brideNameInput.focus();
            return false;
        }

        if (!groomNameInput.value.trim()) {
            alert("Please enter the groom's name.");
            groomNameInput.focus();
            return false;
        }

        if (!weddingDateInput.value) {
            alert("Please select the wedding date.");
            weddingDateInput.focus();
            return false;
        }

        if (!eventTypeInput.value) {
            alert("Please select the event type.");
            eventTypeInput.focus();
            return false;
        }

        if (!venueInput.value.trim()) {
            alert("Please enter the wedding venue.");
            venueInput.focus();
            return false;
        }

    }


    if (stepNumber === 4) {

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

        if (!slug) {
            throw new Error("No invitation was selected.");
        }

        console.log("Loading product:", slug);

        selectedProduct = await getProductBySlug(slug);

        if (!selectedProduct) {
            throw new Error("Invitation not found.");
        }

        console.log("Loaded product:", selectedProduct);


        orderProductName.textContent = selectedProduct.name;

        orderProductPrice.textContent =
            formatPrice(selectedProduct.price);

        if (selectedProduct.categories) {
            orderProductCategory.textContent =
                selectedProduct.categories.name || "";
        }

        if (selectedProduct.main_image_url) {

            orderProductImage.style.backgroundImage =
                `url("${selectedProduct.main_image_url}")`;

            orderProductImage.style.backgroundSize = "cover";
            orderProductImage.style.backgroundPosition = "center";
            orderProductImage.style.backgroundRepeat = "no-repeat";

        } else {

            orderProductImage.style.backgroundImage = "none";

        }

        updateTotalPrice();

    }

    catch (error) {

        console.error("Product loading failed:", error);

        orderProductName.textContent = "Invitation unavailable";
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

        if (nextStep === 4) {
            buildReview();
        }

        showStep(nextStep);

    });

});


previousButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const previousStep = currentStep - 1;

        if (previousStep >= 1) {
            showStep(previousStep);
        }

    });

});


/* ======================================================
   REFERENCE FILE
====================================================== */

if (referenceFileInput) {

    referenceFileInput.addEventListener("change", () => {

        const file = referenceFileInput.files?.[0];

        if (!file) {
            selectedFileEl.textContent = "";
            return;
        }

        const sizeMB = file.size / (1024 * 1024);

        if (sizeMB > 10) {

            alert("Reference file must be smaller than 10MB.");

            referenceFileInput.value = "";
            selectedFileEl.textContent = "";

            return;

        }

        selectedFileEl.textContent = `Selected: ${file.name}`;

    });

}


/* ======================================================
   COLLECT FORM DATA
====================================================== */

function collectFormData() {

    return {

        customer: {
            fullName: fullNameInput.value.trim(),
            whatsapp: whatsappInput.value.trim(),
            email: emailInput.value.trim(),
            city: cityInput.value.trim(),
            country: countryInput.value.trim()
        },

        wedding: {
            brideName: brideNameInput.value.trim(),
            groomName: groomNameInput.value.trim(),
            weddingDate: weddingDateInput.value,
            weddingTime: weddingTimeInput.value,
            venue: venueInput.value.trim(),
            eventType: eventTypeInput.value
        },

        additional: {
            customText: customTextInput.value.trim(),
            specialRequirements: specialRequirementsInput.value.trim(),
            notes: orderNotesInput.value.trim()
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
    const referenceFile = referenceFileInput?.files?.[0];

    const quantity = getQuantity();
    const unitPrice = Number(selectedProduct?.price) || 0;
    const totalPrice = unitPrice * quantity;


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
                <span>Email</span>
                <strong>${escapeHtml(data.customer.email)}</strong>
            </div>

            <div class="review-row">
                <span>City</span>
                <strong>${escapeHtml(data.customer.city)}</strong>
            </div>

            <div class="review-row">
                <span>Country</span>
                <strong>${escapeHtml(data.customer.country)}</strong>
            </div>
        </div>


        <div class="review-section">
            <h3>Wedding Details</h3>

            <div class="review-row">
                <span>Bride</span>
                <strong>${escapeHtml(data.wedding.brideName)}</strong>
            </div>

            <div class="review-row">
                <span>Groom</span>
                <strong>${escapeHtml(data.wedding.groomName)}</strong>
            </div>

            <div class="review-row">
                <span>Date</span>
                <strong>${escapeHtml(data.wedding.weddingDate)}</strong>
            </div>

            <div class="review-row">
                <span>Time</span>
                <strong>${escapeHtml(data.wedding.weddingTime || "Not provided")}</strong>
            </div>

            <div class="review-row">
                <span>Event</span>
                <strong>${escapeHtml(data.wedding.eventType)}</strong>
            </div>

            <div class="review-row">
                <span>Venue</span>
                <strong>${escapeHtml(data.wedding.venue)}</strong>
            </div>
        </div>


        <div class="review-section">
            <h3>Additional Details</h3>

            <div class="review-row review-row-block">
                <span>Custom Text</span>
                <strong>${escapeHtml(data.additional.customText || "Not provided")}</strong>
            </div>

            <div class="review-row review-row-block">
                <span>Special Requirements</span>
                <strong>${escapeHtml(data.additional.specialRequirements || "Not provided")}</strong>
            </div>

            <div class="review-row review-row-block">
                <span>Additional Notes</span>
                <strong>${escapeHtml(data.additional.notes || "Not provided")}</strong>
            </div>

            <div class="review-row">
                <span>Reference File</span>
                <strong>${referenceFile ? escapeHtml(referenceFile.name) : "Not provided"}</strong>
            </div>
        </div>

    `;

}


/* ======================================================
   SUBMIT ORDER
====================================================== */

async function submitOrder() {

    if (!selectedProduct) {
        throw new Error("No invitation selected.");
    }

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
            email: formData.customer.email,
            city: formData.customer.city,
            country: formData.customer.country
        },

        wedding: {
            brideName: formData.wedding.brideName,
            groomName: formData.wedding.groomName,
            weddingDate: formData.wedding.weddingDate,
            weddingTime: formData.wedding.weddingTime,
            venue: formData.wedding.venue,
            eventType: formData.wedding.eventType
        },

        additional: {
            customText: formData.additional.customText,
            specialRequirements: formData.additional.specialRequirements,
            notes: formData.additional.notes
        }

    };


    console.log("Submitting payload:", payload);


    const { data, error } =
        await supabaseClient.rpc("submit_order", { payload });


    if (error) {

        console.error("Order submission error:", error);

        throw new Error(
            error.message || "Unable to submit your order."
        );

    }


    if (!data?.success) {
        throw new Error("Order could not be created.");
    }


    return data;

}


/* ======================================================
   FORM SUBMIT
====================================================== */

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    if (!validateStep(4)) return;

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
        const referenceFile = referenceFileInput?.files?.[0];

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

                customer: formData.customer,
                wedding: formData.wedding,
                additional: formData.additional,

                referenceFile: referenceFile ? referenceFile.name : null

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