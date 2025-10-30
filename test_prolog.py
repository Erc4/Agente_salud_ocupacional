try:
    from pyswip import Prolog
    print("✅ pyswip importado correctamente")
    
    prolog = Prolog()
    print("✅ Motor Prolog inicializado")
    
    # Prueba simple
    prolog.assertz("padre(juan, maria)")
    result = list(prolog.query("padre(juan, X)"))
    print(f"✅ Consulta exitosa: {result}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("\nSolución:")
    print("1. Asegúrate de haber instalado SWI-Prolog 64-bit")
    print("2. Reinicia la terminal después de instalar")
    print("3. Verifica con: swipl --version")