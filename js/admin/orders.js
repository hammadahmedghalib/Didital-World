import { supabaseClient } from "../supabase.js";

// ======================================================
// ELEMENTS
// ======================================================

const tableBody =
    document.getElementById("ordersTableBody");

const message =
    document.getElementById("ordersMessage");

const searchInput =
    document.getElementById("searchOrders");

const statusFilter =
    document.getElementById("statusFilter");

const refreshButton =
    document.getElementById("refreshOrders");

const logoutButton =
    document.getElementById("logoutButton");

const totalOrders =
    document.getElementById("totalOrders");

const newOrders =
    document.getElementById("newOrders");

const progressOrders =
    document.getElementById("progressOrders");

const completedOrders =
    document.getElementById("completedOrders");


let orders = [];


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

        window.location.href =
            "login.html";

        return false;
    }

    return true;
}


// ======================================================
// LOAD ORDERS
// ======================================================

async function loadOrders() {

    if (message) {
        message.textContent =
            "Loading orders...";
    }


    console.log(
        "=== LOADING ORDERS ==="
    );


    // ==================================================
    // 1. LOAD ORDERS
    // ==================================================

    const {
        data: orderRows,
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
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (orderError) {

        console.error(
            "ORDERS ERROR:",
            orderError
        );

        throw orderError;
    }


    orders =
        orderRows || [];


    console.log(
        "ORDERS:",
        orders
    );


    // ==================================================
    // NO ORDERS
    // ==================================================

    if (!orders.length) {

        updateStats();

        renderOrders();

        message.textContent =
            "0 order(s) found.";

        return;
    }


    // ==================================================
    // IDS
    // ==================================================

    const customerIds = [
        ...new Set(
            orders
                .map(
                    order =>
                        order.customer_id
                )
                .filter(Boolean)
        )
    ];


    const productIds = [
        ...new Set(
            orders
                .map(
                    order =>
                        order.product_id
                )
                .filter(Boolean)
        )
    ];


    const orderIds =
        orders.map(
            order =>
                order.id
        );


    // ==================================================
    // 2. LOAD CUSTOMERS
    // ==================================================

    let customers = [];


    if (customerIds.length) {

        const {
            data,
            error
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
            .in(
                "id",
                customerIds
            );


        if (error) {

            console.error(
                "CUSTOMERS ERROR:",
                error
            );

            throw error;
        }


        customers =
            data || [];
    }


    // ==================================================
    // 3. LOAD PRODUCTS
    // ==================================================

    let products = [];


    if (productIds.length) {

        const {
            data,
            error
        } = await supabaseClient
            .from("products")
            .select(`
                id,
                name,
                slug,
                main_image_url
            `)
            .in(
                "id",
                productIds
            );


        if (error) {

            console.error(
                "PRODUCTS ERROR:",
                error
            );

            throw error;
        }


        products =
            data || [];
    }


    // ==================================================
    // 4. LOAD WEDDING DETAILS
    // ==================================================

    let weddingDetails = [];


    if (orderIds.length) {

        const {
            data,
            error
        } = await supabaseClient
            .from("wedding_details")
            .select(`
                order_id,
                bride_name,
                groom_name,
                wedding_date,
                wedding_time,
                venue,
                event_type
            `)
            .in(
                "order_id",
                orderIds
            );


        if (error) {

            console.error(
                "WEDDING DETAILS ERROR:",
                error
            );

            throw error;
        }


        weddingDetails =
            data || [];
    }


    // ==================================================
    // 5. LOAD REFERENCE FILES
    //
    // OPTIONAL:
    // If this fails, do NOT stop the Orders page.
    // ==================================================

    let referenceFiles = [];


    if (orderIds.length) {

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
                .in(
                    "order_id",
                    orderIds
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


            if (error) {

                console.warn(
                    "REFERENCE FILES COULD NOT BE LOADED:",
                    error
                );

            } else {

                referenceFiles =
                    data || [];

            }

        } catch (error) {

            console.warn(
                "REFERENCE FILE QUERY FAILED:",
                error
            );

        }
    }


    // ==================================================
    // 6. CREATE MAPS
    // ==================================================

    const customerMap =
        new Map(
            customers.map(
                customer => [
                    customer.id,
                    customer
                ]
            )
        );


    const productMap =
        new Map(
            products.map(
                product => [
                    product.id,
                    product
                ]
            )
        );


    const weddingMap =
        new Map(
            weddingDetails.map(
                wedding => [
                    wedding.order_id,
                    wedding
                ]
            )
        );


    const fileMap =
        new Map();


    referenceFiles.forEach(file => {

        if (!fileMap.has(file.order_id)) {

            fileMap.set(
                file.order_id,
                []
            );

        }


        fileMap
            .get(file.order_id)
            .push(file);

    });


    // ==================================================
    // 7. COMBINE
    // ==================================================

    orders =
        orders.map(order => ({

            ...order,

            customers:
                customerMap.get(
                    order.customer_id
                ) || {},

            products:
                productMap.get(
                    order.product_id
                ) || {},

            wedding_details:
                weddingMap.get(
                    order.id
                ) || {},

            order_files:
                fileMap.get(
                    order.id
                ) || []

        }));


    console.log(
        "FINAL ORDERS:",
        orders
    );


    // ==================================================
    // 8. RENDER
    // ==================================================

    updateStats();

    renderOrders();


    message.textContent =
        `${orders.length} order(s) found.`;
}


// ======================================================
// STATS
// ======================================================

function updateStats() {

    totalOrders.textContent =
        orders.length;


    newOrders.textContent =
        orders.filter(
            order =>
                order.status === "new"
        ).length;


    progressOrders.textContent =
        orders.filter(
            order =>
                order.status === "in_progress"
        ).length;


    completedOrders.textContent =
        orders.filter(
            order =>
                order.status === "completed"
        ).length;
}


// ======================================================
// FILTER
// ======================================================

function filteredOrders() {

    const search =
        searchInput?.value
            ?.trim()
            .toLowerCase() || "";


    const selectedStatus =
        statusFilter?.value || "all";


    return orders.filter(order => {

        const customer =
            order.customers || {};

        const product =
            order.products || {};


        const searchableText = [

            order.order_number,

            customer.full_name,

            customer.whatsapp,

            customer.email,

            product.name

        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


        const matchesSearch =
            !search ||
            searchableText.includes(
                search
            );


        const matchesStatus =
            selectedStatus === "all" ||
            order.status === selectedStatus;


        return (
            matchesSearch &&
            matchesStatus
        );

    });
}


// ======================================================
// RENDER
// ======================================================

function renderOrders() {

    if (!tableBody) {
        return;
    }


    const list =
        filteredOrders();


    if (!list.length) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="message"
                >
                    No orders found.
                </td>
            </tr>
        `;

        return;
    }


    tableBody.innerHTML =
        list
            .map(createRow)
            .join("");


    // STATUS EVENTS

    tableBody
        .querySelectorAll(
            ".order-status"
        )
        .forEach(select => {

            select.addEventListener(
                "change",
                async () => {

                    await changeStatus(
                        select.dataset.id,
                        select.value,
                        select
                    );

                }
            );

        });


    // REFERENCE EVENTS

    tableBody
        .querySelectorAll(
            ".reference-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    await openReferenceFile(
                        button.dataset.filePath
                    );

                }
            );

        });
}


// ======================================================
// CREATE ROW
// ======================================================

function createRow(order) {

    const customer =
        order.customers || {};

    const product =
        order.products || {};

    const wedding =
        order.wedding_details || {};

    const files =
        order.order_files || [];


    const weddingNames =
        `${wedding.bride_name || "—"} & ${wedding.groom_name || "—"}`;


    const created =
        order.created_at
            ? formatDate(
                order.created_at
            )
            : "—";


    const weddingDate =
        wedding.wedding_date ||
        "—";


    // --------------------------------------------------
    // REFERENCE
    // --------------------------------------------------

    let referenceHtml = `
        <span class="no-reference">
            None
        </span>
    `;


    if (files.length) {

        const file =
            files[0];


        referenceHtml = `

            <button
                type="button"
                class="reference-button"
                data-file-path="${escapeHtml(
                    file.file_url
                )}"
            >
                View File
            </button>


            <span class="reference-name">

                ${escapeHtml(
                    file.file_name
                )}

            </span>

        `;
    }


    return `

        <tr>

            <td>

                <strong>
                    ${escapeHtml(
                        order.order_number ||
                        "—"
                    )}
                </strong>

            </td>


            <td>

                <strong>
                    ${escapeHtml(
                        customer.full_name ||
                        "—"
                    )}
                </strong>

                <small>
                    ${escapeHtml(
                        customer.whatsapp ||
                        ""
                    )}
                </small>

            </td>


            <td>

                ${escapeHtml(
                    product.name ||
                    "—"
                )}

            </td>


            <td>

                <strong>
                    ${escapeHtml(
                        weddingNames
                    )}
                </strong>

                <small>
                    ${escapeHtml(
                        weddingDate
                    )}
                </small>

            </td>


            <td>

                PKR
                ${Number(
                    order.price_at_order_time || 0
                ).toLocaleString(
                    "en-PK"
                )}

            </td>


            <td>

                <select
                    class="order-status status-${escapeHtml(
                        order.status || "new"
                    )}"
                    data-id="${escapeHtml(
                        order.id
                    )}"
                >

                    <option
                        value="new"
                        ${
                            order.status === "new"
                                ? "selected"
                                : ""
                        }
                    >
                        New
                    </option>


                    <option
                        value="in_progress"
                        ${
                            order.status === "in_progress"
                                ? "selected"
                                : ""
                        }
                    >
                        In Progress
                    </option>


                    <option
                        value="completed"
                        ${
                            order.status === "completed"
                                ? "selected"
                                : ""
                        }
                    >
                        Completed
                    </option>


                    <option
                        value="cancelled"
                        ${
                            order.status === "cancelled"
                                ? "selected"
                                : ""
                        }
                    >
                        Cancelled
                    </option>

                </select>

            </td>


            <td>

                ${escapeHtml(
                    created
                )}

            </td>


            <td>

                ${referenceHtml}

            </td>


            <td>

                <a
                    class="view-btn"
                    href="order-detail.html?id=${encodeURIComponent(
                        order.id
                    )}"
                >
                    View
                </a>

            </td>

        </tr>

    `;
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
// CHANGE STATUS
// ======================================================

async function changeStatus(
    orderId,
    newStatus,
    selectElement
) {

    const order =
        orders.find(
            item =>
                item.id === orderId
        );


    const previousStatus =
        order?.status ||
        "new";


    try {

        if (selectElement) {
            selectElement.disabled =
                true;
        }


        const {
            error
        } = await supabaseClient
            .from("orders")
            .update({
                status: newStatus
            })
            .eq(
                "id",
                orderId
            );


        if (error) {
            throw error;
        }


        if (order) {
            order.status =
                newStatus;
        }


        updateStats();

        renderOrders();


        message.textContent =
            "Order status updated.";


    } catch (error) {

        console.error(
            "Status update error:",
            error
        );


        alert(
            error.message ||
            "Could not update order status."
        );


        if (order) {
            order.status =
                previousStatus;
        }


        renderOrders();
    }
}


// ======================================================
// SEARCH
// ======================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        renderOrders
    );

}


// ======================================================
// STATUS FILTER
// ======================================================

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        renderOrders
    );

}


// ======================================================
// REFRESH
// ======================================================

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        async () => {

            try {

                await loadOrders();

            } catch (error) {

                showError(error);

            }

        }
    );

}


// ======================================================
// LOGOUT
// ======================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            await supabaseClient.auth.signOut();

            window.location.href =
                "login.html";

        }
    );

}


// ======================================================
// DATE
// ======================================================

function formatDate(value) {

    if (!value) {
        return "—";
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


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ======================================================
// ERROR
// ======================================================

function showError(error) {

    console.error(
        "Orders page error:",
        error
    );


    if (message) {

        message.textContent =
            "Error loading orders.";

    }


    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="error"
                >
                    ${escapeHtml(
                        error?.message ||
                        "Unknown error"
                    )}
                </td>
            </tr>
        `;

    }
}


// ======================================================
// INIT
// ======================================================

(async function init() {

    try {

        console.log(
            "=== ORDERS PAGE INITIALIZING ==="
        );


        const isAdmin =
            await checkAdmin();


        if (!isAdmin) {
            return;
        }


        console.log(
            "Admin verified."
        );


        await loadOrders();


    } catch (error) {

        showError(error);

    }

})();