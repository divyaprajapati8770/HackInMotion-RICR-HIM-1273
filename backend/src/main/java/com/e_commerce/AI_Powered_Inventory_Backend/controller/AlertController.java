package com.e_commerce.AI_Powered_Inventory_Backend.controller;


import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.AlertResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.security.CurrentUser;
import com.e_commerce.AI_Powered_Inventory_Backend.service.AlertService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Alerts")
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public ResponseEntity<List<AlertResponse>> list() {
        return ResponseEntity.ok(
                alertService.listActiveAlerts(CurrentUser.id())
        );
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<Void> resolve(
            @PathVariable Long id) {

        alertService.resolveAlert(
                CurrentUser.id(),
                id
        );

        return ResponseEntity.noContent().build();
    }
}
