import {
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
} from "../config.js";


const supabase =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


const elements = {

    form:
        document.getElementById("categoryForm"),

    formTitle:
        document.getElementById("categoryFormTitle"),

    id:
        document.getElementById("categoryId"),

    name:
        document.getElementById("categoryName"),

    slug:
        document.getElementById("categorySlug"),

    description:
        document.getElementById("categoryDescription"),

    image:
        document.getElementById("categoryImage"),

    currentImage:
        document.getElementById(
            "categoryCurrentImage"
        ),

    sortOrder:
        document.getElementById(
            "categorySortOrder"
        ),

    featured:
        document.getElementById(
            "categoryFeatured"
        ),

    active:
        document.getElementById(
            "categoryActive"
        ),

    error:
        document.getElementById(
            "categoryFormError"
        ),

    saveButton:
        document.getElementById(
            "saveCategoryButton"
        ),

    cancelButton:
        document.getElementById(
            "cancelCategoryEdit"
        ),

    table:
        document.getElementById(
            "categoriesTable"
        ),

    count:
        document.getElementById(
            "categoryCount"
        ),

    logout:
        document.getElementById(
            "logoutButton"
        )

};


let editingCategory = null;


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   ADMIN CHECK
========================================================= */

async function requireAdmin() {

    const {
        data,
        error
    } = await supabase.auth.getSession();


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
    } = await supabase
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


/* =========================================================
   LOAD CATEGORIES
========================================================= */

async function loadCategories() {

    elements.table.textContent =
        "Loading...";


    const {
        data,
        error
    } = await supabase
        .from("categories")
        .select("*")
        .order(
            "sort_order",
            {
                ascending: true
            }
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(error);

        elements.table.innerHTML = `
            <div class="admin-empty-state">
                Unable to load categories.
                <br>
                ${escapeHtml(error.message)}
            </div>
        `;

        return;

    }


    elements.count.textContent =
        `${data.length} ${
            data.length === 1
                ? "category"
                : "categories"
        }`;


    if (!data.length) {

        elements.table.innerHTML = `
            <div class="admin-empty-state">
                No categories yet.
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
                        Name
                    </th>

                    <th>
                        Slug
                    </th>

                    <th>
                        Status
                    </th>

                    <th>
                        Featured
                    </th>

                    <th>
                        Sort
                    </th>

                    <th>
                        Actions
                    </th>

                </tr>

            </thead>


            <tbody>

                ${data.map(category => `

                    <tr>

                        <td>

                            ${
                                category.image_url
                                    ? `
                                        <img
                                            src="${escapeHtml(category.image_url)}"
                                            class="admin-table-image"
                                            alt=""
                                        >
                                    `
                                    : `
                                        <div
                                            class="admin-table-image admin-no-image"
                                        >
                                            —
                                        </div>
                                    `
                            }

                        </td>


                        <td>
                            <strong>
                                ${escapeHtml(category.name)}
                            </strong>
                        </td>


                        <td>
                            ${escapeHtml(category.slug)}
                        </td>


                        <td>

                            <span
                                class="
                                    admin-status
                                    ${
                                        category.status === "active"
                                            ? "active"
                                            : "inactive"
                                    }
                                "
                            >
                                ${
                                    category.status === "active"
                                        ? "Active"
                                        : "Inactive"
                                }
                            </span>

                        </td>


                        <td>
                            ${
                                category.featured
                                    ? "Yes"
                                    : "No"
                            }
                        </td>


                        <td>
                            ${category.sort_order}
                        </td>


                        <td>

                            <div
                                class="admin-row-actions"
                            >

                                <button
                                    type="button"
                                    class="admin-small-button"
                                    data-action="edit"
                                    data-id="${category.id}"
                                >
                                    Edit
                                </button>


                                <button
                                    type="button"
                                    class="admin-small-button"
                                    data-action="toggle"
                                    data-id="${category.id}"
                                >
                                    ${
                                        category.status === "active"
                                            ? "Deactivate"
                                            : "Activate"
                                    }
                                </button>


                                <button
                                    type="button"
                                    class="admin-small-button danger"
                                    data-action="delete"
                                    data-id="${category.id}"
                                >
                                    Delete
                                </button>

                            </div>

                        </td>

                    </tr>

                `).join("")}

            </tbody>

        </table>

    `;


    elements.table
        .querySelectorAll(
            "[data-action='edit']"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const category =
                        data.find(
                            item =>
                                item.id ===
                                button.dataset.id
                        );

                    if (category) {
                        startEdit(category);
                    }

                }
            );

        });


    elements.table
        .querySelectorAll(
            "[data-action='toggle']"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const category =
                        data.find(
                            item =>
                                item.id ===
                                button.dataset.id
                        );

                    if (category) {

                        await toggleCategory(
                            category
                        );

                    }

                }
            );

        });


    elements.table
        .querySelectorAll(
            "[data-action='delete']"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const category =
                        data.find(
                            item =>
                                item.id ===
                                button.dataset.id
                        );

                    if (category) {

                        await deleteCategory(
                            category
                        );

                    }

                }
            );

        });

}


/* =========================================================
   START EDIT
========================================================= */

function startEdit(category) {

    editingCategory =
        category;


    elements.formTitle.textContent =
        "Edit Category";


    elements.id.value =
        category.id;


    elements.name.value =
        category.name || "";


    elements.slug.value =
        category.slug || "";


    elements.description.value =
        category.description || "";


    elements.sortOrder.value =
        category.sort_order ?? 0;


    elements.featured.checked =
        Boolean(category.featured);


    elements.active.checked =
        category.status === "active";


    if (category.image_url) {

        elements.currentImage.innerHTML = `

            <img
                src="${escapeHtml(category.image_url)}"
                alt="Current category image"
            >

        `;

    }
    else {

        elements.currentImage.innerHTML = "";

    }


    elements.cancelButton.hidden =
        false;


    elements.saveButton.textContent =
        "Update Category";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   RESET FORM
========================================================= */

function resetForm() {

    editingCategory =
        null;


    elements.form.reset();


    elements.id.value =
        "";


    elements.sortOrder.value =
        "0";


    elements.active.checked =
        true;


    elements.currentImage.innerHTML =
        "";


    elements.formTitle.textContent =
        "Add Category";


    elements.saveButton.textContent =
        "Save Category";


    elements.cancelButton.hidden =
        true;


    elements.error.textContent =
        "";

}


/* =========================================================
   UPLOAD IMAGE
========================================================= */

async function uploadCategoryImage(file) {

    if (!file) {
        return null;
    }


    const maxSize =
        10 * 1024 * 1024;


    if (file.size > maxSize) {

        throw new Error(
            "Image must be smaller than 10MB."
        );

    }


    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const filePath =
        `categories/${crypto.randomUUID()}.${extension}`;


    const {
        error
    } = await supabase.storage
        .from("site-media")
        .upload(
            filePath,
            file,
            {
                cacheControl: "3600",
                upsert: false,
                contentType: file.type
            }
        );


    if (error) {
        throw error;
    }


    const {
        data
    } = supabase.storage
        .from("site-media")
        .getPublicUrl(
            filePath
        );


    return data.publicUrl;

}


/* =========================================================
   SAVE CATEGORY
========================================================= */

async function saveCategory(event) {

    event.preventDefault();


    elements.error.textContent =
        "";


    const name =
        elements.name.value.trim();


    const slug =
        elements.slug.value
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");


    const description =
        elements.description.value.trim();


    const sortOrder =
        Number(
            elements.sortOrder.value
        ) || 0;


    const status =
        elements.active.checked
            ? "active"
            : "inactive";


    const featured =
        elements.featured.checked;


    if (!name) {

        elements.error.textContent =
            "Category name is required.";

        return;

    }


    if (!slug) {

        elements.error.textContent =
            "A valid slug is required.";

        return;

    }


    elements.saveButton.disabled =
        true;


    elements.saveButton.textContent =
        "Saving...";


    try {

        let imageUrl =
            editingCategory?.image_url ||
            null;


        if (
            elements.image.files.length
        ) {

            imageUrl =
                await uploadCategoryImage(
                    elements.image.files[0]
                );

        }


        const payload = {

            name,

            slug,

            description:
                description || null,

            image_url:
                imageUrl,

            status,

            featured,

            sort_order: sortOrder,

            updated_at:
                new Date().toISOString()

        };


        let result;


        if (editingCategory) {

            result =
                await supabase
                    .from("categories")
                    .update(payload)
                    .eq(
                        "id",
                        editingCategory.id
                    );

        }
        else {

            result =
                await supabase
                    .from("categories")
                    .insert(payload);

        }


        if (result.error) {
            throw result.error;
        }


        resetForm();

        await loadCategories();

    }
    catch (error) {

        console.error(error);

        elements.error.textContent =
            error.message ||
            "Unable to save category.";

    }
    finally {

        elements.saveButton.disabled =
            false;

        if (!editingCategory) {

            elements.saveButton.textContent =
                "Save Category";

        }
        else {

            elements.saveButton.textContent =
                "Update Category";

        }

    }

}


/* =========================================================
   TOGGLE CATEGORY
========================================================= */

async function toggleCategory(category) {

    const newStatus =
        category.status === "active"
            ? "inactive"
            : "active";


    const {
        error
    } = await supabase
        .from("categories")
        .update({
            status: newStatus,
            updated_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            category.id
        );


    if (error) {

        alert(
            error.message
        );

        return;

    }


    await loadCategories();

}


/* =========================================================
   DELETE CATEGORY
========================================================= */

async function deleteCategory(category) {

    const confirmed =
        window.confirm(
            `Delete "${category.name}"?`
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } = await supabase
        .from("categories")
        .delete()
        .eq(
            "id",
            category.id
        );


    if (error) {

        alert(
            "This category cannot be deleted if products are assigned to it.\n\n" +
            error.message
        );

        return;

    }


    await loadCategories();

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    await supabase.auth.signOut();

    window.location.href =
        "login.html";

}


/* =========================================================
   EVENTS
========================================================= */

elements.form.addEventListener(
    "submit",
    saveCategory
);


elements.cancelButton.addEventListener(
    "click",
    resetForm
);


elements.logout.addEventListener(
    "click",
    logout
);


/* =========================================================
   AUTO SLUG
========================================================= */

elements.name.addEventListener(
    "input",
    () => {

        if (editingCategory) {
            return;
        }


        elements.slug.value =
            elements.name.value
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(
                    /[^a-z0-9-]/g,
                    ""
                );

    }
);


/* =========================================================
   INIT
========================================================= */

async function init() {

    const isAdmin =
        await requireAdmin();


    if (!isAdmin) {
        return;
    }


    await loadCategories();

}


init();