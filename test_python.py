print("Verificando módulos de Python...")

modulos = [
    ("mysql.connector", "MySQL"),
    ("cv2", "OpenCV"),
    ("numpy", "NumPy"),
    ("scipy", "SciPy"),
    ("pyttsx3", "Text-to-Speech")
]

errores = []
for modulo, nombre in modulos:
    try:
        __import__(modulo)
        print(f"✅ {nombre} - Instalado")
    except ImportError:
        print(f"❌ {nombre} - NO instalado")
        errores.append(nombre)

if errores:
    print(f"\n⚠️ Faltan: {', '.join(errores)}")
else:
    print("\n🎉 ¡Todos los módulos están instalados!")