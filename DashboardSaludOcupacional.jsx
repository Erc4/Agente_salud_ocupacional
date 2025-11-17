import React, { useState, useEffect } from 'react';
import { Activity, Wind, Volume2, Eye, AlertCircle, CheckCircle } from 'lucide-react';

const DashboardSaludOcupacional = () => {
  // Estados para datos en tiempo real
  const [datosSensores, setDatosSensores] = useState({
    co2: 450,
    ruido: 45,
    temperatura: 23
  });

  const [estadoFatiga, setEstadoFatiga] = useState({
    visual: 'bajo',
    postural: 'bajo',
    cognitiva: 'bajo'
  });

  const [alertasActivas, setAlertasActivas] = useState([]);
  
  const [estadoActuadores, setEstadoActuadores] = useState({
    ventilador: 'apagado',
    ledVerde: false,
    ledAmarillo: false,
    ledRojo: false
  });

  const [sesionActual, setSesionActual] = useState({
    activa: true,
    minutosTranscurridos: 0,
    pausasTomadas: 0
  });

  // Simular actualización de datos cada 5 segundos
  useEffect(() => {
    const intervalo = setInterval(() => {
      // Simular cambios en sensores
      setDatosSensores(prev => ({
        co2: Math.max(400, Math.min(1500, prev.co2 + (Math.random() - 0.5) * 50)),
        ruido: Math.max(30, Math.min(80, prev.ruido + (Math.random() - 0.5) * 10)),
        temperatura: Math.max(20, Math.min(28, prev.temperatura + (Math.random() - 0.5) * 1))
      }));

      // Incrementar tiempo de sesión
      setSesionActual(prev => ({
        ...prev,
        minutosTranscurridos: prev.minutosTranscurridos + 1
      }));
    }, 5000);

    return () => clearInterval(intervalo);
  }, []);

  // Función para determinar color según nivel
  const getColorCO2 = (valor) => {
    if (valor < 800) return 'text-green-500';
    if (valor < 1000) return 'text-yellow-500';
    if (valor < 1500) return 'text-orange-500';
    return 'text-red-500';
  };

  const getColorRuido = (valor) => {
    if (valor < 50) return 'text-green-500';
    if (valor < 65) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getColorFatiga = (nivel) => {
    if (nivel === 'bajo') return 'text-green-500';
    if (nivel === 'moderado') return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🏥 Agente Inteligente - Salud Ocupacional
        </h1>
        <p className="text-gray-600">Sistema de monitoreo y optimización de ambiente laboral</p>
      </div>

      {/* Sesión Actual */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Sesión Actual</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Estado</p>
            <p className="text-2xl font-bold text-blue-600">
              {sesionActual.activa ? 'Activa' : 'Finalizada'}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Tiempo Trabajado</p>
            <p className="text-2xl font-bold text-purple-600">
              {sesionActual.minutosTranscurridos} min
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Pausas Tomadas</p>
            <p className="text-2xl font-bold text-green-600">
              {sesionActual.pausasTomadas}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Panel de Sensores */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Activity className="mr-2" /> Lecturas de Sensores
          </h2>
          
          {/* CO2 */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-gray-700">CO₂</span>
              <span className={`text-2xl font-bold ${getColorCO2(datosSensores.co2)}`}>
                {Math.round(datosSensores.co2)} ppm
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all ${
                  datosSensores.co2 < 800 ? 'bg-green-500' :
                  datosSensores.co2 < 1000 ? 'bg-yellow-500' :
                  datosSensores.co2 < 1500 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((datosSensores.co2 / 2000) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Óptimo: &lt;800 | Aceptable: 800-1000 | Crítico: &gt;1200
            </p>
          </div>

          {/* Ruido */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-gray-700 flex items-center">
                <Volume2 className="mr-2 w-5 h-5" /> Ruido
              </span>
              <span className={`text-2xl font-bold ${getColorRuido(datosSensores.ruido)}`}>
                {Math.round(datosSensores.ruido)} dB
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all ${
                  datosSensores.ruido < 50 ? 'bg-green-500' :
                  datosSensores.ruido < 65 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${(datosSensores.ruido / 100) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Tranquilo: &lt;50 | Moderado: 50-65 | Ruidoso: &gt;65
            </p>
          </div>

          {/* Temperatura */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-gray-700">🌡️ Temperatura</span>
              <span className="text-2xl font-bold text-blue-600">
                {datosSensores.temperatura.toFixed(1)}°C
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(Math.max(((datosSensores.temperatura - 15) / 15) * 100, 0), 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Óptimo: 22-24°C
            </p>
          </div>
        </div>

        {/* Panel de Detección de Fatiga */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Eye className="mr-2" /> Detección de Fatiga
          </h2>

          {/* Fatiga Visual */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-700">Fatiga Visual</p>
                <p className="text-xs text-gray-500">Análisis de parpadeo y mirada</p>
              </div>
              <div className="text-right">
                <span className={`text-xl font-bold uppercase ${getColorFatiga(estadoFatiga.visual)}`}>
                  {estadoFatiga.visual}
                </span>
              </div>
            </div>
          </div>

          {/* Fatiga Postural */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-700">Fatiga Postural</p>
                <p className="text-xs text-gray-500">Análisis de posición</p>
              </div>
              <div className="text-right">
                <span className={`text-xl font-bold uppercase ${getColorFatiga(estadoFatiga.postural)}`}>
                  {estadoFatiga.postural}
                </span>
              </div>
            </div>
          </div>

          {/* Fatiga Cognitiva */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-700">Fatiga Cognitiva</p>
                <p className="text-xs text-gray-500">Tiempo de trabajo continuo</p>
              </div>
              <div className="text-right">
                <span className={`text-xl font-bold uppercase ${getColorFatiga(estadoFatiga.cognitiva)}`}>
                  {estadoFatiga.cognitiva}
                </span>
              </div>
            </div>
          </div>

          {/* Recomendación */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm font-semibold text-blue-800 mb-1">💡 Recomendación</p>
            <p className="text-sm text-blue-700">
              {sesionActual.minutosTranscurridos > 50 
                ? "Es momento de tomar una pausa de 5 minutos"
                : "Todo va bien. Mantén tu postura correcta"}
            </p>
          </div>
        </div>
      </div>

      {/* Alertas Activas */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <AlertCircle className="mr-2" /> Alertas Activas
        </h2>
        
        {datosSensores.co2 > 1200 || datosSensores.ruido > 70 || sesionActual.minutosTranscurridos > 60 ? (
          <div className="space-y-3">
            {datosSensores.co2 > 1200 && (
              <div className="flex items-start p-4 bg-red-50 border-l-4 border-red-500 rounded">
                <AlertCircle className="text-red-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">CO₂ Crítico</p>
                  <p className="text-sm text-red-700">
                    Nivel de CO₂ en {Math.round(datosSensores.co2)} ppm. Ventilador activado automáticamente.
                  </p>
                </div>
              </div>
            )}
            
            {datosSensores.ruido > 70 && (
              <div className="flex items-start p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <AlertCircle className="text-yellow-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-800">Ruido Elevado</p>
                  <p className="text-sm text-yellow-700">
                    Nivel de ruido en {Math.round(datosSensores.ruido)} dB. Considera usar audífonos.
                  </p>
                </div>
              </div>
            )}
            
            {sesionActual.minutosTranscurridos > 60 && (
              <div className="flex items-start p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                <AlertCircle className="text-orange-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-orange-800">Pausa Recomendada</p>
                  <p className="text-sm text-orange-700">
                    Has trabajado {sesionActual.minutosTranscurridos} minutos sin pausa. Toma un descanso.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <CheckCircle className="text-green-500 mr-3" />
            <p className="text-green-700 font-medium">
              No hay alertas activas. Condiciones de trabajo óptimas.
            </p>
          </div>
        )}
      </div>

      {/* Estado de Actuadores */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Wind className="mr-2" /> Estado de Actuadores
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Ventilador */}
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <Wind className={`mx-auto mb-2 ${datosSensores.co2 > 1200 ? 'text-blue-500' : 'text-gray-400'}`} size={32} />
            <p className="font-semibold text-gray-700">Ventilador</p>
            <p className={`text-sm ${datosSensores.co2 > 1200 ? 'text-blue-600' : 'text-gray-500'}`}>
              {datosSensores.co2 > 1200 ? 'ENCENDIDO' : 'APAGADO'}
            </p>
          </div>

          {/* LED Verde */}
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 ${
              datosSensores.co2 < 800 && datosSensores.ruido < 50 
                ? 'bg-green-500 shadow-lg shadow-green-300' 
                : 'bg-gray-300'
            }`}></div>
            <p className="font-semibold text-gray-700">LED Verde</p>
            <p className="text-sm text-gray-500">Estado OK</p>
          </div>

          {/* LED Amarillo */}
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 ${
              (datosSensores.co2 >= 800 && datosSensores.co2 < 1200) || 
              (datosSensores.ruido >= 50 && datosSensores.ruido < 70)
                ? 'bg-yellow-500 shadow-lg shadow-yellow-300' 
                : 'bg-gray-300'
            }`}></div>
            <p className="font-semibold text-gray-700">LED Amarillo</p>
            <p className="text-sm text-gray-500">Precaución</p>
          </div>

          {/* LED Rojo */}
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 ${
              datosSensores.co2 >= 1200 || datosSensores.ruido >= 70
                ? 'bg-red-500 shadow-lg shadow-red-300 animate-pulse' 
                : 'bg-gray-300'
            }`}></div>
            <p className="font-semibold text-gray-700">LED Rojo</p>
            <p className="text-sm text-gray-500">Alerta</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-gray-600 text-sm">
        <p>🤖 Sistema de Agente Inteligente | Universidad Autónoma de Sinaloa</p>
        <p className="mt-1">Actualización en tiempo real cada 5 segundos</p>
      </div>
    </div>
  );
};

export default DashboardSaludOcupacional;