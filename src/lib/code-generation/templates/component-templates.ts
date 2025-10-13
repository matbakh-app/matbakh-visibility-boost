/**
 * Component Templates for Code Generation
 * 
 * Provides templates for generating Kiro-compliant React components
 */

import { CodeGenerationConfig } from '../types';

export class ComponentTemplates {
    constructor(private config: CodeGenerationConfig) { }

    /**
     * Render a template with provided data
     */
    render(templateName: string, data: any): string {
        const template = this.getTemplate(templateName);
        return this.interpolate(template, data);
    }

    /**
     * Get template by name
     */
    private getTemplate(name: string): string {
        switch (name) {
            case 'ui-component':
                return this.getUIComponentTemplate();
            case 'feature-component':
                return this.getFeatureComponentTemplate();
            case 'page-component':
                return this.getPageComponentTemplate();
            case 'layout-component':
                return this.getLayoutComponentTemplate();
            default:
                return this.getBasicComponentTemplate();
        }
    }

    /**
     * UI Component Template (shadcn/ui style)
     */
    private getUIComponentTemplate(): string {
        return `{{imports}}

{{propsInterface}}

const {{componentName}} = React.forwardRef<
  HTMLDivElement,
  {{componentName}}Props
>(({ className, children, ...props }, ref) => {
  {{content}}
})
{{componentName}}.displayName = "{{componentName}}"

{{exports}}
`;
    }

    /**
     * Feature Component Template
     */
    private getFeatureComponentTemplate(): string {
        return `{{imports}}

{{propsInterface}}

export function {{componentName}}({ className, children, ...props }: {{componentName}}Props) {
  {{content}}
}
`;
    }

    /**
     * Page Component Template
     */
    private getPageComponentTemplate(): string {
        return `{{imports}}
import { Helmet } from 'react-helmet-async';

{{propsInterface}}

export function {{componentName}}({ className, children, ...props }: {{componentName}}Props) {
  {{i18n}}

  return (
    <>
      <Helmet>
        <title>{t('{{componentName.toLowerCase()}}.title')}</title>
        <meta name="description" content={t('{{componentName.toLowerCase()}}.description')} />
      </Helmet>
      <main className={cn("{{defaultClasses}}", className)} {...props}>
        {{content}}
      </main>
    </>
  );
}
`;
    }

    /**
     * Layout Component Template
     */
    private getLayoutComponentTemplate(): string {
        return `{{imports}}

{{propsInterface}}

export function {{componentName}}({ className, children, ...props }: {{componentName}}Props) {
  return (
    <div className={cn("{{defaultClasses}}", className)} {...props}>
      {{content}}
    </div>
  );
}
`;
    }

    /**
     * Basic Component Template
     */
    private getBasicComponentTemplate(): string {
        return `{{imports}}

{{propsInterface}}

export function {{componentName}}({ className, children, ...props }: {{componentName}}Props) {
  {{content}}
}
`;
    }

    /**
     * Interpolate template variables
     */
    private interpolate(template: string, data: any): string {
        return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
            const value = this.getNestedValue(data, path);
            return value !== undefined ? String(value) : match;
        });
    }

    /**
     * Get nested value from object path
     */
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Generate props interface template
     */
    generatePropsInterface(componentName: string, props: Record<string, string>): string {
        const propsEntries = Object.entries(props || {})
            .map(([name, type]) => `  ${name}?: ${type};`)
            .join('\n');

        return `
export interface ${componentName}Props extends React.HTMLAttributes<HTMLDivElement> {
${propsEntries}
  children?: React.ReactNode;
}`;
    }
}