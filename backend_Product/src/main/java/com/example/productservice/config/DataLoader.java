package com.example.productservice.config;

import com.example.productservice.model.Product;
import com.example.productservice.service.ProductService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final ProductService productService;

    @Override
    public void run(String... args) throws Exception {
        if (productService.count() == 0) {
            ObjectMapper mapper = new ObjectMapper();
            InputStream inputStream = new ClassPathResource("flower.json").getInputStream();

            List<Product> products = mapper.readValue(inputStream, new TypeReference<List<Product>>() {});

            for (Product product : products) {
                product.setId(UUID.randomUUID().toString());
                productService.save(product);
            }

            System.out.println("🌸 Imported flower data!");
        }
    }
}