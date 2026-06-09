import streamlit as st
import pandas as pd
from datetime import datetime
from supabase import create_client, Client
import os

# ============================================================
# CONFIGURACIÓN INICIAL
# ============================================================
st.set_page_config(
    page_title="AgroConecta Admin",
    page_icon="🌱",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Colores y estilos personalizados
st.markdown("""
<style>
    .metric-card { background-color: #f0f2f6; padding: 1.5rem; border-radius: 0.5rem; }
    .success-badge { background-color: #d4edda; color: #155724; padding: 0.25rem 0.5rem; border-radius: 0.25rem; }
    .warning-badge { background-color: #fff3cd; color: #856404; padding: 0.25rem 0.5rem; border-radius: 0.25rem; }
    .danger-badge { background-color: #f8d7da; color: #721c24; padding: 0.25rem 0.5rem; border-radius: 0.25rem; }
</style>
""", unsafe_allow_html=True)

# ============================================================
# CONEXIÓN A SUPABASE
# ============================================================
@st.cache_resource
def init_supabase() -> Client:
    """Inicializa la conexión a Supabase."""
    url = st.secrets.get("SUPABASE_URL") or os.getenv("SUPABASE_URL")
    key = st.secrets.get("SUPABASE_KEY") or os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        st.error("❌ Faltan las credenciales de Supabase. Configura SUPABASE_URL y SUPABASE_KEY")
        st.stop()
    
    return create_client(url, key)

supabase: Client = init_supabase()

# ============================================================
# FUNCIONES DE DATOS
# ============================================================

@st.cache_data(ttl=300)
def get_usuarios():
    """Obtiene la lista de usuarios desde Supabase."""
    try:
        response = supabase.table("users").select("*").execute()
        return response.data
    except Exception as e:
        st.error(f"Error cargando usuarios: {e}")
        return []

@st.cache_data(ttl=300)
def get_productos():
    """Obtiene productos desde Supabase."""
    try:
        response = supabase.table("productos").select("*").execute()
        return response.data
    except Exception as e:
        st.error(f"Error cargando productos: {e}")
        return []

@st.cache_data(ttl=300)
def get_ordenes():
    """Obtiene órdenes desde Supabase."""
    try:
        response = supabase.table("ordenes").select("*").execute()
        return response.data
    except Exception as e:
        st.error(f"Error cargando órdenes: {e}")
        return []

@st.cache_data(ttl=300)
def get_fletes():
    """Obtiene fletes desde Supabase."""
    try:
        response = supabase.table("fletes").select("*").execute()
        return response.data
    except Exception as e:
        st.error(f"Error cargando fletes: {e}")
        return []

# ============================================================
# PÁGINA: DASHBOARD
# ============================================================
def page_dashboard():
    st.title("📊 Dashboard — AgroConecta")
    st.markdown("---")
    
    usuarios = get_usuarios()
    productos = get_productos()
    ordenes = get_ordenes()
    fletes = get_fletes()
    
    # KPIs
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        count_usuarios = len([u for u in usuarios if u["rol"] != "anon"])
        st.metric("👥 Usuarios Registrados", count_usuarios)
    
    with col2:
        count_productos = len([p for p in productos if p["status"] == "disponible"])
        st.metric("🌱 Productos Disponibles", count_productos)
    
    with col3:
        count_ordenes = len(ordenes)
        st.metric("📦 Órdenes Totales", count_ordenes)
    
    with col4:
        count_fletes = len([f for f in fletes if f["status"] in ["disponible", "aceptado"]])
        st.metric("🚛 Fletes Activos", count_fletes)
    
    st.markdown("---")
    
    # Gráficos de estado
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("📊 Usuarios por Rol")
        user_roles = {}
        for u in usuarios:
            if u["rol"] != "anon":
                user_roles[u["rol"]] = user_roles.get(u["rol"], 0) + 1
        
        if user_roles:
            df_roles = pd.DataFrame(list(user_roles.items()), columns=["Rol", "Cantidad"])
            st.bar_chart(df_roles.set_index("Rol"))
    
    with col2:
        st.subheader("🎯 Productos por Rubro")
        rubros = {}
        for p in productos:
            rubro = p.get("rubro", "Sin rubro")
            rubros[rubro] = rubros.get(rubro, 0) + 1
        
        if rubros:
            df_rubros = pd.DataFrame(list(rubros.items()), columns=["Rubro", "Cantidad"])
            st.bar_chart(df_rubros.set_index("Rubro"))
    
    st.markdown("---")
    
    # Órdenes recientes
    st.subheader("📋 Órdenes Recientes")
    if ordenes:
        df_ordenes = pd.DataFrame(ordenes[-10:]).copy()
        df_ordenes = df_ordenes[["id", "titulo_producto", "status", "fecha_creacion", "total_pago_producto"]]
        df_ordenes.columns = ["ID", "Producto", "Estado", "Fecha", "Total"]
        st.dataframe(df_ordenes, use_container_width=True)
    else:
        st.info("No hay órdenes registradas.")

# ============================================================
# PÁGINA: GESTIÓN DE USUARIOS
# ============================================================
def page_usuarios():
    st.title("👥 Gestión de Usuarios")
    st.markdown("---")
    
    usuarios = get_usuarios()
    
    # Filtros
    col1, col2 = st.columns([2, 1])
    with col1:
        rol_filter = st.selectbox(
            "Filtrar por rol",
            ["Todos", "agricultor", "comprador", "transportista", "admin"],
            index=0
        )
    with col2:
        solo_no_verificados = st.checkbox("Solo no verificados")
    
    # Filtrar datos
    usuarios_filtrados = usuarios
    if rol_filter != "Todos":
        usuarios_filtrados = [u for u in usuarios_filtrados if u["rol"] == rol_filter]
    if solo_no_verificados:
        usuarios_filtrados = [u for u in usuarios_filtrados if not u.get("is_midagri_verified", False)]
    
    st.markdown(f"**Total: {len(usuarios_filtrados)} usuario(s)**")
    st.markdown("---")
    
    # Tabla de usuarios
    if usuarios_filtrados:
        df = pd.DataFrame(usuarios_filtrados)[["id", "nombre", "rol", "email", "ubicacion", "is_midagri_verified"]]
        df.columns = ["ID", "Nombre", "Rol", "Email", "Ubicación", "Verificado"]
        df["Verificado"] = df["Verificado"].apply(lambda x: "✅ Sí" if x else "❌ No")
        
        st.dataframe(df, use_container_width=True)
        
        # Verificar usuario
        st.markdown("---")
        st.subheader("✅ Verificar Usuario")
        
        col1, col2 = st.columns([3, 1])
        with col1:
            usuario_id = st.selectbox(
                "Selecciona usuario para verificar",
                [(u["id"], u["nombre"]) for u in usuarios_filtrados if u["rol"] in ["agricultor", "comprador", "transportista"]],
                format_func=lambda x: f"{x[1]} ({x[0]})"
            )
        
        with col2:
            if st.button("Verificar", use_container_width=True, type="primary"):
                try:
                    supabase.table("users").update({"is_midagri_verified": True}).eq("id", usuario_id[0]).execute()
                    st.success(f"✅ Usuario {usuario_id[1]} verificado correctamente.")
                    st.cache_data.clear()
                except Exception as e:
                    st.error(f"Error verificando usuario: {e}")
    else:
        st.info("No hay usuarios para mostrar.")

# ============================================================
# PÁGINA: GESTIÓN DE PRODUCTOS
# ============================================================
def page_productos():
    st.title("🌱 Gestión de Productos")
    st.markdown("---")
    
    productos = get_productos()
    usuarios = {u["id"]: u for u in get_usuarios()}
    
    # Filtros
    col1, col2, col3 = st.columns(3)
    with col1:
        status_filter = st.selectbox(
            "Filtrar por estado",
            ["Todos", "disponible", "reservado", "vendido"],
            index=0
        )
    with col2:
        rubro_filter = st.selectbox(
            "Filtrar por rubro",
            ["Todos", "Tubérculos", "Cereales", "Hortalizas", "Frutas", "Legumbres"],
            index=0
        )
    with col3:
        solo_verificados = st.checkbox("Solo de agricultores verificados")
    
    # Aplicar filtros
    productos_filtrados = productos
    if status_filter != "Todos":
        productos_filtrados = [p for p in productos_filtrados if p.get("status") == status_filter]
    if rubro_filter != "Todos":
        productos_filtrados = [p for p in productos_filtrados if p.get("rubro") == rubro_filter]
    if solo_verificados:
        productos_filtrados = [p for p in productos_filtrados if p.get("is_midagri_verified")]
    
    st.markdown(f"**Total: {len(productos_filtrados)} producto(s)**")
    st.markdown("---")
    
    # Tabla
    if productos_filtrados:
        df = pd.DataFrame(productos_filtrados)[["id", "titulo", "rubro", "precio_per_kg", "volumen_disponible", "status", "nombre_agricultor", "is_midagri_verified"]]
        df.columns = ["ID", "Título", "Rubro", "Precio/kg", "Volumen", "Estado", "Agricultor", "Verificado"]
        df["Verificado"] = df["Verificado"].apply(lambda x: "✅" if x else "❌")
        df["Precio/kg"] = df["Precio/kg"].apply(lambda x: f"S/ {x:.2f}" if x else "—")
        
        st.dataframe(df, use_container_width=True)
    else:
        st.info("No hay productos para mostrar.")

# ============================================================
# PÁGINA: GESTIÓN DE ÓRDENES
# ============================================================
def page_ordenes():
    st.title("📦 Gestión de Órdenes")
    st.markdown("---")
    
    ordenes = get_ordenes()
    
    # Filtro por estado
    status_filter = st.selectbox(
        "Filtrar por estado",
        ["Todos", "pendiente_flete", "flete_asignado", "cargando_chacra", "en_transito", "por_confirmar", "entregado"],
        index=0
    )
    
    # Aplicar filtro
    ordenes_filtradas = ordenes
    if status_filter != "Todos":
        ordenes_filtradas = [o for o in ordenes_filtradas if o.get("status") == status_filter]
    
    st.markdown(f"**Total: {len(ordenes_filtradas)} orden(es)**")
    st.markdown("---")
    
    if ordenes_filtradas:
        df = pd.DataFrame(ordenes_filtradas)[["id", "titulo_producto", "status", "cantidad_comprada", "total_pago_producto", "nombre_comprador", "fecha_creacion"]]
        df.columns = ["ID", "Producto", "Estado", "Cantidad", "Total", "Comprador", "Fecha"]
        df["Total"] = df["Total"].apply(lambda x: f"S/ {x:.2f}" if x else "—")
        
        st.dataframe(df, use_container_width=True)
    else:
        st.info("No hay órdenes para mostrar.")

# ============================================================
# PÁGINA: GESTIÓN DE FLETES
# ============================================================
def page_fletes():
    st.title("🚛 Gestión de Fletes")
    st.markdown("---")
    
    fletes = get_fletes()
    
    # Filtro por estado
    status_filter = st.selectbox(
        "Filtrar por estado",
        ["Todos", "disponible", "aceptado", "en_ruta", "descargado", "completado"],
        index=0
    )
    
    # Aplicar filtro
    fletes_filtrados = fletes
    if status_filter != "Todos":
        fletes_filtrados = [f for f in fletes_filtrados if f.get("status") == status_filter]
    
    st.markdown(f"**Total: {len(fletes_filtrados)} flete(s)**")
    st.markdown("---")
    
    if fletes_filtrados:
        df = pd.DataFrame(fletes_filtrados)[["id", "origen", "destino", "peso_carga", "tarifa_propuesta", "status", "nombre_transportista"]]
        df.columns = ["ID", "Origen", "Destino", "Peso (kg)", "Tarifa", "Estado", "Transportista"]
        df["Tarifa"] = df["Tarifa"].apply(lambda x: f"S/ {x:.2f}" if x else "—")
        
        st.dataframe(df, use_container_width=True)
    else:
        st.info("No hay fletes para mostrar.")

# ============================================================
# NAVEGACIÓN PRINCIPAL
# ============================================================
def main():
    st.sidebar.title("🌾 AgroConecta Admin")
    st.sidebar.markdown("Panel de administración y monitoreo")
    st.sidebar.markdown("---")
    
    pagina = st.sidebar.radio(
        "Selecciona una sección",
        ["📊 Dashboard", "👥 Usuarios", "🌱 Productos", "📦 Órdenes", "🚛 Fletes"],
        index=0
    )
    
    st.sidebar.markdown("---")
    st.sidebar.markdown("### ℹ️ Información")
    st.sidebar.markdown(f"**Última actualización:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    st.sidebar.markdown("**Versión:** 1.0.0")
    
    # Renderizar página seleccionada
    if pagina == "📊 Dashboard":
        page_dashboard()
    elif pagina == "👥 Usuarios":
        page_usuarios()
    elif pagina == "🌱 Productos":
        page_productos()
    elif pagina == "📦 Órdenes":
        page_ordenes()
    elif pagina == "🚛 Fletes":
        page_fletes()

if __name__ == "__main__":
    main()
