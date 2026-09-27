import { supabaseClient } from "./supabase.js";

// ======================================================
// GET ACTIVE CATEGORIES
// ======================================================
export async function getCategories() {
  const { data, error } = await supabaseClient
    .from("categories")
    .select(`
      id,
      name,
      slug,
      description,
      image_url,
      status,
      featured,
      sort_order
    `)
    .eq("status", "active")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getCategories error:", error);
    throw error;
  }

  return data || [];
}


// ======================================================
// GET PUBLISHED PRODUCTS
// ======================================================
export async function getProducts(options = {}) {
  const categorySlug = options.categorySlug || null;

  let selectQuery = `
    id,
    name,
    slug,
    price,
    short_description,
    description,
    main_image_url,
    demo_url,
    style,
    tags,
    event_types,
    status,
    featured,
    popular,
    sort_order,
    category_id,
    categories (
      id,
      name,
      slug
    )
  `;

  // For a specific category, use !inner so Supabase
  // filters the actual product rows by category.
  if (categorySlug && categorySlug !== "all") {
    selectQuery = `
      id,
      name,
      slug,
      price,
      short_description,
      description,
      main_image_url,
      demo_url,
      style,
      tags,
      event_types,
      status,
      featured,
      popular,
      sort_order,
      category_id,
      categories!inner (
        id,
        name,
        slug
      )
    `;
  }

  let query = supabaseClient
    .from("products")
    .select(selectQuery)
    .eq("status", "published");

  // IMPORTANT:
  // "all" means no category filtering.
  if (categorySlug && categorySlug !== "all") {
    query = query.eq("categories.slug", categorySlug);
  }

  if (options.featured === true) {
    query = query.eq("featured", true);
  }

  const { data, error } = await query
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getProducts error:", error);
    throw error;
  }

  return data || [];
}


// ======================================================
// GET SINGLE PRODUCT
// ======================================================
export async function getProductBySlug(slug) {
  const { data, error } = await supabaseClient
    .from("products")
    .select(`
      id,
      name,
      slug,
      price,
      short_description,
      description,
      main_image_url,
      demo_url,
      style,
      tags,
      event_types,
      status,
      featured,
      popular,
      sort_order,
      category_id,
      categories (
        id,
        name,
        slug
      ),
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
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) {
    console.error("getProductBySlug error:", error);
    throw error;
  }

  if (!data) {
    return null;
  }

  data.product_images = (data.product_images || []).sort(
    (a, b) => a.sort_order - b.sort_order
  );

  data.product_features = (data.product_features || []).sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return data;
}