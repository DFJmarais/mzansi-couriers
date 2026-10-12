-- Multi-Stop Deliveries Tables
CREATE TABLE IF NOT EXISTS delivery_batches (
  id VARCHAR(36) PRIMARY KEY,
  courier_id VARCHAR(36) NOT NULL,
  status ENUM('pending', 'accepted', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  total_stops INT NOT NULL,
  total_distance DECIMAL(10, 2),
  estimated_time INT,
  base_price DECIMAL(10, 2),
  multi_stop_bonus DECIMAL(10, 2),
  total_price DECIMAL(10, 2),
  created_at BIGINT NOT NULL,
  started_at BIGINT,
  completed_at BIGINT,
  FOREIGN KEY (courier_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS batch_stops (
  id VARCHAR(36) PRIMARY KEY,
  batch_id VARCHAR(36) NOT NULL,
  stop_number INT NOT NULL,
  delivery_id VARCHAR(36) NOT NULL,
  pickup_location JSON,
  dropoff_location JSON,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  completed_at BIGINT,
  FOREIGN KEY (batch_id) REFERENCES delivery_batches(id),
  FOREIGN KEY (delivery_id) REFERENCES deliveries(id)
);

-- Upfront Pay Visibility Tables
CREATE TABLE IF NOT EXISTS delivery_pricing (
  id VARCHAR(36) PRIMARY KEY,
  delivery_id VARCHAR(36) NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  distance_km DECIMAL(10, 2),
  distance_price DECIMAL(10, 2),
  time_multiplier DECIMAL(5, 2) DEFAULT 1.0,
  surge_multiplier DECIMAL(5, 2) DEFAULT 1.0,
  item_weight_kg DECIMAL(10, 2),
  weight_price DECIMAL(10, 2),
  fragile_surcharge DECIMAL(10, 2) DEFAULT 0,
  hazmat_surcharge DECIMAL(10, 2) DEFAULT 0,
  rush_surcharge DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  breakdown_visible BOOLEAN DEFAULT true,
  created_at BIGINT NOT NULL,
  FOREIGN KEY (delivery_id) REFERENCES deliveries(id)
);

-- Flexible Scheduling Tables
CREATE TABLE IF NOT EXISTS courier_schedules (
  id VARCHAR(36) PRIMARY KEY,
  courier_id VARCHAR(36) NOT NULL,
  schedule_type ENUM('flexible', 'shift_based', 'on_demand') DEFAULT 'flexible',
  is_active BOOLEAN DEFAULT true,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  FOREIGN KEY (courier_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS courier_availability (
  id VARCHAR(36) PRIMARY KEY,
  courier_id VARCHAR(36) NOT NULL,
  day_of_week INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  max_deliveries INT,
  preferred_areas JSON,
  created_at BIGINT NOT NULL,
  FOREIGN KEY (courier_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS courier_shifts (
  id VARCHAR(36) PRIMARY KEY,
  courier_id VARCHAR(36) NOT NULL,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('scheduled', 'active', 'completed', 'cancelled') DEFAULT 'scheduled',
  deliveries_completed INT DEFAULT 0,
  earnings DECIMAL(10, 2) DEFAULT 0,
  created_at BIGINT NOT NULL,
  FOREIGN KEY (courier_id) REFERENCES users(id)
);

-- Certification System Tables
CREATE TABLE IF NOT EXISTS courier_certifications (
  id VARCHAR(36) PRIMARY KEY,
  courier_id VARCHAR(36) NOT NULL,
  certification_type ENUM('pharmacy', 'fragile', 'hazmat', 'temperature_controlled', 'high_value', 'food_delivery') NOT NULL,
  status ENUM('pending', 'verified', 'expired', 'revoked') DEFAULT 'pending',
  issued_date BIGINT,
  expiry_date BIGINT,
  verified_by VARCHAR(36),
  verification_document_url VARCHAR(255),
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  FOREIGN KEY (courier_id) REFERENCES users(id),
  FOREIGN KEY (verified_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS certification_requirements (
  id VARCHAR(36) PRIMARY KEY,
  certification_type ENUM('pharmacy', 'fragile', 'hazmat', 'temperature_controlled', 'high_value', 'food_delivery') NOT NULL,
  description VARCHAR(500),
  training_url VARCHAR(255),
  exam_required BOOLEAN DEFAULT false,
  document_required BOOLEAN DEFAULT false,
  renewal_period_days INT DEFAULT 365,
  pay_multiplier DECIMAL(5, 2) DEFAULT 1.0,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS delivery_requirements (
  id VARCHAR(36) PRIMARY KEY,
  delivery_id VARCHAR(36) NOT NULL,
  required_certification ENUM('pharmacy', 'fragile', 'hazmat', 'temperature_controlled', 'high_value', 'food_delivery'),
  is_optional BOOLEAN DEFAULT false,
  created_at BIGINT NOT NULL,
  FOREIGN KEY (delivery_id) REFERENCES deliveries(id)
);

-- Indexes for performance
CREATE INDEX idx_delivery_batches_courier ON delivery_batches(courier_id);
CREATE INDEX idx_delivery_batches_status ON delivery_batches(status);
CREATE INDEX idx_batch_stops_batch ON batch_stops(batch_id);
CREATE INDEX idx_courier_schedules_courier ON courier_schedules(courier_id);
CREATE INDEX idx_courier_availability_courier ON courier_availability(courier_id);
CREATE INDEX idx_courier_shifts_courier ON courier_shifts(courier_id);
CREATE INDEX idx_courier_certifications_courier ON courier_certifications(courier_id);
CREATE INDEX idx_courier_certifications_type ON courier_certifications(certification_type);
