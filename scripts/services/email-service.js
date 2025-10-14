/**
 * Email Service for Kiro Job System
 * Simple email notification service
 */

export class EmailService {
    constructor() {
        this.enabled = process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true';
        this.recipient = process.env.EMAIL_RECIPIENT || 'mail@matbakh.app';
    }

    async sendJobNotification(jobName, status, duration, details = {}) {
        if (!this.enabled) {
            console.log(`📧 Email notification (disabled): ${jobName} - ${status}`);
            return;
        }

        const subject = `Kiro Job ${status.toUpperCase()}: ${jobName}`;
        const body = this.formatJobNotification(jobName, status, duration, details);

        // In a real implementation, this would send actual emails
        // For now, we'll just log the notification
        console.log(`📧 Email notification sent to ${this.recipient}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Duration: ${duration}ms`);

        if (details.error) {
            console.log(`   Error: ${details.error}`);
        }
    }

    formatJobNotification(jobName, status, duration, details) {
        const timestamp = new Date().toISOString();

        let body = `Job Execution Report
    
Job Name: ${jobName}
Status: ${status.toUpperCase()}
Duration: ${duration}ms
Timestamp: ${timestamp}
`;

        if (details.output) {
            body += `\nOutput:\n${details.output}`;
        }

        if (details.error) {
            body += `\nError:\n${details.error}`;
        }

        return body;
    }

    async sendAlert(title, message, priority = 'normal') {
        if (!this.enabled) {
            console.log(`🚨 Alert (disabled): ${title} - ${message}`);
            return;
        }

        console.log(`🚨 Alert sent to ${this.recipient}`);
        console.log(`   Title: ${title}`);
        console.log(`   Priority: ${priority}`);
        console.log(`   Message: ${message}`);
    }
}

export const emailService = new EmailService();
export default emailService;