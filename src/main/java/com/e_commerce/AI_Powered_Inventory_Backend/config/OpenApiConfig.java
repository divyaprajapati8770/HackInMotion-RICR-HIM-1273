package com.e_commerce.AI_Powered_Inventory_Backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI inventoryForecastingOpenApi() {

        return new OpenAPI()
                .info(
                        new Info()
                                .title("AI-Powered Inventory & Demand Forecasting System API")
                                .description(
                                        "REST API for inventory management, sales data ingestion, "
                                                + "AI-driven demand forecasting, and smart stock alerts."
                                )
                                .version("v1.0.0")
                                .contact(
                                        new Contact()
                                                .name("HackInMotion Team")
                                )
                )
                .addSecurityItem(
                        new SecurityRequirement()
                                .addList(SCHEME_NAME)
                )
                .components(
                        new Components()
                                .addSecuritySchemes(
                                        SCHEME_NAME,
                                        new SecurityScheme()
                                                .name(SCHEME_NAME)
                                                .type(SecurityScheme.Type.HTTP)
                                                .scheme("bearer")
                                                .bearerFormat("JWT")
                                )
                );
    }
}