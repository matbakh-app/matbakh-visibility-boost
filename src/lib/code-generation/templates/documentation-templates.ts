/**
 * Documentation Templates for Code Generation
 * 
 * Provides templates for generating comprehensive documentation
 */

import { CodeGenerationConfig } from '../types';

export class DocumentationTemplates {
    constructor(private config: CodeGenerationConfig) { }

    /**
     * Generate component documentation
     */
    generateComponentDocs(options: {
        name: string;
        description: string;
        props: Array<{ name: string, type: string, description: string }>;
        examples: string[];
        accessibility?: string;
        styling?: string;
    }): string {
        const { name, description, props, examples, accessibility, styling } = options;

        return `# ${name} Component

${description}

## Installation

\`\`\`bash
import { ${name} } from '@/components/ui/${name.toLowerCase()}';
\`\`\`

## Usage

### Basic Usage

\`\`\`tsx
${examples[0] || `<${name}>Content</${name}>`}
\`\`\`

### Advanced Usage

\`\`\`tsx
${examples[1] || `<${name} className="custom-class">Advanced content</${name}>`}
\`\`\`

## Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
${this.generatePropsTable(props)}

## Examples

${examples.map((example, index) => `
### Example ${index + 1}

\`\`\`tsx
${example}
\`\`\`
`).join('\n')}

${accessibility || ''}

${styling || ''}

## Best Practices

- Follow Kiro architecture patterns
- Ensure accessibility compliance
- Use semantic HTML elements
- Implement proper error handling
- Add comprehensive tests

## Related Components

- [Button](./button.md)
- [Card](./card.md)
- [Dialog](./dialog.md)

## Changelog

### v1.0.0
- Initial implementation
- Basic functionality
- Accessibility support
- Storybook stories
- Comprehensive tests
`;
    }

    /**
     * Generate API documentation
     */
    generateApiDocs(options: {
        title: string;
        description: string;
        baseUrl: string;
        endpoints: Array<{
            method: string;
            path: string;
            description: string;
            parameters?: any[];
            responses?: any[];
        }>;
    }): string {
        const { title, description, baseUrl, endpoints } = options;

        return `# ${title} API Documentation

${description}

## Base URL

\`${baseUrl}\`

## Authentication

All API requests require authentication. Include your API key in the Authorization header:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Endpoints

${endpoints.map(endpoint => this.generateEndpointDocs(endpoint)).join('\n\n')}

## Error Handling

The API uses conventional HTTP response codes to indicate success or failure:

- \`200\` - OK: The request was successful
- \`400\` - Bad Request: The request was invalid
- \`401\` - Unauthorized: Authentication failed
- \`403\` - Forbidden: Access denied
- \`404\` - Not Found: Resource not found
- \`500\` - Internal Server Error: Server error

### Error Response Format

\`\`\`json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request is invalid",
    "details": "Additional error details"
  }
}
\`\`\`

## Rate Limiting

API requests are limited to 1000 requests per hour per API key.

## SDKs and Libraries

- [TypeScript SDK](./sdk/typescript.md)
- [React Hooks](./sdk/react-hooks.md)
- [Node.js Client](./sdk/nodejs.md)
`;
    }

    /**
     * Generate endpoint documentation
     */
    private generateEndpointDocs(endpoint: {
        method: string;
        path: string;
        description: string;
        parameters?: any[];
        responses?: any[];
    }): string {
        const { method, path, description, parameters, responses } = endpoint;

        return `### ${method.toUpperCase()} ${path}

${description}

#### Parameters

${parameters?.length ? this.generateParametersTable(parameters) : 'No parameters required.'}

#### Responses

${responses?.length ? this.generateResponsesTable(responses) : 'Standard HTTP response codes apply.'}

#### Example Request

\`\`\`bash
curl -X ${method.toUpperCase()} \\
  "${path}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"
\`\`\`

#### Example Response

\`\`\`json
{
  "success": true,
  "data": {}
}
\`\`\``;
    }

    /**
     * Generate props table for component documentation
     */
    private generatePropsTable(props: Array<{ name: string, type: string, description: string }>): string {
        if (!props.length) return '| - | - | - | - |';

        return props
            .map(prop => `| ${prop.name} | \`${prop.type}\` | ${prop.description} | - |`)
            .join('\n');
    }

    /**
     * Generate parameters table for API documentation
     */
    private generateParametersTable(parameters: any[]): string {
        return `
| Name | Type | Required | Description |
|------|------|----------|-------------|
${parameters.map(param =>
            `| ${param.name} | \`${param.type}\` | ${param.required ? 'Yes' : 'No'} | ${param.description} |`
        ).join('\n')}`;
    }

    /**
     * Generate responses table for API documentation
     */
    private generateResponsesTable(responses: any[]): string {
        return `
| Status | Description | Schema |
|--------|-------------|--------|
${responses.map(response =>
            `| ${response.status} | ${response.description} | \`${response.schema || 'object'}\` |`
        ).join('\n')}`;
    }

    /**
     * Generate README template
     */
    generateReadme(options: {
        projectName: string;
        description: string;
        installation: string;
        usage: string;
        features: string[];
        contributing?: string;
    }): string {
        const { projectName, description, installation, usage, features, contributing } = options;

        return `# ${projectName}

${description}

## Features

${features.map(feature => `- ${feature}`).join('\n')}

## Installation

${installation}

## Usage

${usage}

## Documentation

- [Component Library](./docs/components/README.md)
- [API Reference](./docs/api/README.md)
- [Development Guide](./docs/development.md)
- [Deployment Guide](./docs/deployment.md)

## Development

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
\`\`\`

## Testing

\`\`\`bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
\`\`\`

## Contributing

${contributing || 'Please read our contributing guidelines before submitting pull requests.'}

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Support

- [Documentation](./docs/)
- [Issues](./issues)
- [Discussions](./discussions)
`;
    }

    /**
     * Generate changelog template
     */
    generateChangelog(): string {
        return `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New features and enhancements

### Changed
- Changes to existing functionality

### Deprecated
- Features that will be removed in future versions

### Removed
- Features that have been removed

### Fixed
- Bug fixes

### Security
- Security improvements

## [1.0.0] - ${new Date().toISOString().split('T')[0]}

### Added
- Initial release
- Core functionality
- Basic documentation
- Test suite
`;
    }
}