"""
Módulo de Síntesis de Voz para Alertas
Utiliza pyttsx3 para generación de voz local
"""

import pyttsx3
import time

class AsistenteVoz:
    def __init__(self):
        """
        Inicializa el motor de síntesis de voz
        """
        try:
            self.engine = pyttsx3.init()
            
            # Configurar propiedades
            self.engine.setProperty('rate', 150)    # Velocidad
            self.engine.setProperty('volume', 1.0)  # Volumen
            
            print("✓ Asistente de voz inicializado")
        except Exception as e:
            print(f"⚠️ Error inicializando voz: {e}")
            self.engine = None
    
    def hablar(self, texto, esperar=True):
        """
        Convierte texto a voz
        """
        if self.engine is None:
            print(f"[VOZ DESHABILITADA] {texto}")
            return
        
        try:
            print(f"🔊 Diciendo: {texto}")
            self.engine.say(texto)
            if esperar:
                self.engine.runAndWait()
        except Exception as e:
            print(f"❌ Error en síntesis de voz: {e}")
    
    # ========================================
    # MENSAJES DEL SISTEMA
    # ========================================
    
    def bienvenida(self):
        """Mensaje de bienvenida"""
        self.hablar("Bienvenido al sistema de salud ocupacional. Tu sesión ha comenzado.")
    
    def alerta_co2_alto(self, valor):
        """Alerta de CO2 elevado"""
        mensaje = f"Atención. Nivel de dióxido de carbono elevado: {valor} partes por millón. "\
                  "Se recomienda mejorar la ventilación."
        self.hablar(mensaje)
    
    def alerta_ruido_alto(self, valor):
        """Alerta de ruido elevado"""
        mensaje = f"Nivel de ruido elevado: {valor} decibeles. "\
                  "Considera utilizar audífonos con cancelación de ruido."
        self.hablar(mensaje)
    
    def recordatorio_pausa(self, minutos):
        """Recordatorio de tomar pausa"""
        mensaje = f"Has trabajado {minutos} minutos sin descanso. "\
                  "Es momento de tomar una pausa de cinco minutos."
        self.hablar(mensaje)
    
    def alerta_fatiga_visual(self):
        """Alerta de fatiga visual"""
        mensaje = "Se han detectado signos de fatiga visual. "\
                  "Descansa la vista mirando a lo lejos durante veinte segundos."
        self.hablar(mensaje)
    
    def alerta_fatiga_postural(self):
        """Alerta de fatiga postural"""
        mensaje = "Tu postura no es correcta. "\
                  "Ajusta tu posición y realiza algunos estiramientos."
        self.hablar(mensaje)
    
    def despedida(self, minutos_totales):
        """Mensaje de despedida"""
        mensaje = f"Sesión finalizada. Has trabajado {minutos_totales} minutos. "\
                  "Que tengas un excelente día."
        self.hablar(mensaje)
    
    # ========================================
    # GUÍAS DE EJERCICIOS
    # ========================================
    
    def guiar_ejercicio_20_20_20(self):
        """
        Guía el ejercicio visual 20-20-20
        """
        print("\n🎯 Iniciando ejercicio visual 20-20-20")
        
        pasos = [
            "Ejercicio visual veinte, veinte, veinte.",
            "Aparta la mirada de la pantalla.",
            "Busca un objeto a seis metros de distancia.",
            "Concéntrate en ese objeto durante veinte segundos.",
            "Perfecto. Ejercicio completado."
        ]
        
        for paso in pasos:
            self.hablar(paso, esperar=True)
            if "veinte segundos" in paso:
                print("   [Esperando 20 segundos...]")
                time.sleep(20)
            else:
                time.sleep(2)
    
    def guiar_estiramiento_cuello(self):
        """
        Guía estiramiento de cuello
        """
        print("\n🎯 Iniciando estiramiento de cuello")
        
        pasos = [
            "Estiramiento de cuello.",
            "Inclina lentamente tu cabeza hacia el hombro derecho.",
            "Mantén cinco segundos.",
            "Regresa al centro.",
            "Ahora inclina hacia el hombro izquierdo.",
            "Mantén cinco segundos.",
            "Regresa al centro. Ejercicio completado."
        ]
        
        for paso in pasos:
            self.hablar(paso, esperar=True)
            if "cinco segundos" in paso:
                time.sleep(5)
            else:
                time.sleep(2)
    
    def detener(self):
        """
        Detiene el motor de voz
        """
        if self.engine:
            self.engine.stop()

# ========================================
# PRUEBA DEL MÓDULO
# ========================================

if __name__ == "__main__":
    print("="*60)
    print("PRUEBA DEL ASISTENTE DE VOZ")
    print("="*60 + "\n")
    
    asistente = AsistenteVoz()
    
    # Prueba de mensajes
    print("\n1. Mensaje de bienvenida:")
    asistente.bienvenida()
    time.sleep(2)
    
    print("\n2. Alerta de CO2:")
    asistente.alerta_co2_alto(1250)
    time.sleep(2)
    
    print("\n3. Alerta de fatiga visual:")
    asistente.alerta_fatiga_visual()
    time.sleep(2)
    
    print("\n4. Guía de ejercicio:")
    respuesta = input("\n¿Quieres probar la guía de ejercicio 20-20-20? (s/n): ")
    if respuesta.lower() == 's':
        asistente.guiar_ejercicio_20_20_20()
    
    asistente.detener()
    print("\n✓ Prueba completada")