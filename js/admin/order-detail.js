import { supabaseClient } from "../supabase.js";


// ======================================================
// ELEMENTS — only what still exists in order-detail.html
// ======================================================

const loadingBox =
    document.getElementById("loadingBox");

const errorBox =
    document.getElementById("errorBox");

const orderContent =
    document.getElementById("orderContent");

const pageTitle =
    document.getElementById("pageTitle");

const orderSubtitle =
    document.getElementById("orderSubtitle");

const orderNumber =
    document.getElementById("orderNumber");

const statusSelect =
    document.getElementById("statusSelect");

const orderPrice =
    document.getElementById("orderPrice");

const orderQuantity =
    document.getElementById("orderQuantity");

const orderTotal =
    document.getElementById("orderTotal");

const orderCreated =
    document.getElementById("orderCreated");

const customerName =
    document.getElementById("customerName");

const customerWhatsapp =
    document.getElementById("customerWhatsapp");

const customerCity =
    document.getElementById("customerCity");

const productImage =
    document.getElementById("productImage");

const productName =
    document.getElementById("productName");

const productSlug =
    document.getElementById("productSlug");

const productPrice =
    document.getElementById("productPrice");

const whatsappButton =
    document.getElementById("whatsappButton");

const logoutButton =
    document.getElementById("logoutButton");


// ======================================================
// STATE
// ======================================================

let currentOrder = null;


// ======================================================
// GET ORDER ID
// ======================================================

function getOrderId() {

    const params =
        new URLSearchParams(window.location.search);

    return params.get("id");
}


// ======================================================
// ADMIN CHECK
// ======================================================

async function checkAdmin() {

    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();

    if (error) {
        throw error;
    }

    if (!session) {
        window.location.href = "login.html";
        return false;
    }

    const {
        data: isAdmin,
        error: adminError
    } = await supabaseClient.rpc("is_admin");

    if (adminError) {
        throw adminError;
    }

    if (isAdmin !== true) {

        await supabaseClient.auth.signOut();

        window.location.href = "login.html";

        return false;
    }

    return true;
}


// ======================================================
// LOAD ORDER
// ======================================================

async function loadOrder() {

    const orderId = getOrderId();

    if (!orderId) {
        throw new Error("No order ID was provided.");
    }


    // --------------------------------------------------
    // ORDER
    // --------------------------------------------------

    const {
        data: order,
        error: orderError
    } = await supabaseClient
        .from("orders")
        .select(`
            id,
            order_number,
            customer_id,
            product_id,
            price_at_order_time,
            quantity,
            total_price,
            status,
            notes,
            created_at
        `)
        .eq("id", orderId)
        .single();


    if (orderError) {
        throw orderError;
    }

    if (!order) {
        throw new Error("Order not found.");
    }


    // --------------------------------------------------
    // CUSTOMER
    // --------------------------------------------------

    let customer = {};

    if (order.customer_id) {

        const {
            data,
            error
        } = await supabaseClient
            .from("customers")
            .select(`
                id,
                full_name,
                whatsapp,
                city
            `)
            .eq("id", order.customer_id)
            .maybeSingle();

        if (error) {
            console.warn("Customer load error:", error);
        } else {
            customer = data || {};
        }

    }


    // --------------------------------------------------
    // PRODUCT
    // --------------------------------------------------

    let product = {};

    if (order.product_id) {

        const {
            data,
            error
        } = await supabaseClient
            .from("products")
            .select(`
                id,
                name,
                slug,
                price,
                main_image_url
            `)
            .eq("id", order.product_id)
            .maybeSingle();

        if (error) {
            console.warn("Product load error:", error);
        } else {
            product = data || {};
        }

    }


    currentOrder = {
        ...order,
        customer,
        product
    };


    renderOrder(currentOrder);
}


// ======================================================
// RENDER ORDER
// ======================================================

function renderOrder(order) {

    const customer = order.customer || {};
    const product = order.product || {};


    /* HEADER */

    if (pageTitle)
        pageTitle.textContent =
            order.order_number || "Order Details";

    if (orderSubtitle)
        orderSubtitle.textContent =
            `Created ${formatDate(order.created_at)}`;


    /* ORDER CARD */

    if (orderNumber)
        orderNumber.textContent =
            order.order_number || "Not provided";

    if (statusSelect)
        statusSelect.value =
            order.status || "new";

    if (orderPrice)
        orderPrice.textContent =
            formatPrice(order.price_at_order_time);

    if (orderQuantity)
        orderQuantity.textContent =
            order.quantity
                ? `${Number(order.quantity).toLocaleString("en-PK")} cards`
                : "—";

    if (orderTotal)
        orderTotal.textContent =
            order.total_price !== null &&
            order.total_price !== undefined &&
            order.total_price !== ""
                ? formatPrice(order.total_price)
                : "—";

    if (orderCreated)
        orderCreated.textContent =
            formatDate(order.created_at);


    /* CUSTOMER CARD */

    if (customerName)
        customerName.textContent =
            customer.full_name || "Not provided";

    if (customerWhatsapp)
        customerWhatsapp.textContent =
            customer.whatsapp || "Not provided";

    if (customerCity)
        customerCity.textContent =
            customer.city || "Not provided";


    /* WHATSAPP BUTTON */

    if (whatsappButton) {

        if (customer.whatsapp) {

            const phone =
                customer.whatsapp.replace(/\D/g, "");

            whatsappButton.href =
                `https://wa.me/${phone}`;

            whatsappButton.style.display =
                "inline-block";

        } else {

            whatsappButton.style.display =
                "none";

        }

    }


    /* PRODUCT CARD */

    if (productName)
        productName.textContent =
            product.name || "Not provided";

    if (productSlug)
        productSlug.textContent =
            product.slug || "Not provided";

    if (productPrice)
        productPrice.textContent =
            formatPrice(
                order.price_at_order_time ||
                product.price
            );

    if (productImage) {

        productImage.style.backgroundImage =
            product.main_image_url
                ? `url("${product.main_image_url}")`
                : "none";

    }


    /* SHOW PAGE */

    if (loadingBox)
        loadingBox.style.display = "none";

    if (errorBox)
        errorBox.style.display = "none";

    if (orderContent)
        orderContent.style.display = "grid";
}


// ======================================================
// STATUS UPDATE
// ======================================================

if (statusSelect) {

    statusSelect.addEventListener(
        "change",
        async () => {

            if (!currentOrder) return;

            const oldStatus = currentOrder.status;
            const newStatus = statusSelect.value;

            statusSelect.disabled = true;

            try {

                const { error } = await supabaseClient
                    .from("orders")
                    .update({ status: newStatus })
                    .eq("id", currentOrder.id);

                if (error) throw error;

                currentOrder.status = newStatus;

            }
            catch (error) {

                statusSelect.value = oldStatus;

                alert(
                    error.message ||
                    "Unable to update order status."
                );

            }

            statusSelect.disabled = false;

        }
    );

}


// ======================================================
// LOGOUT
// ======================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();

            await supabaseClient.auth.signOut();

            window.location.href = "login.html";

        }
    );

}


// ======================================================
// HELPERS
// ======================================================

function formatPrice(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    return `PKR ${Number(value).toLocaleString("en-PK")}`;

}


function formatDate(value) {

    if (!value) {
        return "Not available";
    }

    return new Date(value)
        .toLocaleString("en-PK", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

}


// ======================================================
// ERROR
// ======================================================

function showError(error) {

    console.error("Order detail error:", error);

    if (loadingBox)
        loadingBox.style.display = "none";

    if (orderContent)
        orderContent.style.display = "none";

    if (errorBox) {

        errorBox.style.display = "block";

        errorBox.textContent =
            error?.message || "Unable to load order.";

    }

}


// ======================================================
// INITIALIZE
// ======================================================

(async function init() {

    try {

        const isAdmin = await checkAdmin();

        if (!isAdmin) return;

        await loadOrder();

    }
    catch (error) {

        showError(error);

    }

})();