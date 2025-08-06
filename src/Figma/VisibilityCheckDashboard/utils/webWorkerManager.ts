interface WorkerTask {
  id: string;
  type: 'swot-analysis' | 'scorecard-calculation' | 'trend-analysis' | 'competitor-ranking';
  data: any;
  priority: 'high' | 'normal' | 'low';
  resolve: (result: any) => void;
  reject: (error: any) => void;
  startTime: number;
}

class WebWorkerManager {
  private workers: Map<string, Worker> = new Map();
  private taskQueue: WorkerTask[] = [];
  private activeTasks: Map<string, WorkerTask> = new Map();
  private maxWorkers = navigator.hardwareConcurrency || 4;
  private isProcessing = false;

  constructor() {
    this.initializeWorkers();
  }

  private initializeWorkers() {
    // Create worker for heavy computations
    const workerCode = `
      // SWOT Analysis Worker
      self.addEventListener('message', (event) => {
        const { id, type, data } = event.data;
        
        try {
          let result;
          
          switch (type) {
            case 'swot-analysis':
              result = performSWOTAnalysis(data);
              break;
            case 'scorecard-calculation':
              result = calculateBalancedScorecard(data);
              break;
            case 'trend-analysis':
              result = analyzeTrends(data);
              break;
            case 'competitor-ranking':
              result = calculateCompetitorRanking(data);
              break;
            default:
              throw new Error('Unknown task type: ' + type);
          }
          
          self.postMessage({ id, result, success: true });
        } catch (error) {
          self.postMessage({ id, error: error.message, success: false });
        }
      });

      // SWOT Analysis Implementation
      function performSWOTAnalysis(data) {
        const { metrics, competitors, trends, cultural } = data;
        
        const strengths = [];
        const weaknesses = [];
        const opportunities = [];
        const threats = [];
        
        // Analyze strengths
        if (metrics.rating > 4.0) strengths.push('Hohe Kundenzufriedenheit');
        if (metrics.reviewVelocity > competitors.avgReviewVelocity) strengths.push('Aktive Community');
        if (metrics.visibilityScore > 80) strengths.push('Starke Online-Präsenz');
        
        // Analyze weaknesses
        if (metrics.rating < competitors.avgRating) weaknesses.push('Bewertungen unter Durchschnitt');
        if (metrics.orderVolume < competitors.avgOrderVolume) weaknesses.push('Niedrigere Bestellfrequenz');
        
        // Analyze opportunities
        if (cultural.targetGroupCoverage < 80) opportunities.push('Zielgruppen-Expansion');
        if (trends.mobileTraffic > trends.desktopTraffic) opportunities.push('Mobile-First Strategie');
        
        // Analyze threats
        competitors.nearby.forEach(comp => {
          if (comp.rating > metrics.rating && comp.distance < 500) {
            threats.push(\`Starke Konkurrenz: \${comp.name}\`);
          }
        });
        
        return {
          strengths: strengths.slice(0, 6),
          weaknesses: weaknesses.slice(0, 6),
          opportunities: opportunities.slice(0, 6),
          threats: threats.slice(0, 6),
          calculatedAt: Date.now()
        };
      }

      // Balanced Scorecard Implementation
      function calculateBalancedScorecard(data) {
        const { financial, customer, process, learning } = data;
        
        const perspectives = {
          financial: {
            name: 'Finanzielle Perspektive',
            score: calculatePerspectiveScore([
              { metric: 'Umsatz', value: financial.revenue, target: financial.revenueTarget, weight: 0.4 },
              { metric: 'Gewinn', value: financial.profit, target: financial.profitTarget, weight: 0.3 },
              { metric: 'Kosten', value: financial.costs, target: financial.costTarget, weight: 0.3, inverse: true }
            ])
          },
          customer: {
            name: 'Kundenperspektive',
            score: calculatePerspectiveScore([
              { metric: 'Kundenzufriedenheit', value: customer.satisfaction, target: customer.satisfactionTarget, weight: 0.4 },
              { metric: 'Kundenbindung', value: customer.retention, target: customer.retentionTarget, weight: 0.3 },
              { metric: 'Neukunden', value: customer.acquisition, target: customer.acquisitionTarget, weight: 0.3 }
            ])
          },
          process: {
            name: 'Prozessperspektive',
            score: calculatePerspectiveScore([
              { metric: 'Servicequalität', value: process.serviceQuality, target: process.serviceQualityTarget, weight: 0.5 },
              { metric: 'Effizienz', value: process.efficiency, target: process.efficiencyTarget, weight: 0.5 }
            ])
          },
          learning: {
            name: 'Lern- und Entwicklungsperspektive',
            score: calculatePerspectiveScore([
              { metric: 'Mitarbeiterzufriedenheit', value: learning.employeeSatisfaction, target: learning.employeeSatisfactionTarget, weight: 0.6 },
              { metric: 'Weiterbildung', value: learning.training, target: learning.trainingTarget, weight: 0.4 }
            ])
          }
        };
        
        const overallScore = Object.values(perspectives).reduce((sum, p) => sum + p.score, 0) / 4;
        
        return {
          perspectives,
          overallScore,
          calculatedAt: Date.now()
        };
      }

      function calculatePerspectiveScore(metrics) {
        let weightedScore = 0;
        
        metrics.forEach(metric => {
          let achievement;
          if (metric.inverse) {
            achievement = Math.max(0, Math.min(100, ((metric.target - metric.value) / metric.target) * 100));
          } else {
            achievement = Math.max(0, Math.min(100, (metric.value / metric.target) * 100));
          }
          weightedScore += achievement * metric.weight;
        });
        
        return Math.round(weightedScore);
      }

      // Trend Analysis Implementation
      function analyzeTrends(data) {
        const { timeSeries, competitors } = data;
        
        const trends = [];
        
        // Analyze revenue trend
        const revenueGrowth = calculateGrowthRate(timeSeries.revenue);
        trends.push({
          metric: 'Umsatzentwicklung',
          growth: revenueGrowth,
          status: revenueGrowth > 5 ? 'positive' : revenueGrowth < -5 ? 'negative' : 'stable',
          forecast: forecastNextPeriod(timeSeries.revenue)
        });
        
        // Analyze rating trend
        const ratingTrend = calculateTrendDirection(timeSeries.ratings);
        trends.push({
          metric: 'Bewertungstrend',
          direction: ratingTrend,
          status: ratingTrend > 0 ? 'improving' : ratingTrend < 0 ? 'declining' : 'stable'
        });
        
        return {
          trends,
          insights: generateInsights(trends),
          calculatedAt: Date.now()
        };
      }

      function calculateGrowthRate(values) {
        if (values.length < 2) return 0;
        const first = values[0];
        const last = values[values.length - 1];
        return ((last - first) / first) * 100;
      }

      function calculateTrendDirection(values) {
        if (values.length < 3) return 0;
        
        let positive = 0, negative = 0;
        for (let i = 1; i < values.length; i++) {
          if (values[i] > values[i-1]) positive++;
          else if (values[i] < values[i-1]) negative++;
        }
        
        return positive - negative;
      }

      function forecastNextPeriod(values) {
        // Simple linear regression forecast
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
        const sumX2 = values.reduce((sum, _, i) => sum + (i * i), 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return Math.round(slope * n + intercept);
      }

      function generateInsights(trends) {
        const insights = [];
        
        trends.forEach(trend => {
          if (trend.status === 'positive') {
            insights.push(\`\${trend.metric}: Positive Entwicklung erkannt\`);
          } else if (trend.status === 'negative') {
            insights.push(\`\${trend.metric}: Handlungsbedarf identifiziert\`);
          }
        });
        
        return insights;
      }

      // Competitor Ranking Implementation
      function calculateCompetitorRanking(data) {
        const { competitors, weights } = data;
        
        return competitors.map(comp => ({
          ...comp,
          score: calculateCompetitorScore(comp, weights),
          rank: 0 // Will be set after sorting
        }))
        .sort((a, b) => b.score - a.score)
        .map((comp, index) => ({
          ...comp,
          rank: index + 1
        }));
      }

      function calculateCompetitorScore(competitor, weights) {
        let score = 0;
        score += competitor.rating * weights.rating;
        score += (competitor.reviewCount / 100) * weights.reviews;
        score += competitor.visibilityScore * weights.visibility;
        score -= (competitor.distance / 1000) * weights.proximity; // Closer is better
        return Math.round(score * 10) / 10;
      }
    `;

    // Create blob and worker
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);

    for (let i = 0; i < Math.min(this.maxWorkers, 2); i++) {
      const worker = new Worker(workerUrl);
      const workerId = `worker-${i}`;
      
      worker.addEventListener('message', (event) => {
        this.handleWorkerMessage(workerId, event);
      });

      worker.addEventListener('error', (error) => {
        console.error(`Worker ${workerId} error:`, error);
      });

      this.workers.set(workerId, worker);
    }

    // Clean up blob URL
    URL.revokeObjectURL(workerUrl);
  }

  private handleWorkerMessage(workerId: string, event: MessageEvent) {
    const { id, result, error, success } = event.data;
    const task = this.activeTasks.get(id);
    
    if (task) {
      this.activeTasks.delete(id);
      
      if (success) {
        // Track performance
        const duration = Date.now() - task.startTime;
        this.trackPerformance(task.type, duration);
        
        task.resolve(result);
      } else {
        task.reject(new Error(error));
      }
      
      // Process next task
      this.processNextTask();
    }
  }

  async executeTask<T>(
    type: WorkerTask['type'],
    data: any,
    priority: WorkerTask['priority'] = 'normal'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        id: Date.now().toString() + Math.random().toString(36),
        type,
        data,
        priority,
        resolve,
        reject,
        startTime: Date.now()
      };

      // Add to queue with priority
      if (priority === 'high') {
        this.taskQueue.unshift(task);
      } else {
        this.taskQueue.push(task);
      }

      this.processNextTask();
    });
  }

  private processNextTask() {
    if (this.taskQueue.length === 0 || this.activeTasks.size >= this.workers.size) {
      return;
    }

    const task = this.taskQueue.shift();
    if (!task) return;

    // Find available worker
    for (const [workerId, worker] of this.workers) {
      const isWorkerBusy = Array.from(this.activeTasks.values())
        .some(activeTask => activeTask.id === workerId);
      
      if (!isWorkerBusy) {
        this.activeTasks.set(task.id, task);
        worker.postMessage({
          id: task.id,
          type: task.type,
          data: task.data
        });
        break;
      }
    }
  }

  private trackPerformance(type: string, duration: number) {
    // Track performance metrics
    const metrics = {
      taskType: type,
      duration,
      timestamp: Date.now()
    };

    // Store in performance log
    const perfLog = JSON.parse(localStorage.getItem('worker-performance') || '[]');
    perfLog.push(metrics);
    
    // Keep only last 100 entries
    if (perfLog.length > 100) {
      perfLog.splice(0, perfLog.length - 100);
    }
    
    localStorage.setItem('worker-performance', JSON.stringify(perfLog));

    // Send to analytics
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Worker Task Completed', metrics);
    }
  }

  getPerformanceStats() {
    const perfLog = JSON.parse(localStorage.getItem('worker-performance') || '[]');
    
    if (perfLog.length === 0) {
      return null;
    }

    const stats = {};
    
    perfLog.forEach(entry => {
      if (!stats[entry.taskType]) {
        stats[entry.taskType] = {
          count: 0,
          totalDuration: 0,
          minDuration: Infinity,
          maxDuration: 0
        };
      }
      
      const taskStats = stats[entry.taskType];
      taskStats.count++;
      taskStats.totalDuration += entry.duration;
      taskStats.minDuration = Math.min(taskStats.minDuration, entry.duration);
      taskStats.maxDuration = Math.max(taskStats.maxDuration, entry.duration);
    });

    // Calculate averages
    Object.keys(stats).forEach(taskType => {
      const taskStats = stats[taskType];
      taskStats.avgDuration = Math.round(taskStats.totalDuration / taskStats.count);
    });

    return stats;
  }

  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers.clear();
    this.taskQueue.length = 0;
    this.activeTasks.clear();
  }
}

// Global instance
export const webWorkerManager = new WebWorkerManager();

// Convenience functions
export const computeSWOTAnalysis = (data: any) => 
  webWorkerManager.executeTask('swot-analysis', data, 'high');

export const computeBalancedScorecard = (data: any) => 
  webWorkerManager.executeTask('scorecard-calculation', data, 'high');

export const analyzeTrends = (data: any) => 
  webWorkerManager.executeTask('trend-analysis', data, 'normal');

export const rankCompetitors = (data: any) => 
  webWorkerManager.executeTask('competitor-ranking', data, 'normal');