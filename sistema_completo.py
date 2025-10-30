"""
Sistema Completo Integrado
Detector de Fatiga + Monitoreo de Sesión + Alertas de Voz
"""

import mysql.connector
import time
import threading
from datetime import datetime
from detector_fatiga_real import DetectorFatigaReal
from asistente_voz import AsistenteVoz

class SistemaCompletoSaludOcupacional:
    def __init__(self, db_config):
        """
        Inicializa el sistema completo
        """
        self.db_config = db_config
        self.asistente_voz = AsistenteVoz()
        self.detector = None
        self.sesion_id = None
        self.monitoreo_activo = True
        
        print("\n" + "="*60)
        print("SISTEMA COMPLETO DE SALUD OCUPACIONAL")
        print("="*60 + "\n")
    
    def iniciar_sesion(self):
        """
        Inicia o recupera sesión activa
        """
        try:
            conexion = mysql.connector.connect(**self.db_config)
            cursor = conexion.cursor(dictionary=True)
            
            # Buscar sesión activa
            cursor.execute("""
                SELECT id, 
                       TIMESTAMPDIFF(MINUTE, CONCAT(fecha, ' ', hora_inicio), NOW()) as minutos
                FROM sesiones_trabajo 
                WHERE estado = 'activa' 
                ORDER BY id DESC 
                LIMIT 1
            """)
            sesion = cursor.fetchone()
            
            if sesion:
                self.sesion_id = sesion['id']
                minutos = sesion['minutos']
                print(f"✓ Sesión recuperada: ID {self.sesion_id}")
                print(f"  Tiempo transcurrido: {minutos} minutos\n")
            else:
                # Crear nueva sesión
                cursor.execute("""
                    INSERT INTO sesiones_trabajo (usuario_id, fecha, hora_inicio, estado)
                    VALUES (1, CURDATE(), CURTIME(), 'activa')
                """)
                conexion.commit()
                self.sesion_id = cursor.lastrowid
                print(f"✓ Nueva sesión iniciada: ID {self.sesion_id}\n")
                
                # Mensaje de bienvenida
                self.asistente_voz.bienvenida()
            
            cursor.close()
            conexion.close()
            
            return True
            
        except Exception as e:
            print(f"❌ Error iniciando sesión: {e}")
            return False
    
    def monitorear_tiempo_trabajo(self):
        """
        Monitorea el tiempo de trabajo en segundo plano
        """
        ultima_alerta_pausa = 0
        
        while self.monitoreo_activo:
            try:
                conexion = mysql.connector.connect(**self.db_config)
                cursor = conexion.cursor(dictionary=True)
                
                # Obtener minutos de trabajo
                cursor.execute("""
                    SELECT TIMESTAMPDIFF(MINUTE, CONCAT(fecha, ' ', hora_inicio), NOW()) as minutos
                    FROM sesiones_trabajo
                    WHERE id = ?
                """, (self.sesion_id,))
                
                resultado = cursor.fetchone()
                if resultado:
                    minutos = resultado['minutos']
                    
                    # Alertar cada 50 minutos
                    if minutos >= 50 and minutos % 50 == 0 and minutos != ultima_alerta_pausa:
                        print(f"\n⏰ Recordatorio: {minutos} minutos de trabajo")
                        self.asistente_voz.recordatorio_pausa(minutos)
                        ultima_alerta_pausa = minutos
                
                cursor.close()
                conexion.close()
                
            except Exception as e:
                print(f"⚠️ Error en monitoreo: {e}")
            
            time.sleep(60)  # Verificar cada minuto
    
    def monitorear_alertas_criticas(self):
        """
        Monitorea alertas críticas de la base de datos
        """
        alertas_procesadas = set()
        
        while self.monitoreo_activo:
            try:
                conexion = mysql.connector.connect(**self.db_config)
                cursor = conexion.cursor(dictionary=True)
                
                # Buscar alertas no visualizadas de prioridad alta
                cursor.execute("""
                    SELECT * FROM alertas_generadas
                    WHERE sesion_id = ?
                      AND prioridad = 'alta'
                      AND visualizada = FALSE
                      AND descartada = FALSE
                      AND timestamp > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
                """, (self.sesion_id,))
                
                alertas = cursor.fetchall()
                
                for alerta in alertas:
                    if alerta['id'] not in alertas_procesadas:
                        print(f"\n⚠️ ALERTA CRÍTICA: {alerta['mensaje']}")
                        
                        # Generar alerta de voz según tipo
                        if 'co2' in alerta['tipo_alerta'].lower():
                            # Extraer valor de CO2 del mensaje si es posible
                            import re
                            match = re.search(r'(\d+)\s*ppm', alerta['mensaje'])
                            valor = int(match.group(1)) if match else 1200
                            self.asistente_voz.alerta_co2_alto(valor)
                        
                        elif 'ruido' in alerta['tipo_alerta'].lower():
                            match = re.search(r'(\d+)\s*dB', alerta['mensaje'])
                            valor = int(match.group(1)) if match else 70
                            self.asistente_voz.alerta_ruido_alto(valor)
                        
                        # Marcar como visualizada
                        cursor.execute("""
                            UPDATE alertas_generadas 
                            SET visualizada = TRUE 
                            WHERE id = ?
                        """, (alerta['id'],))
                        conexion.commit()
                        
                        alertas_procesadas.add(alerta['id'])
                
                cursor.close()
                conexion.close()
                
            except Exception as e:
                print(f"⚠️ Error monitoreando alertas: {e}")
            
            time.sleep(10)  # Verificar cada 10 segundos
    
    def ejecutar(self):
        """
        Ejecuta el sistema completo
        """
        # Iniciar sesión
        if not self.iniciar_sesion():
            return
        
        # Esperar un poco después de la bienvenida
        time.sleep(2)
        
        # Iniciar detector de fatiga PASANDO el asistente de voz
        try:
            self.detector = DetectorFatigaReal(
                self.db_config, 
                asistente_voz=self.asistente_voz  # Compartir el mismo asistente
            )
            self.detector.establecer_sesion(self.sesion_id)
        except Exception as e:
            print(f"❌ Error iniciando detector: {e}")
            import traceback
            traceback.print_exc()
            return
        
        # Iniciar threads de monitoreo
        thread_tiempo = threading.Thread(target=self.monitorear_tiempo_trabajo, daemon=True)
        thread_alertas = threading.Thread(target=self.monitorear_alertas_criticas, daemon=True)
        
        thread_tiempo.start()
        thread_alertas.start()
        
        print("✓ Threads de monitoreo iniciados")
        print("✓ Detector de fatiga con cámara iniciando...\n")
        
        # Ejecutar detector (bucle principal)
        try:
            self.detector.ejecutar_monitor_continuo()
        except KeyboardInterrupt:
            print("\n\n✓ Sistema detenido por el usuario")
        finally:
            self.finalizar()
    
    def finalizar(self):
        """
        Finaliza el sistema y la sesión
        """
        print("\nFinalizando sistema...")
        self.monitoreo_activo = False
        
        try:
            conexion = mysql.connector.connect(**self.db_config)
            cursor = conexion.cursor(dictionary=True)
            
            # Obtener minutos totales
            cursor.execute("""
                SELECT TIMESTAMPDIFF(MINUTE, CONCAT(fecha, ' ', hora_inicio), NOW()) as minutos
                FROM sesiones_trabajo
                WHERE id = ?
            """, (self.sesion_id,))
            
            resultado = cursor.fetchone()
            minutos_totales = resultado['minutos'] if resultado else 0
            
            # Finalizar sesión
            cursor.execute("""
                UPDATE sesiones_trabajo 
                SET hora_fin = CURTIME(), 
                    estado = 'finalizada',
                    minutos_totales = ?
                WHERE id = ?
            """, (minutos_totales, self.sesion_id))
            
            conexion.commit()
            cursor.close()
            conexion.close()
            
            print(f"✓ Sesión finalizada: {minutos_totales} minutos trabajados")
            
            # Mensaje de despedida
            self.asistente_voz.despedida(minutos_totales)
            
        except Exception as e:
            print(f"⚠️ Error finalizando: {e}")
        
        print("\n✓ Sistema cerrado correctamente\n")

# ========================================
# EJECUCIÓN PRINCIPAL
# ========================================

if __name__ == "__main__":
    db_config = {
        'host': 'localhost',
        'user': 'root',
        'password': '',
        'database': 'salud_ocupacional'
    }
    
    sistema = SistemaCompletoSaludOcupacional(db_config)
    sistema.ejecutar()