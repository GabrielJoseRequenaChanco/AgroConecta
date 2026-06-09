import streamlit as st
import pandas as pd
from datetime import datetime
from supabase import create_client, Client
import os

# ============================================================
# CONFIGURACIÓN INICIAL DE LA PLATAFORMA
# ============================================================
st.set_page_config(
    page_title="AgroConecta — Plataforma Agrícola Integral",
    page_icon="🌱",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Inyección de estilos de interfaz avanzados (Tarjetas, Estados y Badges)
st.markdown("""
<style>
    .main-title { color: #2e7d32; font-weight: bold; }
    .metric-box { background-color: #f8f9fa; padding: 1.2rem; border-radius: 0.6rem; border-left: 5px solid #4caf50; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .product-card { background-color: #ffffff; padding: 1.5rem; border-radius: 0.5rem; border: 1px solid #e0e0e0; margin-bottom: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    .status-disponible { color: #155724; background-color: #d4edda; padding: 0.25rem 0.6rem; border-radius: 50px; font-size: 0.85rem; font-weight: bold; }
    .status-proceso { color: #856404; background-color: #fff3cd; padding: 0.25rem 0.6rem; border-radius: 50px; font-size: 0.85rem; font-weight: bold; }
    .status-alerta { color: #721c24; background-color: #f8d7da; padding: 0.25rem 0.6rem; border-radius: 50px; font-size: 0.85rem; font-weight: bold; }
</style>
""", unsafe_allow_html=True)

# ============================================================
# CONEXIÓN INTEGRADA A SUPABASE
# ============================================================
@st.cache_resource
def init_supabase() -> Client:
    """Inicializa de forma segura la comunicación con Supabase."""
    url = st.secrets.get("SUPABASE_URL") or os.getenv("SUPABASE_URL")
    key = st.secrets.get("SUPABASE_KEY") or os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        st.error("❌ Credenciales ausentes. Configura SUPABASE_URL y SUPABASE_KEY en los Secrets de Streamlit.")
        st.stop()
    
    return create_client(url, key)

supabase: Client = init_supabase()

# ============================================================
# CAPA DE DATOS: CONSULTAS OPTIMIZADAS CON LIMPIEZA DE CACHÉ
# ============================================================
@st.cache_data(ttl=60)
def get_usuarios():
    try:
        response = supabase.table("users").select("*").execute()
        return response.data if response.data else []
    except Exception as e:
        st.error(f"Error en sincronización de usuarios: {e}")
        return []

@st.cache_data(ttl=60)
def get_productos():
    try:
        response = supabase.table("productos").select("*").execute()
        return response.data if response.data else []
    except Exception as e:
        st.error(f"Error en sincronización de productos: {e}")
        return []

@st.cache_data(ttl=60)
def get_ordenes():
    try:
        response = supabase.table("ordenes").select("*").execute()
        return response.data if response.data else []
    except Exception as e:
        st.error(f"Error en sincronización de órdenes: {e}")
        return []

@st.cache_data(ttl=60)
def get_fletes():
    try:
        response = supabase.table("fletes").select("*").execute()
        return response.data if response.data else []
    except Exception as e:
        st.error(f"Error en sincronización de fletes: {e}")
        return []

# "Lista de Rubros" maestra global para homologación en formularios de la app
LISTA_RUBROS_MAESTRA = ["Tubérculos", "Cereales", "Hortalizas", "Frutas", "Legumbres", "Otros"]

# ============================================================
# SECCIÓN 1: VISTA DEL AGRICULTOR (REGISTRO Y GESTIÓN DE COSECHAS)
# ============================================================
def view_agricultor(current_user):
    st.title("👨‍🌾 Panel del Agricultor — Gestión de Cosechas")
    st.markdown("Registra la producción de tus campos y gestiona la disponibilidad en tiempo real.")
    st.markdown("---")
    
    tab1, tab2 = st.tabs(["🆕 Registrar Nueva Cosecha", "📦 Mis Productos en Mercado"])
    
    with tab1:
        st.subheader("Formulario de Publicación de Cosecha")
        with st.form("form_nuevo_producto", clear_on_submit=True):
            col1, col2 = st.columns(2)
            with col1:
                titulo = st.text_input("Nombre comercial del producto", placeholder="Ej. Papa Única Seleccionada")
                # Implementación estricta de la lista de rubros en el selector
                rubro = st.selectbox("Categoría o Rubro", LISTA_RUBROS_MAESTRA)
                precio_per_kg = st.number_input("Precio de venta sugerido por Kilogramo (S/.)", min_value=0.1, value=1.5, step=0.1)
            
            with col2:
                volumen_disponible = st.number_input("Volumen Total Disponible para Carga (kg)", min_value=10, value=500, step=50)
                descripcion = st.text_area("Detalles del producto (Variedad, estado de maduración, tipo de saco)")
            
            submit_prod = st.form_submit_button("🚀 Publicar en el Mercado de AgroConecta", type="primary")
            
            if submit_prod:
                if not titulo.strip():
                    st.error("Por favor, introduce un título descriptivo para tu producción.")
                else:
                    nuevo_prod = {
                        "titulo": titulo,
                        "rubro": rubro,
                        "precio_per_kg": precio_per_kg,
                        "volumen_disponible": volumen_disponible,
                        "status": "disponible",
                        "nombre_agricultor": current_user["nombre"],
                        "is_midagri_verified": current_user.get("is_midagri_verified", False)
                    }
                    try:
                        supabase.table("productos").insert(nuevo_prod).execute()
                        st.success(f"¡Éxito! Tu lote de **{titulo}** ya está visible para los compradores de la región.")
                        st.cache_data.clear()
                    except Exception as e:
                        st.error(f"Error técnico al insertar en base de datos: {e}")
                        
    with tab2:
        st.subheader("Historial de Lotes Publicados")
        todos_productos = get_productos()
        mis_productos = [p for p in todos_productos if p.get("nombre_agricultor") == current_user["nombre"]]
        
        if mis_productos:
            df_mis_prod = pd.DataFrame(mis_productos)
            st.dataframe(
                df_mis_prod[["id", "titulo", "rubro", "precio_per_kg", "volumen_disponible", "status"]],
                use_container_width=True
            )
            
            st.markdown("---")
            st.subheader("⚙️ Actualizar Estado de Lote")
            col_id, col_est, col_btn = st.columns([1, 1, 1])
            with col_id:
                prod_seleccionado_id = st.selectbox("Seleccionar ID del producto", [p["id"] for p in mis_productos])
            with col_est:
                nuevo_estado = st.selectbox("Nuevo Estado Operativo", ["disponible", "reservado", "vendido"], key="status_agri")
            with col_btn:
                st.markdown("<br>", unsafe_allow_html=True)
                if st.button("Guardar Cambios de Lote", use_container_width=True):
                    try:
                        supabase.table("productos").update({"status": nuevo_estado}).eq("id", prod_seleccionado_id).execute()
                        st.success(f"Lote #{prod_seleccionado_id} actualizado a '{nuevo_estado}' con éxito.")
                        st.cache_data.clear()
                    except Exception as e:
                        st.error(f"No se pudo modificar el registro: {e}")
        else:
            st.info("Aún no tienes producciones registradas. Usa la pestaña anterior para añadir la primera.")

# ============================================================
# SECCIÓN 2: VISTA DEL COMPRADOR (MARKETPLACE Y ÓRDENES DE COMPRA)
# ============================================================
def view_comprador(current_user):
    st.title("🛒 Marketplace Mayorista — AgroConecta")
    st.markdown("Encuentra ofertas directas desde las chacras y genera órdenes de abastecimiento al instante.")
    st.markdown("---")
    
    productos = get_productos()
    productos_disponibles = [p for p in productos if p.get("status") == "disponible"]
    
    # Filtros avanzados integrados en la zona comercial
    st.subheader("🔍 Filtros de Búsqueda Avanzada")
    col_f1, col_f2 = st.columns(2)
    with col_f1:
        filtro_rubro = st.selectbox("Filtrar por Rubro Agrícola", ["Todos"] + LISTA_RUBROS_MAESTRA)
    with col_f2:
        solo_verificados = st.checkbox("Mostrar únicamente productores con verificación del MIDAGRI")
        
    if filtro_rubro != "Todos":
        productos_disponibles = [p for p in productos_disponibles if p.get("rubro") == filtro_rubro]
    if solo_verificados:
        productos_disponibles = [p for p in productos_disponibles if p.get("is_midagri_verified")]
        
    st.markdown(f"Se encontraron **{len(productos_disponibles)} ofertas disponibles** listas para negociación.")
    st.markdown("---")
    
    if productos_disponibles:
        # Renderizado dinámico extensivo en tarjetas comerciales utilizando Layout de Columnas
        for prod in productos_disponibles:
            st.markdown(f"""
            <div class="product-card">
                <h3>🌱 {prod['titulo']}</h3>
                <p><b>Rubro:</b> {prod['rubro']} | <b>Productor:</b> {prod['nombre_agricultor']} {'(✅ Verificado MIDAGRI)' if prod.get('is_midagri_verified') else ''}</p>
                <p><b>Precio por kg:</b> S/. {prod['precio_per_kg']:.2f} | <b>Volumen Ofertado:</b> {prod['volumen_disponible']} kg</p>
            </div>
            """, unsafe_allow_html=True)
            
            # Formulario de intención de compra integrado abajo de cada elemento de lista
            with st.expander(f"📦 Generar Orden de Compra para: {prod['titulo']}"):
                cantidad = st.number_input(
                    f"Cantidad a adquirir (kg) - Máx: {prod['volumen_disponible']}", 
                    min_value=1, 
                    max_value=int(prod['volumen_disponible']), 
                    value=int(prod['volumen_disponible'] // 2),
                    key=f"cant_{prod['id']}"
                )
                
                total_calculado = cantidad * prod['precio_per_kg']
                st.info(f"💰 **Total Estimado de Pago por Producto:** S/. {total_calculado:.2f}")
                
                if st.button("Confirmar Compra Directa", key=f"btn_buy_{prod['id']}", type="primary"):
                    try:
                        # 1. Crear registro en la tabla de órdenes
                        nueva_orden = {
                            "titulo_producto": prod["titulo"],
                            "status": "pendiente_flete",
                            "cantidad_comprada": cantidad,
                            "total_pago_producto": total_calculado,
                            "nombre_comprador": current_user["nombre"],
                            "fecha_creacion": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        }
                        supabase.table("ordenes").insert(nueva_orden).execute()
                        
                        # 2. Generar automáticamente una solicitud de flete asociada
                        nuevo_flete = {
                            "origen": "Chacra del Productor",
                            "destino": current_user.get("ubicacion", "Destino Central"),
                            "peso_carga": cantidad,
                            "tarifa_propuesta": total_calculado * 0.15, # Estimación base de flete
                            "status": "disponible",
                            "nombre_transportista": None
                        }
                        supabase.table("fletes").insert(nuevo_flete).execute()
                        
                        # 3. Descontar stock del producto original o actualizar estado
                        nuevo_volumen = prod['volumen_disponible'] - cantidad
                        estado_actualizado = "disponible" if nuevo_volumen > 0 else "vendido"
                        supabase.table("productos").update({
                            "volumen_disponible": nuevo_volumen,
                            "status": estado_actualizado
                        }).eq("id", prod["id"]).execute()
                        
                        st.success("🎉 ¡Orden generada correctamente! Ya se notificó al agricultor y la solicitud de flete está disponible para los transportistas.")
                        st.cache_data.clear()
                    except Exception as e:
                        st.error(f"Fallo crítico en transaccionalidad de compra: {e}")
    else:
        st.info("No hay stock que cumpla con los filtros seleccionados en este momento.")

# ============================================================
# SECCIÓN 3: VISTA DEL TRANSPORTISTA (ASIGNACIÓN DE RUTAS Y FLETES)
# ============================================================
def view_transportista(current_user):
    st.title("🚛 Panel Logístico — Bolsa de Fletes")
    st.markdown("Encuentra solicitudes de carga en la región, acepta viajes y actualiza la hoja de ruta.")
    st.markdown("---")
    
    fletes = get_fletes()
    fletes_disponibles = [f for f in fletes if f.get("status") == "disponible"]
    mis_viajes = [f for f in fletes if f.get("nombre_transportista") == current_user["nombre"]]
    
    tab_bolsa, tab_mis_viajes = st.tabs(["🛣️ Viajes Disponibles en la Red", "🗂️ Mis Viajes Asignados"])
    
    with tab_bolsa:
        st.subheader("Cargas Esperando Asignación de Camión")
        if fletes_disponibles:
            df_dispo = pd.DataFrame(fletes_disponibles)
            st.dataframe(
                df_dispo[["id", "origen", "destino", "peso_carga", "tarifa_propuesta", "status"]],
                use_container_width=True
            )
            
            st.markdown("---")
            st.subheader("✍️ Tomar Servicio de Transporte")
            flete_id_selec = st.selectbox("Seleccione el ID de la carga que desea transportar", [f["id"] for f in fletes_disponibles])
            
            if st.button("🔒 Confirmar y Adjudicarse Flete", type="primary"):
                try:
                    supabase.table("fletes").update({
                        "status": "aceptado",
                        "nombre_transportista": current_user["nombre"]
                    }).eq("id", flete_id_selec).execute()
                    
                    st.success(f"🚚 ¡Flete #{flete_id_selec} asignado a tu perfil! Revisa la pestaña 'Mis Viajes Asignados' para coordinar la ruta.")
                    st.cache_data.clear()
                except Exception as e:
                    st.error(f"Error al procesar la reserva del viaje: {e}")
        else:
            st.info("Excelente. No hay solicitudes pendientes de transporte en este cuadrante.")
            
    with tab_mis_viajes:
        st.subheader("Control de Bitácora Operativa")
        if mis_viajes:
            df_propios = pd.DataFrame(mis_viajes)
            st.dataframe(
                df_propios[["id", "origen", "destino", "peso_carga", "tarifa_propuesta", "status"]],
                use_container_width=True
            )
            
            st.markdown("---")
            st.subheader("🔄 Actualizar Progreso del Viaje")
            col_f_id, col_f_st = st.columns(2)
            with col_f_id:
                viaje_id_actualizar = st.selectbox("ID del viaje en curso", [m["id"] for m in mis_viajes])
            with col_f_st:
                estado_viaje_nuevo = st.selectbox("Estado de Transición de Ruta", ["aceptado", "en_ruta", "descargado", "completado"])
                
            if st.button("Actualizar Hoja de Ruta Logística"):
                try:
                    supabase.table("fletes").update({"status": estado_viaje_nuevo}).eq("id", viaje_id_actualizar).execute()
                    st.success(f"Bitácora del Flete #{viaje_id_actualizar} actualizada a '{estado_viaje_nuevo}'.")
                    st.cache_data.clear()
                except Exception as e:
                    st.error(f"Imposible sincronizar el estado logístico: {e}")
        else:
            st.info("Aún no tienes servicios adjudicados. Explora la pestaña de Viajes Disponibles.")

# ============================================================
# SECCIÓN 4: RESPALDO DE RESPONSABILIDAD / PANEL DE ADMIN ANTERIOR
# ============================================================
def page_dashboard():
    st.title("📊 Dashboard Central de Monitoreo — AgroConecta Admin")
    st.markdown("---")
    
    usuarios = get_usuarios()
    productos = get_productos()
    ordenes = get_ordenes()
    fletes = get_fletes()
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("👥 Usuarios Registrados", len([u for u in usuarios if u.get("rol") != "anon"]))
    with col2:
        st.metric("🌱 Stock Activo Lotes", len([p for p in productos if p.get("status") == "disponible"]))
    with col3:
        st.metric("📦 Órdenes Totales", len(ordenes))
    with col4:
        st.metric("🚛 Fletes en Red", len([f for f in fletes if f.get("status") in ["disponible", "aceptado"]]))
    
    st.markdown("---")
    col_g1, col_g2 = st.columns(2)
    with col_g1:
        st.subheader("📊 Distribución de Usuarios por Rol")
        user_roles = {}
        for u in usuarios:
            if u.get("rol") != "anon":
                user_roles[u["rol"]] = user_roles.get(u["rol"], 0) + 1
        if user_roles:
            st.bar_chart(pd.DataFrame(list(user_roles.items()), columns=["Rol", "Cantidad"]).set_index("Rol"))
            
    with col_g2:
        st.subheader("🎯 Densidad de Oferta por Rubro")
        rubros_count = {}
        for p in productos:
            r = p.get("rubro", "Sin rubro")
            rubros_count[r] = rubros_count.get(r, 0) + 1
        if rubros_count:
            st.bar_chart(pd.DataFrame(list(rubros_count.items()), columns=["Rubro", "Cantidad"]).set_index("Rubro"))

def page_usuarios():
    st.title("👥 Control de Identidades y Verificaciones")
    st.markdown("---")
    usuarios = get_usuarios()
    
    rol_filter = st.selectbox("Rol Institucional", ["Todos", "agricultor", "comprador", "transportista", "admin"])
    filtrados = usuarios
    if rol_filter != "Todos":
        filtrados = [u for u in filtrados if u.get("rol") == rol_filter]
        
    if filtrados:
        df = pd.DataFrame(filtrados)[["id", "nombre", "rol", "email", "ubicacion", "is_midagri_verified"]]
        df.columns = ["ID", "Nombre", "Rol", "Email", "Ubicación", "Verificado MIDAGRI"]
        df["Verificado MIDAGRI"] = df["Verificado MIDAGRI"].apply(lambda x: "✅ Validado" if x else "❌ Sin Verificar")
        st.dataframe(df, use_container_width=True)
        
        st.markdown("---")
        st.subheader("Moderar Estado de Verificación Oficial")
        c1, c2 = st.columns([3, 1])
        with c1:
            usuario_mod = st.selectbox("Seleccione Usuario para Otorgar Sello", [(u["id"], u["nombre"]) for u in filtrados if u["rol"] != "admin"], format_func=lambda x: f"{x[1]} ({x[0]})")
        with c2:
            st.markdown("<br>", unsafe_allow_html=True)
            if st.button("Otorgar Verificación", type="primary", use_container_width=True):
                try:
                    supabase.table("users").update({"is_midagri_verified": True}).eq("id", usuario_mod[0]).execute()
                    st.success(f"Sello otorgado con éxito al usuario: {usuario_mod[1]}")
                    st.cache_data.clear()
                except Exception as e:
                    st.error(f"Fallo en transacción: {e}")
    else:
        st.info("No existen registros bajo los criterios solicitados.")

def page_productos():
    st.title("🌱 Auditoría de Catálogo")
    st.markdown("---")
    productos = get_productos()
    if productos:
        df = pd.DataFrame(productos)[["id", "titulo", "rubro", "precio_per_kg", "volumen_disponible", "status", "nombre_agricultor"]]
        st.dataframe(df, use_container_width=True)

def page_ordenes():
    st.title("📦 Trazabilidad de Órdenes Comerciales")
    st.markdown("---")
    ordenes = get_ordenes()
    if ordenes:
        df = pd.DataFrame(ordenes)[["id", "titulo_producto", "status", "cantidad_comprada", "total_pago_producto", "nombre_comprador", "fecha_creacion"]]
        st.dataframe(df, use_container_width=True)

def page_fletes():
    st.title("🚛 Seguimiento de Manifiestos de Carga")
    st.markdown("---")
    fletes = get_fletes()
    if fletes:
        df = pd.DataFrame(fletes)[["id", "origen", "destino", "peso_carga", "tarifa_propuesta", "status", "nombre_transportista"]]
        st.dataframe(df, use_container_width=True)

# ============================================================
# NAVEGACIÓN Y ENRUTAMIENTO DINÁMICO DE PÁGINAS
# ============================================================
def main():
    st.sidebar.title("🌾 Plataforma AgroConecta")
    st.sidebar.markdown("Canal Integrado de Comercio Agrícola Regional")
    st.sidebar.markdown("---")
    
    # SIMULADOR DE SESIÓN ACTIVA (Autenticación lógica para demostración/pruebas)
    st.sidebar.subheader("👤 Simulación de Perfil Activo")
    todos_los_usuarios = get_usuarios()
    
    if todos_los_usuarios:
        # Estructura un mapeo limpio para que el dueño de la app seleccione con qué perfil interactuar
        usuario_simulado = st.sidebar.selectbox(
            "Iniciar sesión como:",
            todos_los_usuarios,
            format_func=lambda u: f"{u.get('nombre')} ({u.get('rol').upper()})"
        )
        st.session_state["current_user"] = usuario_simulado
    else:
        # Perfil de respaldo de emergencia si la tabla 'users' de Supabase arranca vacía
        st.session_state["current_user"] = {
            "id": "USR-999",
            "nombre": "Gabriel José Requena",
            "rol": "admin",
            "email": "gabriel@agroconecta.com",
            "ubicacion": "Huancayo",
            "is_midagri_verified": True
        }
    
    user_activo = st.session_state["current_user"]
    st.sidebar.info(f"**Usuario:** {user_activo['nombre']}\n\n**Rol de Acceso:** {user_activo['rol'].upper()}")
    st.sidebar.markdown("---")
    
    # Enrutador de menús basado estrictamente en el rol de la persona autenticada
    st.sidebar.subheader("🧭 Menú Operativo")
    
    if user_activo["rol"] == "admin":
        pagina = st.sidebar.radio(
            "Módulos Administrativos",
            ["📊 Dashboard General", "👥 Panel Usuarios", "🌱 Catálogo Productos", "📦 Historial Órdenes", "🚛 Manifiestos Fletes"]
        )
        st.sidebar.markdown("---")
        if st.sidebar.button("Limpiar Memoria Caché"):
            st.cache_data.clear()
            st.success("Caché vaciada.")
            
        if pagina == "📊 Dashboard General":
            page_dashboard()
        elif pagina == "👥 Panel Usuarios":
            page_usuarios()
        elif pagina == "🌱 Catálogo Productos":
            page_productos()
        elif pagina == "📦 Historial Órdenes":
            page_ordenes()
        elif pagina == "🚛 Manifiestos Fletes":
            page_fletes()
            
    elif user_activo["rol"] == "agricultor":
        view_agricultor(user_activo)
        
    elif user_activo["rol"] == "comprador":
        view_comprador(user_activo)
        
    elif user_activo["rol"] == "transportista":
        view_transportista(user_activo)
        
    st.sidebar.markdown("---")
    st.sidebar.markdown(f"**Infraestructura:** Streamlit Cloud\n\n**Sincronización:** Supabase Realtime\n\n**Fecha de Sesión:** {datetime.now().strftime('%Y-%m-%d')}")

if __name__ == "__main__":
    main()