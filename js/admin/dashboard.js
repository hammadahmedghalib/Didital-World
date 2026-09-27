import {
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
} from "../config.js";


const supabase =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


async function requireAdmin() {

    const {
        data,
        error
    } = await supabase.auth.getSession();


    if (error || !data.session) {

        window.location.href =
            "login.html";

        return false;

    }


    const {
        data: admin,
        error: adminError
    } = await supabase
        .from("admin_profiles")
        .select("user_id,role,is_active")
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


async function loadStats() {

    const [
        productsResult,
        categoriesResult,
        newOrdersResult,
        progressOrdersResult,
        completedOrdersResult
    ] =
        await Promise.all([

            supabase
                .from("products")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                ),

            supabase
                .from("categories")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                ),

            supabase
                .from("orders")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "status",
                    "new"
                ),

            supabase
                .from("orders")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .in(
                    "status",
                    [
                        "contacted",
                        "details_pending",
                        "in_progress",
                        "preview_ready",
                        "revision"
                    ]
                ),

            supabase
                .from("orders")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "status",
                    "completed"
                )

        ]);


    document.getElementById(
        "totalProducts"
    ).textContent =
        productsResult.count || 0;


    document.getElementById(
        "totalCategories"
    ).textContent =
        categoriesResult.count || 0;


    document.getElementById(
        "newOrders"
    ).textContent =
        newOrdersResult.count || 0;


    document.getElementById(
        "inProgressOrders"
    ).textContent =
        progressOrdersResult.count || 0;


    document.getElementById(
        "completedOrders"
    ).textContent =
        completedOrdersResult.count || 0;

}


async function loadRecentOrders() {

    const container =
        document.getElementById(
            "recentOrders"
        );


    const {
        data,
        error
    } = await supabase
        .from("orders")
        .select(`
            id,
            order_number,
            price_at_order_time,
            status,
            created_at,
            customers (
                full_name
            ),
            products (
                name
            )
        `)
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .limit(10);


    if (error) {

        console.error(error);

        container.textContent =
            "Unable to load recent orders.";

        return;

    }


    if (!data?.length) {

        container.textContent =
            "No orders yet.";

        return;

    }


    container.innerHTML = `

        <table class="admin-table">

            <thead>

                <tr>

                    <th>
                        Order
                    </th>

                    <th>
                        Customer
                    </th>

                    <th>
                        Product
                    </th>

                    <th>
                        Price
                    </th>

                    <th>
                        Status
                    </th>

                    <th>
                        Date
                    </th>

                </tr>

            </thead>

            <tbody>

                ${data.map(order => `

                    <tr>

                        <td>
                            ${order.order_number}
                        </td>

                        <td>
                            ${
                                order.customers?.full_name ||
                                "—"
                            }
                        </td>

                        <td>
                            ${
                                order.products?.name ||
                                "—"
                            }
                        </td>

                        <td>
                            PKR ${
                                Number(
                                    order.price_at_order_time
                                ).toLocaleString()
                            }
                        </td>

                        <td>
                            ${order.status}
                        </td>

                        <td>
                            ${
                                new Date(
                                    order.created_at
                                ).toLocaleDateString()
                            }
                        </td>

                    </tr>

                `).join("")}

            </tbody>

        </table>

    `;

}


async function logout() {

    await supabase.auth.signOut();

    window.location.href =
        "login.html";

}


async function init() {

    const isAdmin =
        await requireAdmin();


    if (!isAdmin) {
        return;
    }


    await loadStats();

    await loadRecentOrders();


    document
        .getElementById(
            "logoutButton"
        )
        .addEventListener(
            "click",
            logout
        );

}


init();