#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { registerPdfExtractorTool } from './core/extractors/PDFExtractor.js';
import { registerDesignTokenTool } from './core/context/DesignTokenExtractor.js';
import { registerShopifyThemeGenerator } from './core/generators/ShopifyGenerator.js';
import { registerShopifyThemeInstaller } from './core/generators/ShopifyInstaller.js';
import { logger } from './utils/logger.js';

class BrandToThemeServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'brand-to-theme-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // Configurar manejadores de errores
    this.server.onerror = (error) => logger.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });

    // Registrar herramientas MCP
    this.setupTools();
    
    // No implementamos recursos por ahora, nos enfocamos en herramientas (tools)
    this.setupResourceHandlers();
  }

  private setupTools() {
    // Registrar las herramientas MCP
    registerPdfExtractorTool(this.server);
    registerDesignTokenTool(this.server);
    registerShopifyThemeGenerator(this.server);
    registerShopifyThemeInstaller(this.server);

    // Configurar el manejador de lista de herramientas
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'extract_pdf_branding',
          description: 'Extrae elementos visuales e identidad de marca desde un archivo PDF',
          inputSchema: {
            type: 'object',
            properties: {
              pdfPath: {
                type: 'string',
                description: 'Ruta al archivo PDF del manual de identidad corporativa'
              },
              extractOptions: {
                type: 'object',
                properties: {
                  extractColors: {
                    type: 'boolean',
                    description: 'Extraer paleta de colores'
                  },
                  extractTypography: {
                    type: 'boolean',
                    description: 'Extraer información tipográfica'
                  },
                  extractLogos: {
                    type: 'boolean',
                    description: 'Extraer logos y variantes'
                  }
                }
              }
            },
            required: ['pdfPath']
          }
        },
        {
          name: 'generate_design_tokens',
          description: 'Genera tokens de diseño a partir de la identidad de marca extraída',
          inputSchema: {
            type: 'object',
            properties: {
              brandingData: {
                type: 'object',
                description: 'Datos de identidad de marca extraídos'
              },
              figmaData: {
                type: 'object',
                description: 'Datos opcionalmente extraídos de Figma'
              },
              format: {
                type: 'string',
                enum: ['json', 'css', 'scss'],
                description: 'Formato de salida para los tokens'
              }
            },
            required: ['brandingData']
          }
        },
        {
          name: 'create_shopify_theme',
          description: 'Genera un tema de Shopify basado en tokens de diseño',
          inputSchema: {
            type: 'object',
            properties: {
              designTokens: {
                type: 'object',
                description: 'Tokens de diseño generados'
              },
              themeName: {
                type: 'string',
                description: 'Nombre del tema a generar'
              },
              outputPath: {
                type: 'string',
                description: 'Ruta donde guardar los archivos del tema'
              }
            },
            required: ['designTokens', 'themeName']
          }
        },
        {
          name: 'preview_shopify_theme',
          description: 'Genera una vista previa del tema de Shopify',
          inputSchema: {
            type: 'object',
            properties: {
              themePath: {
                type: 'string',
                description: 'Ruta a los archivos del tema'
              },
              previewType: {
                type: 'string',
                enum: ['thumbnail', 'full'],
                description: 'Tipo de vista previa a generar'
              }
            },
            required: ['themePath']
          }
        },
        {
          name: 'install_shopify_theme',
          description: 'Instala el tema generado en la tienda Shopify conectada',
          inputSchema: {
            type: 'object',
            properties: {
              themePath: {
                type: 'string',
                description: 'Ruta a los archivos del tema'
              },
              installationType: {
                type: 'string',
                enum: ['new', 'update'],
                description: 'Instalar como tema nuevo o actualizar un tema existente'
              },
              existingThemeId: {
                type: 'string',
                description: 'ID del tema existente a actualizar (requerido si installationType es "update")'
              },
              setAsMain: {
                type: 'boolean',
                description: 'Establecer como tema principal de la tienda después de la instalación'
              }
            },
            required: ['themePath', 'installationType']
          }
        }
      ],
    }));
  }

  private setupResourceHandlers() {
    // Por simplicidad, no implementamos recursos por ahora
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [],
    }));

    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
      resourceTemplates: [],
    }));

    // Si en el futuro añadimos recursos, implementaremos este handler
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      throw new McpError(
        ErrorCode.NotFound,
        `Recurso no encontrado: ${request.params.uri}`
      );
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Brand-to-Theme MCP server running on stdio');
  }
}

// Iniciar el servidor
const server = new BrandToThemeServer();
server.run().catch((err) => {
  logger.error('Error starting server:', err);
  process.exit(1);
});