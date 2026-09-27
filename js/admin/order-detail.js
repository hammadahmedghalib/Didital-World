import { supabaseClient } from "../supabase.js";

// ======================================================
// ELEMENTS
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

const orderCreated =
    document.getElementById("orderCreated");

const customerName =
    document.getElementById("customerName");

const customerWhatsapp =
    document.getElementById("customerWhatsapp");

const customerEmail =
    document.getElementById("customerEmail");

const customerCity =
    document.getElementById("customerCity");

const customerCountry =
    document.getElementById("customerCountry");

const productImage =
    document.getElementById("productImage");

const productName =
    document.getElementById("productName");

const productSlug =
    document.getElementById("productSlug");

const productPrice =
    document.getElementById("productPrice");

const brideName =
    document.getElementById("brideName");

const groomName =
    document.getElementById("groomName");

const weddingDate =
    document.getElementById("weddingDate");

const weddingTime =
    document.getElementById("weddingTime");

const eventType =
    document.getElementById("eventType");

const venue =
    document.getElementById("venue");

const customText =
    document.getElementById("customText");

const specialRequirements =
    document.getElementById("specialRequirements");

const notes =
    document.getElementById("notes");

const whatsappButton =
    document.getElementById("whatsappButton");

const logoutButton =
    document.getElementById("logoutButton");

const referenceSection =
    document.getElementById("referenceFilesSection");

const referenceList =
    document.getElementById("referenceFilesList");

const referenceUploadMessage =
    document.getElementById("referenceUploadMessage");


// ======================================================
// STATE
// ======================================================

let currentOrder = null;


// ======================================================
// GET ORDER ID
// ======================================================

function getOrderId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");
}


// ======================================================
// ADMIN CHECK
// ======================================================

async function checkAdmin() {

    const {
        data: {
            session
        },
        error
    } = await supabaseClient.auth.getSession();

    if (error) {
        throw error;
    }

    if (!session) {

        window.location.href =
            "login.html";

        return false;
    }


    const {
        data: isAdmin,
        error: adminError
    } = await supabaseClient.rpc(
        "is_admin"
    );

    if (adminError) {
        throw adminError;
    }

    if (isAdmin !== true) {

        await supabaseClient.auth.signOut();

        window.location.href =
            "login.html";

        return false;
    }

    return true;
}


// ======================================================
// LOAD ORDER
// ======================================================

async function loadOrder() {

    const orderId =
        getOrderId();

    if (!orderId) {

        throw new Error(
            "No order ID was provided."
        );
    }


    // ==================================================
    // ORDER
    // ==================================================

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
            status,
            notes,
            created_at
        `)
        .eq(
            "id",
            orderId
        )
        .single();


    if (orderError) {
        throw orderError;
    }


    if (!order) {

        throw new Error(
            "Order not found."
        );
    }


    // ==================================================
    // CUSTOMER
    // ==================================================

    const {
        data: customer,
        error: customerError
    } = await supabaseClient
        .from("customers")
        .select(`
            id,
            full_name,
            whatsapp,
            email,
            city,
            country
        `)
        .eq(
            "id",
            order.customer_id
        )
        .maybeSingle();


    if (customerError) {
        throw customerError;
    }


    // ==================================================
    // PRODUCT
    // ==================================================

    const {
        data: product,
        error: productError
    } = await supabaseClient
        .from("products")
        .select(`
            id,
            name,
            slug,
            price,
            main_image_url
        `)
        .eq(
            "id",
            order.product_id
        )
        .maybeSingle();


    if (productError) {
        throw productError;
    }


    // ==================================================
    // WEDDING
    // ==================================================

    const {
        data: wedding,
        error: weddingError
    } = await supabaseClient
        .from("wedding_details")
        .select(`
            order_id,
            bride_name,
            groom_name,
            wedding_date,
            wedding_time,
            venue,
            event_type,
            custom_text,
            special_requirements,
            notes
        `)
        .eq(
            "order_id",
            orderId
        )
        .maybeSingle();


    if (weddingError) {
        throw weddingError;
    }


    // ==================================================
    // REFERENCE FILES
    // ==================================================

    let files = [];


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("order_files")
            .select(`
                id,
                order_id,
                file_url,
                file_name,
                file_type,
                file_size,
                created_at
            `)
            .eq(
                "order_id",
                orderId
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            console.warn(
                "Reference files could not be loaded:",
                error
            );

        } else {

            files =
                data || [];

        }

    } catch (error) {

        console.warn(
            "Reference files query failed:",
            error
        );
    }


    currentOrder = {

        ...order,

        customer:
            customer || {},

        product:
            product || {},

        wedding:
            wedding || {},

        files

    };


    console.log(
        "Complete admin order:",
        currentOrder
    );


    renderOrder(
        currentOrder
    );
}


// ======================================================
// RENDER ORDER
// ======================================================

function renderOrder(order) {

    const customer =
        order.customer || {};

    const product =
        order.product || {};

    const wedding =
        order.wedding || {};

    const files =
        order.files || [];


    // ==================================================
    // HEADER
    // ==================================================

    pageTitle.textContent =
        order.order_number ||
        "Order Details";


    orderSubtitle.textContent =
        `Created ${formatDate(
            order.created_at
        )}`;


    // ==================================================
    // ORDER
    // ==================================================

    orderNumber.textContent =
        order.order_number ||
        "Not provided";


    statusSelect.value =
        order.status ||
        "new";


    orderPrice.textContent =
        formatPrice(
            order.price_at_order_time
        );


    orderCreated.textContent =
        formatDate(
            order.created_at
        );


    // ==================================================
    // CUSTOMER
    // ==================================================

    customerName.textContent =
        customer.full_name ||
        "Not provided";


    customerWhatsapp.textContent =
        customer.whatsapp ||
        "Not provided";


    customerEmail.textContent =
        customer.email ||
        "Not provided";


    customerCity.textContent =
        customer.city ||
        "Not provided";


    customerCountry.textContent =
        customer.country ||
        "Not provided";


    // ==================================================
    // WHATSAPP
    // ==================================================

    if (customer.whatsapp) {

        const phone =
            customer.whatsapp.replace(
                /\D/g,
                ""
            );


        whatsappButton.href =
            `https://wa.me/${phone}`;


        whatsappButton.style.display =
            "inline-block";

    } else {

        whatsappButton.style.display =
            "none";
    }


    // ==================================================
    // PRODUCT
    // ==================================================

    productName.textContent =
        product.name ||
        "Not provided";


    productSlug.textContent =
        product.slug ||
        "Not provided";


    productPrice.textContent =
        formatPrice(
            order.price_at_order_time ||
            product.price
        );


    if (product.main_image_url) {

        productImage.style.backgroundImage =
            `url("${product.main_image_url}")`;

    } else {

        productImage.style.backgroundImage =
            "none";
    }


    // ==================================================
    // WEDDING
    // ==================================================

    brideName.textContent =
        wedding.bride_name ||
        "Not provided";


    groomName.textContent =
        wedding.groom_name ||
        "Not provided";


    weddingDate.textContent =
        wedding.wedding_date ||
        "Not provided";


    weddingTime.textContent =
        wedding.wedding_time ||
        "Not provided";


    eventType.textContent =
        wedding.event_type ||
        "Not provided";


    venue.textContent =
        wedding.venue ||
        "Not provided";


    // ==================================================
    // ADDITIONAL
    // ==================================================

    customText.textContent =
        wedding.custom_text ||
        "Not provided";


    specialRequirements.textContent =
        wedding.special_requirements ||
        "Not provided";


    const weddingNotes =
        String(
            wedding.notes || ""
        ).trim();


    const orderNotes =
        String(
            order.notes || ""
        ).trim();


    notes.textContent =
        weddingNotes ||
        orderNotes ||
        "Not provided";


    // ==================================================
    // REFERENCE FILES
    // ==================================================

    renderReferenceFiles(
        files
    );


    // ==================================================
    // SHOW PAGE
    // ==================================================

    loadingBox.style.display =
        "none";

    errorBox.style.display =
        "none";

    orderContent.style.display =
        "grid";
}


// ======================================================
// RENDER REFERENCE FILES
// ======================================================

function renderReferenceFiles(files) {

    if (!referenceSection ||
        !referenceList) {

        return;
    }


    referenceSection.style.display =
        "block";


    if (!files.length) {

        referenceList.innerHTML = `
            <p class="empty-file">
                No reference file was uploaded with this order.
            </p>
        `;

        return;
    }


    referenceList.innerHTML =
        files
            .map(file => {

                return `

                    <div class="reference-file">

                        <div
                            class="reference-file-name"
                        >
                            ${escapeHtml(
                                file.file_name
                            )}
                        </div>


                        <div
                            class="reference-file-meta"
                        >
                            ${escapeHtml(
                                formatFileSize(
                                    file.file_size
                                )
                            )}

                            •

                            ${escapeHtml(
                                file.file_type ||
                                "Unknown type"
                            )}
                        </div>


                        <button
                            type="button"
                            class="button primary reference-file-button"
                            data-file-path="${escapeHtml(
                                file.file_url
                            )}"
                        >
                            View / Download
                        </button>

                    </div>

                `;

            })
            .join("");


    referenceList
        .querySelectorAll(
            ".reference-file-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openReferenceFile(
                        button.dataset.filePath
                    );

                }
            );

        });
}


// ======================================================
// OPEN PRIVATE FILE
// ======================================================

async function openReferenceFile(
    storagePath
) {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .storage
            .from("order-files")
            .createSignedUrl(
                storagePath,
                300
            );


        if (error) {
            throw error;
        }


        if (!data?.signedUrl) {

            throw new Error(
                "Could not create secure file link."
            );
        }


        window.open(
            data.signedUrl,
            "_blank"
        );

    } catch (error) {

        console.error(
            "Reference file error:",
            error
        );


        alert(
            error.message ||
            "Unable to open reference file."
        );
    }
}


// ======================================================
// UPDATE STATUS
// ======================================================

statusSelect.addEventListener(
    "change",
    async () => {

        if (!currentOrder) {
            return;
        }


        const oldStatus =
            currentOrder.status;


        const newStatus =
            statusSelect.value;


        statusSelect.disabled =
            true;


        try {

            const {
                error
            } = await supabaseClient
                .from("orders")
                .update({
                    status:
                        newStatus
                })
                .eq(
                    "id",
                    currentOrder.id
                );


            if (error) {
                throw error;
            }


            currentOrder.status =
                newStatus;


        } catch (error) {

            statusSelect.value =
                oldStatus;


            alert(
                error.message ||
                "Unable to update order status."
            );

        }


        statusSelect.disabled =
            false;
    }
);


// ======================================================
// LOGOUT
// ======================================================

logoutButton.addEventListener(
    "click",
    async event => {

        event.preventDefault();

        await supabaseClient.auth.signOut();

        window.location.href =
            "login.html";

    }
);


// ======================================================
// HELPERS
// ======================================================

function formatPrice(value) {

    return `PKR ${Number(
        value || 0
    ).toLocaleString(
        "en-PK"
    )}`;
}


function formatDate(value) {

    if (!value) {
        return "Not available";
    }


    return new Date(value)
        .toLocaleString(
            "en-PK",
            {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
}


function formatFileSize(bytes) {

    if (!bytes) {
        return "Unknown size";
    }


    if (bytes < 1024) {

        return `${bytes} B`;

    }


    if (bytes < 1024 * 1024) {

        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;

    }


    return `${(
        bytes /
        (1024 * 1024)
    ).toFixed(1)} MB`;
}


function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


// ======================================================
// ERROR
// ======================================================

function showError(error) {

    console.error(
        "Order detail error:",
        error
    );


    loadingBox.style.display =
        "none";


    orderContent.style.display =
        "none";


    errorBox.style.display =
        "block";


    errorBox.textContent =
        error?.message ||
        "Unable to load order.";
}


// ======================================================
// INITIALIZE
// ======================================================

(async function init() {

    try {

        const isAdmin =
            await checkAdmin();


        if (!isAdmin) {
            return;
        }


        await loadOrder();

    } catch (error) {

        showError(
            error
        );

    }

})();