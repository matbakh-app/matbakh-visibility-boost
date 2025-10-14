/**
 * GDPR Compliance Dashboard
 * 
 * React component for displaying GDPR compliance status and detailed reports.
 * Provides real-time compliance monitoring and actionable insights.
 */

import React, { useEffect, useState } from 'react';
import { GDPRComplianceReport, GDPRComplianceValidator } from '../../lib/compliance/gdpr-compliance-validator';

interface GDPRComplianceDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const GDPRComplianceDashboard: React.FC<GDPRComplianceDashboardProps> = ({
  className = '',
  autoRefresh = false,
  refreshInterval = 300000 // 5 minutes
}) => {
  const [report, setReport] = useState<GDPRComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [validator] = useState(() => new GDPRComplianceValidator());

  useEffect(() => {
    loadComplianceReport();

    if (autoRefresh) {
      const interval = setInterval(loadComplianceReport, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const loadComplianceReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const newReport = await validator.validateCompliance();
      setReport(newReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load compliance report');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'non_compliant': return 'text-red-600 bg-red-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'not_applicable': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return '✅';
      case 'non_compliant': return '❌';
      case 'partial': return '⚠️';
      case 'not_applicable': return '➖';
      default: return '❓';
    }
  };

  const getCategoryDisplayName = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getFilteredChecks = () => {
    if (!report) return [];
    if (selectedCategory === 'all') return report.checks;
    return report.checks.filter(check => check.category === selectedCategory);
  };

  const downloadReport = async () => {
    try {
      const markdown = await validator.generateComplianceReport();
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdpr-compliance-report-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download report');
    }
  };

  const exportData = async () => {
    try {
      const data = await validator.exportComplianceData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdpr-compliance-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button
            onClick={loadComplianceReport}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">No compliance report available</div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">GDPR Compliance Dashboard</h1>
          <p className="text-gray-600">Last updated: {report.timestamp.toLocaleString()}</p>
        </div>
        <div className="space-x-2">
          <button
            onClick={loadComplianceReport}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Refresh
          </button>
          <button
            onClick={downloadReport}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Download Report
          </button>
          <button
            onClick={exportData}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Export Data
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Overall Compliance Status</h2>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.overallStatus)}`}>
              {getStatusIcon(report.overallStatus)} {report.overallStatus.toUpperCase()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{report.complianceScore}%</div>
            <div className="text-sm text-gray-600">Compliance Score</div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{report.compliantChecks}</div>
            <div className="text-sm text-gray-600">Compliant</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{report.nonCompliantChecks}</div>
            <div className="text-sm text-gray-600">Non-Compliant</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{report.partialChecks}</div>
            <div className="text-sm text-gray-600">Partial</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{report.notApplicableChecks}</div>
            <div className="text-sm text-gray-600">Not Applicable</div>
          </div>
        </div>
      </div>

      {/* Category Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Compliance by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(report.summary).map(([category, summary]) => (
            <div key={category} className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900">{getCategoryDisplayName(category)}</h3>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-900">{summary.score}%</div>
                <div className="text-sm text-gray-600">{summary.compliant}/{summary.total} compliant</div>
                {summary.criticalIssues.length > 0 && (
                  <div className="mt-2 text-xs text-red-600">
                    {summary.criticalIssues.length} critical issue(s)
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Detailed Checks */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Detailed Compliance Checks</h2>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Categories</option>
            <option value="data_processing">Data Processing</option>
            <option value="data_storage">Data Storage</option>
            <option value="user_rights">User Rights</option>
            <option value="consent">Consent</option>
            <option value="security">Security</option>
            <option value="ai_operations">AI Operations</option>
          </select>
        </div>

        <div className="space-y-4">
          {getFilteredChecks().map((check) => (
            <div key={check.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon(check.status)}</span>
                    <h3 className="font-medium text-gray-900">{check.title}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {getCategoryDisplayName(check.category)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{check.description}</p>
                  <p className="text-xs text-gray-500 mt-1"><strong>Requirement:</strong> {check.requirement}</p>
                  <p className="text-sm text-gray-700 mt-2"><strong>Implementation:</strong> {check.implementation}</p>
                  
                  {check.evidence.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700">Evidence:</p>
                      <ul className="text-xs text-gray-600 list-disc list-inside">
                        {check.evidence.map((evidence, index) => (
                          <li key={index}>{evidence}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {check.recommendations && check.recommendations.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700">Recommendations:</p>
                      <ul className="text-xs text-gray-600 list-disc list-inside">
                        {check.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}>
                  {check.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h2>
          <ul className="space-y-2">
            {report.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};