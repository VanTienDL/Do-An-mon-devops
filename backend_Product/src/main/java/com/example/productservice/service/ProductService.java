package com.example.productservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.example.productservice.repository.ProductRepository;
import com.example.productservice.model.Product;

import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.HashMap;
import java.util.Map;

import com.example.productservice.dto.BuyItemRequest;
import java.util.Optional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final RestTemplate restTemplate;

    public List<Product> getAll() {
        return productRepository.findAll();
    }

    public void buyProducts(List<BuyItemRequest> items) {

    for (BuyItemRequest item : items) {

        if (item.getCount() <= 0) {
            throw new RuntimeException("Quantity must be positive");
        }

        Product product = productRepository
                .findById(item.getItemID())
                .orElseThrow(() -> new RuntimeException("Product not found: " + item.getItemID()));

        if (product.getNum() < item.getCount()) {
            throw new RuntimeException("Not enough stock for: " + product.getName());
        }

        

        // 🔹 Gọi sang Order Service
        String orderServiceUrl = "http://localhost:3003/api/purchase/create-order";

        Map<String, Object> body = new HashMap<>();
        body.put("userID", item.getUserID());   // nhớ BuyItemRequest phải có userID
        body.put("productID", item.getItemID());
        body.put("num", item.getCount());
        body.put("price", product.getPrice());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response =
            restTemplate.postForEntity(orderServiceUrl, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Order service error");
            }

        } catch (Exception e) {
            throw new RuntimeException("Failed to call Order Service: " + e.getMessage());
        }

        // 🔹 Trừ stock
        product.setNum(product.getNum() - item.getCount());
        productRepository.save(product);
    }
}

    public void save(Product product) {
        product.setId(UUID.randomUUID().toString()); // ID random string
        productRepository.save(product);
    }

    public long count() {
        return productRepository.count();
    }
}
