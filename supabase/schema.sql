-- =========================================================
-- WEDDING INVITATION PLATFORM
-- INITIAL DATABASE SCHEMA
-- =========================================================


-- =========================================================
-- EXTENSIONS
-- =========================================================

create extension if not exists pgcrypto;


-- =========================================================
-- CATEGORIES
-- =========================================================

create table if not exists public.categories (

    id uuid primary key default gen_random_uuid(),

    name text not null,

    slug text not null unique,

    description text,

    image_url text,

    status text not null default 'active'
        check (status in ('active', 'inactive')),

    featured boolean not null default false,

    sort_order integer not null default 0,

    seo_title text,

    seo_description text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()

);


-- =========================================================
-- PRODUCTS
-- =========================================================

create table if not exists public.products (

    id uuid primary key default gen_random_uuid(),

    category_id uuid
        references public.categories(id)
        on delete restrict,

    name text not null,

    slug text not null unique,

    price numeric(12,2) not null
        check (price >= 0),

    short_description text,

    description text,

    main_image_url text,

    demo_url text,

    style text,

    tags text[] not null default '{}',

    event_types text[] not null default '{}',

    status text not null default 'draft'
        check (
            status in (
                'draft',
                'published',
                'archived'
            )
        ),

    featured boolean not null default false,

    popular boolean not null default false,

    sort_order integer not null default 0,

    seo_title text,

    seo_description text,

    og_image text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()

);


-- =========================================================
-- PRODUCT IMAGES
-- =========================================================

create table if not exists public.product_images (

    id uuid primary key default gen_random_uuid(),

    product_id uuid not null
        references public.products(id)
        on delete cascade,

    image_url text not null,

    alt_text text,

    sort_order integer not null default 0,

    created_at timestamptz not null default now()

);


-- =========================================================
-- PRODUCT FEATURES
-- =========================================================

create table if not exists public.product_features (

    id uuid primary key default gen_random_uuid(),

    product_id uuid not null
        references public.products(id)
        on delete cascade,

    feature text not null,

    sort_order integer not null default 0

);


-- =========================================================
-- CUSTOMERS
-- =========================================================

create table if not exists public.customers (

    id uuid primary key default gen_random_uuid(),

    full_name text not null,

    whatsapp text not null,

    email text not null,

    city text not null,

    country text not null,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()

);


-- =========================================================
-- ORDERS
-- =========================================================

create table if not exists public.orders (

    id uuid primary key default gen_random_uuid(),

    order_number text not null unique,

    customer_id uuid not null
        references public.customers(id)
        on delete restrict,

    product_id uuid not null
        references public.products(id)
        on delete restrict,

    price_at_order_time numeric(12,2) not null
        check (price_at_order_time >= 0),

    status text not null default 'new'
        check (
            status in (
                'new',
                'contacted',
                'details_pending',
                'in_progress',
                'preview_ready',
                'revision',
                'completed',
                'cancelled'
            )
        ),

    notes text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()

);


-- =========================================================
-- WEDDING DETAILS
-- =========================================================

create table if not exists public.wedding_details (

    id uuid primary key default gen_random_uuid(),

    order_id uuid not null unique
        references public.orders(id)
        on delete cascade,

    bride_name text not null,

    groom_name text not null,

    wedding_date date not null,

    wedding_time time,

    venue text not null,

    event_type text not null,

    custom_text text,

    special_requirements text,

    notes text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()

);


-- =========================================================
-- ORDER FILES
-- =========================================================

create table if not exists public.order_files (

    id uuid primary key default gen_random_uuid(),

    order_id uuid not null
        references public.orders(id)
        on delete cascade,

    file_url text not null,

    file_name text not null,

    file_type text,

    file_size bigint,

    created_at timestamptz not null default now()

);


-- =========================================================
-- ADMIN PROFILES
-- =========================================================

create table if not exists public.admin_profiles (

    user_id uuid primary key
        references auth.users(id)
        on delete cascade,

    role text not null default 'admin'
        check (
            role in ('admin', 'staff')
        ),

    is_active boolean not null default true,

    created_at timestamptz not null default now()

);


-- =========================================================
-- HOMEPAGE SECTIONS
-- =========================================================

create table if not exists public.homepage_sections (

    id uuid primary key default gen_random_uuid(),

    section_key text not null unique,

    title text,

    subtitle text,

    description text,

    image_url text,

    button_text text,

    button_url text,

    status text not null default 'active'
        check (
            status in ('active', 'inactive')
        ),

    sort_order integer not null default 0,

    updated_at timestamptz not null default now()

);


-- =========================================================
-- SITE SETTINGS
-- =========================================================

create table if not exists public.site_settings (

    id uuid primary key default gen_random_uuid(),

    setting_key text not null unique,

    setting_value text,

    updated_at timestamptz not null default now()

);


-- =========================================================
-- INDEXES
-- =========================================================

create index if not exists idx_products_category
on public.products(category_id);

create index if not exists idx_products_status
on public.products(status);

create index if not exists idx_products_featured
on public.products(featured);

create index if not exists idx_products_sort_order
on public.products(sort_order);

create index if not exists idx_product_images_product
on public.product_images(product_id);

create index if not exists idx_product_features_product
on public.product_features(product_id);

create index if not exists idx_orders_status
on public.orders(status);

create index if not exists idx_orders_created_at
on public.orders(created_at desc);

create index if not exists idx_orders_customer
on public.orders(customer_id);

create index if not exists idx_orders_product
on public.orders(product_id);

create index if not exists idx_wedding_details_order
on public.wedding_details(order_id);


-- =========================================================
-- ADMIN HELPER
-- =========================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$

    select exists (

        select 1

        from public.admin_profiles

        where user_id = auth.uid()

        and is_active = true

        and role in ('admin', 'staff')

    );

$$;


-- =========================================================
-- ORDER SUBMISSION FUNCTION
-- =========================================================

create or replace function public.submit_order(
    payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$

declare

    v_product_id uuid;

    v_customer_id uuid;

    v_order_id uuid;

    v_order_number text;

    v_product_price numeric(12,2);

    v_full_name text;

    v_whatsapp text;

    v_email text;

    v_city text;

    v_country text;

    v_bride_name text;

    v_groom_name text;

    v_wedding_date date;

    v_wedding_time time;

    v_venue text;

    v_event_type text;

    v_custom_text text;

    v_special_requirements text;

    v_notes text;

begin

    -- =====================================================
    -- READ PRODUCT
    -- =====================================================

    v_product_id :=
        (payload->'product'->>'id')::uuid;


    -- =====================================================
    -- READ CUSTOMER
    -- =====================================================

    v_full_name :=
        trim(payload->'customer'->>'fullName');

    v_whatsapp :=
        trim(payload->'customer'->>'whatsapp');

    v_email :=
        trim(payload->'customer'->>'email');

    v_city :=
        trim(payload->'customer'->>'city');

    v_country :=
        trim(payload->'customer'->>'country');


    -- =====================================================
    -- READ WEDDING
    -- =====================================================

    v_bride_name :=
        trim(payload->'wedding'->>'brideName');

    v_groom_name :=
        trim(payload->'wedding'->>'groomName');

    v_wedding_date :=
        (payload->'wedding'->>'weddingDate')::date;

    v_wedding_time :=
        nullif(
            payload->'wedding'->>'weddingTime',
            ''
        )::time;

    v_venue :=
        trim(payload->'wedding'->>'venue');

    v_event_type :=
        trim(payload->'wedding'->>'eventType');


    -- =====================================================
    -- READ ADDITIONAL
    -- =====================================================

    v_custom_text :=
        nullif(
            trim(payload->'additional'->>'customText'),
            ''
        );

    v_special_requirements :=
        nullif(
            trim(
                payload->'additional'
                ->>'specialRequirements'
            ),
            ''
        );

    v_notes :=
        nullif(
            trim(payload->'additional'->>'notes'),
            ''
        );


    -- =====================================================
    -- BASIC VALIDATION
    -- =====================================================

    if v_product_id is null then

        raise exception
            'Product is required.';

    end if;


    if v_full_name = '' then

        raise exception
            'Full name is required.';

    end if;


    if v_whatsapp = '' then

        raise exception
            'WhatsApp number is required.';

    end if;


    if v_email = '' then

        raise exception
            'Email address is required.';

    end if;


    if v_city = '' then

        raise exception
            'City is required.';

    end if;


    if v_country = '' then

        raise exception
            'Country is required.';

    end if;


    if v_bride_name = '' then

        raise exception
            'Bride name is required.';

    end if;


    if v_groom_name = '' then

        raise exception
            'Groom name is required.';

    end if;


    if v_wedding_date is null then

        raise exception
            'Wedding date is required.';

    end if;


    if v_venue = '' then

        raise exception
            'Venue is required.';

    end if;


    if v_event_type = '' then

        raise exception
            'Event type is required.';

    end if;


    -- =====================================================
    -- GET REAL PRODUCT PRICE
    -- =====================================================

    select price

    into v_product_price

    from public.products

    where id = v_product_id

    and status = 'published';


    if not found then

        raise exception
            'Selected invitation is not available.';

    end if;


    -- =====================================================
    -- CREATE CUSTOMER
    -- =====================================================

    insert into public.customers (

        full_name,

        whatsapp,

        email,

        city,

        country

    )

    values (

        v_full_name,

        v_whatsapp,

        v_email,

        v_city,

        v_country

    )

    returning id

    into v_customer_id;


    -- =====================================================
    -- CREATE ORDER NUMBER
    -- =====================================================

    v_order_number :=
        'WED-' ||
        upper(
            substr(
                replace(
                    gen_random_uuid()::text,
                    '-',
                    ''
                ),
                1,
                8
            )
        );


    -- =====================================================
    -- CREATE ORDER
    -- =====================================================

    insert into public.orders (

        order_number,

        customer_id,

        product_id,

        price_at_order_time,

        status,

        notes

    )

    values (

        v_order_number,

        v_customer_id,

        v_product_id,

        v_product_price,

        'new',

        v_notes

    )

    returning id

    into v_order_id;


    -- =====================================================
    -- CREATE WEDDING DETAILS
    -- =====================================================

    insert into public.wedding_details (

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

    )

    values (

        v_order_id,

        v_bride_name,

        v_groom_name,

        v_wedding_date,

        v_wedding_time,

        v_venue,

        v_event_type,

        v_custom_text,

        v_special_requirements,

        v_notes

    );


    -- =====================================================
    -- RETURN RESULT
    -- =====================================================

    return jsonb_build_object(

        'success',
        true,

        'order_id',
        v_order_id,

        'order_number',
        v_order_number,

        'status',
        'new'

    );

end;

$$;


-- =========================================================
-- FUNCTION PERMISSIONS
-- =========================================================

revoke all
on function public.submit_order(jsonb)
from public;

grant execute
on function public.submit_order(jsonb)
to anon, authenticated;


grant execute
on function public.is_admin()
to authenticated;


-- =========================================================
-- ENABLE RLS
-- =========================================================

alter table public.categories
enable row level security;

alter table public.products
enable row level security;

alter table public.product_images
enable row level security;

alter table public.product_features
enable row level security;

alter table public.customers
enable row level security;

alter table public.orders
enable row level security;

alter table public.wedding_details
enable row level security;

alter table public.order_files
enable row level security;

alter table public.admin_profiles
enable row level security;

alter table public.homepage_sections
enable row level security;

alter table public.site_settings
enable row level security;


-- =========================================================
-- CATEGORY POLICIES
-- =========================================================

create policy "Public can view active categories"

on public.categories

for select

to anon, authenticated

using (
    status = 'active'
    or public.is_admin()
);


create policy "Admins can insert categories"

on public.categories

for insert

to authenticated

with check (
    public.is_admin()
);


create policy "Admins can update categories"

on public.categories

for update

to authenticated

using (
    public.is_admin()
)

with check (
    public.is_admin()
);


create policy "Admins can delete categories"

on public.categories

for delete

to authenticated

using (
    public.is_admin()
);


-- =========================================================
-- PRODUCT POLICIES
-- =========================================================

create policy "Public can view published products"

on public.products

for select

to anon, authenticated

using (
    status = 'published'
    or public.is_admin()
);


create policy "Admins can insert products"

on public.products

for insert

to authenticated

with check (
    public.is_admin()
);


create policy "Admins can update products"

on public.products

for update

to authenticated

using (
    public.is_admin()
)

with check (
    public.is_admin()
);


create policy "Admins can delete products"

on public.products

for delete

to authenticated

using (
    public.is_admin()
);


-- =========================================================
-- PRODUCT IMAGE POLICIES
-- =========================================================

create policy "Public can view product images"

on public.product_images

for select

to anon, authenticated

using (

    exists (

        select 1

        from public.products p

        where p.id = product_id

        and (
            p.status = 'published'
            or public.is_admin()
        )

    )

);


create policy "Admins can insert product images"

on public.product_images

for insert

to authenticated

with check (
    public.is_admin()
);


create policy "Admins can update product images"

on public.product_images

for update

to authenticated

using (
    public.is_admin()
)

with check (
    public.is_admin()
);


create policy "Admins can delete product images"

on public.product_images

for delete

to authenticated

using (
    public.is_admin()
);


-- =========================================================
-- PRODUCT FEATURE POLICIES
-- =========================================================

create policy "Public can view product features"

on public.product_features

for select

to anon, authenticated

using (

    exists (

        select 1

        from public.products p

        where p.id = product_id

        and (
            p.status = 'published'
            or public.is_admin()
        )

    )

);


create policy "Admins can insert product features"

on public.product_features

for insert

to authenticated

with check (
    public.is_admin()
);


create policy "Admins can update product features"

on public.product_features

for update

to authenticated

using (
    public.is_admin()
)

with check (
    public.is_admin()
);


create policy "Admins can delete product features"

on public.product_features

for delete

to authenticated

using (
    public.is_admin()
);


-- =========================================================
-- ADMIN PROFILE POLICIES
-- =========================================================

create policy "Admins can view admin profiles"

on public.admin_profiles

for select

to authenticated

using (
    public.is_admin()
);


create policy "Admins can update admin profiles"

on public.admin_profiles

for update

to authenticated

using (
    public.is_admin()
)

with check (
    public.is_admin()
);


-- =========================================================
-- ORDER POLICIES
-- =========================================================

create policy "Admins can view orders"

on public.orders

for select

to authenticated

using (
    public.is_admin()
);


create policy "Admins can update orders"

on public.orders

for update

to authenticated

using (
    public.is_admin()
)

with check (
    public.is_admin()
);


create policy "Admins can delete orders"

on public.orders

for delete

to authenticated

using (
    public.is_admin()
);


-- =========================================================
-- CUSTOMER POLICIES
-- =========================================================

create policy "Admins can view customers"

on public.customers

for select

to authenticated

using (
    public.is_admin()
);


create policy "Admins can update customers"

on public.customers

for update

to authenticated

using (
    public.is_admin()
);


-- =========================================================
-- WEDDING DETAIL POLICIES
-- =========================================================

create policy "Admins can view wedding details"

on public.wedding_details

for select

to authenticated

using (
    public.is_admin()
);


create policy "Admins can update wedding details"

on public.wedding_details

for update

to authenticated

using (
    public.is_admin()
);


-- =========================================================
-- ORDER FILE POLICIES
-- =========================================================

create policy "Admins can view order files"

on public.order_files

for select

to authenticated

using (
    public.is_admin()
);


create policy "Admins can insert order files"

on public.order_files

for insert

to authenticated

with check (
    public.is_admin()
);


create policy "Admins can delete order files"

on public.order_files

for delete

to authenticated

using (
    public.is_admin()
);


-- =========================================================
-- HOMEPAGE POLICIES
-- =========================================================

create policy "Public can view active homepage sections"

on public.homepage_sections

for select

to anon, authenticated

using (
    status = 'active'
    or public.is_admin()
);


create policy "Admins can insert homepage sections"

on public.homepage_sections

for insert

to authenticated

with check (
    public.is_admin()
);


create policy "Admins can update homepage sections"

on public.homepage_sections

for update

to authenticated

using (
    public.is_admin()
)

with check (
    public.is_admin()
);


create policy "Admins can delete homepage sections"

on public.homepage_sections

for delete

to authenticated

using (
    public.is_admin()
);


-- =========================================================
-- SITE SETTINGS POLICIES
-- =========================================================

create policy "Admins can view site settings"

on public.site_settings

for select

to authenticated

using (
    public.is_admin()
);


create policy "Admins can insert site settings"

on public.site_settings

for insert

to authenticated

with check (
    public.is_admin()
);


create policy "Admins can update site settings"

on public.site_settings

for update

to authenticated

using (
    public.is_admin()
)

with check (
    public.is_admin()
);


create policy "Admins can delete site settings"

on public.site_settings

for delete

to authenticated

using (
    public.is_admin()
);


-- =========================================================
-- SEED CATEGORIES
-- =========================================================

insert into public.categories
(
    name,
    slug,
    description,
    status,
    featured,
    sort_order
)

values

(
    'Luxury',
    'luxury',
    'Premium wedding invitations created for unforgettable celebrations.',
    'active',
    true,
    1
),

(
    'Affordable',
    'affordable',
    'Beautiful and elegant invitations at accessible prices.',
    'active',
    true,
    2
),

(
    'Traditional',
    'traditional',
    'Classic invitation styles inspired by timeless wedding traditions.',
    'active',
    true,
    3
),

(
    'Modern',
    'modern',
    'Clean contemporary invitation designs with a modern aesthetic.',
    'active',
    true,
    4
)

on conflict (slug)
do nothing;