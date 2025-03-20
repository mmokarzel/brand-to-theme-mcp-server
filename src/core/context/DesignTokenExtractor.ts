import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../../utils/logger.js';
import { BrandingData } from '../extractors/PDFExtractor.js';

// Interfaz para Design Tokens
export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing?: SpacingTokens;
  breakpoints?: BreakpointTokens;
  shadows?: ShadowTokens;
  borders?: BorderTokens;
  metadata: {
    brandName: string;
    version: string;
    description?: string;
    createdAt: string;
  };
}

interface ColorTokens {
  primary: Record<string, string>;
  secondary: Record<string, string>;
  accent: Record<string, string>;
  neutral: Record<string, string>;
  feedback: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

interface TypographyTokens {
  families: {
    heading: string;
    body: string;
    accent?: string;
  };
  weights: {
    light?: number;
    regular: number;
    medium?: number;
    semibold?: number;
    bold: number;
    extraBold?: number;
  };
  sizes: {
    base: string;
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
    xxxl: string;
  };
  lineHeights: {
    tight: number;
    normal: number;
    loose: number;
  };
}

interface SpacingTokens {
  base: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

interface BreakpointTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

interface ShadowTokens {
  sm: string;
  md: string;
  lg: string;
}

interface BorderTokens {
  radius: {
    sm: string;
    md: string;
    lg: string;
    round: string;
  };
  width: {
    thin: string;
    normal: string;
    thick: string;
  };
}

/**
 * Genera valores por defecto para los tokens de color
 */
function generateDefaultColorTokens(): ColorTokens {
  return {
    primary: {
      '50': '#e6f0f9',
      '100': '#cce0f3',
      '200': '#99c2e8',
      '300': '#66a3dc',
      '400': '#3385d1',
      '500': '#0066c5',
      '600': '#00529e',
      '700': '#003d76',
      '800': '#00294f',
      '900': '#001427'
    },
    secondary: {
      '50': '#e6f5e6',
      '100': '#ccebcc',
      '200': '#99d699',
      '300': '#66c266',
      '400': '#33ad33',
      '500': '#009900',
      '600': '#007a00',
      '700': '#005c00',
      '800': '#003d00',
      '900': '#001f00'
    },
    accent: {
      '50': '#fef2e6',
      '100': '#fde6cc',
      '200': '#fbcc99',
      '300': '#f9b366',
      '400': '#f69933',
      '500': '#f48000',
      '600': '#c36600',
      '700': '#924d00',
      '800': '#613300',
      '900': '#311a00'
    },
    neutral: {
      '50': '#f7f7f7',
      '100': '#e3e3e3',
      '200': '#c8c8c8',
      '300': '#a4a4a4',
      '400': '#818181',
      '500': '#666666',
      '600': '#515151',
      '700': '#434343',
      '800': '#383838',
      '900': '#121212',
      'white': '#ffffff',
      'black': '#000000'
    },
    feedback: {
      success: '#00C851',
      warning: '#FFBB33',
      error: '#FF4444',
      info: '#33B5E5'
    }
  };
}

/**
 * Genera valores por defecto para los tokens de tipografía
 */
function generateDefaultTypographyTokens(): TypographyTokens {
  return {
    families: {
      heading: 'Arial, sans-serif',
      body: 'Helvetica, Arial, sans-serif'
    },
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extraBold: 800
    },
    sizes: {
      base: '16px',
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.25rem',
      xl: '1.5rem',
      xxl: '2rem',
      xxxl: '3rem'
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      loose: 2
    }
  };
}

/**
 * Genera valores por defecto para los tokens de espaciado
 */
function generateDefaultSpacingTokens(): SpacingTokens {
  return {
    base: '8px',
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  };
}

/**
 * Convierte la paleta de colores extraída en tokens de color
 */
function convertColorsToTokens(colors: BrandingData['colors']): ColorTokens {
  // Comenzar con tokens por defecto
  const tokens = generateDefaultColorTokens();
  
  // Clasificar los colores por categoría
  const primaryColors = colors.filter(c => c.category === 'primary');
  const secondaryColors = colors.filter(c => c.category === 'secondary');
  const accentColors = colors.filter(c => c.category === 'accent');
  
  // Si tenemos colores primarios, actualizar los tokens
  if (primaryColors.length > 0) {
    // Actualizar el color primario (500) con el primer color primario encontrado
    tokens.primary['500'] = primaryColors[0].hex;
  }
  
  // Si tenemos colores secundarios, actualizar los tokens
  if (secondaryColors.length > 0) {
    tokens.secondary['500'] = secondaryColors[0].hex;
  }
  
  // Si tenemos colores de acento, actualizar los tokens
  if (accentColors.length > 0) {
    tokens.accent['500'] = accentColors[0].hex;
  }
  
  return tokens;
}

/**
 * Convierte la información tipográfica extraída en tokens de tipografía
 */
function convertTypographyToTokens(typography: BrandingData['typography']): TypographyTokens {
  // Comenzar con tokens por defecto
  const tokens = generateDefaultTypographyTokens();
  
  // Encontrar fuentes para títulos y cuerpo
  const headingFont = typography.find(t => t.category === 'heading');
  const bodyFont = typography.find(t => t.category === 'body');
  const accentFont = typography.find(t => t.category === 'accent');
  
  // Actualizar fuentes si existen
  if (headingFont) {
    tokens.families.heading = `${headingFont.family}, sans-serif`;
  }
  
  if (bodyFont) {
    tokens.families.body = `${bodyFont.family}, sans-serif`;
  }
  
  if (accentFont) {
    tokens.families.accent = `${accentFont.family}, sans-serif`;
  }
  
  return tokens;
}

/**
 * Genera Design Tokens completos a partir de datos de branding
 */
function generateDesignTokens(brandingData: BrandingData): DesignTokens {
  // Generar los diferentes grupos de tokens
  const colorTokens = convertColorsToTokens(brandingData.colors);
  const typographyTokens = convertTypographyToTokens(brandingData.typography);
  const spacingTokens = generateDefaultSpacingTokens();
  
  // Construir el objeto de design tokens completo
  return {
    colors: colorTokens,
    typography: typographyTokens,
    spacing: spacingTokens,
    metadata: {
      brandName: brandingData.brandName || 'Marca sin nombre',
      version: '1.0.0',
      createdAt: new Date().toISOString()
    }
  };
}

/**
 * Convierte los tokens a diferentes formatos
 */
function convertTokensToFormat(tokens: DesignTokens, format: string): string {
  switch (format) {
    case 'json':
      return JSON.stringify(tokens, null, 2);
      
    case 'css':
      return generateCSSVariables(tokens);
      
    case 'scss':
      return generateSCSSVariables(tokens);
      
    default:
      return JSON.stringify(tokens, null, 2);
  }
}

/**
 * Genera variables CSS a partir de design tokens
 */
function generateCSSVariables(tokens: DesignTokens): string {
  let css = `:root {\n`;
  
  // Variables de color
  Object.entries(tokens.colors.primary).forEach(([key, value]) => {
    css += `  --color-primary-${key}: ${value};\n`;
  });
  
  Object.entries(tokens.colors.secondary).forEach(([key, value]) => {
    css += `  --color-secondary-${key}: ${value};\n`;
  });
  
  Object.entries(tokens.colors.accent).forEach(([key, value]) => {
    css += `  --color-accent-${key}: ${value};\n`;
  });
  
  Object.entries(tokens.colors.neutral).forEach(([key, value]) => {
    css += `  --color-neutral-${key}: ${value};\n`;
  });
  
  Object.entries(tokens.colors.feedback).forEach(([key, value]) => {
    css += `  --color-${key}: ${value};\n`;
  });
  
  // Variables de tipografía
  css += `  --font-family-heading: ${tokens.typography.families.heading};\n`;
  css += `  --font-family-body: ${tokens.typography.families.body};\n`;
  
  if (tokens.typography.families.accent) {
    css += `  --font-family-accent: ${tokens.typography.families.accent};\n`;
  }
  
  Object.entries(tokens.typography.weights).forEach(([key, value]) => {
    css += `  --font-weight-${key}: ${value};\n`;
  });
  
  Object.entries(tokens.typography.sizes).forEach(([key, value]) => {
    css += `  --font-size-${key}: ${value};\n`;
  });
  
  Object.entries(tokens.typography.lineHeights).forEach(([key, value]) => {
    css += `  --line-height-${key}: ${value};\n`;
  });
  
  // Variables de espaciado
  if (tokens.spacing) {
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      css += `  --spacing-${key}: ${value};\n`;
    });
  }
  
  css += `}\n`;
  return css;
}

/**
 * Genera variables SCSS a partir de design tokens
 */
function generateSCSSVariables(tokens: DesignTokens): string {
  let scss = `// Design Tokens generados a partir de la identidad de marca\n`;
  scss += `// Marca: ${tokens.metadata.brandName}\n`;
  scss += `// Versión: ${tokens.metadata.version}\n\n`;
  
  // Variables de color
  scss += `// Colores Primarios\n`;
  Object.entries(tokens.colors.primary).forEach(([key, value]) => {
    scss += `$color-primary-${key}: ${value};\n`;
  });
  
  scss += `\n// Colores Secundarios\n`;
  Object.entries(tokens.colors.secondary).forEach(([key, value]) => {
    scss += `$color-secondary-${key}: ${value};\n`;
  });
  
  scss += `\n// Colores de Acento\n`;
  Object.entries(tokens.colors.accent).forEach(([key, value]) => {
    scss += `$color-accent-${key}: ${value};\n`;
  });
  
  scss += `\n// Colores Neutrales\n`;
  Object.entries(tokens.colors.neutral).forEach(([key, value]) => {
    scss += `$color-neutral-${key}: ${value};\n`;
  });
  
  scss += `\n// Colores de Feedback\n`;
  Object.entries(tokens.colors.feedback).forEach(([key, value]) => {
    scss += `$color-${key}: ${value};\n`;
  });
  
  // Variables de tipografía
  scss += `\n// Tipografía\n`;
  scss += `$font-family-heading: ${tokens.typography.families.heading};\n`;
  scss += `$font-family-body: ${tokens.typography.families.body};\n`;
  
  if (tokens.typography.families.accent) {
    scss += `$font-family-accent: ${tokens.typography.families.accent};\n`;
  }
  
  scss += `\n// Pesos tipográficos\n`;
  Object.entries(tokens.typography.weights).forEach(([key, value]) => {
    scss += `$font-weight-${key}: ${value};\n`;
  });
  
  scss += `\n// Tamaños de fuente\n`;
  Object.entries(tokens.typography.sizes).forEach(([key, value]) => {
    scss += `$font-size-${key}: ${value};\n`;
  });
  
  scss += `\n// Alturas de línea\n`;
  Object.entries(tokens.typography.lineHeights).forEach(([key, value]) => {
    scss += `$line-height-${key}: ${value};\n`;
  });
  
  // Variables de espaciado
  if (tokens.spacing) {
    scss += `\n// Espaciado\n`;
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      scss += `$spacing-${key}: ${value};\n`;
    });
  }
  
  return scss;
}

/**
 * Registra la herramienta MCP para generación de tokens de diseño
 */
export function registerDesignTokenTool(server: Server): void {
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== 'generate_design_tokens') {
      return; // No es esta herramienta, permitir que otro handler lo maneje
    }
    
    try {
      const { brandingData, figmaData, format = 'json' } = request.params.arguments as {
        brandingData: BrandingData;
        figmaData?: any;
        format?: 'json' | 'css' | 'scss';
      };
      
      if (!brandingData) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Se requieren los datos de branding (brandingData)'
        );
      }
      
      logger.info(`Generando tokens de diseño a partir de datos de branding`);
      
      // Combinar datos de Figma si existen
      const combinedData = figmaData ? { ...brandingData, ...figmaData } : brandingData;
      
      // Generar design tokens
      const designTokens = generateDesignTokens(combinedData);
      
      // Convertir a formato solicitado
      const result = convertTokensToFormat(designTokens, format);
      
      return {
        content: [
          {
            type: 'text',
            text: result
          }
        ]
      };
    } catch (error) {
      logger.error('Error en la herramienta generate_design_tokens:', error);
      
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  });
}