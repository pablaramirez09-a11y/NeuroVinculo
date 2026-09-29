CREATE DATABASE IF NOT EXISTS neurovinculo_db;
USE neurovinculo_db;

CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  document VARCHAR(100) NOT NULL,
  phone VARCHAR(100),
  email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT,
  date DATE,
  time_start TIME,
  time_end TIME,
  modality ENUM('presencial', 'virtual') NOT NULL,
  reason TEXT,
  status ENUM('pending', 'confirmed', 'in_progress', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATETIME,
  status ENUM('pending', 'completed') DEFAULT 'pending',
  is_urgent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- SISTEMA DE AUTENTICACIÓN Y SEGURIDAD
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(255) NOT NULL,
  ip_address VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- PRINCIPIO DE MÍNIMO PRIVILEGIO
-- Crear usuario dedicado solo con los permisos necesarios para la aplicación
CREATE USER IF NOT EXISTS 'neuro_app_user'@'localhost' IDENTIFIED BY 'neuro_secure_password';
-- Revocar todos los privilegios primero (por si acaso)
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'neuro_app_user'@'localhost';
-- Otorgar solo los privilegios CRUD sobre la base de datos específica
GRANT SELECT, INSERT, UPDATE, DELETE ON neurovinculo_db.* TO 'neuro_app_user'@'localhost';
FLUSH PRIVILEGES;

-- ==========================================
-- Insertar datos de prueba
-- ==========================================
-- Usuario administrador por defecto (Agenda psico-orientacion / IEFA2026)
INSERT INTO users (username, password_hash, role) VALUES 
('Agenda psico-orientacion', '$2b$10$4DFsUKtkqBULritYpxtMP.TnkzFywFagsrudX3Im1sjXazQWvF2Tu', 'admin');

INSERT INTO patients (name, document, phone, email) VALUES 
('Juan Pérez', '100123456', '+57 300 123 4567', 'juan@example.com'),
('María Gómez', '100765432', '+57 310 987 6543', 'maria@example.com');

INSERT INTO appointments (patient_id, date, time_start, time_end, modality, reason, status) VALUES 
(1, CURDATE(), '08:00:00', '09:00:00', 'presencial', 'Acompañamiento Emocional (Manejo de Ansiedad Escolar)', 'confirmed'),
(2, CURDATE(), '09:30:00', '10:30:00', 'virtual', 'Psico Orientación Vocacional & Proyecto de Vida', 'confirmed');
