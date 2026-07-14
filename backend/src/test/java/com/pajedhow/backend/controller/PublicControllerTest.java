package com.pajedhow.backend.controller;

import com.pajedhow.backend.config.AppProperties;
import com.pajedhow.backend.dto.OrderDtos.CreateOrderRequest;
import com.pajedhow.backend.dto.OrderDtos.OrderResponse;
import com.pajedhow.backend.dto.ProductDtos.ProductResponse;
import com.pajedhow.backend.service.OrderService;
import com.pajedhow.backend.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PublicController.class)
@AutoConfigureMockMvc(addFilters = false)
class PublicControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    @MockBean
    private OrderService orderService;

    @MockBean
    private AppProperties appProperties;

    @Test
    void featuredProductsEndpointReturnsPublishedHighlights() throws Exception {
        ProductResponse product = new ProductResponse(
                1L, "oak-chair", "Oak Chair", "Furniture", BigDecimal.valueOf(250000), null,
                "https://example.com/chair.jpg", 4.8, 12, true, List.of("Brown"), "Oak",
                "PUBLISHED", 10, true, "SKU-1", 1, 12, 5, null
        );
        when(productService.featured(8)).thenReturn(List.of(product));

        mockMvc.perform(get("/api/featured"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.products[0].slug").value("oak-chair"));
    }

    @Test
    void checkoutEndpointCreatesOrderForGuestBuyer() throws Exception {
        OrderResponse order = new OrderResponse(
                10L, "#FH10001", null, "Guest Buyer", "+255700000000", "Dar es Salaam",
                "PENDING", "Cash on Delivery", "PENDING", BigDecimal.valueOf(250000), BigDecimal.ZERO,
                BigDecimal.valueOf(250000), List.of(), List.of(), null, null
        );
        when(orderService.create(any(CreateOrderRequest.class), eq(null))).thenReturn(order);

        String body = """
                {
                  "customerName": "Guest Buyer",
                  "phone": "+255700000000",
                  "shippingAddress": "Dar es Salaam",
                  "payment": "Cash on Delivery",
                  "delivery": 0,
                  "items": [
                    {
                      "productId": 1,
                      "name": "Oak Chair",
                      "image": "https://example.com/chair.jpg",
                      "price": 250000,
                      "quantity": 1
                    }
                  ]
                }
                """;

        mockMvc.perform(post("/api/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderNumber").value("#FH10001"));
    }
}
