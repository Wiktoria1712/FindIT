CREATE TABLE partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('chain', 'local_store', 'marketplace')),
  integration_type TEXT NOT NULL CHECK (integration_type IN ('api', 'pos_sync', 'erp_export', 'manual_panel')),
  sync_frequency_seconds INTEGER NOT NULL DEFAULT 300,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stores (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  opening_hours_json TEXT,
  supports_reservation INTEGER NOT NULL DEFAULT 0,
  supports_online_payment INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id)
);

CREATE TABLE product_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_category_id TEXT,
  FOREIGN KEY (parent_category_id) REFERENCES product_categories(id)
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  category_id TEXT,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  variant TEXT,
  size_label TEXT,
  barcode TEXT UNIQUE,
  image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES product_categories(id)
);

CREATE TABLE store_products (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  external_product_id TEXT,
  local_name TEXT,
  is_listed INTEGER NOT NULL DEFAULT 1,
  UNIQUE(store_id, product_id),
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE inventory_snapshots (
  id TEXT PRIMARY KEY,
  store_product_id TEXT NOT NULL,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  availability_status TEXT NOT NULL CHECK (availability_status IN ('in_stock', 'low_stock', 'out_of_stock', 'unknown')),
  price_amount NUMERIC(10,2),
  currency_code TEXT NOT NULL DEFAULT 'PLN',
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  synced_at TEXT NOT NULL,
  source_event_id TEXT,
  FOREIGN KEY (store_product_id) REFERENCES store_products(id)
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  phone_number TEXT UNIQUE,
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  inventory_snapshot_id TEXT NOT NULL,
  quantity_reserved INTEGER NOT NULL DEFAULT 1,
  reservation_code TEXT NOT NULL UNIQUE,
  reservation_status TEXT NOT NULL CHECK (reservation_status IN ('pending', 'confirmed', 'cancelled', 'expired', 'picked_up')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (inventory_snapshot_id) REFERENCES inventory_snapshots(id)
);

CREATE TABLE search_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  searched_phrase TEXT NOT NULL,
  normalized_phrase TEXT NOT NULL,
  matched_product_id TEXT,
  latitude REAL,
  longitude REAL,
  radius_km REAL NOT NULL,
  result_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (matched_product_id) REFERENCES products(id)
);

CREATE INDEX idx_products_normalized_name ON products(normalized_name);
CREATE INDEX idx_stores_location ON stores(latitude, longitude);
CREATE INDEX idx_store_products_lookup ON store_products(store_id, product_id);
CREATE INDEX idx_inventory_latest ON inventory_snapshots(store_product_id, synced_at DESC);
CREATE INDEX idx_search_events_phrase ON search_events(normalized_phrase, created_at DESC);
