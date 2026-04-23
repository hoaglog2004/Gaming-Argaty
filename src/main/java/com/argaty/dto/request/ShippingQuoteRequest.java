package com.argaty.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingQuoteRequest {

    @NotNull(message = "Tạm tính không được để trống")
    @DecimalMin(value = "0", message = "Tạm tính phải >= 0")
    private BigDecimal subtotal;

    @NotNull(message = "Số lượng sản phẩm không được để trống")
    @Min(value = 1, message = "Số lượng sản phẩm phải >= 1")
    private Integer itemCount;

    @NotBlank(message = "Thành phố không được để trống")
    private String city;

    @NotBlank(message = "Quận/Huyện không được để trống")
    private String district;

    private String ward;

    @NotBlank(message = "Địa chỉ chi tiết không được để trống")
    private String address;
}
