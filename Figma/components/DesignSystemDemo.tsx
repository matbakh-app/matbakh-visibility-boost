import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, AlertCircle, XCircle, Info, Target } from 'lucide-react';

const DesignSystemDemo = () => {
  return (
    <div className="space-y-8 p-6">
      {/* Typography Scale */}
      <Card className="widget-card">
        <CardHeader>
          <CardTitle className="headline-xl">Typography System</CardTitle>
        </CardHeader>
        <CardContent className="widget-padding space-y-6">
          {/* Headlines */}
          <div>
            <h4 className="headline-md mb-4">Headlines (Inter, 600 weight)</h4>
            <div className="space-y-2">
              <div className="headline-xl">Headline XL - 24px (Restaurant Dashboard)</div>
              <div className="headline-lg">Headline LG - 20px (Widget Titles)</div>
              <div className="headline-md">Headline MD - 18px (Section Headers)</div>
            </div>
          </div>

          {/* Metrics */}
          <div>
            <h4 className="headline-md mb-4">Metrics (Roboto Mono, 600 weight)</h4>
            <div className="space-y-2">
              <div className="metric-xl">48px - €12,450</div>
              <div className="metric-lg">36px - 87%</div>
              <div className="metric-md">30px - 234</div>
            </div>
          </div>

          {/* Body Text */}
          <div>
            <h4 className="headline-md mb-4">Body Text (System Font)</h4>
            <div className="space-y-2">
              <p className="body-lg">Body Large - 16px (Descriptions)</p>
              <p className="body-md">Body Medium - 14px (Standard text content)</p>
              <p className="caption">Caption - 12px (Metadata, timestamps)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color System */}
      <Card className="widget-card">
        <CardHeader>
          <CardTitle className="headline-xl">Color System</CardTitle>
        </CardHeader>
        <CardContent className="widget-padding space-y-6">
          {/* Semantic Colors */}
          <div>
            <h4 className="headline-md mb-4">Semantic Colors</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="w-full h-16 bg-success rounded-lg mb-2 flex items-center justify-center">
                  <CheckCircle className="icon-md text-white" />
                </div>
                <div className="body-md font-medium">Success</div>
                <div className="caption">#10B981</div>
              </div>
              <div className="text-center">
                <div className="w-full h-16 bg-warning rounded-lg mb-2 flex items-center justify-center">
                  <AlertCircle className="icon-md text-white" />
                </div>
                <div className="body-md font-medium">Warning</div>
                <div className="caption">#F59E0B</div>
              </div>
              <div className="text-center">
                <div className="w-full h-16 bg-error rounded-lg mb-2 flex items-center justify-center">
                  <XCircle className="icon-md text-white" />
                </div>
                <div className="body-md font-medium">Error</div>
                <div className="caption">#EF4444</div>
              </div>
              <div className="text-center">
                <div className="w-full h-16 bg-neutral rounded-lg mb-2 flex items-center justify-center">
                  <Info className="icon-md text-white" />
                </div>
                <div className="body-md font-medium">Neutral</div>
                <div className="caption">#6B7280</div>
              </div>
              <div className="text-center">
                <div className="w-full h-16 bg-primary-brand rounded-lg mb-2 flex items-center justify-center">
                  <Target className="icon-md text-white" />
                </div>
                <div className="body-md font-medium">Primary</div>
                <div className="caption">#4F46E5</div>
              </div>
            </div>
          </div>

          {/* Light Variants */}
          <div>
            <h4 className="headline-md mb-4">Light Variants (10% opacity)</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-full h-12 bg-success-light rounded-lg mb-2"></div>
                <div className="caption">Success Light</div>
              </div>
              <div className="text-center">
                <div className="w-full h-12 bg-warning-light rounded-lg mb-2"></div>
                <div className="caption">Warning Light</div>
              </div>
              <div className="text-center">
                <div className="w-full h-12 bg-error-light rounded-lg mb-2"></div>
                <div className="caption">Error Light</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spacing System */}
      <Card className="widget-card">
        <CardHeader>
          <CardTitle className="headline-xl">Spacing System (8px Grid)</CardTitle>
        </CardHeader>
        <CardContent className="widget-padding space-y-6">
          <div>
            <h4 className="headline-md mb-4">Component Spacing</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-24 h-12 bg-gray-200 rounded flex items-center justify-center caption">Widget</div>
                <div className="body-md">Widget Padding: 24px</div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-8 bg-blue-200 rounded flex items-center justify-center caption">Button</div>
                <div className="body-md">Button Padding: 12px × 8px</div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-8 h-4 bg-green-200 rounded"></div>
                <div className="body-md">Widget Margin: 16px</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="headline-md mb-4">Scale Reference</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <div className="w-1 h-4 bg-gray-400"></div>
                <div className="caption">2px (space-1)</div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-4 bg-gray-400"></div>
                <div className="caption">8px (space-4)</div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-gray-400"></div>
                <div className="caption">16px (space-8)</div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-6 h-4 bg-gray-400"></div>
                <div className="caption">24px (space-12)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Icons & Touch Targets */}
      <Card className="widget-card">
        <CardHeader>
          <CardTitle className="headline-xl">Icons & Accessibility</CardTitle>
        </CardHeader>
        <CardContent className="widget-padding space-y-6">
          <div>
            <h4 className="headline-md mb-4">Icon Sizes</h4>
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <CheckCircle className="icon-sm text-success mx-auto mb-2" />
                <div className="caption">Small - 20px</div>
              </div>
              <div className="text-center">
                <CheckCircle className="icon-md text-success mx-auto mb-2" />
                <div className="caption">Medium - 24px</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="headline-md mb-4">Touch Targets (40px minimum)</h4>
            <div className="flex items-center space-x-4">
              <button className="touch-target bg-primary-brand text-white rounded button-hover flex items-center justify-center">
                <CheckCircle className="icon-sm" />
              </button>
              <div className="body-md">All interactive elements meet 40px touch target requirement</div>
            </div>
          </div>

          <div>
            <h4 className="headline-md mb-4">Accessibility Features</h4>
            <div className="space-y-2">
              <div className="body-md">✓ WCAG 2.1 AA contrast ratios (4.5:1 minimum)</div>
              <div className="body-md">✓ Focus indicators for keyboard navigation</div>
              <div className="body-md">✓ Reduced motion support for accessibility</div>
              <div className="body-md">✓ High contrast mode compatibility</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesignSystemDemo;