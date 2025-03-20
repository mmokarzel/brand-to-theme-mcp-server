# Brand-to-Theme MCP Server

Servidor MCP para convertir PDFs de identidad de marca en temas funcionales para Shopify.

## Descripción

Este servidor MCP proporciona un conjunto de herramientas para automatizar la conversión de manuales de identidad corporativa en PDF a temas funcionales de Shopify, manteniendo la coherencia con la identidad de marca.

Utiliza tecnologías avanzadas de extracción de PDF y generación de código para transformar elementos visuales de marca (colores, tipografías, etc.) en un tema Shopify completo y listo para instalar.

## Características

- **Extracción de PDF**: Analiza PDFs para obtener paletas de colores, tipografías y otros elementos de diseño
- **Generación de Design Tokens**: Convierte los elementos extraídos en tokens de diseño estandarizados
- **Creación de Temas Shopify**: Genera archivos de tema completos basados en la identidad de marca
- **Integración con Shopify**: Permite instalar el tema directamente en la tienda conectada
- **Integración con Figma**: Compatible con componentes extraídos desde Figma (mediante MCP de Figma)

## Herramientas MCP

El servidor expone las siguientes herramientas MCP:

### 1. `extract_pdf_branding`

Extrae elementos visuales e identidad de marca desde un archivo PDF.

**Parámetros:**
- `pdfPath`: Ruta al archivo PDF del manual de identidad corporativa
- `extractOptions`: Opciones de extracción (colores, tipografía, logos)

### 2. `generate_design_tokens`

Genera tokens de diseño a partir de la identidad de marca extraída.

**Parámetros:**
- `brandingData`: Datos de identidad de marca extraídos
- `figmaData`: Datos opcionalmente extraídos de Figma
- `format`: Formato de salida para los tokens (json, css, scss)

### 3. `create_shopify_theme`

Genera un tema de Shopify basado en tokens de diseño.

**Parámetros:**
- `designTokens`: Tokens de diseño generados
- `themeName`: Nombre del tema a generar
- `outputPath`: Ruta donde guardar los archivos del tema

### 4. `preview_shopify_theme`

Genera una vista previa del tema de Shopify.

**Parámetros:**
- `themePath`: Ruta a los archivos del tema
- `previewType`: Tipo de vista previa a generar (thumbnail, full)

### 5. `install_shopify_theme`

Instala el tema generado en la tienda Shopify conectada.

**Parámetros:**
- `themePath`: Ruta a los archivos del tema
- `installationType`: Instalar como tema nuevo o actualizar un tema existente
- `existingThemeId`: ID del tema existente a actualizar (si es relevante)
- `setAsMain`: Establecer como tema principal de la tienda

## Instalación

1. Clona este repositorio:
```bash
git clone https://github.com/mmokarzel/brand-to-theme-mcp-server.git
cd brand-to-theme-mcp-server
```

2. Instala las dependencias:
```bash
npm install
```

3. Compila el proyecto:
```bash
npm run build
```

4. Configura el servidor MCP en tu archivo de configuración MCP:
```json
{
  "mcpServers": {
    "github.com/mmokarzel/brand-to-theme-mcp-server": {
      "command": "node",
      "args": [
        "/ruta/a/brand-to-theme-mcp/build/index.js"
      ],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Uso Básico

1. Extrae elementos de marca desde un PDF:
```javascript
const brandingData = await extract_pdf_branding({
  pdfPath: "/ruta/a/manual-identidad.pdf"
});
```

2. Genera tokens de diseño:
```javascript
const designTokens = await generate_design_tokens({
  brandingData: brandingData,
  format: "json"
});
```

3. Crea un tema Shopify:
```javascript
const themeResult = await create_shopify_theme({
  designTokens: designTokens,
  themeName: "MiMarca Theme"
});
```

4. Instala el tema en Shopify:
```javascript
const installResult = await install_shopify_theme({
  themePath: themeResult.path,
  installationType: "new",
  setAsMain: true
});
```

## Requisitos

- Node.js v16+
- Shopify Partner Account (para instalar temas)
- MCP compatible con Claude