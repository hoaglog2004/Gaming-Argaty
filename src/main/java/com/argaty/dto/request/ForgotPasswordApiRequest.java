package com.argaty.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForgotPasswordApiRequest {

	@NotBlank(message = "Email khong duoc de trong")
	@Email(message = "Email khong hop le")
	private String email;
}
