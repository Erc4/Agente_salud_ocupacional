"""
Módulo para cargar estándares dinámicos desde MySQL a Prolog
"""

import mysql.connector
from pyswip import Prolog
from datetime import datetime

class CargadorEstandaresDinamico:
    def __init__(self, db_config, archivo_prolog='salud_ocupacional.pl'):
        """Inicializa conexión a BD y Prolog"""
        self.db = mysql.connector.connect(**db_config)
        self.cursor = self.db.cursor(dictionary=True)
        
        self.prolog = Prolog()
        self.prolog.consult(archivo_prolog)
        
        print("✓ Sistema de estándares dinámicos inicializado")
    
    def cargar_estandares_globales(self):
        """Carga todos los estándares activos desde BD a Prolog"""
        
        print("\n📊 Cargando estándares globales desde BD...")
        
        # Cargar estándares de CO2
        self.cursor.execute("""
            SELECT subcategoria, valor_min, valor_max
            FROM estandares_globales
            WHERE categoria = 'co2' AND activo = TRUE
            ORDER BY valor_min
        """)
        
        print("\n  CO2:")
        for row in self.cursor.fetchall():
            nivel = row['subcategoria']
            min_val = float(row['valor_min'])
            max_val = float(row['valor_max'])
            
            # Cargar en Prolog
            query = f"cargar_estandar_co2({nivel}, {min_val}, {max_val})"
            list(self.prolog.query(query))
            
            print(f"    ✓ {nivel}: {min_val}-{max_val} ppm")
        
        # Cargar estándares de ruido
        self.cursor.execute("""
            SELECT subcategoria, valor_min, valor_max
            FROM estandares_globales
            WHERE categoria = 'ruido' AND activo = TRUE
            ORDER BY valor_min
        """)
        
        print("\n  Ruido:")
        for row in self.cursor.fetchall():
            nivel = row['subcategoria']
            min_val = float(row['valor_min'])
            max_val = float(row['valor_max'])
            
            query = f"cargar_estandar_ruido({nivel}, {min_val}, {max_val})"
            list(self.prolog.query(query))
            
            print(f"    ✓ {nivel}: {min_val}-{max_val} dB")
        
        # Cargar estándares de temperatura
        self.cursor.execute("""
            SELECT subcategoria, valor_min, valor_max
            FROM estandares_globales
            WHERE categoria = 'temperatura' AND activo = TRUE
            ORDER BY valor_min
        """)
        
        print("\n  Temperatura:")
        for row in self.cursor.fetchall():
            nivel = row['subcategoria']
            min_val = float(row['valor_min'])
            max_val = float(row['valor_max'])
            
            query = f"cargar_estandar_temperatura({nivel}, {min_val}, {max_val})"
            list(self.prolog.query(query))
            
            print(f"    ✓ {nivel}: {min_val}-{max_val} °C")
    
    def cargar_umbrales_usuario(self, usuario_id):
        """Carga umbrales personalizados del usuario"""
        
        print(f"\n👤 Cargando umbrales personalizados para usuario {usuario_id}...")
        
        self.cursor.execute("""
            SELECT parametro, valor, razon
            FROM umbrales_personalizados
            WHERE usuario_id = %s AND activo = TRUE
            AND (fecha_fin IS NULL OR fecha_fin >= CURDATE())
        """, (usuario_id,))
        
        umbrales_cargados = 0
        
        for row in self.cursor.fetchall():
            parametro = row['parametro']
            valor = float(row['valor'])
            razon = row['razon']
            
            query = f"cargar_umbral_usuario({usuario_id}, {parametro}, {valor})"
            list(self.prolog.query(query))
            
            print(f"  ✓ {parametro} = {valor} (Razón: {razon})")
            umbrales_cargados += 1
        
        if umbrales_cargados == 0:
            print(f"  → Usuario {usuario_id} usa umbrales por defecto")
        
        # Establecer usuario actual en Prolog
        list(self.prolog.query(f"establecer_usuario({usuario_id})"))
        
        return umbrales_cargados
    
    def aplicar_configuracion_contextual(self, contexto):
        """Aplica ajustes contextuales (ej: oficina en altitud)"""
        
        self.cursor.execute("""
            SELECT ajustes, descripcion
            FROM configuraciones_contextuales
            WHERE contexto = %s AND activo = TRUE
            LIMIT 1
        """, (contexto,))
        
        row = self.cursor.fetchone()
        
        if row:
            import json
            ajustes = json.loads(row['ajustes'])
            descripcion = row['descripcion']
            
            print(f"\n📍 Aplicando contexto: {contexto}")
            print(f"   {descripcion}")
            
            for parametro, valor in ajustes.items():
                # Actualizar umbral en Prolog
                query = f"cargar_umbral_usuario(sistema, {parametro}, {valor})"
                list(self.prolog.query(query))
                
                print(f"  ✓ {parametro} ajustado a {valor}")
            
            return True
        else:
            print(f"⚠️ No se encontró configuración para contexto: {contexto}")
            return False
    
    def registrar_cambio_estandar(self, estandar_id, campo, valor_anterior, valor_nuevo, razon):
        """Registra cambio en historial para trazabilidad"""
        
        self.cursor.execute("""
            INSERT INTO historial_estandares 
            (estandar_id, campo_modificado, valor_anterior, valor_nuevo, 
             usuario_modificador, razon)
            VALUES (%s, %s, %s, %s, 'sistema', %s)
        """, (estandar_id, campo, str(valor_anterior), str(valor_nuevo), razon))
        
        self.db.commit()
        
        print(f"📝 Cambio registrado: {campo} de {valor_anterior} a {valor_nuevo}")
    
    def obtener_prolog(self):
        """Retorna la instancia de Prolog para uso externo"""
        return self.prolog
    
    def cerrar(self):
        """Cierra conexiones"""
        self.cursor.close()
        self.db.close()


# ========================================
# EJEMPLO DE USO
# ========================================

if __name__ == "__main__":
    db_config = {
        'host': 'localhost',
        'user': 'root',
        'password': '',
        'database': 'salud_ocupacional'
    }
    
    print("="*60)
    print("SISTEMA DE ESTÁNDARES DINÁMICOS")
    print("="*60)
    
    cargador = CargadorEstandaresDinamico(db_config)
    
    # Cargar estándares globales
    cargador.cargar_estandares_globales()
    
    # Cargar umbrales personalizados
    cargador.cargar_umbrales_usuario(usuario_id=1)
    
    # Aplicar contexto especial (opcional)
    # cargador.aplicar_configuracion_contextual('oficina_altitud_2500m')
    
    print("\n" + "="*60)
    print("✓ Sistema listo con estándares configurables")
    print("="*60 + "\n")
    
    # Probar una consulta
    prolog = cargador.obtener_prolog()
    
    # Simular una lectura de CO2
    list(prolog.query("actualizar_sensor(co2, 1250, '10:30:00')"))
    
    # Verificar si es crítico
    resultado = list(prolog.query("condicion_critica_co2"))
    
    if len(resultado) > 0:
        print("⚠️ ALERTA: CO2 crítico detectado")
    else:
        print("✓ CO2 dentro de rangos normales")
    
    cargador.cerrar()