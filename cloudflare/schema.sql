PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS access_requests (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  company TEXT NOT NULL,
  professional_role TEXT NOT NULL,
  inquiry_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','declined','archived')),
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_access_requests_status_created
  ON access_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_requests_email
  ON access_requests(email);

CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  contact_name TEXT NOT NULL,
  company TEXT NOT NULL,
  professional_role TEXT,
  access_level TEXT NOT NULL DEFAULT 'partner'
    CHECK (access_level IN ('partner','agency','casting','press','creative','admin')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','suspended','revoked')),
  access_request_id TEXT,
  last_seen_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (access_request_id) REFERENCES access_requests(id)
);

CREATE INDEX IF NOT EXISTS idx_partners_status_email
  ON partners(status, email);

CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  company TEXT NOT NULL,
  inquiry_type TEXT NOT NULL,
  project_name TEXT NOT NULL,
  budget_range TEXT,
  proposed_dates TEXT,
  usage_rights TEXT,
  project_brief TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','reviewing','responded','accepted','declined','archived')),
  partner_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id)
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status_created
  ON inquiries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_email
  ON inquiries(email);

CREATE TABLE IF NOT EXISTS portfolio_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  image_path TEXT,
  credit TEXT,
  is_private INTEGER NOT NULL DEFAULT 1 CHECK (is_private IN (0,1)),
  is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_path TEXT,
  access_level TEXT NOT NULL DEFAULT 'partner',
  version TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  metric_value REAL NOT NULL,
  display_value TEXT,
  period_label TEXT,
  captured_at TEXT NOT NULL,
  is_private INTEGER NOT NULL DEFAULT 1 CHECK (is_private IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_platform_metric
  ON analytics_snapshots(platform, metric_key, captured_at DESC);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created
  ON audit_log(created_at DESC);
