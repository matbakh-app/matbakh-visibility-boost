/**
 * Mermaid Architecture Diagram Generator
 * 
 * Converts dependency graph data into Mermaid diagram format
 * with color-coded nodes based on component origin and risk level
 */

import { DependencyGraph, GraphNode, GraphEdge } from './dependency-graph';
import { ComponentOrigin, RiskLevel } from './types';
import fs from 'fs/promises';

export interface MermaidConfig {
  maxNodes?: number;
  includeOrphans?: boolean;
  groupByType?: boolean;
  showRiskLevels?: boolean;
  includeKiroAlternatives?: boolean;
}

export class MermaidGenerator {
  private config: Required<MermaidConfig>;

  constructor(config: Partial<MermaidConfig> = {}) {
    this.config = {
      maxNodes: 50,
      includeOrphans: false,
      groupByType: true,
      showRiskLevels: true,
      includeKiroAlternatives: true,
      ...config
    };
  }

  /**
   * Generate Mermaid diagram from dependency graph
   */
  generateDiagram(graph: DependencyGraph): string {
    const filteredNodes = this.filterNodes(graph.nodes);
    const relevantEdges = this.filterEdges(graph.edges, filteredNodes);

    let mermaid = 'graph TD\n';
    
    // Add style definitions
    mermaid += this.generateStyleDefinitions();
    
    // Add nodes with styling
    mermaid += this.generateNodes(filteredNodes);
    
    // Add edges
    mermaid += this.generateEdges(relevantEdges);
    
    // Add subgraphs for grouping
    if (this.config.groupByType) {
      mermaid += this.generateSubgraphs(filteredNodes);
    }

    return mermaid;
  }

  /**
   * Filter nodes based on configuration
   */
  private filterNodes(nodes: GraphNode[]): GraphNode[] {
    let filtered = [...nodes];

    // Remove orphans if configured
    if (!this.config.includeOrphans) {
      filtered = filtered.filter(node => node.usage !== 'unused');
    }

    // Limit number of nodes
    if (filtered.length > this.config.maxNodes) {
      // Prioritize by risk level and usage
      filtered.sort((a, b) => {
        const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const usageOrder = { active: 3, indirect: 2, unused: 1 };
        
        const aScore = riskOrder[a.risk] * 10 + usageOrder[a.usage];
        const bScore = riskOrder[b.risk] * 10 + usageOrder[b.usage];
        
        return bScore - aScore;
      });
      
      filtered = filtered.slice(0, this.config.maxNodes);
    }

    return filtered;
  }

  /**
   * Filter edges to only include relevant connections
   */
  private filterEdges(edges: GraphEdge[], nodes: GraphNode[]): GraphEdge[] {
    const nodeIds = new Set(nodes.map(n => n.id));
    return edges.filter(edge => 
      nodeIds.has(edge.from) && nodeIds.has(edge.to)
    );
  }

  /**
   * Generate style definitions for different component types
   */
  private generateStyleDefinitions(): string {
    return `
    %% Style definitions
    classDef kiro fill:#22c55e,stroke:#16a34a,stroke-width:2px,color:#fff
    classDef supabase fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    classDef lovable fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    classDef unknown fill:#6b7280,stroke:#4b5563,stroke-width:2px,color:#fff
    classDef critical fill:#7c2d12,stroke:#451a03,stroke-width:3px,color:#fff
    classDef high fill:#dc2626,stroke:#991b1b,stroke-width:2px,color:#fff
    classDef medium fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#000
    classDef low fill:#22c55e,stroke:#16a34a,stroke-width:1px,color:#000
    classDef hasAlternative stroke-dasharray: 5 5

`;
  }

  /**
   * Generate node definitions with styling
   */
  private generateNodes(nodes: GraphNode[]): string {
    let result = '\n    %% Nodes\n';
    
    for (const node of nodes) {
      const nodeId = this.sanitizeId(node.id);
      const label = this.generateNodeLabel(node);
      const shape = this.getNodeShape(node.type);
      
      result += `    ${nodeId}${shape}"${label}"]\n`;
      
      // Apply styling
      const classes = this.getNodeClasses(node);
      if (classes.length > 0) {
        result += `    class ${nodeId} ${classes.join(',')}\n`;
      }
    }
    
    return result;
  }

  /**
   * Generate node label with metadata
   */
  private generateNodeLabel(node: GraphNode): string {
    let label = node.id;
    
    if (this.config.showRiskLevels) {
      const riskEmoji = this.getRiskEmoji(node.risk);
      label = `${riskEmoji} ${label}`;
    }
    
    // Add type indicator
    const typeEmoji = this.getTypeEmoji(node.type);
    if (typeEmoji) {
      label = `${typeEmoji} ${label}`;
    }
    
    // Add Kiro alternative indicator
    if (this.config.includeKiroAlternatives && node.kiroAlternative) {
      label += ' ⭐';
    }
    
    return label;
  }

  /**
   * Get node shape based on component type
   */
  private getNodeShape(type: string): string {
    const shapes = {
      'Page': '[',
      'UI': '(',
      'Hook': '{',
      'Service': '[[',
      'Context': '((',
      'Engine': '{{',
      'Utility': '[(',
      'Test': '>[',
      'Script': '|'
    };
    
    return shapes[type] || '[';
  }

  /**
   * Get CSS classes for node styling
   */
  private getNodeClasses(node: GraphNode): string[] {
    const classes: string[] = [];
    
    // Origin-based styling
    classes.push(node.origin.toLowerCase());
    
    // Risk-based styling (overrides origin for critical/high risk)
    if (node.risk === 'critical' || node.risk === 'high') {
      classes.push(node.risk);
    }
    
    // Kiro alternative indicator
    if (node.kiroAlternative) {
      classes.push('hasAlternative');
    }
    
    return classes;
  }

  /**
   * Generate edge definitions
   */
  private generateEdges(edges: GraphEdge[]): string {
    let result = '\n    %% Dependencies\n';
    
    for (const edge of edges) {
      const fromId = this.sanitizeId(edge.from);
      const toId = this.sanitizeId(edge.to);
      const arrow = this.getArrowType(edge.type);
      
      result += `    ${fromId} ${arrow} ${toId}\n`;
    }
    
    return result;
  }

  /**
   * Get arrow type based on relationship
   */
  private getArrowType(type: string): string {
    const arrows = {
      'import': '-->',
      'export': '<--',
      'dependency': '-->',
      'circular': '<-->',
      'weak': '-.->',
    };
    
    return arrows[type] || '-->';
  }

  /**
   * Generate subgraphs for component grouping
   */
  private generateSubgraphs(nodes: GraphNode[]): string {
    if (!this.config.groupByType) return '';
    
    const groups = this.groupNodesByType(nodes);
    let result = '\n    %% Subgraphs\n';
    
    for (const [type, typeNodes] of Object.entries(groups)) {
      if (typeNodes.length > 1) {
        result += `    subgraph ${type}["${type} Components"]\n`;
        for (const node of typeNodes) {
          result += `        ${this.sanitizeId(node.id)}\n`;
        }
        result += '    end\n';
      }
    }
    
    return result;
  }

  /**
   * Group nodes by component type
   */
  private groupNodesByType(nodes: GraphNode[]): Record<string, GraphNode[]> {
    const groups: Record<string, GraphNode[]> = {};
    
    for (const node of nodes) {
      if (!groups[node.type]) {
        groups[node.type] = [];
      }
      groups[node.type].push(node);
    }
    
    return groups;
  }

  /**
   * Get emoji for risk level
   */
  private getRiskEmoji(risk: RiskLevel): string {
    const emojis = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    };
    return emojis[risk];
  }

  /**
   * Get emoji for component type
   */
  private getTypeEmoji(type: string): string {
    const emojis = {
      'Page': '📄',
      'UI': '🧩',
      'Hook': '🪝',
      'Service': '⚙️',
      'Context': '🌐',
      'Engine': '🔧',
      'Utility': '🛠️',
      'Test': '🧪',
      'Script': '📜'
    };
    return emojis[type] || '';
  }

  /**
   * Sanitize node ID for Mermaid compatibility
   */
  private sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /**
   * Generate legend for the diagram
   */
  generateLegend(): string {
    return `
    %% Legend
    subgraph Legend["🔍 Legend"]
        L1["🟢 Kiro (Modern)"]
        L2["🟡 Supabase (Legacy)"]
        L3["🔴 Lovable (Legacy)"]
        L4["⚫ Unknown"]
        L5["⭐ Has Kiro Alternative"]
        L6["🔴 Critical Risk"]
        L7["🟠 High Risk"]
        L8["🟡 Medium Risk"]
        L9["🟢 Low Risk"]
    end
    
    class L1 kiro
    class L2 supabase
    class L3 lovable
    class L4 unknown
    class L5 hasAlternative
    class L6 critical
    class L7 high
    class L8 medium
    class L9 low
`;
  }

  /**
   * Export Mermaid diagram to file
   */
  async exportDiagram(
    graph: DependencyGraph, 
    outputPath: string,
    includeLegend: boolean = true
  ): Promise<void> {
    let diagram = this.generateDiagram(graph);
    
    if (includeLegend) {
      diagram += this.generateLegend();
    }
    
    await fs.writeFile(outputPath, diagram);
    console.log(`✅ Mermaid diagram exported to ${outputPath}`);
  }

  /**
   * Generate multiple diagram variants
   */
  async generateVariants(graph: DependencyGraph, basePath: string): Promise<void> {
    const variants = [
      {
        name: 'full',
        config: { maxNodes: 100, includeOrphans: true, groupByType: true },
        description: 'Complete architecture overview'
      },
      {
        name: 'critical',
        config: { maxNodes: 30, includeOrphans: false, groupByType: false },
        description: 'Critical components and high-risk areas'
      },
      {
        name: 'legacy',
        config: { maxNodes: 50, includeOrphans: false, groupByType: true },
        description: 'Legacy components requiring attention'
      }
    ];

    for (const variant of variants) {
      const generator = new MermaidGenerator(variant.config);
      const diagram = generator.generateDiagram(graph);
      const filename = `${basePath}-${variant.name}.mmd`;
      
      await fs.writeFile(filename, `%% ${variant.description}\n${diagram}`);
      console.log(`✅ Generated ${variant.name} variant: ${filename}`);
    }
  }
}

/**
 * Generate Mermaid diagram from dependency graph
 */
export async function generateMermaidDiagram(
  graph: DependencyGraph,
  outputPath: string,
  config?: Partial<MermaidConfig>
): Promise<void> {
  const generator = new MermaidGenerator(config);
  await generator.exportDiagram(graph, outputPath);
}

/**
 * Generate multiple diagram variants
 */
export async function generateMermaidVariants(
  graph: DependencyGraph,
  basePath: string
): Promise<void> {
  const generator = new MermaidGenerator();
  await generator.generateVariants(graph, basePath);
}