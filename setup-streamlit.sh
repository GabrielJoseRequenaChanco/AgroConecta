#!/bin/bash
# setup-streamlit.sh
# Script para configurar el entorno local de Streamlit

set -e

echo "🌾 Configurando Streamlit para AgroConecta..."
echo ""

# Verificar si Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 no está instalado. Por favor instálalo primero."
    exit 1
fi

echo "✅ Python está instalado"
echo ""

# Instalar dependencias
echo "📦 Instalando dependencias..."
pip install -r requirements.txt
echo "✅ Dependencias instaladas"
echo ""

# Crear directorio .streamlit si no existe
if [ ! -d ".streamlit" ]; then
    mkdir -p .streamlit
    echo "✅ Directorio .streamlit creado"
fi

# Crear archivo de secrets si no existe
if [ ! -f ".streamlit/secrets.toml" ]; then
    if [ -f ".streamlit/secrets.toml.example" ]; then
        cp .streamlit/secrets.toml.example .streamlit/secrets.toml
        echo "✅ Archivo .streamlit/secrets.toml creado desde plantilla"
        echo ""
        echo "⚠️  IMPORTANTE: Edita .streamlit/secrets.toml y añade tus credenciales de Supabase:"
        echo "   - SUPABASE_URL: Tu URL de Supabase"
        echo "   - SUPABASE_KEY: Tu API Key anon de Supabase"
    fi
else
    echo "✅ Archivo .streamlit/secrets.toml ya existe"
fi

echo ""
echo "🎉 Configuración completada"
echo ""
echo "Para ejecutar la app localmente:"
echo "  streamlit run streamlit_app.py"
echo ""
echo "La app se abrirá en: http://localhost:8501"
