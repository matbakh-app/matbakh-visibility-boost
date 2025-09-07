import { 
  SWOTAnalysisResult, 
  SWOTVisualization, 
  SWOTItem, 
  BusinessInsight,
  ActionRecommendation 
} from './types';

/**
 * Visualization Engine
 * 
 * Creates interactive visualization data for SWOT analysis:
 * - SWOT matrix with interactive elements
 * - Impact vs confidence scatter plots
 * - Theme frequency heatmaps
 * - Network diagrams showing relationships
 * - Timeline visualizations for trends
 */
export class VisualizationEngine {
  private colorSchemes: { [key: string]: string[] };
  private defaultDimensions: { width: number; height: number };

  constructor() {
    this.colorSchemes = {
      swot: ['#4CAF50', '#F44336', '#2196F3', '#FF9800'], // Green, Red, Blue, Orange
      sentiment: ['#f44336', '#ffeb3b', '#4caf50'], // Red, Yellow, Green
      impact: ['#e8f5e8', '#81c784', '#2e7d32'], // Light to dark green
      confidence: ['#ffebee', '#ef5350', '#c62828'], // Light to dark red
      category: ['#3f51b5', '#9c27b0', '#ff5722', '#607d8b', '#795548', '#009688']
    };

    this.defaultDimensions = {
      width: 800,
      height: 600
    };
  }

  /**
   * Generate all visualizations for SWOT analysis
   */
  generateVisualizations(
    result: SWOTAnalysisResult,
    textInsights?: any,
    imageInsights?: any
  ): SWOTVisualization[] {
    const visualizations: SWOTVisualization[] = [];

    // 1. SWOT Matrix
    visualizations.push(this.createSWOTMatrix(result));

    // 2. Impact vs Confidence Scatter Plot
    visualizations.push(this.createImpactConfidenceChart(result));

    // 3. Category Distribution Chart
    visualizations.push(this.createCategoryDistributionChart(result));

    // 4. Action Priority Matrix
    visualizations.push(this.createActionPriorityMatrix(result));

    // 5. Evidence Network Diagram
    visualizations.push(this.createEvidenceNetworkDiagram(result));

    // 6. Sentiment Theme Heatmap (if text insights available)
    if (textInsights) {
      visualizations.push(this.createSentimentThemeHeatmap(textInsights));
    }

    // 7. Image Content Distribution (if image insights available)
    if (imageInsights) {
      visualizations.push(this.createImageContentDistribution(imageInsights));
    }

    // 8. Business Health Radar Chart
    visualizations.push(this.createBusinessHealthRadar(result));

    return visualizations;
  }

  /**
   * Create interactive SWOT matrix
   */
  private createSWOTMatrix(result: SWOTAnalysisResult): SWOTVisualization {
    const { strengths, weaknesses, opportunities, threats } = result.swotAnalysis;

    const matrixData = {
      quadrants: [
        {
          id: 'strengths',
          title: 'Strengths',
          subtitle: 'Internal Positive Factors',
          position: { x: 0, y: 0 },
          color: this.colorSchemes.swot[0],
          items: strengths.map(item => this.formatMatrixItem(item))
        },
        {
          id: 'weaknesses',
          title: 'Weaknesses',
          subtitle: 'Internal Negative Factors',
          position: { x: 1, y: 0 },
          color: this.colorSchemes.swot[1],
          items: weaknesses.map(item => this.formatMatrixItem(item))
        },
        {
          id: 'opportunities',
          title: 'Opportunities',
          subtitle: 'External Positive Factors',
          position: { x: 0, y: 1 },
          color: this.colorSchemes.swot[2],
          items: opportunities.map(item => this.formatMatrixItem(item))
        },
        {
          id: 'threats',
          title: 'Threats',
          subtitle: 'External Negative Factors',
          position: { x: 1, y: 1 },
          color: this.colorSchemes.swot[3],
          items: threats.map(item => this.formatMatrixItem(item))
        }
      ],
      interactions: {
        hover: true,
        click: true,
        filter: true,
        search: true
      }
    };

    return {
      type: 'matrix',
      title: 'SWOT Analysis Matrix',
      description: 'Interactive matrix showing all SWOT factors with detailed information on hover',
      data: matrixData,
      config: {
        width: 1000,
        height: 700,
        interactive: true,
        colors: this.colorSchemes.swot,
        responsive: true,
        exportable: true
      }
    };
  }

  /**
   * Create impact vs confidence scatter plot
   */
  private createImpactConfidenceChart(result: SWOTAnalysisResult): SWOTVisualization {
    const allItems = [
      ...result.swotAnalysis.strengths,
      ...result.swotAnalysis.weaknesses,
      ...result.swotAnalysis.opportunities,
      ...result.swotAnalysis.threats
    ];

    const scatterData = {
      datasets: [
        {
          label: 'Strengths',
          data: result.swotAnalysis.strengths.map(item => ({
            x: item.confidence * 100,
            y: this.impactToNumber(item.impact),
            id: item.id,
            title: item.title,
            description: item.description,
            evidenceCount: item.evidence.length
          })),
          backgroundColor: this.colorSchemes.swot[0],
          borderColor: this.colorSchemes.swot[0]
        },
        {
          label: 'Weaknesses',
          data: result.swotAnalysis.weaknesses.map(item => ({
            x: item.confidence * 100,
            y: this.impactToNumber(item.impact),
            id: item.id,
            title: item.title,
            description: item.description,
            evidenceCount: item.evidence.length
          })),
          backgroundColor: this.colorSchemes.swot[1],
          borderColor: this.colorSchemes.swot[1]
        },
        {
          label: 'Opportunities',
          data: result.swotAnalysis.opportunities.map(item => ({
            x: item.confidence * 100,
            y: this.impactToNumber(item.impact),
            id: item.id,
            title: item.title,
            description: item.description,
            evidenceCount: item.evidence.length
          })),
          backgroundColor: this.colorSchemes.swot[2],
          borderColor: this.colorSchemes.swot[2]
        },
        {
          label: 'Threats',
          data: result.swotAnalysis.threats.map(item => ({
            x: item.confidence * 100,
            y: this.impactToNumber(item.impact),
            id: item.id,
            title: item.title,
            description: item.description,
            evidenceCount: item.evidence.length
          })),
          backgroundColor: this.colorSchemes.swot[3],
          borderColor: this.colorSchemes.swot[3]
        }
      ],
      axes: {
        x: {
          title: 'Confidence Level (%)',
          min: 0,
          max: 100,
          gridLines: true
        },
        y: {
          title: 'Impact Level',
          min: 0,
          max: 4,
          labels: ['', 'Low', 'Medium', 'High'],
          gridLines: true
        }
      }
    };

    return {
      type: 'chart',
      title: 'Impact vs Confidence Analysis',
      description: 'Scatter plot showing SWOT items by their impact level and confidence score. Bubble size indicates amount of supporting evidence.',
      data: scatterData,
      config: {
        width: 800,
        height: 500,
        interactive: true,
        responsive: true,
        tooltip: true,
        legend: true
      }
    };
  }

  /**
   * Create category distribution chart
   */
  private createCategoryDistributionChart(result: SWOTAnalysisResult): SWOTVisualization {
    const allItems = [
      ...result.swotAnalysis.strengths,
      ...result.swotAnalysis.weaknesses,
      ...result.swotAnalysis.opportunities,
      ...result.swotAnalysis.threats
    ];

    const categoryCount = new Map<string, { count: number; swotTypes: string[] }>();
    
    for (const item of allItems) {
      const category = item.category;
      const swotType = this.getSWOTType(item, result);
      
      if (!categoryCount.has(category)) {
        categoryCount.set(category, { count: 0, swotTypes: [] });
      }
      
      const existing = categoryCount.get(category)!;
      existing.count++;
      existing.swotTypes.push(swotType);
    }

    const chartData = {
      labels: Array.from(categoryCount.keys()),
      datasets: [
        {
          label: 'SWOT Items by Category',
          data: Array.from(categoryCount.values()).map(item => item.count),
          backgroundColor: this.colorSchemes.category.slice(0, categoryCount.size),
          borderColor: this.colorSchemes.category.slice(0, categoryCount.size),
          borderWidth: 2
        }
      ],
      breakdown: Array.from(categoryCount.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        swotTypes: this.aggregateSWOTTypes(data.swotTypes)
      }))
    };

    return {
      type: 'chart',
      title: 'SWOT Items by Business Category',
      description: 'Distribution of SWOT items across different business categories (operational, marketing, financial, etc.)',
      data: chartData,
      config: {
        width: 600,
        height: 400,
        interactive: true,
        responsive: true,
        legend: true
      },
      vendorConfig: {
        library: 'chartjs',
        chartType: 'doughnut'
      }
    };
  }

  /**
   * Create action priority matrix
   */
  private createActionPriorityMatrix(result: SWOTAnalysisResult): SWOTVisualization {
    const actions = result.actionRecommendations;

    const matrixData = {
      axes: {
        x: { title: 'Effort Level', labels: ['Low', 'Medium', 'High'] },
        y: { title: 'Expected Impact', labels: ['Low', 'Medium', 'High'] }
      },
      quadrants: [
        { id: 'quick-wins', title: 'Quick Wins', subtitle: 'High Impact, Low Effort', color: '#4CAF50' },
        { id: 'major-projects', title: 'Major Projects', subtitle: 'High Impact, High Effort', color: '#2196F3' },
        { id: 'fill-ins', title: 'Fill-ins', subtitle: 'Low Impact, Low Effort', color: '#FFC107' },
        { id: 'thankless-tasks', title: 'Questionable', subtitle: 'Low Impact, High Effort', color: '#F44336' }
      ],
      actions: actions.map(action => ({
        id: action.id,
        title: action.title,
        description: action.description,
        priority: action.priority,
        effort: action.effort,
        impact: action.expectedImpact,
        timeframe: action.timeframe,
        category: action.category,
        position: {
          x: this.effortToNumber(action.effort),
          y: this.impactToNumber(action.expectedImpact)
        },
        quadrant: this.determineActionQuadrant(action.effort, action.expectedImpact)
      }))
    };

    return {
      type: 'matrix',
      title: 'Action Priority Matrix',
      description: 'Priority matrix showing recommended actions plotted by effort required vs expected impact',
      data: matrixData,
      config: {
        width: 700,
        height: 500,
        interactive: true,
        colors: ['#4CAF50', '#2196F3', '#FFC107', '#F44336'],
        responsive: true
      }
    };
  }

  /**
   * Create evidence network diagram
   */
  private createEvidenceNetworkDiagram(result: SWOTAnalysisResult): SWOTVisualization {
    const allItems = [
      ...result.swotAnalysis.strengths,
      ...result.swotAnalysis.weaknesses,
      ...result.swotAnalysis.opportunities,
      ...result.swotAnalysis.threats
    ];

    const nodes: any[] = [];
    const links: any[] = [];

    // Create nodes for SWOT items
    for (const item of allItems) {
      nodes.push({
        id: item.id,
        title: item.title,
        type: 'swot_item',
        category: this.getSWOTType(item, result),
        size: item.evidence.length * 5 + 10,
        color: this.getSWOTColor(item, result),
        confidence: item.confidence,
        impact: item.impact
      });

      // Create nodes for evidence sources
      for (const evidence of item.evidence) {
        const evidenceId = `evidence_${evidence.source}_${evidence.type}`;
        
        // Add evidence node if not already exists
        if (!nodes.find(n => n.id === evidenceId)) {
          nodes.push({
            id: evidenceId,
            title: `${evidence.source} (${evidence.type})`,
            type: 'evidence',
            category: evidence.type,
            size: 8,
            color: this.getEvidenceColor(evidence.type),
            relevance: evidence.relevanceScore
          });
        }

        // Create link between SWOT item and evidence
        links.push({
          source: item.id,
          target: evidenceId,
          strength: evidence.relevanceScore,
          type: 'evidence_link'
        });
      }
    }

    // Create links between related SWOT items
    for (const item of allItems) {
      if (item.relatedItems) {
        for (const relatedId of item.relatedItems) {
          if (allItems.find(i => i.id === relatedId)) {
            links.push({
              source: item.id,
              target: relatedId,
              strength: 0.5,
              type: 'relationship_link'
            });
          }
        }
      }
    }

    const networkData = {
      nodes,
      links,
      layout: {
        type: 'force',
        iterations: 300,
        linkDistance: 100,
        nodeStrength: -300
      },
      interactions: {
        drag: true,
        zoom: true,
        hover: true,
        filter: true
      }
    };

    return {
      type: 'network',
      title: 'SWOT Evidence Network',
      description: 'Network diagram showing relationships between SWOT items and their supporting evidence',
      data: networkData,
      config: {
        width: 900,
        height: 600,
        interactive: true,
        responsive: true,
        legend: true
      }
    };
  }

  /**
   * Create sentiment theme heatmap
   */
  private createSentimentThemeHeatmap(textInsights: any): SWOTVisualization {
    const themes = textInsights.topThemes || [];
    
    const heatmapData = {
      data: themes.map((theme: any, index: number) => ({
        x: index,
        y: this.sentimentToNumber(theme.sentiment),
        value: theme.frequency,
        theme: theme.theme,
        sentiment: theme.sentiment,
        frequency: theme.frequency
      })),
      axes: {
        x: {
          title: 'Themes',
          labels: themes.map((theme: any) => theme.theme)
        },
        y: {
          title: 'Sentiment',
          labels: ['Negative', 'Neutral', 'Positive']
        }
      },
      colorScale: {
        min: 0,
        max: Math.max(...themes.map((t: any) => t.frequency), 1),
        colors: this.colorSchemes.sentiment
      }
    };

    return {
      type: 'heatmap',
      title: 'Customer Feedback Theme Analysis',
      description: 'Heatmap showing frequency and sentiment of themes mentioned in customer reviews',
      data: heatmapData,
      config: {
        width: 800,
        height: 400,
        interactive: true,
        responsive: true,
        tooltip: true
      }
    };
  }

  /**
   * Create image content distribution
   */
  private createImageContentDistribution(imageInsights: any): SWOTVisualization {
    const contentDistribution = imageInsights.contentDistribution || {};
    
    const pieData = {
      labels: Object.keys(contentDistribution).map(key => this.formatContentLabel(key)),
      datasets: [{
        data: Object.values(contentDistribution).map((value: any) => Math.round(value * 100)),
        backgroundColor: this.colorSchemes.category.slice(0, Object.keys(contentDistribution).length),
        borderColor: '#ffffff',
        borderWidth: 2
      }],
      total: Object.values(contentDistribution).reduce((sum: number, value: any) => sum + value, 0)
    };

    return {
      type: 'chart',
      title: 'Visual Content Distribution',
      description: 'Distribution of different types of visual content (food, interior, exterior, etc.)',
      data: pieData,
      config: {
        width: 500,
        height: 400,
        interactive: true,
        responsive: true,
        legend: true,
        tooltip: true
      },
      vendorConfig: {
        library: 'chartjs',
        chartType: 'pie'
      }
    };
  }

  /**
   * Create business health radar chart
   */
  private createBusinessHealthRadar(result: SWOTAnalysisResult): SWOTVisualization {
    const categories = ['operational', 'marketing', 'financial', 'strategic', 'customer', 'competitive'];
    
    const categoryScores = categories.map(category => {
      const categoryItems = [
        ...result.swotAnalysis.strengths,
        ...result.swotAnalysis.weaknesses,
        ...result.swotAnalysis.opportunities,
        ...result.swotAnalysis.threats
      ].filter(item => item.category === category);

      if (categoryItems.length === 0) return 50; // Neutral score

      // Calculate weighted score based on SWOT type and impact
      let totalScore = 0;
      let totalWeight = 0;

      for (const item of categoryItems) {
        const swotType = this.getSWOTType(item, result);
        const impactWeight = this.impactToNumber(item.impact);
        const confidenceWeight = item.confidence;
        
        let itemScore = 50; // Neutral base
        if (swotType === 'strength') itemScore = 80;
        else if (swotType === 'opportunity') itemScore = 70;
        else if (swotType === 'weakness') itemScore = 30;
        else if (swotType === 'threat') itemScore = 20;

        const weight = impactWeight * confidenceWeight;
        totalScore += itemScore * weight;
        totalWeight += weight;
      }

      return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
    });

    const radarData = {
      labels: categories.map(cat => this.formatCategoryLabel(cat)),
      datasets: [{
        label: 'Business Health Score',
        data: categoryScores,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
      }],
      scale: {
        min: 0,
        max: 100,
        stepSize: 20
      }
    };

    return {
      type: 'chart',
      title: 'Business Health Radar',
      description: 'Radar chart showing business health across different categories based on SWOT analysis',
      data: radarData,
      config: {
        width: 600,
        height: 600,
        interactive: true,
        responsive: true,
        legend: true
      },
      vendorConfig: {
        library: 'chartjs',
        chartType: 'radar'
      }
    };
  }

  /**
   * Helper methods
   */
  private formatMatrixItem(item: SWOTItem): any {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      confidence: Math.round(item.confidence * 100),
      impact: item.impact,
      category: item.category,
      evidenceCount: item.evidence.length,
      size: this.calculateItemSize(item),
      priority: this.calculateItemPriority(item)
    };
  }

  private calculateItemSize(item: SWOTItem): number {
    const baseSize = 20;
    const confidenceBonus = item.confidence * 15;
    const impactBonus = this.impactToNumber(item.impact) * 5;
    const evidenceBonus = Math.min(item.evidence.length * 3, 15);
    
    return Math.round(baseSize + confidenceBonus + impactBonus + evidenceBonus);
  }

  private calculateItemPriority(item: SWOTItem): 'low' | 'medium' | 'high' {
    const score = item.confidence * this.impactToNumber(item.impact);
    
    if (score >= 2.5) return 'high';
    if (score >= 1.5) return 'medium';
    return 'low';
  }

  private impactToNumber(impact: 'low' | 'medium' | 'high'): number {
    switch (impact) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  private effortToNumber(effort: 'low' | 'medium' | 'high'): number {
    switch (effort) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  private sentimentToNumber(sentiment: 'positive' | 'negative' | 'neutral'): number {
    switch (sentiment) {
      case 'positive': return 2;
      case 'neutral': return 1;
      case 'negative': return 0;
      default: return 1;
    }
  }

  private getSWOTType(item: SWOTItem, result: SWOTAnalysisResult): string {
    if (result.swotAnalysis.strengths.includes(item as any)) return 'strength';
    if (result.swotAnalysis.weaknesses.includes(item as any)) return 'weakness';
    if (result.swotAnalysis.opportunities.includes(item as any)) return 'opportunity';
    if (result.swotAnalysis.threats.includes(item as any)) return 'threat';
    return 'unknown';
  }

  private getSWOTColor(item: SWOTItem, result: SWOTAnalysisResult): string {
    const type = this.getSWOTType(item, result);
    const colorMap = {
      strength: this.colorSchemes.swot[0],
      weakness: this.colorSchemes.swot[1],
      opportunity: this.colorSchemes.swot[2],
      threat: this.colorSchemes.swot[3]
    };
    return colorMap[type as keyof typeof colorMap] || '#666666';
  }

  private getEvidenceColor(evidenceType: string): string {
    const colorMap = {
      review: '#4CAF50',
      image: '#2196F3',
      metric: '#FF9800',
      trend: '#9C27B0'
    };
    return colorMap[evidenceType as keyof typeof colorMap] || '#666666';
  }

  private determineActionQuadrant(effort: string, impact: string): string {
    if (impact === 'high' && effort === 'low') return 'quick-wins';
    if (impact === 'high' && effort === 'high') return 'major-projects';
    if (impact === 'low' && effort === 'low') return 'fill-ins';
    if (impact === 'low' && effort === 'high') return 'thankless-tasks';
    return 'fill-ins'; // Default
  }

  private aggregateSWOTTypes(types: string[]): { [key: string]: number } {
    const counts: { [key: string]: number } = {};
    for (const type of types) {
      counts[type] = (counts[type] || 0) + 1;
    }
    return counts;
  }

  private formatContentLabel(key: string): string {
    const labelMap = {
      hasFood: 'Food Photos',
      hasInterior: 'Interior Photos',
      hasExterior: 'Exterior Photos',
      hasPeople: 'People Photos',
      hasMenu: 'Menu Photos'
    };
    return labelMap[key as keyof typeof labelMap] || key;
  }

  private formatCategoryLabel(category: string): string {
    const labelMap = {
      operational: 'Operations',
      marketing: 'Marketing',
      financial: 'Financial',
      strategic: 'Strategic',
      customer: 'Customer',
      competitive: 'Competitive'
    };
    return labelMap[category as keyof typeof labelMap] || category;
  }
}