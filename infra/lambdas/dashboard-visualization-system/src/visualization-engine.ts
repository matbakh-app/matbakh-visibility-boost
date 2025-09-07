/**
 * Visualization Engine
 * Handles chart generation, rendering, and export functionality
 */
import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import * as d3 from 'd3';
import { 
  VisualizationConfig, 
  VisualizationRequest, 
  VisualizationResponse,
  DashboardWidget,
  ExportFormat,
  RenderOptions 
} from './types';

export class VisualizationEngine {
  private defaultWidth = 800;
  private defaultHeight = 600;
  private defaultDpi = 96;

  /**
   * Render visualization
   */
  async renderVisualization(
    widget: DashboardWidget,
    data: any[],
    options?: RenderOptions
  ): Promise<VisualizationResponse> {
    const startTime = Date.now();

    try {
      const renderOptions = {
        width: options?.width || this.defaultWidth,
        height: options?.height || this.defaultHeight,
        dpi: options?.dpi || this.defaultDpi,
        quality: options?.quality || 0.9,
        background: options?.background || '#ffffff',
        theme: options?.theme || 'default',
      };

      let result: string;
      let contentType: string;

      switch (widget.type) {
        case 'line_chart':
        case 'bar_chart':
        case 'pie_chart':
        case 'donut_chart':
        case 'area_chart':
          result = await this.renderChartJS(widget, data, renderOptions);
          contentType = 'image/png';
          break;

        case 'scatter_plot':
        case 'heatmap':
        case 'treemap':
        case 'sankey':
          result = await this.renderD3Visualization(widget, data, renderOptions);
          contentType = 'image/svg+xml';
          break;

        case 'table':
          result = await this.renderTable(widget, data, renderOptions);
          contentType = 'text/html';
          break;

        case 'metric_card':
          result = await this.renderMetricCard(widget, data, renderOptions);
          contentType = 'image/png';
          break;

        case 'gauge':
          result = await this.renderGauge(widget, data, renderOptions);
          contentType = 'image/svg+xml';
          break;

        case 'map':
          result = await this.renderMap(widget, data, renderOptions);
          contentType = 'image/png';
          break;

        default:
          throw new Error(`Unsupported widget type: ${widget.type}`);
      }

      const renderTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        contentType,
        size: Buffer.byteLength(result, 'base64'),
        metadata: {
          renderTime,
          cacheHit: false,
          dataPoints: data.length,
        },
      };
    } catch (error) {
      console.error('Visualization rendering failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          renderTime: Date.now() - startTime,
          cacheHit: false,
          dataPoints: data.length,
        },
      };
    }
  }

  /**
   * Export visualization
   */
  async exportVisualization(
    widget: DashboardWidget,
    data: any[],
    format: ExportFormat,
    options?: RenderOptions
  ): Promise<VisualizationResponse> {
    try {
      switch (format) {
        case 'png':
        case 'svg':
          return await this.renderVisualization(widget, data, options);

        case 'pdf':
          return await this.exportToPDF(widget, data, options);

        case 'csv':
          return await this.exportToCSV(data);

        case 'excel':
          return await this.exportToExcel(data);

        case 'json':
          return await this.exportToJSON(data);

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Render Chart.js visualizations
   */
  private async renderChartJS(
    widget: DashboardWidget,
    data: any[],
    options: RenderOptions
  ): Promise<string> {
    const canvas = createCanvas(options.width!, options.height!);
    const ctx = canvas.getContext('2d') as any;

    // Configure Chart.js for server-side rendering
    const chartConfig = this.buildChartJSConfig(widget, data);

    // Create chart
    const chart = new Chart(ctx, chartConfig);

    // Wait for chart to render
    await new Promise(resolve => setTimeout(resolve, 100));

    // Convert to base64
    const buffer = canvas.toBuffer('image/png');
    return buffer.toString('base64');
  }

  /**
   * Render D3 visualizations
   */
  private async renderD3Visualization(
    widget: DashboardWidget,
    data: any[],
    options: RenderOptions
  ): Promise<string> {
    const svg = d3.create('svg')
      .attr('width', options.width)
      .attr('height', options.height)
      .attr('viewBox', `0 0 ${options.width} ${options.height}`)
      .style('background', options.background);

    switch (widget.type) {
      case 'scatter_plot':
        this.renderD3ScatterPlot(svg, data, widget.visualization, options);
        break;
      case 'heatmap':
        this.renderD3Heatmap(svg, data, widget.visualization, options);
        break;
      case 'treemap':
        this.renderD3Treemap(svg, data, widget.visualization, options);
        break;
      case 'sankey':
        this.renderD3Sankey(svg, data, widget.visualization, options);
        break;
    }

    return Buffer.from(svg.node()!.outerHTML).toString('base64');
  }

  /**
   * Render table
   */
  private async renderTable(
    widget: DashboardWidget,
    data: any[],
    options: RenderOptions
  ): Promise<string> {
    const { formatting } = widget.visualization;
    
    let html = `
      <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #f5f5f5;">
    `;

    // Headers
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      for (const header of headers) {
        html += `<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${header}</th>`;
      }
    }

    html += `
          </tr>
        </thead>
        <tbody>
    `;

    // Rows
    for (const row of data) {
      html += '<tr>';
      for (const [key, value] of Object.entries(row)) {
        const formattedValue = this.formatValue(value, formatting);
        html += `<td style="border: 1px solid #ddd; padding: 8px;">${formattedValue}</td>`;
      }
      html += '</tr>';
    }

    html += `
        </tbody>
      </table>
    `;

    return Buffer.from(html).toString('base64');
  }

  /**
   * Render metric card
   */
  private async renderMetricCard(
    widget: DashboardWidget,
    data: any[],
    options: RenderOptions
  ): Promise<string> {
    const canvas = createCanvas(options.width!, options.height!);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = options.background!;
    ctx.fillRect(0, 0, options.width!, options.height!);

    // Calculate metric value
    const value = this.calculateMetricValue(data, widget.visualization);
    const formattedValue = this.formatValue(value, widget.visualization.formatting);

    // Draw metric
    ctx.fillStyle = '#333';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(formattedValue, options.width! / 2, options.height! / 2);

    // Draw title
    ctx.font = '16px Arial';
    ctx.fillText(widget.title, options.width! / 2, options.height! / 2 + 40);

    const buffer = canvas.toBuffer('image/png');
    return buffer.toString('base64');
  }

  /**
   * Render gauge
   */
  private async renderGauge(
    widget: DashboardWidget,
    data: any[],
    options: RenderOptions
  ): Promise<string> {
    const svg = d3.create('svg')
      .attr('width', options.width)
      .attr('height', options.height)
      .attr('viewBox', `0 0 ${options.width} ${options.height}`);

    const centerX = options.width! / 2;
    const centerY = options.height! / 2;
    const radius = Math.min(options.width!, options.height!) / 3;

    const value = this.calculateMetricValue(data, widget.visualization);
    const maxValue = 100; // This should come from widget config
    const angle = (value / maxValue) * Math.PI;

    // Background arc
    const arc = d3.arc()
      .innerRadius(radius - 20)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);

    svg.append('path')
      .attr('d', arc as any)
      .attr('transform', `translate(${centerX}, ${centerY})`)
      .attr('fill', '#e0e0e0');

    // Value arc
    const valueArc = d3.arc()
      .innerRadius(radius - 20)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(-Math.PI / 2 + angle);

    svg.append('path')
      .attr('d', valueArc as any)
      .attr('transform', `translate(${centerX}, ${centerY})`)
      .attr('fill', '#4CAF50');

    // Value text
    svg.append('text')
      .attr('x', centerX)
      .attr('y', centerY + 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .text(this.formatValue(value, widget.visualization.formatting));

    return Buffer.from(svg.node()!.outerHTML).toString('base64');
  }

  /**
   * Render map (placeholder implementation)
   */
  private async renderMap(
    widget: DashboardWidget,
    data: any[],
    options: RenderOptions
  ): Promise<string> {
    const canvas = createCanvas(options.width!, options.height!);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = options.background!;
    ctx.fillRect(0, 0, options.width!, options.height!);

    // Placeholder text
    ctx.fillStyle = '#666';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Map visualization', options.width! / 2, options.height! / 2);
    ctx.font = '16px Arial';
    ctx.fillText('(Implementation pending)', options.width! / 2, options.height! / 2 + 30);

    const buffer = canvas.toBuffer('image/png');
    return buffer.toString('base64');
  }

  /**
   * Build Chart.js configuration
   */
  private buildChartJSConfig(widget: DashboardWidget, data: any[]): ChartConfiguration {
    const { visualization } = widget;
    
    const config: ChartConfiguration = {
      type: this.mapWidgetTypeToChartJS(widget.type),
      data: {
        labels: data.map(d => d.label || d.x || d.category),
        datasets: visualization.series.map(series => ({
          label: series.label,
          data: data.map(d => d[series.field]),
          backgroundColor: series.color || visualization.colors.palette[0],
          borderColor: series.color || visualization.colors.palette[0],
          borderWidth: series.style?.lineWidth || 2,
          fill: series.style?.fillOpacity !== undefined ? series.style.fillOpacity > 0 : false,
        })),
      },
      options: {
        responsive: false,
        animation: {
          duration: visualization.animation.enabled ? visualization.animation.duration : 0,
        },
        plugins: {
          legend: {
            display: visualization.legend.enabled,
            position: visualization.legend.position as any,
          },
          tooltip: {
            enabled: visualization.tooltip.enabled,
          },
        },
        scales: this.buildChartJSScales(visualization),
      },
    };

    return config;
  }

  /**
   * Build Chart.js scales configuration
   */
  private buildChartJSScales(visualization: VisualizationConfig): any {
    const scales: any = {};

    for (const axis of visualization.axes) {
      const scaleConfig: any = {
        type: axis.scale,
        display: true,
        title: {
          display: !!axis.label,
          text: axis.label,
        },
        grid: {
          display: axis.grid,
        },
      };

      if (axis.min !== undefined) scaleConfig.min = axis.min;
      if (axis.max !== undefined) scaleConfig.max = axis.max;

      if (axis.ticks) {
        scaleConfig.ticks = {
          maxTicksLimit: axis.ticks.count,
          stepSize: axis.ticks.interval,
        };
      }

      scales[axis.type] = scaleConfig;
    }

    return scales;
  }

  /**
   * Map widget type to Chart.js type
   */
  private mapWidgetTypeToChartJS(widgetType: string): ChartType {
    const mapping: Record<string, ChartType> = {
      'line_chart': 'line',
      'bar_chart': 'bar',
      'pie_chart': 'pie',
      'donut_chart': 'doughnut',
      'area_chart': 'line',
    };

    return mapping[widgetType] || 'line';
  }

  /**
   * D3 visualization methods
   */
  private renderD3ScatterPlot(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    data: any[],
    visualization: VisualizationConfig,
    options: RenderOptions
  ): void {
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = options.width! - margin.left - margin.right;
    const height = options.height! - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.x) as [number, number])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.y) as [number, number])
      .range([height, 0]);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Points
    g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('r', 3.5)
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .style('fill', visualization.colors.palette[0]);
  }

  private renderD3Heatmap(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    data: any[],
    visualization: VisualizationConfig,
    options: RenderOptions
  ): void {
    // Heatmap implementation
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = options.width! - margin.left - margin.right;
    const height = options.height! - margin.top - margin.bottom;

    // This would be a full heatmap implementation
    // For now, just add a placeholder
    svg.append('text')
      .attr('x', options.width! / 2)
      .attr('y', options.height! / 2)
      .attr('text-anchor', 'middle')
      .text('Heatmap visualization');
  }

  private renderD3Treemap(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    data: any[],
    visualization: VisualizationConfig,
    options: RenderOptions
  ): void {
    // Treemap implementation placeholder
    svg.append('text')
      .attr('x', options.width! / 2)
      .attr('y', options.height! / 2)
      .attr('text-anchor', 'middle')
      .text('Treemap visualization');
  }

  private renderD3Sankey(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    data: any[],
    visualization: VisualizationConfig,
    options: RenderOptions
  ): void {
    // Sankey diagram implementation placeholder
    svg.append('text')
      .attr('x', options.width! / 2)
      .attr('y', options.height! / 2)
      .attr('text-anchor', 'middle')
      .text('Sankey visualization');
  }

  /**
   * Export methods
   */
  private async exportToPDF(
    widget: DashboardWidget,
    data: any[],
    options?: RenderOptions
  ): Promise<VisualizationResponse> {
    // PDF export would require additional libraries like puppeteer
    // For now, return a placeholder
    return {
      success: false,
      error: 'PDF export not yet implemented',
    };
  }

  private async exportToCSV(data: any[]): Promise<VisualizationResponse> {
    if (data.length === 0) {
      return {
        success: true,
        data: Buffer.from('').toString('base64'),
        contentType: 'text/csv',
      };
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          JSON.stringify(row[header] || '')
        ).join(',')
      )
    ].join('\n');

    return {
      success: true,
      data: Buffer.from(csvContent).toString('base64'),
      contentType: 'text/csv',
      size: Buffer.byteLength(csvContent),
    };
  }

  private async exportToExcel(data: any[]): Promise<VisualizationResponse> {
    // Excel export would require additional libraries
    return {
      success: false,
      error: 'Excel export not yet implemented',
    };
  }

  private async exportToJSON(data: any[]): Promise<VisualizationResponse> {
    const jsonContent = JSON.stringify(data, null, 2);
    
    return {
      success: true,
      data: Buffer.from(jsonContent).toString('base64'),
      contentType: 'application/json',
      size: Buffer.byteLength(jsonContent),
    };
  }

  /**
   * Utility methods
   */
  private calculateMetricValue(data: any[], visualization: VisualizationConfig): number {
    if (data.length === 0) return 0;

    // This would be more sophisticated based on the metric configuration
    const values = data.map(d => parseFloat(d.value || d.y || d.count || 0));
    return values.reduce((sum, val) => sum + val, 0);
  }

  private formatValue(value: any, formatting?: any): string {
    if (formatting?.numberFormat) {
      const { decimals, thousandsSeparator, decimalSeparator, prefix, suffix } = formatting.numberFormat;
      let formatted = parseFloat(value).toFixed(decimals);
      
      if (thousandsSeparator) {
        const parts = formatted.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
        formatted = parts.join(decimalSeparator || '.');
      }
      
      return `${prefix || ''}${formatted}${suffix || ''}`;
    }

    if (formatting?.currencyFormat) {
      const { currency, symbol, position } = formatting.currencyFormat;
      const formatted = parseFloat(value).toFixed(2);
      return position === 'before' ? `${symbol}${formatted}` : `${formatted}${symbol}`;
    }

    return String(value);
  }
}