/**
 * Dependency Graph Builder
 * 
 * Generates a comprehensive graph of all components with their connections,
 * types, and metadata for visualization and analysis.
 */

import madge from 'madge';
import path from 'path';
import fs from 'fs/promises';
import { getComponentMap, ComponentMap } from './component-map';
import { ComponentOrigin, RiskLevel } from './types';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface GraphNode {
  id: string;
  type: string;
  origin: ComponentOrigin;
  risk: RiskLevel;
  testCoverage: boolean;
  kiroAlternative: boolean;
  archiveCandidate: boolean;
  riskScore: number;
  usage: 'active' | 'unused' | 'indirect';
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'import' | 'export' | 'dependency';
  weight?: number;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    generatedAt: string;
    totalNodes: number;
    totalEdges: number;
    circularDependencies: string[][];
    orphanedNodes: string[];
    criticalPaths: string[][];
  };
}

export class DependencyGraphBuilder {
  private baseDir: string;
  private componentMap: ComponentMap | null = null;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.resolve(process.cwd(), 'src');
  }

  /**
   * Generate complete dependency graph
   */
  async generateDependencyGraph(outputFile?: string): Promise<DependencyGraph> {
    console.log('🔍 Analyzing dependencies with madge...');
    
    // Get component map
    this.componentMap = await getComponentMap();
    
    // Use madge to analyze dependencies
    const madgeGraph = await madge(this.baseDir, {
      fileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      includeNpm: false,
      tsConfig: path.resolve(__dirname, '../../../tsconfig.json'),
      webpackConfig: false,
      excludeRegExp: [
        /node_modules/,
        /\.test\./,
        /\.spec\./,
        /\.d\.ts$/
      ]
    });

    const dependencyObj = madgeGraph.obj();
    const circularDeps = madgeGraph.circular();

    // Build nodes
    const nodes = this.buildNodes(dependencyObj);
    
    // Build edges
    const edges = this.buildEdges(dependencyObj);
    
    // Calculate metadata
    const metadata = this.calculateMetadata(nodes, edges, circularDeps);

    const graph: DependencyGraph = {
      nodes,
      edges,
      metadata
    };

    // Export if output file specified
    if (outputFile) {
      await this.exportGraph(graph, outputFile);
    }

    return graph;
  }

  /**
   * Build graph nodes from component map and dependency data
   */
  private buildNodes(dependencyObj: Record<string, string[]>): GraphNode[] {
    const nodes: GraphNode[] = [];
    const processedFiles = new Set<string>();

    // Process all files from dependency analysis
    Object.keys(dependencyObj).forEach(filePath => {
      const nodeId = this.getNodeId(filePath);
      
      if (!processedFiles.has(nodeId)) {
        const node = this.createNode(filePath, nodeId);
        if (node) {
          nodes.push(node);
          processedFiles.add(nodeId);
        }
      }
    });

    // Also process dependencies that might not be in keys
    Object.values(dependencyObj).forEach(deps => {
      deps.forEach(depPath => {
        const nodeId = this.getNodeId(depPath);
        
        if (!processedFiles.has(nodeId)) {
          const node = this.createNode(depPath, nodeId);
          if (node) {
            nodes.push(node);
            processedFiles.add(nodeId);
          }
        }
      });
    });

    return nodes;
  }

  /**
   * Create a graph node from file path
   */
  private createNode(filePath: string, nodeId: string): GraphNode | null {
    // Get component info from map
    const componentInfo = this.componentMap?.[nodeId];
    
    if (!componentInfo) {
      // Create basic node for files not in component map
      return {
        id: nodeId,
        type: this.inferTypeFromPath(filePath),
        origin: 'Unknown',
        risk: 'low',
        testCoverage: false,
        kiroAlternative: false,
        archiveCandidate: false,
        riskScore: 0,
        usage: 'indirect'
      };
    }

    return {
      id: nodeId,
      type: componentInfo.type,
      origin: componentInfo.origin,
      risk: componentInfo.riskLevel,
      testCoverage: componentInfo.testCoverage,
      kiroAlternative: componentInfo.kiroAlternative,
      archiveCandidate: componentInfo.archiveCandidate,
      riskScore: componentInfo.riskScore,
      usage: componentInfo.usage
    };
  }

  /**
   * Build graph edges from dependency data
   */
  private buildEdges(dependencyObj: Record<string, string[]>): GraphEdge[] {
    const edges: GraphEdge[] = [];

    Object.entries(dependencyObj).forEach(([fromPath, toPaths]) => {
      const fromId = this.getNodeId(fromPath);
      
      toPaths.forEach(toPath => {
        const toId = this.getNodeId(toPath);
        
        edges.push({
          from: fromId,
          to: toId,
          type: 'dependency',
          weight: 1
        });
      });
    });

    return edges;
  }

  /**
   * Calculate graph metadata
   */
  private calculateMetadata(
    nodes: GraphNode[], 
    edges: GraphEdge[], 
    circularDeps: string[][]
  ): DependencyGraph['metadata'] {
    // Find orphaned nodes (no incoming or outgoing edges)
    const connectedNodes = new Set<string>();
    edges.forEach(edge => {
      connectedNodes.add(edge.from);
      connectedNodes.add(edge.to);
    });
    
    const orphanedNodes = nodes
      .filter(node => !connectedNodes.has(node.id))
      .map(node => node.id);

    // Convert circular dependency paths to node IDs
    const circularNodePaths = circularDeps.map(cycle => 
      cycle.map(filePath => this.getNodeId(filePath))
    );

    // Find critical paths (high-risk nodes with many dependencies)
    const criticalPaths = this.findCriticalPaths(nodes, edges);

    return {
      generatedAt: new Date().toISOString(),
      totalNodes: nodes.length,
      totalEdges: edges.length,
      circularDependencies: circularNodePaths,
      orphanedNodes,
      criticalPaths
    };
  }

  /**
   * Find critical dependency paths
   */
  private findCriticalPaths(nodes: GraphNode[], edges: GraphEdge[]): string[][] {
    const criticalPaths: string[][] = [];
    
    // Find high-risk nodes with many dependencies
    const highRiskNodes = nodes.filter(node => 
      node.risk === 'high' || node.risk === 'critical'
    );

    highRiskNodes.forEach(riskNode => {
      const dependents = edges
        .filter(edge => edge.to === riskNode.id)
        .map(edge => edge.from);
      
      if (dependents.length > 3) {
        criticalPaths.push([riskNode.id, ...dependents]);
      }
    });

    return criticalPaths;
  }

  /**
   * Get node ID from file path
   */
  private getNodeId(filePath: string): string {
    // Remove file extension and normalize path
    const relativePath = path.relative(this.baseDir, filePath);
    return path.basename(relativePath, path.extname(relativePath));
  }

  /**
   * Infer component type from file path
   */
  private inferTypeFromPath(filePath: string): string {
    if (filePath.includes('/pages/')) return 'Page';
    if (filePath.includes('/components/')) return 'UI';
    if (filePath.includes('/hooks/')) return 'Hook';
    if (filePath.includes('/services/')) return 'Service';
    if (filePath.includes('/contexts/')) return 'Context';
    if (filePath.includes('/lib/')) return 'Engine';
    if (filePath.includes('/utils/')) return 'Utility';
    if (filePath.includes('test')) return 'Test';
    return 'Unknown';
  }

  /**
   * Export graph to JSON file
   */
  private async exportGraph(graph: DependencyGraph, outputFile: string): Promise<void> {
    await fs.writeFile(outputFile, JSON.stringify(graph, null, 2));
    console.log(`✅ Dependency graph written to ${outputFile}`);
    console.log(`📊 Graph contains ${graph.nodes.length} nodes and ${graph.edges.length} edges`);
    
    if (graph.metadata.circularDependencies.length > 0) {
      console.log(`⚠️  Found ${graph.metadata.circularDependencies.length} circular dependencies`);
    }
    
    if (graph.metadata.orphanedNodes.length > 0) {
      console.log(`🔍 Found ${graph.metadata.orphanedNodes.length} orphaned nodes`);
    }
  }

  /**
   * Generate visualization-ready data
   */
  async generateVisualizationData(outputFile: string): Promise<void> {
    const graph = await this.generateDependencyGraph();
    
    // Create D3.js compatible format
    const vizData = {
      nodes: graph.nodes.map(node => ({
        id: node.id,
        group: node.type,
        risk: node.risk,
        origin: node.origin,
        size: node.riskScore + 5, // Base size + risk
        color: this.getRiskColor(node.risk)
      })),
      links: graph.edges.map(edge => ({
        source: edge.from,
        target: edge.to,
        value: edge.weight || 1
      }))
    };

    await fs.writeFile(outputFile, JSON.stringify(vizData, null, 2));
    console.log(`✅ Visualization data written to ${outputFile}`);
  }

  /**
   * Get color for risk level
   */
  private getRiskColor(risk: RiskLevel): string {
    const colors = {
      low: '#22c55e',      // Green
      medium: '#f59e0b',   // Yellow
      high: '#ef4444',     // Red
      critical: '#7c2d12'  // Dark red
    };
    return colors[risk];
  }
}

/**
 * Main function to generate dependency graph
 */
export async function generateDependencyGraph(outputFile?: string): Promise<DependencyGraph> {
  const builder = new DependencyGraphBuilder();
  return builder.generateDependencyGraph(outputFile);
}

/**
 * Generate visualization-ready dependency graph
 */
export async function generateVisualizationGraph(outputFile: string): Promise<void> {
  const builder = new DependencyGraphBuilder();
  await builder.generateVisualizationData(outputFile);
}