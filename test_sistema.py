"""
Test del sistema para verificar voz
"""
from asistente_voz import AsistenteVoz
import time

print("="*60)
print("TEST DE VOZ EN SISTEMA")
print("="*60 + "\n")

print("1. Creando asistente...")
asistente = AsistenteVoz()
print("✓ Asistente creado\n")

print("2. Probando mensaje de bienvenida...")
asistente.bienvenida()
print("✓ Bienvenida dicha\n")

time.sleep(3)

print("3. Probando alerta de CO2...")
asistente.alerta_co2_alto(1250)
print("✓ Alerta dicha\n")

time.sleep(3)

print("4. Probando alerta de fatiga...")
asistente.alerta_fatiga_visual()
print("✓ Alerta dicha\n")

print("\n✓ Test completado")