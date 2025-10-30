import cv2

print("Probando cámara...")
print("Presiona 'q' para salir")

cap = cv2.VideoCapture(0)  # 0 = cámara por defecto

if not cap.isOpened():
    print("❌ No se pudo abrir la cámara")
    print("Prueba cambiando el 0 por 1 o 2")
    exit()

print("✅ Cámara abierta correctamente")

while True:
    ret, frame = cap.read()
    
    if not ret:
        print("❌ Error leyendo frame")
        break
    
    # Mostrar frame
    cv2.imshow('Test Cámara - Presiona Q para salir', frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print("✓ Cámara cerrada")