"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResendNotificationService = void 0;
const utils_1 = require("@medusajs/framework/utils");
const resend_1 = require("resend");
const templates_1 = require("../templates");
/**
 * Service to handle email notifications using the Resend API.
 */
class ResendNotificationService extends utils_1.AbstractNotificationProviderService {
    static identifier = "RESEND_NOTIFICATION_SERVICE";
    config_; // Configuration for Resend API
    logger_; // Logger for error and event logging
    resend; // Instance of the Resend API client
    constructor({ logger }, options) {
        super();
        this.config_ = {
            apiKey: options.api_key,
            from: options.from
        };
        this.logger_ = logger;
        this.resend = new resend_1.Resend(this.config_.apiKey);
    }
    async send(notification) {
        if (!notification) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, `No notification information provided`);
        }
        if (notification.channel === 'sms') {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, `SMS notification not supported`);
        }
        // Generate the email content using the template
        let emailContent;
        try {
            emailContent = (0, templates_1.generateEmailTemplate)(notification.template, notification.data);
        }
        catch (error) {
            if (error instanceof utils_1.MedusaError) {
                throw error; // Re-throw MedusaError for invalid template data
            }
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, `Failed to generate email content for template: ${notification.template}`);
        }
        const emailOptions = notification.data.emailOptions;
        // Compose the message body to send via API to Resend
        const message = {
            to: notification.to,
            from: notification.from?.trim() ?? this.config_.from,
            react: emailContent,
            subject: emailOptions.subject ?? 'You have a new notification',
            headers: emailOptions.headers,
            replyTo: emailOptions.replyTo,
            cc: emailOptions.cc,
            bcc: emailOptions.bcc,
            tags: emailOptions.tags,
            text: emailOptions.text,
            attachments: Array.isArray(notification.attachments)
                ? notification.attachments.map((attachment) => ({
                    content: attachment.content,
                    filename: attachment.filename,
                    content_type: attachment.content_type,
                    disposition: attachment.disposition ?? 'attachment',
                    id: attachment.id ?? undefined
                }))
                : undefined,
            scheduledAt: emailOptions.scheduledAt
        };
        // Send the email via Resend
        try {
            await this.resend.emails.send(message);
            this.logger_.log(`Successfully sent "${notification.template}" email to ${notification.to} via Resend`);
            return {}; // Return an empty object on success
        }
        catch (error) {
            const errorCode = error.code;
            const responseError = error.response?.body?.errors?.[0];
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, `Failed to send "${notification.template}" email to ${notification.to} via Resend: ${errorCode} - ${responseError?.message ?? 'unknown error'}`);
        }
    }
}
exports.ResendNotificationService = ResendNotificationService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzZW5kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21vZHVsZXMvZW1haWwtbm90aWZpY2F0aW9ucy9zZXJ2aWNlcy9yZXNlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EscURBQTRGO0FBQzVGLG1DQUFtRDtBQUVuRCw0Q0FBb0Q7QUFxQnBEOztHQUVHO0FBQ0gsTUFBYSx5QkFBMEIsU0FBUSwyQ0FBbUM7SUFDaEYsTUFBTSxDQUFDLFVBQVUsR0FBRyw2QkFBNkIsQ0FBQTtJQUN2QyxPQUFPLENBQXFCLENBQUMsK0JBQStCO0lBQzVELE9BQU8sQ0FBUSxDQUFDLHFDQUFxQztJQUNyRCxNQUFNLENBQVEsQ0FBQyxvQ0FBb0M7SUFFN0QsWUFBWSxFQUFFLE1BQU0sRUFBd0IsRUFBRSxPQUF5QztRQUNyRixLQUFLLEVBQUUsQ0FBQTtRQUNQLElBQUksQ0FBQyxPQUFPLEdBQUc7WUFDYixNQUFNLEVBQUUsT0FBTyxDQUFDLE9BQU87WUFDdkIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO1NBQ25CLENBQUE7UUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQTtRQUNyQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDL0MsQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFJLENBQ1IsWUFBMkQ7UUFFM0QsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ2xCLE1BQU0sSUFBSSxtQkFBVyxDQUFDLG1CQUFXLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxzQ0FBc0MsQ0FBQyxDQUFBO1FBQy9GLENBQUM7UUFDRCxJQUFJLFlBQVksQ0FBQyxPQUFPLEtBQUssS0FBSyxFQUFFLENBQUM7WUFDbkMsTUFBTSxJQUFJLG1CQUFXLENBQUMsbUJBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLGdDQUFnQyxDQUFD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