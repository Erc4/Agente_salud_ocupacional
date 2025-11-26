-- ========================================
-- BASE DE DATOS: SALUD OCUPACIONAL
-- Versión con Estándares Configurables + ESP32
-- ========================================

CREATE DATABASE IF NOT EXISTS salud_ocupacional;
USE salud_ocupacional;

-- ========================================
-- TABLA DE USUARIOS
-- ========================================
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLA DE SESIONES DE TRABAJO
-- ========================================
CREATE TABLE sesiones_trabajo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME,
    minutos_totales INT DEFAULT 0,
    pausas_tomadas INT DEFAULT 0,
    estado ENUM('activa', 'pausada', 'finalizada') DEFAULT 'activa',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ========================================
-- TABLA DE LECTURAS DE SENSORES
-- ========================================
CREATE TABLE lecturas_sensores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sesion_id INT NOT NULL,
    tipo_sensor ENUM('co2', 'ruido', 'temperatura') NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    unidad VARCHAR(10),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sesion_id) REFERENCES sesiones_trabajo(id) ON DELETE CASCADE,
    INDEX idx_sesion_sensor (sesion_id, tipo_sensor),
    INDEX idx_timestamp (timestamp)
);

-- ========================================
-- TABLA DE DETECCIÓN DE FATIGA
-- ========================================
CREATE TABLE deteccion_fatiga (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sesion_id INT NOT NULL,
    tipo_fatiga ENUM('visual', 'postural', 'cognitiva') NOT NULL,
    nivel_fatiga ENUM('bajo', 'moderado', 'alto') NOT NULL,
    indicador VARCHAR(100),
    frecuencia_parpadeo INT,
    postura_detectada VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sesion_id) REFERENCES sesiones_trabajo(id) ON DELETE CASCADE,
    INDEX idx_sesion_tipo (sesion_id, tipo_fatiga)
);

-- ========================================
-- TABLA DE ALERTAS GENERADAS
-- ========================================
CREATE TABLE alertas_generadas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sesion_id INT NOT NULL,
    tipo_alerta VARCHAR(50) NOT NULL,
    prioridad ENUM('alta', 'media', 'baja') NOT NULL,
    mensaje TEXT NOT NULL,
    visualizada BOOLEAN DEFAULT FALSE,
    descartada BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sesion_id) REFERENCES sesiones_trabajo(id) ON DELETE CASCADE,
    INDEX idx_sesion_prioridad (sesion_id, prioridad)
);

-- ========================================
-- TABLA DE ACCIONES DEL SISTEMA
-- ========================================
CREATE TABLE acciones_sistema (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sesion_id INT NOT NULL,
    tipo_accion VARCHAR(50) NOT NULL,
    descripcion TEXT,
    automatica BOOLEAN DEFAULT TRUE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sesion_id) REFERENCES sesiones_trabajo(id) ON DELETE CASCADE
);

-- ========================================
-- TABLA DE DISPOSITIVOS ESP32
-- ========================================
CREATE TABLE dispositivos_esp32 (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    sensores TEXT,
    actuadores TEXT,
    estado ENUM('activo', 'inactivo', 'error') DEFAULT 'activo',
    ultima_conexion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLA DE COMANDOS PARA ESP32
-- ========================================
CREATE TABLE comandos_esp32 (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id VARCHAR(50) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    parametro VARCHAR(100),
    estado ENUM('pendiente', 'ejecutado', 'error') DEFAULT 'pendiente',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ejecutado_at TIMESTAMP NULL,
    FOREIGN KEY (device_id) REFERENCES dispositivos_esp32(device_id) ON DELETE CASCADE,
    INDEX idx_device_estado (device_id, estado)
);

-- ========================================
-- TABLA DE ESTÁNDARES GLOBALES (NUEVA)
-- ========================================
CREATE TABLE estandares_globales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    categoria VARCHAR(50) NOT NULL,
    subcategoria VARCHAR(50),
    valor_min DECIMAL(10, 2),
    valor_max DECIMAL(10, 2),
    unidad VARCHAR(10),
    fuente VARCHAR(200),
    fecha_vigencia DATE,
    fecha_revision DATE,
    activo BOOLEAN DEFAULT TRUE,
    notas TEXT,
    INDEX idx_categoria_activo (categoria, activo)
);

-- ========================================
-- TABLA DE UMBRALES PERSONALIZADOS (NUEVA)
-- ========================================
CREATE TABLE umbrales_personalizados (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    parametro VARCHAR(50) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    unidad VARCHAR(10),
    razon VARCHAR(200),
    fecha_inicio DATE DEFAULT (CURDATE()),
    fecha_fin DATE,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_activo (usuario_id, activo)
);

-- ========================================
-- TABLA DE HISTORIAL DE ESTÁNDARES (NUEVA)
-- ========================================
CREATE TABLE historial_estandares (
    id INT PRIMARY KEY AUTO_INCREMENT,
    estandar_id INT NOT NULL,
    campo_modificado VARCHAR(50),
    valor_anterior VARCHAR(100),
    valor_nuevo VARCHAR(100),
    usuario_modificador VARCHAR(100),
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    razon TEXT,
    FOREIGN KEY (estandar_id) REFERENCES estandares_globales(id) ON DELETE CASCADE
);

-- ========================================
-- TABLA DE CONFIGURACIONES CONTEXTUALES (NUEVA)
-- ========================================
CREATE TABLE configuraciones_contextuales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    contexto VARCHAR(50) NOT NULL,
    descripcion TEXT,
    ajustes JSON,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- ========================================
-- DATOS DE EJEMPLO
-- ========================================

-- Usuario de prueba
INSERT INTO usuarios (nombre, apellido, email) VALUES
('Usuario', 'Demo', 'demo@ejemplo.com');

-- Sesión activa de prueba
INSERT INTO sesiones_trabajo (usuario_id, fecha, hora_inicio, estado) VALUES
(1, CURDATE(), CURTIME(), 'activa');

-- Dispositivo ESP32 de ejemplo
INSERT INTO dispositivos_esp32 (device_id, tipo, sensores, actuadores) VALUES
('ESP32_ESCRITORIO_01', 'sensor_actuador', 'MQ135', 'ventilador,leds')
ON DUPLICATE KEY UPDATE device_id=device_id;

-- Estándares de CO2
INSERT INTO estandares_globales 
(categoria, subcategoria, valor_min, valor_max, unidad, fuente, fecha_vigencia) VALUES
('co2', 'optimo', 400, 800, 'ppm', 'ASHRAE 62.1-2019', '2019-01-01'),
('co2', 'aceptable', 801, 1000, 'ppm', 'ASHRAE 62.1-2019', '2019-01-01'),
('co2', 'deficiente', 1001, 1500, 'ppm', 'ASHRAE 62.1-2019', '2019-01-01'),
('co2', 'critico', 1501, 5000, 'ppm', 'OSHA TWA', '2015-01-01');

-- Estándares de ruido
INSERT INTO estandares_globales 
(categoria, subcategoria, valor_min, valor_max, unidad, fuente, fecha_vigencia) VALUES
('ruido', 'silencioso', 0, 40, 'dB', 'OMS Guía Ruido', '2018-01-01'),
('ruido', 'tranquilo', 41, 50, 'dB', 'OMS Guía Ruido', '2018-01-01'),
('ruido', 'moderado', 51, 65, 'dB', 'OMS Guía Ruido', '2018-01-01'),
('ruido', 'ruidoso', 66, 85, 'dB', 'OSHA PEL', '2015-01-01'),
('ruido', 'muy_ruidoso', 86, 120, 'dB', 'OSHA PEL', '2015-01-01');

-- Estándares de temperatura
INSERT INTO estandares_globales 
(categoria, subcategoria, valor_min, valor_max, unidad, fuente, fecha_vigencia) VALUES
('temperatura', 'frio', 0, 18, '°C', 'ISO 7730', '2005-01-01'),
('temperatura', 'fresco', 19, 21, '°C', 'ISO 7730', '2005-01-01'),
('temperatura', 'optimo', 22, 24, '°C', 'ISO 7730', '2005-01-01'),
('temperatura', 'calido', 25, 27, '°C', 'ISO 7730', '2005-01-01'),
('temperatura', 'caluroso', 28, 40, '°C', 'ISO 7730', '2005-01-01');

-- Ejemplo de configuración contextual
INSERT INTO configuraciones_contextuales 
(contexto, descripcion, ajustes) VALUES
('oficina_altitud_2500m', 
 'Ajustes para oficinas ubicadas a 2500m sobre nivel del mar',
 '{"co2_aceptable_max": 1200, "co2_critico": 1400}');

-- ========================================
-- VISTAS ÚTILES
-- ========================================

CREATE OR REPLACE VIEW vista_sesion_actual AS
SELECT 
    s.id AS sesion_id,
    s.usuario_id,
    u.nombre,
    u.apellido,
    s.fecha,
    s.hora_inicio,
    s.minutos_totales,
    s.estado,
    (SELECT valor FROM lecturas_sensores WHERE sesion_id = s.id AND tipo_sensor = 'co2' ORDER BY timestamp DESC LIMIT 1) AS ultimo_co2,
    (SELECT valor FROM lecturas_sensores WHERE sesion_id = s.id AND tipo_sensor = 'ruido' ORDER BY timestamp DESC LIMIT 1) AS ultimo_ruido,
    (SELECT valor FROM lecturas_sensores WHERE sesion_id = s.id AND tipo_sensor = 'temperatura' ORDER BY timestamp DESC LIMIT 1) AS ultima_temperatura
FROM sesiones_trabajo s
JOIN usuarios u ON s.usuario_id = u.id
WHERE s.estado = 'activa';

-- ========================================
-- FIN DEL ESQUEMA
-- ========================================