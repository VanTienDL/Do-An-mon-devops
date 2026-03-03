package com.example.productservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.example.productservice.service.ProductService;
import com.example.productservice.model.Product;
import com.example.productservice.dto.BuyItemRequest;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin
public class ProductController {

    private final ProductService productService;

    //GET api/products
    @GetMapping
    public List<Product> getAll() {
        return productService.getAll();
    }

    //POST api/products/buy
    @PostMapping("/buy")
    public String buy(@RequestBody List<BuyItemRequest> items) {
    productService.buyProducts(items);
    return "Purchase successful!";
    }   
}
