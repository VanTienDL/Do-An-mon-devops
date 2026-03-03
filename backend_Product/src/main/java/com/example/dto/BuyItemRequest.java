package com.example.productservice.dto;

import lombok.Data;

@Data
public class BuyItemRequest {
    private String userID;
    private String itemID;
    private int count;
}