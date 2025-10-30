/**
 * API Backend - Sistema de Salud Ocupacional
 * VERSIÓN CON SIMULACIÓN DE SENSORES (Sin Arduino)
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

// ========================================
// SIMULADOR DE SENSORES
// ========================================

class SimuladorSensores {
  constructor() {
    this.co2 = 450;
    this.ruido = 45;
    this.temperatura = 23;
  }

  simularLectura() {
    // Simular variaciones naturales
    this.co2 += (Math.random() - 0.5) * 30;
    this.co2 = Math.max(400, Math.min(1500, this.co2));

    this.ruido += (Math.random() - 0.5) * 5;
    this.ruido = Math.max(35, Math.min(80, this.ruido));

    this.temperatura += (Math.random() - 0.5) * 0.5;
    this.temperatura = Math.max(20, Math.min(28, this.temperatura));

    return {
      co2: Math.round(this.co2),
      ruido: Math.round(this.ruido),
      temperatura: parseFloat(this.temperatura.toFixed(1))
    };
  }

  // Simular condición crítica (para pruebas)
  simularCO2Alto() {
    this.co2 = 1250;
  }

  simularRuidoAlto() {
    this.ruido = 75;
  }
}

const simulador = new SimuladorSensores();

// Iniciar simulación automática cada 10 segundos
let sesionActual = 1;
setInterval(async () => {
  const lecturas = simulador.simularLectura();
  
  try {
    // Guardar en base de datos
    await dbPool.query(`
      INSERT INTO lecturas_sensores (sesion_id, tipo_sensor, valor, unidad)
      VALUES 
        (?, 'co2', ?, 'ppm'),
        (?, 'ruido', ?, 'dB'),
        (?, 'temperatura', ?, '°C')
    `, [
      sesionActual, lecturas.co2,
      sesionActual, lecturas.ruido,
      sesionActual, lecturas.temperatura
    ]);

    console.log(`📊 Lecturas simuladas - CO2: ${lecturas.co2} ppm, Ruido: ${lecturas.ruido} dB, Temp: ${lecturas.temperatura}°C`);

    // Verificar condiciones y generar alertas
    if (lecturas.co2 > 1200) {
      await generarAlerta(sesionActual, 'co2_critico', 'alta', 
        `CO₂ crítico: ${lecturas.co2} ppm. Ventilación necesaria.`);
    }

    if (lecturas.ruido > 70) {
      await generarAlerta(sesionActual, 'ruido_alto', 'media',
        `Nivel de ruido elevado: ${lecturas.ruido} dB`);
    }

    // Actualizar tiempo de sesión
    await dbPool.query(`
      UPDATE sesiones_trabajo 
      SET minutos_totales = TIMESTAMPDIFF(MINUTE, 
        CONCAT(fecha, ' ', hora_inicio), NOW())
      WHERE id = ?
    `, [sesionActual]);

  } catch (error) {
    console.error('Error en simulación:', error.message);
  }
}, 10000); // Cada 10 segundos

// Función auxiliar para generar alertas
async function generarAlerta(sesionId, tipo, prioridad, mensaje) {
  try {
    // Verificar si ya existe alerta similar reciente
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

// ========================================
// RUTAS PRINCIPALES
// ========================================

app.get('/', (req, res) => {
  res.json({
    message: '🏥 API de Salud Ocupacional - Modo Simulación',
    status: 'activo',
    version: '1.0.0',
    modo: 'simulacion_sin_arduino',
    endpoints: [
      'GET  /api/test',
      'GET  /api/sensores/ultimas',
      'GET  /api/sesion/actual',
      'POST /api/sesion/iniciar',
      'GET  /api/alertas/activas',
      'GET  /api/fatiga/actual',
      'POST /api/simulador/co2-alto',
      'POST /api/simulador/ruido-alto'
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

// Obtener últimas lecturas de sensores
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

// Obtener sesión actual
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

// Iniciar nueva sesión
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

// Obtener alertas activas
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

// Obtener estado de fatiga actual
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
// ENDPOINTS PARA PRUEBAS DEL SIMULADOR
// ========================================

// Forzar CO2 alto (para demostración)
app.post('/api/simulador/co2-alto', (req, res) => {
  simulador.simularCO2Alto();
  res.json({ 
    success: true, 
    message: 'CO2 elevado simulado',
    nuevo_valor: simulador.co2 
  });
});

// Forzar ruido alto (para demostración)
app.post('/api/simulador/ruido-alto', (req, res) => {
  simulador.simularRuidoAlto();
  res.json({ 
    success: true, 
    message: 'Ruido elevado simulado',
    nuevo_valor: simulador.ruido 
  });
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
      console.log('🚀 SERVIDOR API INICIADO - MODO SIMULACIÓN');
      console.log('='.repeat(60));
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🎯 Simulación automática de sensores ACTIVA`);
      console.log(`📊 Lecturas cada 10 segundos`);
      console.log('='.repeat(60));
      console.log('\nEndpoints disponibles:');
      console.log('  GET  / (info del API)');
      console.log('  GET  /api/test');
      console.log('  GET  /api/sensores/ultimas');
      console.log('  GET  /api/sesion/actual');
      console.log('  GET  /api/alertas/activas');
      console.log('  POST /api/simulador/co2-alto (forzar alerta)');
      console.log('  POST /api/simulador/ruido-alto (forzar alerta)');
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