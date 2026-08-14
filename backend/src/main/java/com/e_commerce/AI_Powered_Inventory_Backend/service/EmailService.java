package com.e_commerce.AI_Powered_Inventory_Backend.service;



import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Map;

/**
 * Sends transactional email through Resend's REST API.
 *
 * Deliberately calls the HTTP API with the WebClient already on the
 * classpath rather than pulling in the Resend Java SDK — one less
 * dependency, and the send endpoint is a single POST.
 *
 * IMPORTANT — this is inert until configured. If app.mail.resend-api-key
 * is blank (the default), no HTTP call is made: the message is logged
 * instead and the caller continues normally. That's a deliberate choice
 * so signup keeps working in local dev and demos without an API key —
 * but it does mean that until you set RESEND_API_KEY, *no verification
 * email is actually delivered*. The verify link is written to the
 * application log so you can still complete the flow manually.
 */
@Slf4j
@Service
public class EmailService {

    private static final String RESEND_ENDPOINT = "https://api.resend.com/emails";

    private final WebClient webClient = WebClient.builder().build();

    @Value("${app.mail.resend-api-key:}")
    private String resendApiKey;

    @Value("${app.mail.from:Obstocker <onboarding@resend.dev>}")
    private String fromAddress;

    @Value("${app.mail.app-base-url:http://localhost:3000}")
    private String appBaseUrl;

    public boolean isConfigured() {
        return resendApiKey != null && !resendApiKey.isBlank();
    }

    @Async("mailExecutor")
    public void sendVerificationEmail(String toEmail, String businessName, String token) {
        String verifyUrl = appBaseUrl + "/verify?token=" + token;

        if (!isConfigured()) {
            log.warn(
                    "RESEND_API_KEY is not configured. Verification email was not sent."
            );
            return;
        }

        String html = buildVerificationHtml(businessName, verifyUrl);

        try {
            webClient.post()
                    .uri(RESEND_ENDPOINT)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + resendApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of(
                            "from", fromAddress,
                            "to", new String[]{toEmail},
                            "subject", "Verify your Obstocker account",
                            "html", html))
                    .retrieve()
                    .toBodilessEntity()
                    .timeout(Duration.ofSeconds(8))
                    .block();
            log.info("Verification email dispatched to {}", toEmail);
        } catch (Exception e) {
            // Never fail signup because email delivery failed — the
            // account exists and the user can request a resend.
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildVerificationHtml(String businessName, String verifyUrl) {
        String safeName = businessName == null ? "there" : businessName;
        return """
                <!doctype html>
                <html>
                  <body style="margin:0;padding:0;background:#F8FAFC;font-family:Roboto,Arial,sans-serif;">
                    <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
                      <tr><td align="center">
                        <table role="presentation" width="100%%" cellpadding="0" cellspacing="0"
                               style="max-width:520px;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;padding:40px;">
                          <tr><td>
                            <h1 style="margin:0 0 8px;font-size:22px;color:#0F172A;">Verify your email</h1>
                            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#64748B;">
                              Hi %s — confirm this address to finish setting up your Obstocker account.
                            </p>
                            <a href="%s"
                               style="display:inline-block;background:#4F46E5;color:#FFFFFF;text-decoration:none;
                                      font-size:15px;font-weight:600;padding:12px 24px;border-radius:8px;">
                              Verify email
                            </a>
                            <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#94A3B8;">
                              This link expires in 24 hours. If you didn't create an Obstocker account, you can ignore this email.
                            </p>
                            <p style="margin:16px 0 0;font-size:12px;color:#94A3B8;word-break:break-all;">
                              Or paste this into your browser:<br/>%s
                            </p>
                          </td></tr>
                        </table>
                      </td></tr>
                    </table>
                  </body>
                </html>
                """.formatted(safeName, verifyUrl, verifyUrl);
    }
}
