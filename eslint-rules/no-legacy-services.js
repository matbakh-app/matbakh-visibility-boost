/**
 * ESLint Custom Rule: no-legacy-services
 * 
 * Detects and prevents usage of legacy external services
 * beyond simple import statements - includes API calls, configurations, etc.
 * 
 * Requirements: 3.1
 */

const LEGACY_PATTERNS = {
    supabase: {
        patterns: [
            /createClient.*supabase/i,
            /supabase\.createClient/i,
            /\.supabase\.co/i,
            /SUPABASE_[A-Z_]+/i,
            /supabaseUrl|supabaseKey/i,
        ],
        message: "❌ Supabase usage detected! Use AWS RDS + Cognito instead.",
        service: "Supabase"
    },
    vercel: {
        patterns: [
            /vercel\.json/i,
            /\.vercel\./i,
            /VERCEL_[A-Z_]+/i,
            /vercel\.app/i,
        ],
        message: "❌ Vercel configuration detected! Use AWS CloudFront + S3 instead.",
        service: "Vercel"
    },
    twilio: {
        patterns: [
            /twilio\.com/i,
            /TWILIO_[A-Z_]+/i,
            /accountSid.*authToken/i,
            /client\.messages\.create/i,
            /new Twilio\(/i,
        ],
        message: "❌ Twilio API usage detected! Use AWS SES for emails or AWS SNS for SMS.",
        service: "Twilio"
    },
    resend: {
        patterns: [
            /resend\.dev/i,
            /RESEND_[A-Z_]+/i,
            /new Resend\(/i,
            /resend\.emails\.send/i,
        ],
        message: "❌ Resend API usage detected! Use AWS SES instead.",
        service: "Resend"
    },
    lovable: {
        patterns: [
            /lovable\.dev/i,
            /lovable\.ai/i,
            /LOVABLE_[A-Z_]+/i,
            /lovable-[a-z-]+/i,
        ],
        message: "❌ Lovable platform usage detected! Use AWS-native services instead.",
        service: "Lovable"
    }
};

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow usage of legacy external services",
            category: "Best Practices",
            recommended: true,
        },
        fixable: null,
        schema: [
            {
                type: "object",
                properties: {
                    allowedServices: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },
                    strictMode: {
                        type: "boolean"
                    }
                },
                additionalProperties: false
            }
        ],
        messages: {
            legacyServiceUsage: "{{message}} Found in {{nodeType}}: {{code}}",
            legacyServiceConfig: "{{message}} Configuration detected in {{nodeType}}.",
            legacyServiceUrl: "{{message}} URL reference found: {{url}}"
        }
    },

    create(context) {
        const options = context.options[0] || {};
        const allowedServices = options.allowedServices || [];
        const strictMode = options.strictMode !== false;

        function checkNode(node, nodeType) {
            const sourceCode = context.getSourceCode();
            const text = sourceCode.getText(node);

            for (const [serviceName, config] of Object.entries(LEGACY_PATTERNS)) {
                // Skip if service is explicitly allowed
                if (allowedServices.includes(serviceName)) {
                    continue;
                }

                for (const pattern of config.patterns) {
                    if (pattern.test(text)) {
                        context.report({
                            node,
                            messageId: "legacyServiceUsage",
                            data: {
                                message: config.message,
                                nodeType,
                                code: text.length > 50 ? text.substring(0, 50) + "..." : text
                            }
                        });
                        return; // Only report first match per node
                    }
                }
            }
        }

        function checkStringLiteral(node) {
            const value = node.value;

            for (const [serviceName, config] of Object.entries(LEGACY_PATTERNS)) {
                if (allowedServices.includes(serviceName)) {
                    continue;
                }

                for (const pattern of config.patterns) {
                    if (pattern.test(value)) {
                        context.report({
                            node,
                            messageId: "legacyServiceUrl",
                            data: {
                                message: config.message,
                                url: value
                            }
                        });
                        return;
                    }
                }
            }
        }

        return {
            // Check variable declarations
            VariableDeclarator(node) {
                if (node.init) {
                    checkNode(node.init, "variable declaration");
                }
            },

            // Check function calls
            CallExpression(node) {
                checkNode(node, "function call");
            },

            // Check member expressions (e.g., object.method)
            MemberExpression(node) {
                checkNode(node, "member expression");
            },

            // Check string literals for URLs and config values
            Literal(node) {
                if (typeof node.value === "string") {
                    checkStringLiteral(node);
                }
            },

            // Check template literals
            TemplateLiteral(node) {
                checkNode(node, "template literal");
            },

            // Check property definitions in objects
            Property(node) {
                if (node.key && node.value) {
                    checkNode(node.key, "object property key");
                    checkNode(node.value, "object property value");
                }
            },

            // Check JSX attributes
            JSXAttribute(node) {
                if (node.value) {
                    checkNode(node.value, "JSX attribute");
                }
            },

            // Check environment variable access
            Identifier(node) {
                if (strictMode && node.name && /^(SUPABASE|VERCEL|TWILIO|RESEND|LOVABLE)_/.test(node.name)) {
                    const serviceName = node.name.split('_')[0].toLowerCase();
                    const config = LEGACY_PATTERNS[serviceName];
                    if (config && !allowedServices.includes(serviceName)) {
                        context.report({
                            node,
                            messageId: "legacyServiceConfig",
                            data: {
                                message: config.message,
                                nodeType: "environment variable"
                            }
                        });
                    }
                }
            }
        };
    }
};