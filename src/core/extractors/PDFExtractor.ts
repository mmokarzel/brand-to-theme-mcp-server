import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../../utils/logger.js';
import fs from 'fs';
import pdfParse from 'pdf-parse';

// Interfaz para los datos de branding extraídos
export interface BrandingData {
  colors: ColorInfo[];
  typography: TypographyInfo[];
  logos: LogoInfo[];
  spacing?: SpacingInfo;
  brandName?: string;
  brandTagline?: string;
}

interface ColorInfo {
  name: string;
  hex: string;
  rgb?: string;
  cmyk?: string;
  category?: 'primary' | 'secondary' | 'accent' | 'neutral';
  usage?: string;
}

interface TypographyInfo {
  family: string;
  category?: 'heading' | 'body' | 'accent';
  weights?: string[];
  usage?: string;
}

interface LogoInfo {
  name: string;
  type: 'primary' | 'secondary' | 'alternative' | 'icon';
  description?: string;
  imageData?: Buffer;
}

interface SpacingInfo {
  base?: number;
  scale?: number[];
  rules?: string[];
}

/**
 * Extrae colores de un texto de PDF
 * Busca patrones comunes de definición de colores como HEX, RGB, CMYK
 */
function extractColors(text: string): ColorInfo[] {
  const colors: ColorInfo[] = [];
  
  // Búsqueda de códigos hexadecimales
  const hexPattern = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g;
  const hexMatches = text.match(hexPattern) || [];
  
  // Crear entradas de color para cada coincidencia de hex
  hexMatches.forEach((hex, index) => {
    colors.push({
      name: `Color ${index + 1}`,
      hex: hex,
      category: index === 0 ? 'primary' : (index === 1 ? 'secondary' : 'accent')
    });
  });
  
  // Búsqueda de colores RGB
  const rgbPattern = /RGB\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/gi;
  let rgbMatch;
  while ((rgbMatch = rgbPattern.exec(text)) !== null) {
    const rgb = `rgb(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]})`;
    
    // Convertir RGB a HEX
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    
    // Añadir solo si no existe ya un color con este hex
    if (!colors.some(c => c.hex.toLowerCase() === hex.toLowerCase())) {
      colors.push({
        name: `Color RGB ${colors.length + 1}`,
        hex: hex,
        rgb: rgb
      });
    }
  }
  
  return colors;
}

/**
 * Extrae información sobre tipografías de un texto PDF
 */
function extractTypography(text: string): TypographyInfo[] {
  const typography: TypographyInfo[] = [];
  
  // Lista de fuentes comunes para buscar
  const commonFonts = [
    'Arial', 'Helvetica', 'Times', 'Times New Roman', 'Courier', 'Verdana', 
    'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Tahoma', 'Trebuchet MS',
    'Impact', 'Comic Sans MS', 'Webdings', 'Symbol', 'Montserrat', 'Roboto',
    'Open Sans', 'Lato', 'Oswald', 'Raleway', 'PT Sans', 'Merriweather',
    'Ubuntu', 'Noto', 'Playfair Display', 'Poppins', 'Nunito', 'Work Sans'
  ];
  
  // Buscar menciones de fuentes comunes
  commonFonts.forEach(font => {
    const fontRegex = new RegExp(`\\b${font}\\b`, 'gi');
    if (fontRegex.test(text)) {
      typography.push({
        family: font,
        category: typography.length === 0 ? 'heading' : 'body'
      });
    }
  });
  
  // Si no se encontraron fuentes, añadir valores por defecto
  if (typography.length === 0) {
    typography.push({
      family: 'Arial',
      category: 'heading'
    });
    typography.push({
      family: 'Helvetica',
      category: 'body'
    });
  }
  
  return typography;
}

/**
 * Extrae información sobre logos (esta implementación es básica)
 */
function extractLogos(text: string): LogoInfo[] {
  const logos: LogoInfo[] = [];
  
  // Buscar menciones de logos o variantes
  if (text.match(/\blogo\b/i)) {
    logos.push({
      name: 'Logo Principal',
      type: 'primary',
      description: 'Logotipo principal extraído del PDF'
    });
  }
  
  // Si se encuentra algo que sugiere un isotipo o icono
  if (text.match(/\bicon\b|\bisotipo\b|\bsímbolo\b/i)) {
    logos.push({
      name: 'Isotipo',
      type: 'icon',
      description: 'Versión de icono del logotipo'
    });
  }
  
  // Logo alternativo o secundario
  if (text.match(/\balternativo\b|\bsecundario\b|\bmonocromático\b/i)) {
    logos.push({
      name: 'Logo Alternativo',
      type: 'alternative',
      description: 'Versión alternativa del logotipo'
    });
  }
  
  return logos;
}

/**
 * Intenta extraer el nombre de la marca del texto
 */
function extractBrandName(text: string): string | undefined {
  // Patrones comunes para encontrar nombres de marca
  const brandPatterns = [
    /marca\s+(?:registrada)?\s*[:\"']?\s*([A-Z][A-Za-z0-9\s]{0,20})/i,
    /[Bb]rand\s+[Nn]ame\s*[:\"']?\s*([A-Z][A-Za-z0-9\s]{0,20})/,
    /[Ll]ogotipo\s+(?:de)?\s*[:\"']?\s*([A-Z][A-Za-z0-9\s]{0,20})/i
  ];
  
  for (const pattern of brandPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return undefined;
}

/**
 * Extrae datos de branding de un PDF
 */
async function extractBrandingFromPDF(pdfPath: string, options: any = {}): Promise<BrandingData> {
  try {
    // Verificar si el archivo existe
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`El archivo PDF no existe: ${pdfPath}`);
    }
    
    // Leer el archivo PDF
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(dataBuffer);
    
    // Extraer texto del PDF
    const text = pdfData.text;
    
    // Extraer componentes de branding
    const colors = options.extractColors !== false ? extractColors(text) : [];
    const typography = options.extractTypography !== false ? extractTypography(text) : [];
    const logos = options.extractLogos !== false ? extractLogos(text) : [];
    const brandName = extractBrandName(text);
    
    return {
      colors,
      typography,
      logos,
      brandName
    };
  } catch (error) {
    logger.error('Error extracting branding from PDF:', error);
    throw error;
  }
}

/**
 * Registra la herramienta MCP para extracción de PDF
 */
export function registerPdfExtractorTool(server: Server): void {
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== 'extract_pdf_branding') {
      return; // No es esta herramienta, permitir que otro handler lo maneje
    }
    
    try {
      const { pdfPath, extractOptions } = request.params.arguments as { 
        pdfPath: string;
        extractOptions?: {
          extractColors?: boolean;
          extractTypography?: boolean;
          extractLogos?: boolean;
        };
      };
      
      if (!pdfPath) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Se requiere la ruta al archivo PDF (pdfPath)'
        );
      }
      
      logger.info(`Extrayendo información de branding del PDF: ${pdfPath}`);
      const brandingData = await extractBrandingFromPDF(pdfPath, extractOptions);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(brandingData, null, 2)
          }
        ]
      };
    } catch (error) {
      logger.error('Error en la herramienta extract_pdf_branding:', error);
      
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