import streamlit as st
import streamlit.components.v1 as components
import pandas as pd
from datetime import datetime
from supabase import create_client, Client
import os

# ============================================================
# CONFIGURACIÓN DEL PORTAL AGROCONECTA
# ============================================================
st.set_page_config(
    page_title="AgroConecta — Portal de Acceso",
    page_icon="🌱",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Configura aquí el enlace que te otorgue Cloudflare Pages o Vercel al desplegar tu Vite
# (Si estás probando en local, puedes usar "http://localhost:5173")
URL_WEB_PROGRAMADA = "https://tu-web-agroconecta.pages.dev"

# Estilos para limpiar la interfaz de Streamlit y destacar los accesos directos
st.markdown("""
<style>
    .portal-box { background-color: #e8f5e9; padding: 2rem; border-radius: 0.8rem; border: 2px solid #2e7d32; text-align: center; margin-bottom: 2rem; }
    .btn-link { display: inline-block; padding: 0.75rem 1.5rem; background-color: #2e7d32; color: white !important; text-decoration: none !important; border-radius: 0.5rem; font-weight: bold; font-size: 1.1rem; }
    .btn-link:hover { background-color: #1b5e20; }
</style>
""", unsafe_allow_html=True)

# ============================================================
# CONEXIÓN A SUPABASE (BACKEND COOPERATIVO)
# ============================================================
@st.cache_resource
def init_supabase() -> Client:
    url = st.secrets.get("SUPABASE_URL") or os.getenv("SUPABASE_URL")
    key = st.secrets.get("SUPABASE_KEY") or os.getenv("SUPABASE_KEY")
    if not url or not key:
        st.error("❌ Faltan credenciales de Supabase en Secrets.")
        st.stop()
    return create_client(url, key)

supabase: Client = init_supabase()

# Carga de datos esenciales para el monitoreo del administrador
def get_stats():
    try:
        u = len(supabase.table("users").select("id").execute().data)
        p = len(supabase.table("productos").select("id").execute().data)
        return u, p
    except:
        return 0, 0

# ============================================================
# NAVEGACIÓN DEL PORTAL
# ============================================================
st.sidebar.title("🧭 Navegación General")
seleccion = st.sidebar.radio(
    "Ir a la sección:",
    ["🌐 Ver Mi Página Web (Vite)", "📊 Panel de Administración Interno"]
)

st.sidebar.markdown("---")
st.sidebar.info("Este servidor de Streamlit actúa como el nodo central de AgroConecta, permitiendo auditar la base de datos y lanzar la interfaz de usuario.")

# ------------------------------------------------------------
# FLUJO 1: RENDERIZAR LA WEB PROGRAMADA (VITE)
# ------------------------------------------------------------
if seleccion == "🌐 Ver Mi Página Web (Vite)":
    st.title("🌱 Aplicación Web AgroConecta")
    st.markdown("Esta es la interfaz comercial interactiva que programaste utilizando Vite y JavaScript.")
    
    # Caja de redirección imperativa por si el navegador bloquea los marcos embebidos
    st.markdown(f"""
    <div class="portal-box">
        <h3>🚀 ¿Prefieres abrir la aplicación en una pestaña independiente?</h3>
        <p>Si experimentas problemas de carga o necesitas usar funciones del navegador, haz clic en el botón inferior para ingresar directamente al servidor frontend.</p>
        <a href="{URL_WEB_PROGRAMADA}" target="_blank" class="btn-link">🔗 Abrir AgroConecta en Nueva Pestaña</a>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("---")
    st.subheader("Visualización en tiempo real (Vista Embebida)")
    
    # Despliegue de la aplicación web original mediante un contenedor iframe de alta resolución
    components.iframe(
        src=URL_WEB_PROGRAMADA,
        height=850,
        scrolling=True
    )

# ------------------------------------------------------------
# FLUJO 2: PANEL DE ADMINISTRACIÓN ANTERIOR
# ------------------------------------------------------------
elif seleccion == "📊 Panel de Administración Interno":
    st.title("📊 Panel de Control Administrativo")
    st.markdown("Monitoreo estructural de tablas en Supabase.")
    st.markdown("---")
    
    u_count, p_count = get_stats()
    c1, c2 = st.columns(2)
    with c1:
        st.metric("👥 Usuarios Totales en Supabase", u_count)
    with c2:
        st.metric("🌱 Lotes Agrícolas Registrados", p_count)
        
    st.markdown("---")
    st.info("Utiliza esta sección únicamente para verificar usuarios del MIDAGRI o auditar las transacciones logísticas de los fletes.")