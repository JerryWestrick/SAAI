-- Migration: Add trait system, DD fields, and flesh out demo data
-- Run: psql -d saai -f db/migrate_traits.sql

BEGIN;

-- ============================================================
-- 1. NEW TABLES
-- ============================================================

-- Structured fields for data dictionary entries
CREATE TABLE IF NOT EXISTS dd_fields (
    id SERIAL PRIMARY KEY,
    dd_id INTEGER NOT NULL REFERENCES data_dictionary(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'text',  -- text, integer, float, boolean, date, reference
    reference_dd TEXT,  -- if field_type='reference', name of referenced DD entry
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Project-level trait definitions
CREATE TABLE IF NOT EXISTS traits (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    can_go_stale BOOLEAN NOT NULL DEFAULT false,
    UNIQUE(project_id, name)
);

-- Traits on data flows (requires/adds/removes)
CREATE TABLE IF NOT EXISTS flow_traits (
    id SERIAL PRIMARY KEY,
    flow_id INTEGER NOT NULL REFERENCES data_flows(id) ON DELETE CASCADE,
    trait_id INTEGER NOT NULL REFERENCES traits(id) ON DELETE CASCADE,
    modifier TEXT NOT NULL CHECK (modifier IN ('requires', 'adds', 'removes')),
    UNIQUE(flow_id, trait_id, modifier)
);

-- ============================================================
-- 2. NOTIFY TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS dd_fields_notify ON dd_fields;
CREATE TRIGGER dd_fields_notify
    AFTER INSERT OR UPDATE OR DELETE ON dd_fields
    FOR EACH ROW EXECUTE FUNCTION sa_notify();

DROP TRIGGER IF EXISTS traits_notify ON traits;
CREATE TRIGGER traits_notify
    AFTER INSERT OR UPDATE OR DELETE ON traits
    FOR EACH ROW EXECUTE FUNCTION sa_notify();

DROP TRIGGER IF EXISTS flow_traits_notify ON flow_traits;
CREATE TRIGGER flow_traits_notify
    AFTER INSERT OR UPDATE OR DELETE ON flow_traits
    FOR EACH ROW EXECUTE FUNCTION sa_notify();

-- ============================================================
-- 3. TRAIT DEFINITIONS (project 1)
-- ============================================================

INSERT INTO traits (project_id, name, description, can_go_stale) VALUES
    (1, 'Exists',       'Entity has been looked up and confirmed to exist',       false),
    (1, 'Good Standing','Customer balance is within credit limit',                true),
    (1, 'In Stock',     'Product has sufficient quantity available',              true),
    (1, 'Reserved',     'Inventory has been reserved for this order',             true),
    (1, 'Priced',       'Line items have been priced with current prices',        true),
    (1, 'Confirmed',    'Order has been confirmed and assigned an ID',            false);

-- ============================================================
-- 4. FLOW TRAITS (diagram 3: Process Orders L2)
-- ============================================================

-- Flow 27: Customer Record (Customers store → Verify Customer) — adds Exists
INSERT INTO flow_traits (flow_id, trait_id, modifier)
    SELECT 27, id, 'adds' FROM traits WHERE project_id = 1 AND name = 'Exists';

-- Flow 28: Verified Customer (Verify Customer → Check Availability) — requires Exists, adds Good Standing
INSERT INTO flow_traits (flow_id, trait_id, modifier)
    SELECT 28, id, 'requires' FROM traits WHERE project_id = 1 AND name = 'Exists';
INSERT INTO flow_traits (flow_id, trait_id, modifier)
    SELECT 28, id, 'adds' FROM traits WHERE project_id = 1 AND name = 'Good Standing';

-- Flow 29: Product Availability (Products store → Check Availability) — adds Exists
INSERT INTO flow_traits (flow_id, trait_id, modifier)
    SELECT 29, id, 'adds' FROM traits WHERE project_id = 1 AND name = 'Exists';

-- Flow 30: Available Items (Check Availability → Calculate Pricing) — requires In Stock, adds Reserved
INSERT INTO flow_traits (flow_id, trait_id, modifier)
    SELECT 30, id, 'requires' FROM traits WHERE project_id = 1 AND name = 'In Stock';
INSERT INTO flow_traits (flow_id, trait_id, modifier)
    SELECT 30, id, 'adds' FROM traits WHERE project_id = 1 AND name = 'Reserved';

-- Flow 32: Priced Order (Calculate Pricing → Confirm Order) — adds Priced
INSERT INTO flow_traits (flow_id, trait_id, modifier)
    SELECT 32, id, 'adds' FROM traits WHERE project_id = 1 AND name = 'Priced';

-- Flow 33: Order Confirmation (Confirm Order → Customer) — adds Confirmed
INSERT INTO flow_traits (flow_id, trait_id, modifier)
    SELECT 33, id, 'adds' FROM traits WHERE project_id = 1 AND name = 'Confirmed';

-- Flow 34: Confirmed Order (Confirm Order → Orders store) — adds Confirmed
INSERT INTO flow_traits (flow_id, trait_id, modifier)
    SELECT 34, id, 'adds' FROM traits WHERE project_id = 1 AND name = 'Confirmed';

-- Flow 35: Credit Status (Customers store → Confirm Order) — requires Good Standing
INSERT INTO flow_traits (flow_id, trait_id, modifier)
    SELECT 35, id, 'requires' FROM traits WHERE project_id = 1 AND name = 'Good Standing';

-- ============================================================
-- 5. DD FIELDS — structured fields for all 11 DD entries
-- ============================================================

-- DD 1: Purchase Order = customer_id + {order_item} + shipping_address
INSERT INTO dd_fields (dd_id, name, field_type, reference_dd, description, sort_order) VALUES
    (1, 'customer_id',      'integer',   'Customer',   'ID of ordering customer',       1),
    (1, 'shipping_address',  'text',     NULL,          'Delivery address',              2),
    (1, 'order_items',       'reference','order_item',  'List of line items',            3);

-- DD 2: order_item = product_id + quantity + [unit_price]
INSERT INTO dd_fields (dd_id, name, field_type, reference_dd, description, sort_order) VALUES
    (2, 'product_id',  'integer',   'Product', 'ID of ordered product',         1),
    (2, 'quantity',    'integer',   NULL,       'Number of units requested',     2),
    (2, 'unit_price',  'float',    NULL,       'Price per unit (optional, filled during pricing)', 3);

-- DD 3: Order Confirmation = order_id + estimated_delivery + total_amount
INSERT INTO dd_fields (dd_id, name, field_type, reference_dd, description, sort_order) VALUES
    (3, 'order_id',             'integer', NULL, 'Assigned order identifier',    1),
    (3, 'estimated_delivery',   'date',    NULL, 'Expected delivery date',       2),
    (3, 'total_amount',         'float',   NULL, 'Total order cost',             3);

-- DD 4: Invoice = invoice_id + order_id + {line_item} + total + due_date
INSERT INTO dd_fields (dd_id, name, field_type, reference_dd, description, sort_order) VALUES
    (4, 'invoice_id',  'integer',   NULL,          'Unique invoice number',         1),
    (4, 'order_id',    'integer',   NULL,          'Associated order ID',           2),
    (4, 'line_items',  'reference', 'order_item',  'Itemized charges',              3),
    (4, 'total',       'float',     NULL,          'Total amount due',              4),
    (4, 'due_date',    'date',      NULL,          'Payment due date',              5);

-- DD 5: Purchase Request = supplier_id + {restock_item} + urgency
INSERT INTO dd_fields (dd_id, name, field_type, reference_dd, description, sort_order) VALUES
    (5, 'supplier_id',    'integer',   NULL,           'Target supplier ID',            1),
    (5, 'restock_items',  'reference', 'restock_item', 'Items to reorder',              2),
    (5, 'urgency',        'text',      NULL,           'Priority level (normal, urgent, critical)', 3);

-- DD 6: restock_item = product_id + quantity_needed
INSERT INTO dd_fields (dd_id, name, field_type, reference_dd, description, sort_order) VALUES
    (6, 'product_id',      'integer', 'Product', 'Product to restock',            1),
    (6, 'quantity_needed',  'integer', NULL,      'Number of units to order',      2);

-- DD 7: Shipment = shipment_id + {shipped_item} + delivery_date
INSERT INTO dd_fields (dd_id, name, field_type, reference_dd, description, sort_order) VALUES
    (7, 'shipment_id',    'integer',   NULL,          'Shipment tracking ID',          1),
    (7, 'shipped_items',  'reference', 'order_item',  'Items included in shipment',    2),
    (7, 'delivery_date',  'date',      NULL,          'Actual or expected delivery',   3);

-- DD 8: Reports = [sales_report | inventory_report | financial_report]
INSERT INTO dd_fields (dd_id, name, field_type, reference_dd, description, sort_order) VALUES
    (8, 'report_type',    'text',    NULL, 'One of: sales, inventory, financial',   1),
    (8, 'period_start',   'date',    NULL, 'Reporting period start date',           2),
    (8, 'period_end',     'date',    NULL, 'Reporting period end date',             3),
    (8, 'data',           'text',    NULL, 'Report content and summary figures',    4);

-- DD 9: Payment = payment_id + order_id + amount + payment_method + date
INSERT INTO dd_fields (dd_id, name, field_type, reference_dd, description, sort_order) VALUES
    (9, 'payment_id',      'integer', NULL, 'Unique payment identifier',     1),
    (9, 'order_id',        'integer', NULL, 'Associated order ID',           2),
    (9, 'amount',          'float',   NULL, 'Amount paid',                   3),
    (9, 'payment_method',  'text',    NULL, 'Method (credit card, check, wire)', 4),
    (9, 'date',            'date',    NULL, 'Date of payment',               5);

-- DD 10: Product = product_id + name + description + unit_price + stock_qty
INSERT INTO dd_fields (dd_id, name, field_type, reference_dd, description, sort_order) VALUES
    (10, 'product_id',     'integer', NULL, 'Unique product identifier',     1),
    (10, 'name',           'text',    NULL, 'Product name',                  2),
    (10, 'description',    'text',    NULL, 'Product description',           3),
    (10, 'unit_price',     'float',   NULL, 'Current selling price',         4),
    (10, 'stock_qty',      'integer', NULL, 'Current stock quantity',        5),
    (10, 'reorder_level',  'integer', NULL, 'Threshold for restock alert',   6);

-- DD 11: Customer = customer_id + name + address + phone + credit_limit + balance
INSERT INTO dd_fields (dd_id, name, field_type, reference_dd, description, sort_order) VALUES
    (11, 'customer_id',   'integer', NULL, 'Unique customer identifier',    1),
    (11, 'name',          'text',    NULL, 'Full name',                     2),
    (11, 'address',       'text',    NULL, 'Shipping address',              3),
    (11, 'phone',         'text',    NULL, 'Contact number',                4),
    (11, 'credit_limit',  'float',   NULL, 'Maximum allowed balance',       5),
    (11, 'balance',       'float',   NULL, 'Current outstanding balance',   6);

-- ============================================================
-- 6. REWRITE MINI-SPECS — plain natural language
-- ============================================================

-- 1.1 Verify Customer (node 16)
UPDATE mini_specs SET spec_text =
'Receives a Purchase Order containing a customer_id.

Looks up the customer in the Customers store and confirms that the customer exists.

Checks that the customer''s current balance does not exceed their credit limit.

Outputs the Purchase Order with the customer identity verified and good standing confirmed.

Adds traits: Exists, Good Standing
Removes traits: none
Currency: Good Standing may become stale if another transaction changes the customer''s balance before this order is confirmed.'
WHERE node_id = 16;

-- 1.2 Check Availability (node 17)
UPDATE mini_specs SET spec_text =
'Receives a verified Purchase Order with a list of order items.

For each item, looks up the product in the Products store and checks whether sufficient stock is available. Available items have their inventory reserved.

Outputs the list of available items with their reserved quantities.

Adds traits: In Stock, Reserved
Removes traits: none
Currency: In Stock and Reserved may become stale if another order reserves the same products before this order completes.'
WHERE node_id = 17;

-- 1.3 Calculate Pricing (node 18)
UPDATE mini_specs SET spec_text =
'Receives a list of available items with reserved quantities.

For each item, looks up the current unit price from the Products store and calculates the line total as quantity multiplied by unit price.

Sums all line totals to produce the order total. Applies any applicable discount rules.

Outputs the fully priced order with itemized costs and total amount.

Adds traits: Priced
Removes traits: none
Currency: Priced may become stale if product prices change before the order is confirmed.'
WHERE node_id = 18;

-- 1.4 Confirm Order (node 19)
UPDATE mini_specs SET spec_text =
'Receives a priced order with all items costed and totaled.

Checks the customer''s credit status from the Customers store one final time to confirm good standing.

Generates a unique order ID and estimated delivery date. Writes the confirmed order to the Orders store with all line items, pricing, and customer details.

Sends an Order Confirmation to the Customer containing the order ID, estimated delivery date, and total amount.

Adds traits: Confirmed
Removes traits: none
Currency: Requires Good Standing to be current at the moment of confirmation.'
WHERE node_id = 19;

COMMIT;
