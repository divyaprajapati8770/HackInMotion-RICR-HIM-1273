package com.e_commerce.AI_Powered_Inventory_Backend.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.SendEmailRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final Resend resend;

    @Value("${app.resend.from-email}")
    private String fromEmail;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public EmailService(
            @Value("${app.resend.api-key}") String apiKey) {

        this.resend = new Resend(apiKey);
    }

    public void sendVerificationEmail(
            String recipientEmail,
            String token) {

        String verificationLink =
                frontendUrl
                        + "/verify-email?token="
                        + token;

        String html = """
                <!DOCTYPE html>
                <html>
                <body>
                    <h2>Verify your email</h2>

                    <p>
                        Thank you for registering with our
                        Inventory Forecasting application.
                    </p>

                    <p>
                        Please click the button below to verify
                        your email address.
                    </p>

                    <a href="%s"
                       style="
                       display:inline-block;
                       padding:12px 20px;
                       background:#2563eb;
                       color:white;
                       text-decoration:none;
                       border-radius:6px;">
                        Verify Email
                    </a>

                    <p>
                        This link will expire in 24 hours.
                    </p>

                    <p>
                        If you did not create this account,
                        you can safely ignore this email.
                    </p>
                </body>
                </html>
                """.formatted(verificationLink);

        SendEmailRequest request =
                SendEmailRequest.builder()
                        .from(fromEmail)
                        .to(recipientEmail)
                        .subject("Verify your email address")
                        .html(html)
                        .build();

        try {
            resend.emails().send(request);
        } catch (ResendException e) {
            throw new RuntimeException(
                    "Failed to send verification email",
                    e
            );
        }
    }
}