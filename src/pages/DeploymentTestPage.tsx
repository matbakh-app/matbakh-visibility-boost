/**
 * Deployment Test Page - Demo page for testing deployment automation
 */

import { DeploymentDashboard } from '@/components/deployment/DeploymentDashboard';
import React from 'react';

export const DeploymentTestPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto py-8">
                <DeploymentDashboard />
            </div>
        </div>
    );
};