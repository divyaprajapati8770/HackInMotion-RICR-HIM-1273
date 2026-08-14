package com.e_commerce.AI_Powered_Inventory_Backend.controller;

import com.e_commerce.AI_Powered_Inventory_Backend.dto.request.WhatIfRequest;
import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.WhatIfResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.security.CurrentUser;
import com.e_commerce.AI_Powered_Inventory_Backend.service.WhatIfService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/what-if")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "What-If Simulator", description = "Stretch goal: simulate demand-change scenarios (e.g. '+20% sales spike next month')")
public class WhatIfController {

    private final WhatIfService whatIfService;

    @PostMapping("/simulate")
    @Operation(summary = "Run a what-if demand scenario for a product")
    public ResponseEntity<WhatIfResponse> simulate(@Valid @RequestBody WhatIfRequest request) {
        return ResponseEntity.ok(whatIfService.simulate(CurrentUser.id(), request));
    }
}
