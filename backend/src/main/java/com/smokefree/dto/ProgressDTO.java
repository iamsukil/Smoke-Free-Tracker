package com.smokefree.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProgressDTO {
    private Long daysFree;
    private Long cigarettesAvoided;
    private Double moneySaved;
    private String quitDate;
    private Integer cigsPerDay;
    private Double costPerPack;
}
