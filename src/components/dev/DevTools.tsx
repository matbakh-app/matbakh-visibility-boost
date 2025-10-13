import { isDevelopment, memoryDebug, performanceDebug } from '@/lib/dev-utils';
import React, { useEffect, useState } from 'react';

interface DevToolsProps {
    enabled?: boolean;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const DevTools: React.FC<DevToolsProps> = ({
    enabled = isDevelopment,
    position = 'bottom-right'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'console' | 'performance' | 'memory'>('console');
    const [logs, setLogs] = useState<Array<{ type: string; message: string; timestamp: Date }>>([]);

    useEffect(() => {
        if (!enabled) return;

        // Intercept console logs for development
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args) => {
            originalLog(...args);
            setLogs(prev => [...prev.slice(-49), {
                type: 'log',
                message: args.join(' '),
                timestamp: new Date()
            }]);
        };

        console.warn = (...args) => {
            originalWarn(...args);
            setLogs(prev => [...prev.slice(-49), {
                type: 'warn',
                message: args.join(' '),
                timestamp: new Date()
            }]);
        };

        console.error = (...args) => {
            originalError(...args);
            setLogs(prev => [...prev.slice(-49), {
                type: 'error',
                message: args.join(' '),
                timestamp: new Date()
            }]);
        };

        return () => {
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
        };
    }, [enabled]);

    if (!enabled) return null;

    const positionClasses = {
        'top-left': 'top-4 left-4',
        'top-right': 'top-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'bottom-right': 'bottom-4 right-4'
    };

    const handleClearLogs = () => {
        setLogs([]);
        console.clear();
    };

    const handlePerformanceTest = () => {
        performanceDebug.mark('dev-test-start');
        setTimeout(() => {
            performanceDebug.mark('dev-test-end');
            performanceDebug.measure('dev-test', 'dev-test-start', 'dev-test-end');
        }, 100);
    };

    const handleMemoryCheck = () => {
        memoryDebug.logUsage();
    };

    return (
        <div className={`fixed ${positionClasses[position]} z-[9999]`}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
                title="Toggle Dev Tools"
            >
                🛠️
            </button>

            {/* Dev Tools Panel */}
            {isOpen && (
                <div className="mt-2 bg-gray-900 text-white rounded-lg shadow-xl w-96 max-h-96 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gray-800 p-3 border-b border-gray-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Dev Tools</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex mt-2 space-x-1">
                            {(['console', 'performance', 'memory'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-1 text-xs rounded ${activeTab === tab
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 max-h-64 overflow-y-auto">
                        {activeTab === 'console' && (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-gray-400">Console Logs</span>
                                    <button
                                        onClick={handleClearLogs}
                                        className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                                    >
                                        Clear
                                    </button>
                                </div>
                                <div className="space-y-1 text-xs">
                                    {logs.length === 0 ? (
                                        <div className="text-gray-500">No logs yet...</div>
                                    ) : (
                                        logs.map((log, index) => (
                                            <div
                                                key={index}
                                                className={`p-1 rounded ${log.type === 'error'
                                                        ? 'bg-red-900/30 text-red-300'
                                                        : log.type === 'warn'
                                                            ? 'bg-yellow-900/30 text-yellow-300'
                                                            : 'bg-gray-800 text-gray-300'
                                                    }`}
                                            >
                                                <div className="text-gray-500 text-xs">
                                                    {log.timestamp.toLocaleTimeString()}
                                                </div>
                                                <div className="break-words">{log.message}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'performance' && (
                            <div>
                                <div className="text-xs text-gray-400 mb-2">Performance Tools</div>
                                <div className="space-y-2">
                                    <button
                                        onClick={handlePerformanceTest}
                                        className="w-full text-xs bg-green-700 hover:bg-green-600 px-3 py-2 rounded"
                                    >
                                        Run Performance Test
                                    </button>
                                    <div className="text-xs text-gray-400">
                                        Check console for performance measurements
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'memory' && (
                            <div>
                                <div className="text-xs text-gray-400 mb-2">Memory Tools</div>
                                <div className="space-y-2">
                                    <button
                                        onClick={handleMemoryCheck}
                                        className="w-full text-xs bg-purple-700 hover:bg-purple-600 px-3 py-2 rounded"
                                    >
                                        Check Memory Usage
                                    </button>
                                    <div className="text-xs text-gray-400">
                                        Memory info will be logged to console
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DevTools;