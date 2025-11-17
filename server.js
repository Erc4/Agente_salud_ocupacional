/**
 * API Backend - Sistema de Salud Ocupacional
 * VERSIÓN CON ESP32 REAL (Reemplaza simulación)
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ========================================
// CONFIGURACIÓN DE BASE DE DATOS
// ========================================

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'salud_ocupacional',
  waitForConnections: true,
  connectionLimit: 10
};

let dbPool;

async function inicializarDB() {
  try {
    dbPool = mysql.createPool(dbConfig);
    const connection = await dbPool.getConnection();
    console.log('✓ Conectado a MySQL correctamente');
    connection.release();
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
  }
}

// Variable para sesión actual
let sesionActual = 1;

// ========================================
// FUNCIONES AUXILIARES
// ========================================

async function generarAlerta(sesionId, tipo, prioridad, mensaje) {
  try {
    const [alertas] = await dbPool.query(`
      SELECT id FROM alertas_generadas 
      WHERE sesion_id = ? AND tipo_alerta = ? 
      AND timestamp > DATE_SUB(NOW(), INTERVAL 2 MINUTE)
      LIMIT 1
    `, [sesionId, tipo]);

    if (alertas.length === 0) {
      await dbPool.query(`
        INSERT INTO alertas_generadas (sesion_id, tipo_alerta, prioridad, mensaje)
        VALUES (?, ?, ?, ?)
      `, [sesionId, tipo, prioridad, mensaje]);
      
      console.log(`⚠️  Alerta generada: ${mensaje}`);
    }
  } catch (error) {
    console.error('Error generando alerta:', error.message);
  }
}

async function enviarComandoESP32(device_id, accion, parametro = '') {
  try {
    await dbPool.query(`
      INSERT INTO comandos_esp32 (device_id, accion, parametro, estado)
      VALUES (?, ?, ?, 'pendiente')
    `, [device_id, accion, parametro]);
    
    console.log(`📤 Comando enviado a ${device_id}: ${accion}`);
  } catch (error) {
    console.error('Error enviando comando:', error);
  }
}

// ========================================
// RUTAS PRINCIPALES
// ========================================

app.get('/', (req, res) => {
  res.json({
    message: '🏥 API de Salud Ocupacional - ESP32 Real',
    status: 'activo',
    version: '2.0.0',
    modo: 'esp32_real',
    endpoints: [
      'GET  /api/test',
      'GET  /api/sensores/ultimas',
      'GET  /api/sesion/actual',
      'POST /api/sesion/iniciar',
      'GET  /api/alertas/activas',
      'GET  /api/fatiga/actual',
      'POST /api/esp32/registrar',
      'POST /api/esp32/lectura',
      'GET  /api/esp32/comandos',
      'POST /api/esp32/comando/confirmar',
      'POST /api/esp32/comando/enviar'
    ]
  });
});

// Test de conexión
app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT 1 + 1 AS resultado');
    res.json({ 
      success: true, 
      message: 'Conexión a base de datos exitosa',
      resultado: rows[0].resultado 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// ENDPOINTS EXISTENTES
// ========================================

app.get('/api/sensores/ultimas', async (req, res) => {
  try {
    const [lecturas] = await dbPool.query(`
      SELECT tipo_sensor, valor, unidad, timestamp
      FROM lecturas_sensores
      WHERE sesion_id = ?
      ORDER BY tipo_sensor, timestamp DESC
    `, [sesionActual]);
    
    const ultimasLecturas = {};
    lecturas.forEach(lectura => {
      if (!ultimasLecturas[lectura.tipo_sensor]) {
        ultimasLecturas[lectura.tipo_sensor] = {
          valor: parseFloat(lectura.valor),
          unidad: lectura.unidad,
          timestamp: lectura.timestamp
        };
      }
    });
    
    res.json({ success: true, lecturas: ultimasLecturas });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/sesion/actual', async (req, res) => {
  try {
    const [rows] = await dbPool.query(`
      SELECT * FROM vista_sesion_actual LIMIT 1
    `);
    
    if (rows.length > 0) {
      res.json({ success: true, sesion: rows[0] });
    } else {
      res.json({ success: false, message: 'No hay sesión activa' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/sesion/iniciar', async (req, res) => {
  try {
    const [result] = await dbPool.query(`
      INSERT INTO sesiones_trabajo (usuario_id, fecha, hora_inicio, estado)
      VALUES (1, CURDATE(), CURTIME(), 'activa')
    `);
    
    sesionActual = result.insertId;
    
    res.json({ 
      success: true, 
      sesion_id: sesionActual,
      message: 'Sesión iniciada correctamente'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/alertas/activas', async (req, res) => {
  try {
    const [alertas] = await dbPool.query(`
      SELECT * FROM alertas_generadas
      WHERE sesion_id = ?
        AND visualizada = FALSE
        AND descartada = FALSE
      ORDER BY 
        CASE prioridad 
          WHEN 'alta' THEN 1
          WHEN 'media' THEN 2
          WHEN 'baja' THEN 3
        END,
        timestamp DESC
    `, [sesionActual]);
    
    res.json({ success: true, alertas });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/fatiga/actual', async (req, res) => {
  try {
    const [detecciones] = await dbPool.query(`
      SELECT tipo_fatiga, nivel_fatiga, timestamp
      FROM deteccion_fatiga
      WHERE sesion_id = ?
        AND timestamp > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
      ORDER BY tipo_fatiga, timestamp DESC
    `, [sesionActual]);
    
    const estadoActual = {
      visual: 'bajo',
      postural: 'bajo',
      cognitiva: 'bajo'
    };
    
    detecciones.forEach(det => {
      if (!estadoActual[det.tipo_fatiga]) {
        estadoActual[det.tipo_fatiga] = det.nivel_fatiga;
      }
    });
    
    res.json({ success: true, estado: estadoActual });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// ENDPOINTS PARA ESP32
// ========================================

app.post('/api/esp32/registrar', async (req, res) => {
  try {
    const { device_id, tipo, sensores, actuadores } = req.body;
    
    const [existe] = await dbPool.query(
      'SELECT id FROM dispositivos_esp32 WHERE device_id = ?',
      [device_id]
    );
    
    if (existe.length > 0) {
      await dbPool.query(
        'UPDATE dispositivos_esp32 SET ultima_conexion = NOW(), estado = "activo" WHERE device_id = ?',
        [device_id]
      );
      
      res.json({ 
        success: true, 
        message: 'Dispositivo reconectado',
        device_id 
      });
      return;
    }
    
    await dbPool.query(`
      INSERT INTO dispositivos_esp32 (device_id, tipo, sensores, actuadores, estado)
      VALUES (?, ?, ?, ?, 'activo')
    `, [device_id, tipo, sensores, actuadores]);
    
    console.log(`✓ Dispositivo ESP32 registrado: ${device_id}`);
    
    res.json({ 
      success: true, 
      message: 'Dispositivo registrado correctamente',
      device_id 
    });
    
  } catch (error) {
    console.error('Error registrando dispositivo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/esp32/lectura', async (req, res) => {
  try {
    const { device_id, tipo_sensor, valor, unidad } = req.body;
    
    // Guardar lectura
    await dbPool.query(`
      INSERT INTO lecturas_sensores (sesion_id, tipo_sensor, valor, unidad)
      VALUES (?, ?, ?, ?)
    `, [sesionActual, tipo_sensor, valor, unidad]);
    
    console.log(`📊 Lectura ESP32 [${device_id}] - ${tipo_sensor}: ${valor} ${unidad}`);
    
    // Lógica de alertas automáticas
    if (tipo_sensor === 'co2' && valor > 1200) {
      await generarAlerta(sesionActual, 'co2_critico', 'alta', 
        `CO₂ crítico: ${valor} ppm. Ventilación necesaria.`);
      
      // Activar ventilador automáticamente
      await enviarComandoESP32(device_id, 'activar_ventilador', '');
      await enviarComandoESP32(device_id, 'led_alerta', 'rojo');
    } else if (tipo_sensor === 'co2' && valor < 1000) {
      // Desactivar ventilador si CO2 está bien
      await enviarComandoESP32(device_id, 'desactivar_ventilador', '');
      await enviarComandoESP32(device_id, 'led_alerta', 'verde');
    }
    
    // Actualizar tiempo de sesión
    await dbPool.query(`
      UPDATE sesiones_trabajo 
      SET minutos_totales = TIMESTAMPDIFF(MINUTE, 
        CONCAT(fecha, ' ', hora_inicio), NOW())
      WHERE id = ?
    `, [sesionActual]);
    
    res.json({ 
      success: true, 
      message: 'Lectura registrada',
      valor_recibido: valor 
    });
    
  } catch (error) {
    console.error('Error procesando lectura:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/esp32/comandos', async (req, res) => {
  try {
    const { device_id } = req.query;
    
    const [comandos] = await dbPool.query(`
      SELECT id, accion, parametro, timestamp
      FROM comandos_esp32
      WHERE device_id = ? AND estado = 'pendiente'
      ORDER BY timestamp ASC
    `, [device_id]);
    
    res.json({ 
      success: true, 
      comandos 
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/esp32/comando/confirmar', async (req, res) => {
  try {
    const { comando_id, device_id, estado } = req.body;
    
    await dbPool.query(`
      UPDATE comandos_esp32 
      SET estado = ?, ejecutado_at = NOW()
      WHERE id = ? AND device_id = ?
    `, [estado, comando_id, device_id]);
    
    console.log(`✓ Comando ${comando_id} confirmado por ${device_id}`);
    
    res.json({ success: true });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/esp32/comando/enviar', async (req, res) => {
  try {
    const { device_id, accion, parametro } = req.body;
    
    await enviarComandoESP32(device_id, accion, parametro);
    
    res.json({ 
      success: true, 
      message: 'Comando encolado para envío'
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// MANEJO DE ERRORES
// ========================================

app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint no encontrado'
  });
});

// ========================================
// INICIALIZACIÓN
// ========================================

async function iniciarServidor() {
  try {
    await inicializarDB();
    
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 SERVIDOR API INICIADO - ESP32 REAL');
      console.log('='.repeat(60));
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🎯 Esperando conexión de ESP32...`);
      console.log('='.repeat(60));
      console.log('\nEndpoints ESP32:');
      console.log('  POST /api/esp32/registrar');
      console.log('  POST /api/esp32/lectura');
      console.log('  GET  /api/esp32/comandos');
      console.log('  POST /api/esp32/comando/confirmar');
      console.log('  POST /api/esp32/comando/enviar');
      console.log('\n' + '='.repeat(60));
      console.log('Presiona Ctrl+C para detener\n');
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\n\n🛑 Cerrando servidor...');
  if (dbPool) await dbPool.end();
  console.log('✓ Servidor detenido\n');
  process.exit(0);
});

iniciarServidor();