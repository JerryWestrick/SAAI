-- Kasirku POS: SA Model Migration
-- Reverse-engineered from test-systems/kasirku/
-- Project 2: Context (L0) + Level 1 + Level 2 (Process Order)

BEGIN;

-- ============================================================
-- 1. PROJECT
-- ============================================================
INSERT INTO projects (id, name, description) VALUES
(2, 'Kasirku POS', 'Restaurant POS system reverse-engineered from the Kasirku open-source project');

-- ============================================================
-- 2. DIAGRAMS
-- ============================================================
INSERT INTO diagrams (id, project_id, parent_node_id, name, level) VALUES
(4, 2, NULL, 'Context Diagram', 0),
(5, 2, NULL, 'Kasirku POS - Level 1', 1),   -- parent_node_id set after nodes exist
(6, 2, NULL, 'Process Order - Level 2', 2);  -- parent_node_id set after nodes exist

-- ============================================================
-- 3. NODES
-- ============================================================

-- Context Diagram (diagram 4)
INSERT INTO nodes (id, diagram_id, node_type, name, number, x, y) VALUES
(24, 4, 'process',         'Kasirku POS',     '0',  0, 0),
(25, 4, 'external_entity', 'Customer',        'E1', 0, 0),
(26, 4, 'external_entity', 'Admin',           'E2', 0, 0),
(27, 4, 'external_entity', 'Midtrans',        'E3', 0, 0),
(28, 4, 'external_entity', 'Thermal Printer', 'E4', 0, 0);

-- Level 1 (diagram 5) — Processes
INSERT INTO nodes (id, diagram_id, node_type, name, number, x, y) VALUES
(29, 5, 'process', 'Manage Catalog', '1', 0, 0),
(30, 5, 'process', 'Process Order',  '2', 0, 0),
(31, 5, 'process', 'Handle Payment', '3', 0, 0),
(32, 5, 'process', 'Fulfill Order',  '4', 0, 0);

-- Level 1 (diagram 5) — Data Stores
INSERT INTO nodes (id, diagram_id, node_type, name, number, x, y) VALUES
(33, 5, 'data_store', 'Products',   'D1', 0, 0),
(34, 5, 'data_store', 'Categories', 'D2', 0, 0),
(35, 5, 'data_store', 'Orders',     'D3', 0, 0),
(36, 5, 'data_store', 'Payments',   'D4', 0, 0);

-- Level 1 (diagram 5) — External Entities
INSERT INTO nodes (id, diagram_id, node_type, name, number, x, y) VALUES
(37, 5, 'external_entity', 'Customer',        'E1', 0, 0),
(38, 5, 'external_entity', 'Admin',           'E2', 0, 0),
(39, 5, 'external_entity', 'Midtrans',        'E3', 0, 0),
(40, 5, 'external_entity', 'Thermal Printer', 'E4', 0, 0);

-- Level 2 — Process Order (diagram 6) — Processes
INSERT INTO nodes (id, diagram_id, node_type, name, number, x, y) VALUES
(41, 6, 'process', 'Display Menu',        '2.1', 0, 0),
(42, 6, 'process', 'Validate Order',      '2.2', 0, 0),
(43, 6, 'process', 'Create Order Record', '2.3', 0, 0),
(44, 6, 'process', 'Initiate Payment',    '2.4', 0, 0);

-- Level 2 (diagram 6) — Data Stores (from parent)
INSERT INTO nodes (id, diagram_id, node_type, name, number, x, y) VALUES
(45, 6, 'data_store', 'Products',   'D1', 0, 0),
(46, 6, 'data_store', 'Categories', 'D2', 0, 0),
(47, 6, 'data_store', 'Orders',     'D3', 0, 0),
(48, 6, 'data_store', 'Payments',   'D4', 0, 0);

-- Level 2 (diagram 6) — External Entities
INSERT INTO nodes (id, diagram_id, node_type, name, number, x, y) VALUES
(49, 6, 'external_entity', 'Customer', 'E1', 0, 0),
(50, 6, 'external_entity', 'Midtrans', 'E3', 0, 0);

-- ============================================================
-- 4. LINK DIAGRAMS ↔ NODES
-- ============================================================

-- Diagram parent_node_id links (which process node this diagram decomposes)
UPDATE diagrams SET parent_node_id = 24 WHERE id = 5;  -- L1 decomposes "Kasirku POS" (context process)
UPDATE diagrams SET parent_node_id = 30 WHERE id = 6;  -- L2 decomposes "Process Order" (L1 process)

-- Node child_diagram_id links (double-click to drill down)
UPDATE nodes SET child_diagram_id = 5 WHERE id = 24;   -- Kasirku POS → Level 1
UPDATE nodes SET child_diagram_id = 6 WHERE id = 30;   -- Process Order → Level 2

-- ============================================================
-- 5. DATA FLOWS — Context Diagram (diagram 4)
-- ============================================================
INSERT INTO data_flows (id, diagram_id, name, source_id, target_id) VALUES
(36, 4, 'Order Request',        25, 24),  -- Customer → System
(37, 4, 'Product Menu',         24, 25),  -- System → Customer
(38, 4, 'Order Confirmation',   24, 25),  -- System → Customer
(39, 4, 'Order Status',         24, 25),  -- System → Customer
(40, 4, 'Product Data',         26, 24),  -- Admin → System
(41, 4, 'Category Data',        26, 24),  -- Admin → System
(42, 4, 'Status Update',        26, 24),  -- Admin → System
(43, 4, 'Order List',           24, 26),  -- System → Admin
(44, 4, 'Catalog View',         24, 26),  -- System → Admin
(45, 4, 'Payment Request',      24, 27),  -- System → Midtrans
(46, 4, 'Payment Notification', 27, 24),  -- Midtrans → System
(47, 4, 'Receipt Data',         24, 28);  -- System → Printer

-- ============================================================
-- 6. DATA FLOWS — Level 1 (diagram 5)
-- ============================================================
INSERT INTO data_flows (id, diagram_id, name, source_id, target_id) VALUES
-- Manage Catalog (1)
(48, 5, 'Product Data',         38, 29),  -- Admin → Manage Catalog
(49, 5, 'Category Data',        38, 29),  -- Admin → Manage Catalog
(50, 5, 'Product Record',       29, 33),  -- Manage Catalog → Products
(51, 5, 'Category Record',      29, 34),  -- Manage Catalog → Categories
(52, 5, 'Product List',         33, 29),  -- Products → Manage Catalog
(53, 5, 'Category List',        34, 29),  -- Categories → Manage Catalog
(54, 5, 'Catalog View',         29, 38),  -- Manage Catalog → Admin
-- Process Order (2)
(55, 5, 'Product Info',         33, 30),  -- Products → Process Order
(56, 5, 'Category Info',        34, 30),  -- Categories → Process Order
(57, 5, 'Order Request',        37, 30),  -- Customer → Process Order
(58, 5, 'Product Menu',         30, 37),  -- Process Order → Customer
(59, 5, 'New Order',            30, 35),  -- Process Order → Orders
(60, 5, 'Pending Payment',      30, 36),  -- Process Order → Payments
(61, 5, 'Payment Request',      30, 39),  -- Process Order → Midtrans
(62, 5, 'Snap Token',           39, 30),  -- Midtrans → Process Order
(63, 5, 'Order Confirmation',   30, 37),  -- Process Order → Customer
-- Handle Payment (3)
(64, 5, 'Payment Notification', 39, 31),  -- Midtrans → Handle Payment
(65, 5, 'Payment Record',       36, 31),  -- Payments → Handle Payment
(66, 5, 'Updated Payment',      31, 36),  -- Handle Payment → Payments
(67, 5, 'Payment Status',       31, 35),  -- Handle Payment → Orders
-- Fulfill Order (4)
(68, 5, 'Order Details',        35, 32),  -- Orders → Fulfill Order
(69, 5, 'Payment Info',         36, 32),  -- Payments → Fulfill Order
(70, 5, 'Status Update',        38, 32),  -- Admin → Fulfill Order
(71, 5, 'Updated Order',        32, 35),  -- Fulfill Order → Orders
(72, 5, 'Order List',           32, 38),  -- Fulfill Order → Admin
(73, 5, 'Receipt Data',         32, 40),  -- Fulfill Order → Printer
(74, 5, 'Status Request',       37, 32),  -- Customer → Fulfill Order
(75, 5, 'Order Status',         32, 37);  -- Fulfill Order → Customer

-- ============================================================
-- 7. DATA FLOWS — Level 2: Process Order (diagram 6)
-- ============================================================
INSERT INTO data_flows (id, diagram_id, name, source_id, target_id) VALUES
(76, 6, 'Product Records',    45, 41),  -- Products → Display Menu
(77, 6, 'Category Records',   46, 41),  -- Categories → Display Menu
(78, 6, 'Menu Request',       49, 41),  -- Customer → Display Menu
(79, 6, 'Product Menu',       41, 49),  -- Display Menu → Customer
(80, 6, 'Cart Contents',      49, 42),  -- Customer → Validate Order
(81, 6, 'Product Prices',     45, 42),  -- Products → Validate Order
(82, 6, 'Validated Order',    42, 43),  -- Validate Order → Create Order Record
(83, 6, 'New Order',          43, 47),  -- Create Order Record → Orders
(84, 6, 'Order Record',       43, 44),  -- Create Order Record → Initiate Payment
(85, 6, 'Item Details',       45, 44),  -- Products → Initiate Payment
(86, 6, 'Pending Payment',    44, 48),  -- Initiate Payment → Payments
(87, 6, 'Payment Request',    44, 50),  -- Initiate Payment → Midtrans
(88, 6, 'Snap Token',         50, 44),  -- Midtrans → Initiate Payment
(89, 6, 'Order Confirmation', 44, 49);  -- Initiate Payment → Customer

-- ============================================================
-- 8. DATA DICTIONARY (project 2) — 24 entries
-- ============================================================
INSERT INTO data_dictionary (id, project_id, name, definition) VALUES
(12, 2, 'Product',              '= product_id + name + category_id + price + {Photo}'),
(13, 2, 'Photo',                '= url + is_primary'),
(14, 2, 'Category',             '= category_id + name'),
(15, 2, 'Order Request',        '= customer_name + table_number + {Cart Item}'),
(16, 2, 'Cart Item',            '= product_id + quantity + [notes]'),
(17, 2, 'Order',                '= order_id + customer_name + table_number + status + {Order Item}'),
(18, 2, 'Order Item',           '= order_item_id + product_id + quantity + [notes]'),
(19, 2, 'Payment',              '= payment_id + order_id + amount + status + payment_method + [transaction_id] + [paid_at]'),
(20, 2, 'Order Confirmation',   '= snap_token + order_id + payment_id'),
(21, 2, 'Payment Request',      '= transaction_id + amount + {Item Detail} + customer_name + callbacks'),
(22, 2, 'Item Detail',          '= product_id + name + price + quantity'),
(23, 2, 'Payment Notification', '= order_id + transaction_status + fraud_status + [payment_type]'),
(24, 2, 'Receipt Data',         '= {Receipt Line} + subtotal + tax_amount + total + [paid_amount] + [change]'),
(25, 2, 'Receipt Line',         '= name + quantity + price'),
(26, 2, 'Product Menu',         '= {Product} + {Category} + pagination_info'),
(27, 2, 'Order Status',         '= order_id + status + {Order Item} + Payment'),
(28, 2, 'Order List',           '= {Order Summary}'),
(29, 2, 'Order Summary',        '= order_id + customer_name + status + total + payment_method + created_at'),
(30, 2, 'Catalog View',         '= [Product List | Category List]'),
(31, 2, 'Product Data',         '= name + category_id + price + {Photo}'),
(32, 2, 'Category Data',        '= name'),
(33, 2, 'Status Update',        '= order_id + status'),
(34, 2, 'Validated Order',      '= customer_name + table_number + {Validated Item} + subtotal + tax_amount + total'),
(35, 2, 'Validated Item',       '= product_id + name + quantity + unit_price + line_total');

-- ============================================================
-- 9. DD FIELDS — structured decomposition
-- ============================================================

-- Product (dd_id=12)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(44,  12, 'product_id',  'integer', NULL,       NULL, 0),
(45,  12, 'name',        'text',    NULL,       NULL, 1),
(46,  12, 'category_id', 'integer', 'Category', NULL, 2),
(47,  12, 'price',       'float',   NULL,       NULL, 3),
(48,  12, 'photos',      'reference','Photo',   'Iteration', 4);

-- Photo (dd_id=13)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(49,  13, 'url',        'text',    NULL, NULL, 0),
(50,  13, 'is_primary', 'boolean', NULL, NULL, 1);

-- Category (dd_id=14)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(51,  14, 'category_id', 'integer', NULL, NULL, 0),
(52,  14, 'name',        'text',    NULL, NULL, 1);

-- Order Request (dd_id=15)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(53,  15, 'customer_name', 'text',      NULL,        NULL, 0),
(54,  15, 'table_number',  'text',      NULL,        NULL, 1),
(55,  15, 'cart_items',    'reference', 'Cart Item',  'Iteration', 2);

-- Cart Item (dd_id=16)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(56,  16, 'product_id', 'integer', 'Product', NULL, 0),
(57,  16, 'quantity',   'integer',  NULL,     NULL, 1),
(58,  16, 'notes',      'text',     NULL,     'Optional', 2);

-- Order (dd_id=17)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(59,  17, 'order_id',      'integer',   NULL,         NULL, 0),
(60,  17, 'customer_name', 'text',      NULL,         NULL, 1),
(61,  17, 'table_number',  'text',      NULL,         NULL, 2),
(62,  17, 'status',        'text',      NULL,         NULL, 3),
(63,  17, 'order_items',   'reference', 'Order Item', 'Iteration', 4);

-- Order Item (dd_id=18)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(64,  18, 'order_item_id', 'integer', NULL,      NULL, 0),
(65,  18, 'product_id',    'integer', 'Product', NULL, 1),
(66,  18, 'quantity',      'integer',  NULL,     NULL, 2),
(67,  18, 'notes',         'text',     NULL,     'Optional', 3);

-- Payment (dd_id=19)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(68,  19, 'payment_id',     'integer', NULL,    NULL, 0),
(69,  19, 'order_id',       'integer', 'Order', NULL, 1),
(70,  19, 'amount',         'float',   NULL,    NULL, 2),
(71,  19, 'status',         'text',    NULL,    NULL, 3),
(72,  19, 'payment_method', 'text',    NULL,    NULL, 4),
(73,  19, 'transaction_id', 'text',    NULL,    'Optional', 5),
(74,  19, 'paid_at',        'date',    NULL,    'Optional', 6);

-- Order Confirmation (dd_id=20)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(75,  20, 'snap_token', 'text',    NULL,      NULL, 0),
(76,  20, 'order_id',   'integer', 'Order',   NULL, 1),
(77,  20, 'payment_id', 'integer', 'Payment', NULL, 2);

-- Payment Request (dd_id=21)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(78,  21, 'transaction_id', 'text',      NULL,          NULL, 0),
(79,  21, 'amount',         'float',     NULL,          NULL, 1),
(80,  21, 'item_details',   'reference', 'Item Detail', 'Iteration', 2),
(81,  21, 'customer_name',  'text',      NULL,          NULL, 3),
(82,  21, 'callbacks',      'text',      NULL,          NULL, 4);

-- Item Detail (dd_id=22)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(83,  22, 'product_id', 'integer', NULL, NULL, 0),
(84,  22, 'name',       'text',    NULL, NULL, 1),
(85,  22, 'price',      'float',   NULL, NULL, 2),
(86,  22, 'quantity',   'integer', NULL, NULL, 3);

-- Payment Notification (dd_id=23)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(87,  23, 'order_id',           'integer', 'Order', NULL, 0),
(88,  23, 'transaction_status', 'text',    NULL,    NULL, 1),
(89,  23, 'fraud_status',       'text',    NULL,    NULL, 2),
(90,  23, 'payment_type',       'text',    NULL,    'Optional', 3);

-- Receipt Data (dd_id=24)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(91,  24, 'receipt_lines', 'reference', 'Receipt Line', 'Iteration', 0),
(92,  24, 'subtotal',      'float',     NULL,           NULL, 1),
(93,  24, 'tax_amount',    'float',     NULL,           NULL, 2),
(94,  24, 'total',         'float',     NULL,           NULL, 3),
(95,  24, 'paid_amount',   'float',     NULL,           'Optional', 4),
(96,  24, 'change',        'float',     NULL,           'Optional', 5);

-- Receipt Line (dd_id=25)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(97,  25, 'name',     'text',    NULL, NULL, 0),
(98,  25, 'quantity', 'integer', NULL, NULL, 1),
(99,  25, 'price',    'float',   NULL, NULL, 2);

-- Product Menu (dd_id=26)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(100, 26, 'products',        'reference', 'Product',  'Iteration', 0),
(101, 26, 'categories',      'reference', 'Category', 'Iteration', 1),
(102, 26, 'pagination_info', 'text',      NULL,       NULL, 2);

-- Order Status (dd_id=27)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(103, 27, 'order_id',    'integer',   'Order',      NULL, 0),
(104, 27, 'status',      'text',      NULL,         NULL, 1),
(105, 27, 'order_items', 'reference', 'Order Item', 'Iteration', 2),
(106, 27, 'payment',     'reference', 'Payment',    NULL, 3);

-- Order List (dd_id=28)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(107, 28, 'order_summaries', 'reference', 'Order Summary', 'Iteration', 0);

-- Order Summary (dd_id=29)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(108, 29, 'order_id',       'integer', NULL, NULL, 0),
(109, 29, 'customer_name',  'text',    NULL, NULL, 1),
(110, 29, 'status',         'text',    NULL, NULL, 2),
(111, 29, 'total',          'float',   NULL, NULL, 3),
(112, 29, 'payment_method', 'text',    NULL, NULL, 4),
(113, 29, 'created_at',     'date',    NULL, NULL, 5);

-- Catalog View (dd_id=30)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(114, 30, 'product_list',  'reference', 'Product',  'Selection — Product listing', 0),
(115, 30, 'category_list', 'reference', 'Category', 'Selection — Category listing', 1);

-- Product Data (dd_id=31)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(116, 31, 'name',        'text',      NULL,    NULL, 0),
(117, 31, 'category_id', 'integer',   'Category', NULL, 1),
(118, 31, 'price',       'float',     NULL,    NULL, 2),
(119, 31, 'photos',      'reference', 'Photo', 'Iteration', 3);

-- Category Data (dd_id=32)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(120, 32, 'name', 'text', NULL, NULL, 0);

-- Status Update (dd_id=33)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(121, 33, 'order_id', 'integer', 'Order', NULL, 0),
(122, 33, 'status',   'text',    NULL,    NULL, 1);

-- Validated Order (dd_id=34)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(123, 34, 'customer_name',   'text',      NULL,             NULL, 0),
(124, 34, 'table_number',    'text',      NULL,             NULL, 1),
(125, 34, 'validated_items', 'reference', 'Validated Item', 'Iteration', 2),
(126, 34, 'subtotal',        'float',     NULL,             NULL, 3),
(127, 34, 'tax_amount',      'float',     NULL,             NULL, 4),
(128, 34, 'total',           'float',     NULL,             NULL, 5);

-- Validated Item (dd_id=35)
INSERT INTO dd_fields (id, dd_id, name, field_type, reference_dd, description, sort_order) VALUES
(129, 35, 'product_id',  'integer', 'Product', NULL, 0),
(130, 35, 'name',        'text',    NULL,      NULL, 1),
(131, 35, 'quantity',    'integer', NULL,       NULL, 2),
(132, 35, 'unit_price',  'float',   NULL,      NULL, 3),
(133, 35, 'line_total',  'float',   NULL,      NULL, 4);

-- ============================================================
-- 10. TRAITS (project 2) — 6 traits
-- ============================================================
INSERT INTO traits (id, project_id, name, description, can_go_stale) VALUES
(7,  2, 'Exists',          'Entity confirmed to exist in Products store',  false),
(8,  2, 'Priced',          'Items have current prices applied',            true),
(9,  2, 'Taxed',           '10% tax has been calculated',                  false),
(10, 2, 'Ordered',         'Order record written to Orders store',         false),
(11, 2, 'Payment Pending', 'Payment initiated with Midtrans',             true),
(12, 2, 'Paid',            'Payment confirmed by Midtrans',               false);

-- ============================================================
-- 11. FLOW TRAITS — trait annotations on Level 2 flows
-- ============================================================
INSERT INTO flow_traits (id, flow_id, trait_id, modifier) VALUES
-- Product Records (D1 → 2.1 Display Menu) adds Exists
(11, 76, 7,  'adds'),
-- Product Prices (D1 → 2.2 Validate Order) adds Exists
(12, 81, 7,  'adds'),
-- Validated Order (2.2 → 2.3) requires Exists, adds Priced + Taxed
(13, 82, 7,  'requires'),
(14, 82, 8,  'adds'),
(15, 82, 9,  'adds'),
-- New Order (2.3 → D3) adds Ordered
(16, 83, 10, 'adds'),
-- Order Record (2.3 → 2.4) requires Ordered
(17, 84, 10, 'requires'),
-- Pending Payment (2.4 → D4) adds Payment Pending
(18, 86, 11, 'adds'),
-- Order Confirmation (2.4 → E1) requires Payment Pending
(19, 89, 11, 'requires');

-- ============================================================
-- 12. MINI-SPECS — 7 total (4 Level 2 + 3 Level 1 leaf)
-- ============================================================

-- Level 2 leaf processes
INSERT INTO mini_specs (id, node_id, spec_text) VALUES
(5, 41, 'Receives a Menu Request with optional search text and category filter.

Reads Product Records from the Products store and Category Records from the Categories store. Filters products by search text matching product or category name. Filters by selected category if specified.

Returns paginated Product Menu with 12 items per page, each product including its primary photo and category.'),

(6, 42, 'Receives Cart Contents containing customer name, table number, and a list of items with product IDs and quantities.

Looks up each product in the Products store to confirm it exists and retrieve the current unit price. Calculates each line total as quantity multiplied by unit price. Sums all line totals to produce a subtotal. Calculates tax as 10% of the subtotal. Adds subtotal and tax to produce the total.

Outputs a Validated Order with priced line items, subtotal, tax, and total.

Adds traits: Priced, Taxed
Currency: Priced may become stale if product prices change before the order is confirmed.'),

(7, 43, 'Receives a Validated Order with customer name, table number, and priced items.

Creates an Order record in the Orders store with status set to "pending". Creates an Order Item record for each line item with product reference, quantity, and notes.

Outputs the Order Record containing the assigned order ID.

Adds traits: Ordered'),

(8, 44, 'Receives an Order Record with the order ID. Reads Item Details from the Products store to format line items for the payment gateway.

Creates a Pending Payment record in the Payments store with the order total, status "pending", and payment method "midtrans". Generates a unique transaction ID as KASIR-{timestamp}-{payment_id}.

Sends a Payment Request to Midtrans with transaction details, formatted item list including a 10% tax line item, and callback URLs. Receives a Snap Token from Midtrans.

Outputs an Order Confirmation to the Customer containing the snap token, order ID, and payment ID.

Adds traits: Payment Pending
Currency: Payment Pending will resolve when Midtrans sends a Payment Notification to Handle Payment (process 3).');

-- Level 1 leaf processes (no Level 2 decomposition)
INSERT INTO mini_specs (id, node_id, spec_text) VALUES
(9, 29, 'Receives Product Data from Admin containing a product name, category, price, and photos. Writes the Product Record to the Products store, marking the first photo as primary.

Receives Category Data from Admin containing a category name. Writes the Category Record to the Categories store.

Reads Product List from Products store and Category List from Categories store. Outputs the Catalog View to Admin.'),

(10, 31, 'Receives a Payment Notification from Midtrans containing the transaction status and fraud status.

Reads the Payment Record from the Payments store using the transaction ID.

For settlement or successful capture: updates payment status to "completed", records paid_at timestamp, updates the associated order status to "pending" (awaiting fulfillment).

For deny, expire, or cancel: updates payment status to "failed", updates the associated order status to "cancelled".

Adds traits: Paid (on success)
Removes traits: Payment Pending'),

(11, 32, 'Receives a Status Request from Customer. Reads Order Details and Payment Info. Returns Order Status to Customer.

Receives Order List request from Admin. Reads Order Details and Payment Info, with optional filtering by status and search by customer name. Returns Order List to Admin.

Receives a Status Update from Admin with an order ID and new status. Updates the Order in the Orders store.

When printing, reads Order Details and Payment Info, formats a Receipt Data package with itemized lines, subtotal, 10% tax, and total. Sends Receipt Data to the Thermal Printer.');

-- ============================================================
-- 13. RESET SEQUENCES to avoid conflicts with future inserts
-- ============================================================
SELECT setval('projects_id_seq',        (SELECT MAX(id) FROM projects));
SELECT setval('diagrams_id_seq',        (SELECT MAX(id) FROM diagrams));
SELECT setval('nodes_id_seq',           (SELECT MAX(id) FROM nodes));
SELECT setval('data_flows_id_seq',      (SELECT MAX(id) FROM data_flows));
SELECT setval('data_dictionary_id_seq', (SELECT MAX(id) FROM data_dictionary));
SELECT setval('dd_fields_id_seq',       (SELECT MAX(id) FROM dd_fields));
SELECT setval('traits_id_seq',          (SELECT MAX(id) FROM traits));
SELECT setval('flow_traits_id_seq',     (SELECT MAX(id) FROM flow_traits));
SELECT setval('mini_specs_id_seq',      (SELECT MAX(id) FROM mini_specs));

COMMIT;
