import { AlertTriangle, Calendar, CheckCircle, Clock, Play, Users, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface DeploymentSchedule {
    id: string;
    scheduledTime: Date;
    deploymentType: 'hybrid-routing' | 'full-system' | 'rollback';
    requestedBy: string;
    approvedBy: string[];
    status: 'scheduled' | 'approved' | 'executing' | 'completed' | 'cancelled' | 'failed';
    environment: 'production';
    estimatedDuration: number;
    stakeholders: {
        name: string;
        email: string;
        role: string;
        approved: boolean;
        approvedAt?: Date;
    }[];
    preDeploymentChecks: {
        name: string;
        status: 'pending' | 'passed' | 'failed';
        lastChecked?: Date;
        details?: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

interface DeploymentSchedulerProps {
    onScheduleDeployment?: (deployment: Partial<DeploymentSchedule>) => void;
    onApproveDeployment?: (deploymentId: string, approverEmail: string) => void;
    onCancelDeployment?: (deploymentId: string, reason: string) => void;
    onExecuteDeployment?: (deploymentId: string) => void;
}

export const DeploymentScheduler: React.FC<DeploymentSchedulerProps> = ({
    onScheduleDeployment,
    onApproveDeployment,
    onCancelDeployment,
    onExecuteDeployment
}) => {
    const [deployments, setDeployments] = useState<DeploymentSchedule[]>([]);
    const [selectedDeployment, setSelectedDeployment] = useState<DeploymentSchedule | null>(null);
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({
        scheduledTime: '',
        deploymentType: 'hybrid-routing' as const,
        estimatedDuration: 240,
        description: ''
    });

    // Mock data for demonstration
    useEffect(() => {
        const mockDeployments: DeploymentSchedule[] = [
            {
                id: 'prod-deploy-1705123200000',
                scheduledTime: new Date('2025-01-15T02:00:00Z'),
                deploymentType: 'hybrid-routing',
                requestedBy: 'release-team@matbakh.app',
                approvedBy: ['engineering@matbakh.app'],
                status: 'scheduled',
                environment: 'production',
                estimatedDuration: 240,
                stakeholders: [
                    {
                        name: 'Release Team Lead',
                        email: 'release-team@matbakh.app',
                        role: 'deployment-lead',
                        approved: true,
                        approvedAt: new Date('2025-01-14T10:00:00Z')
                    },
                    {
                        name: 'Engineering Manager',
                        email: 'engineering@matbakh.app',
                        role: 'engineering-approval',
                        approved: true,
                        approvedAt: new Date('2025-01-14T11:00:00Z')
                    },
                    {
                        name: 'Security Officer',
                        email: 'security@matbakh.app',
                        role: 'security-approval',
                        approved: false
                    },
                    {
                        name: 'Operations Manager',
                        email: 'operations@matbakh.app',
                        role: 'operations-approval',
                        approved: false
                    },
                    {
                        name: 'CTO',
                        email: 'cto@matbakh.app',
                        role: 'executive-approval',
                        approved: false
                    }
                ],
                preDeploymentChecks: [
                    {
                        name: 'Infrastructure Readiness',
                        status: 'passed',
                        lastChecked: new Date('2025-01-14T09:00:00Z')
                    },
                    {
                        name: 'Code Quality Gates',
                        status: 'passed',
                        lastChecked: new Date('2025-01-14T09:30:00Z')
                    },
                    {
                        name: 'Security Validation',
                        status: 'pending'
                    },
                    {
                        name: 'Performance Testing',
                        status: 'passed',
                        lastChecked: new Date('2025-01-14T10:30:00Z')
                    },
                    {
                        name: 'Rollback Procedures',
                        status: 'passed',
                        lastChecked: new Date('2025-01-14T11:00:00Z')
                    },
                    {
                        name: 'Operations Team Readiness',
                        status: 'pending'
                    },
                    {
                        name: 'Monitoring and Alerting',
                        status: 'passed',
                        lastChecked: new Date('2025-01-14T11:30:00Z')
                    },
                    {
                        name: 'Stakeholder Approval',
                        status: 'pending',
                        details: 'Pending 3 approvals'
                    }
                ],
                createdAt: new Date('2025-01-14T08:00:00Z'),
                updatedAt: new Date('2025-01-14T11:30:00Z')
            }
        ];
        setDeployments(mockDeployments);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'text-yellow-600 bg-yellow-50';
            case 'approved': return 'text-green-600 bg-green-50';
            case 'executing': return 'text-blue-600 bg-blue-50';
            case 'completed': return 'text-green-700 bg-green-100';
            case 'cancelled': return 'text-gray-600 bg-gray-50';
            case 'failed': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'scheduled': return <Clock className="w-4 h-4" />;
            case 'approved': return <CheckCircle className="w-4 h-4" />;
            case 'executing': return <Play className="w-4 h-4" />;
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            case 'failed': return <AlertTriangle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const getCheckStatusColor = (status: string) => {
        switch (status) {
            case 'passed': return 'text-green-600';
            case 'failed': return 'text-red-600';
            case 'pending': return 'text-yellow-600';
            default: return 'text-gray-600';
        }
    };

    const handleScheduleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onScheduleDeployment) {
            onScheduleDeployment({
                scheduledTime: new Date(scheduleForm.scheduledTime),
                deploymentType: scheduleForm.deploymentType,
                estimatedDuration: scheduleForm.estimatedDuration,
                requestedBy: 'current-user@matbakh.app'
            });
        }
        setShowScheduleForm(false);
        setScheduleForm({
            scheduledTime: '',
            deploymentType: 'hybrid-routing',
            estimatedDuration: 240,
            description: ''
        });
    };

    const formatTimeUntil = (scheduledTime: Date) => {
        const now = new Date();
        const diff = scheduledTime.getTime() - now.getTime();

        if (diff < 0) return 'Past due';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-6 h-6" />
                        Production Deployment Scheduler
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Schedule and manage production deployments with approval workflows
                    </p>
                </div>
                <button
                    onClick={() => setShowScheduleForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Schedule Deployment
                </button>
            </div>

            {/* Schedule Form Modal */}
            {showScheduleForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Schedule New Deployment</h3>
                        <form onSubmit={handleScheduleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Scheduled Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={scheduleForm.scheduledTime}
                                    onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Deployment Type
                                </label>
                                <select
                                    value={scheduleForm.deploymentType}
                                    onChange={(e) => setScheduleForm(prev => ({ ...prev, deploymentType: e.target.value as any }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                >
                                    <option value="hybrid-routing">Hybrid Routing</option>
                                    <option value="full-system">Full System</option>
                                    <option value="rollback">Rollback</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estimated Duration (minutes)
                                </label>
                                <input
                                    type="number"
                                    value={scheduleForm.estimatedDuration}
                                    onChange={(e) => setScheduleForm(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    min="60"
                                    max="480"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={scheduleForm.description}
                                    onChange={(e) => setScheduleForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    rows={3}
                                    placeholder="Deployment description..."
                                />
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Schedule
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowScheduleForm(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Deployments List */}
            <div className="grid gap-6">
                {deployments.map((deployment) => (
                    <div key={deployment.id} className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deployment.status)}`}>
                                        {getStatusIcon(deployment.status)}
                                        {deployment.status.charAt(0).toUpperCase() + deployment.status.slice(1)}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {deployment.deploymentType}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {deployment.id}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Scheduled: {deployment.scheduledTime.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Time until: {formatTimeUntil(deployment.scheduledTime)}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                {deployment.status === 'approved' && (
                                    <button
                                        onClick={() => onExecuteDeployment?.(deployment.id)}
                                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                                    >
                                        Execute
                                    </button>
                                )}
                                {deployment.status === 'scheduled' && (
                                    <button
                                        onClick={() => onCancelDeployment?.(deployment.id, 'Manual cancellation')}
                                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Stakeholder Approvals */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Stakeholder Approvals ({deployment.stakeholders.filter(s => s.approved).length}/{deployment.stakeholders.length})
                                </h4>
                                <div className="space-y-2">
                                    {deployment.stakeholders.map((stakeholder, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{stakeholder.name}</p>
                                                <p className="text-xs text-gray-500">{stakeholder.role}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {stakeholder.approved ? (
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <Clock className="w-4 h-4 text-yellow-600" />
                                                )}
                                                {!stakeholder.approved && deployment.status === 'scheduled' && (
                                                    <button
                                                        onClick={() => onApproveDeployment?.(deployment.id, stakeholder.email)}
                                                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pre-deployment Checks */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Pre-deployment Checks ({deployment.preDeploymentChecks.filter(c => c.status === 'passed').length}/{deployment.preDeploymentChecks.length})
                                </h4>
                                <div className="space-y-2">
                                    {deployment.preDeploymentChecks.map((check, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{check.name}</p>
                                                {check.details && (
                                                    <p className="text-xs text-gray-500">{check.details}</p>
                                                )}
                                            </div>
                                            <span className={`text-xs font-medium ${getCheckStatusColor(check.status)}`}>
                                                {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Deployment Details */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Requested by</p>
                                    <p className="font-medium">{deployment.requestedBy}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Duration</p>
                                    <p className="font-medium">{deployment.estimatedDuration} minutes</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Environment</p>
                                    <p className="font-medium">{deployment.environment}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Last updated</p>
                                    <p className="font-medium">{deployment.updatedAt.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {deployments.length === 0 && (
                <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No deployments scheduled</h3>
                    <p className="text-gray-600 mb-4">Schedule your first production deployment to get started.</p>
                    <button
                        onClick={() => setShowScheduleForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Schedule Deployment
                    </button>
                </div>
            )}
        </div>
    );
};

export default DeploymentScheduler;