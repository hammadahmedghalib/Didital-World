import {
    getCategories,
    getProducts
} from "./catalog.js";


function renderCategories(
    categories
) {

    const container =
        document.getElementById(
            "categoryGrid"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        categories.map(
            category => {

                return `
                    <a
                        href="category.html?category=${category.slug}"
                        class="category-card"
                    >

                        <img
                            src="${category.image_url || ""}"
                            alt="${category.name} wedding invitations"
                            loading="lazy"
                        >

                        <div
                            class="category-card-overlay"
                        >

                            <h3>
                                ${category.name}
                            </h3>

                        </div>

                    </a>
                `;

            }
        ).join("");
}


function renderFeaturedProducts(
    products
) {

    const container =
        document.getElementById(
            "featuredProducts"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        products.map(
            product => {

                const categoryName =
                    product.categories?.name ||
                    "";


                const badge =
                    product.featured
                        ? "FEATURED"
                        : product.popular
                            ? "POPULAR"
                            : "";


                return `
                    <article
                        class="product-card"
                    >

                        <a
                            href="invitation.html?slug=${product.slug}"
                        >

                            <div
                                class="product-card-image"
                            >

                                ${
                                    badge
                                        ? `
                                            <span
                                                class="product-card-badge"
                                            >
                                                ${badge}
                                            </span>
                                        `
                                        : ""
                                }

                                <img
                                    src="${product.main_image_url || ""}"
                                    alt="${product.name} wedding invitation"
                                    loading="lazy"
                                >

                            </div>


                            <div
                                class="product-card-body"
                            >

                                <span
                                    class="product-card-category"
                                >
                                    ${categoryName}
                                </span>


                                <h3>
                                    ${product.name}
                                </h3>


                                <p
                                    class="product-card-price"
                                >
                                    PKR ${Number(
                                        product.price
                                    ).toLocaleString()}
                                </p>


                                <span
                                    class="product-card-button"
                                >
                                    View Design
                                </span>

                            </div>

                        </a>

                    </article>
                `;

            }
        ).join("");
}


function setupMobileMenu() {

    const button =
        document.getElementById(
            "mobileMenuButton"
        );


    const menu =
        document.getElementById(
            "mobileNav"
        );


    if (!button || !menu) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            menu.classList.toggle(
                "active"
            );

        }
    );

}


async function init() {

    try {

        const categories =
            await getCategories();


        const products =
            await getProducts({
                featured: true
            });


        renderCategories(
            categories
        );


        renderFeaturedProducts(
            products
        );


        setupMobileMenu();

    }
    catch (error) {

        console.error(
            "Homepage failed to load:",
            error
        );

    }

}


document.addEventListener(
    "DOMContentLoaded",
    init
);