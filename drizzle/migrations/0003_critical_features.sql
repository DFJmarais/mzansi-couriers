-- Payment Security Tables
CREATE TABLE IF NOT EXISTS payment_security_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  transaction_id VARCHAR(36),
  risk_score INT DEFAULT 0,
  risk_level VARCHAR(10),
  fraud_factors JSON,
  requires_3d_secure BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS transaction_limits (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  daily_limit DECIMAL(10,2) DEFAULT 10000,
  monthly_limit DECIMAL(10,2) DEFAULT 100000,
  daily_used DECIMAL(10,2) DEFAULT 0,
  monthly_used DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Courier Performance Tables
CREATE TABLE IF NOT EXISTS courier_performance (
  id VARCHAR(36) PRIMARY KEY,
  courier_id VARCHAR(36) NOT NULL UNIQUE,
  total_deliveries INT DEFAULT 0,
  completed_deliveries INT DEFAULT 0,
  acceptance_rate DECIMAL(5,2) DEFAULT 0,
  cancellation_rate DECIMAL(5,2) DEFAULT 0,
  on_time_rate DECIMAL(5,2) DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  weekly_earnings DECIMAL(10,2) DEFAULT 0,
  monthly_earnings DECIMAL(10,2) DEFAULT 0,
  rank VARCHAR(20) DEFAULT 'Bronze',
  benchmark_percentile DECIMAL(5,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (courier_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS courier_earnings_history (
  id VARCHAR(36) PRIMARY KEY,
  courier_id VARCHAR(36) NOT NULL,
  delivery_id VARCHAR(36),
  amount DECIMAL(10,2),
  delivery_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (courier_id) REFERENCES users(id)
);

-- Support System Tables
CREATE TABLE IF NOT EXISTS support_tickets (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  status VARCHAR(20) DEFAULT 'open',
  priority VARCHAR(10) DEFAULT 'medium',
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS support_messages (
  id VARCHAR(36) PRIMARY KEY,
  ticket_id VARCHAR(36) NOT NULL,
  sender_id VARCHAR(36) NOT NULL,
  message TEXT,
  attachments JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS faq_articles (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255),
  content TEXT,
  category VARCHAR(50),
  views INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Notifications Tables
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'sent',
  channels JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  notification_types JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Dispute Resolution Tables
CREATE TABLE IF NOT EXISTS delivery_disputes (
  id VARCHAR(36) PRIMARY KEY,
  delivery_id VARCHAR(36) NOT NULL,
  reported_by VARCHAR(36) NOT NULL,
  dispute_type VARCHAR(50),
  description TEXT,
  status VARCHAR(20) DEFAULT 'open',
  severity VARCHAR(10) DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  FOREIGN KEY (delivery_id) REFERENCES deliveries(id),
  FOREIGN KEY (reported_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS dispute_evidence (
  id VARCHAR(36) PRIMARY KEY,
  dispute_id VARCHAR(36) NOT NULL,
  file_url VARCHAR(255),
  file_type VARCHAR(20),
  uploaded_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dispute_id) REFERENCES delivery_disputes(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS dispute_resolutions (
  id VARCHAR(36) PRIMARY KEY,
  dispute_id VARCHAR(36) NOT NULL,
  resolution_type VARCHAR(50),
  amount DECIMAL(10,2),
  notes TEXT,
  resolved_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dispute_id) REFERENCES delivery_disputes(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_payment_security_user ON payment_security_logs(user_id);
CREATE INDEX idx_transaction_limits_user ON transaction_limits(user_id);
CREATE INDEX idx_courier_performance_courier ON courier_performance(courier_id);
CREATE INDEX idx_courier_earnings_courier ON courier_earnings_history(courier_id);
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_messages_ticket ON support_messages(ticket_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_delivery_disputes_delivery ON delivery_disputes(delivery_id);
CREATE INDEX idx_dispute_evidence_dispute ON dispute_evidence(dispute_id);
