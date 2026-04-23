-- Seed minimal catalog data for local development
-- Safe to run multiple times: it only inserts when dbo.products is empty.

SET NOCOUNT ON;

IF EXISTS (SELECT 1 FROM dbo.products)
BEGIN
    PRINT 'Seed skipped: dbo.products already has data.';
    RETURN;
END

DECLARE @now datetime2 = SYSDATETIME();

DECLARE @brandId bigint;
DECLARE @categoryId bigint;

-- Brand (idempotent)
SELECT TOP (1) @brandId = id FROM dbo.brands WHERE slug = 'argaty';
IF @brandId IS NULL
BEGIN
    INSERT INTO dbo.brands (
        name,
        slug,
        is_active,
        display_order,
        created_at,
        updated_at
    )
    VALUES (N'Argaty', 'argaty', 1, 1, @now, @now);

    SELECT TOP (1) @brandId = id FROM dbo.brands WHERE slug = 'argaty';
END

-- Category (idempotent)
SELECT TOP (1) @categoryId = id FROM dbo.categories WHERE slug = 'keyboard-mouse';
IF @categoryId IS NULL
BEGIN
    INSERT INTO dbo.categories (
        name,
        slug,
        display_order,
        is_active,
        is_featured,
        created_at,
        updated_at
    )
    VALUES (N'Keyboard & Mouse', 'keyboard-mouse', 1, 1, 1, @now, @now);

    SELECT TOP (1) @categoryId = id FROM dbo.categories WHERE slug = 'keyboard-mouse';
END

-- Insert minimal products (required NOT NULL columns only)
INSERT INTO dbo.products (
    name,
    slug,
    sku,
    price,
    quantity,
    sold_count,
    low_stock_threshold,
    category_id,
    brand_id,
    rating,
    review_count,
    is_active,
    is_featured,
    is_new,
    is_best_seller,
    created_at,
    updated_at
)
VALUES
(
    N'Argaty Mechanical Keyboard K1',
    'argaty-mechanical-keyboard-k1',
    'ARG-K1',
    1299000.00,
    50,
    12,
    5,
    @categoryId,
    @brandId,
    4.6,
    18,
    1,
    1,
    1,
    1,
    @now,
    @now
),
(
    N'Argaty Gaming Mouse M2',
    'argaty-gaming-mouse-m2',
    'ARG-M2',
    699000.00,
    80,
    25,
    10,
    @categoryId,
    @brandId,
    4.7,
    31,
    1,
    1,
    0,
    1,
    @now,
    @now
),
(
    N'Argaty Mouse Pad XL',
    'argaty-mouse-pad-xl',
    'ARG-PAD-XL',
    299000.00,
    120,
    3,
    10,
    @categoryId,
    @brandId,
    4.2,
    6,
    1,
    0,
    1,
    0,
    @now,
    @now
),
(
    N'Argaty Mechanical Keyboard K3 (TKL)',
    'argaty-mechanical-keyboard-k3-tkl',
    'ARG-K3-TKL',
    1599000.00,
    40,
    0,
    5,
    @categoryId,
    @brandId,
    0.0,
    0,
    1,
    0,
    1,
    0,
    @now,
    @now
);

PRINT 'Seed inserted:';
SELECT 'brands' AS tbl, COUNT(*) AS cnt FROM dbo.brands
UNION ALL SELECT 'categories', COUNT(*) FROM dbo.categories
UNION ALL SELECT 'products', COUNT(*) FROM dbo.products;
