# 🌾 AgroConecta Admin — Streamlit Cloud

Guía para desplegar el panel administrativo de AgroConecta en Streamlit Cloud.

## ✅ Requisitos previos

- Cuenta en [Streamlit Cloud](https://streamlit.io/cloud)
- Repositorio Git (GitHub, GitLab o Bitbucket) con este proyecto
- Credenciales de Supabase (URL y API Key)

## 🚀 Pasos de deployment

### 1. Conecta tu repositorio a Streamlit Cloud

1. Ve a https://share.streamlit.io/
2. Haz clic en "New app"
3. Selecciona tu repositorio de GitHub
4. Elige la rama principal (normalmente `main`)
5. Especifica el archivo: `streamlit_app.py`
6. Haz clic en "Deploy"

### 2. Configura las credenciales (Secrets)

Una vez que la app esté desplegada:

1. Ve al dashboard de tu app en Streamlit Cloud
2. Haz clic en "Settings" (⚙️)
3. Ve a la sección "Secrets"
4. Copia el siguiente contenido y reemplaza los valores reales:

```toml
# Supabase credentials
SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_KEY = "your-anon-key-here"
```

5. Haz clic en "Save"

La app se reiniciará automáticamente con las nuevas credenciales.

### 3. Accede a tu app

- URL: `https://agroconecta-j5rakey32jzkopmxiffwr6.streamlit.app/`
- O desde el dashboard de Streamlit Cloud

## 📋 Características del panel

✅ **Dashboard**
- Resumen de KPIs (usuarios, productos, órdenes, fletes)
- Gráficos de usuarios por rol
- Gráficos de productos por rubro
- Últimas órdenes registradas

✅ **Gestión de Usuarios**
- Listado filtrable por rol
- Opción para ver solo usuarios no verificados
- Botón para verificar usuarios (activar "Sello de Confianza")

✅ **Gestión de Productos**
- Listado filtrable por estado y rubro
- Vista de productos disponibles, reservados y vendidos
- Información del agricultor y verificación

✅ **Gestión de Órdenes**
- Listado de todas las órdenes
- Filtrado por estado de entrega
- Información de comprador y totales

✅ **Gestión de Fletes**
- Listado de todos los fletes
- Filtrado por estado
- Información de transportista y rutas

## 🔧 Troubleshooting

### Error: "Faltan las credenciales de Supabase"
- Verifica que hayas agregado correctamente `SUPABASE_URL` y `SUPABASE_KEY` en Secrets
- Espera 30 segundos después de guardar los secrets antes de recargar

### Error: "No se puede conectar a Supabase"
- Verifica que la URL y la API Key sean correctas
- Asegúrate de que tu proyecto Supabase esté activo
- Comprueba que las tablas existan en tu base de datos

### La app está lenta
- Streamlit Cloud puede ser más lento en el tier gratuito
- Los cachés de datos se actualizan cada 5 minutos

## 📚 Recursos

- [Documentación de Streamlit](https://docs.streamlit.io/)
- [Documentación de Streamlit Cloud](https://docs.streamlit.io/streamlit-community-cloud/deploy-your-app)
- [Documentación de Supabase Python](https://github.com/supabase-community/supabase-py)

## 🛠️ Desarrollo local

Para probar la app localmente antes de desplegar:

```bash
# Instala dependencias
pip install -r requirements.txt

# Crea el archivo de secrets locales
cp .streamlit/secrets.toml.example .streamlit/secrets.toml
# Edita .streamlit/secrets.toml con tus credenciales reales

# Ejecuta la app
streamlit run streamlit_app.py
```

La app se abrirá en `http://localhost:8501`

## 📝 Notas de seguridad

⚠️ **IMPORTANTE:**
- Nunca hagas commit del archivo `.streamlit/secrets.toml`
- Usa solo la API Key **anon** de Supabase, no la service role key
- Los secrets en Streamlit Cloud se encriptan y no son visibles en el código
- Asegúrate de que tu repositorio sea privado si contiene información sensible

---

**Versión:** 1.0.0  
**Última actualización:** 2026-06-09
