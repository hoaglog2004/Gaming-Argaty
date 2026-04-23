package com.argaty.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordApiRequest {

	@NotBlank(message = "Token khong duoc de trong")
	private String token;

	@NotBlank(message = "Mat khau moi khong duoc de trong")
	@Size(min = 6, max = 100, message = "Mat khau moi phai tu 6 den 100 ky tu")
	private String newPassword;

	@NotBlank(message = "Xac nhan mat khau khong duoc de trong")
	private String confirmPassword;
}
