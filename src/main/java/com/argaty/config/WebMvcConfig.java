package com.argaty.config;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Cấu hình Web MVC
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir}")
    private String uploadDir;

        @Value("${app.frontend-url:http://localhost:5173}")
        private String frontendUrl;

    /**
     * Cấu hình static resources và upload folder
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // CSS files
        registry.addResourceHandler("/css/**")
                .addResourceLocations("classpath:/static/css/");
        
        // JS files
        registry.addResourceHandler("/js/**")
                .addResourceLocations("classpath:/static/js/");
        
        // Images
        registry.addResourceHandler("/images/**")
                .addResourceLocations("classpath:/static/images/");
        
        // Static resources (all)
        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/");

        // Upload folder - cho phép truy cập file đã upload
        // Sử dụng đường dẫn tuyệt đối với prefix file:///
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
        String uploadAbsolutePath = "file:///" + uploadPath.toString().replace("\\", "/") + "/";

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadAbsolutePath);
    }

    /**
     * Cấu hình các view controller đơn giản
     */
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
                // Redirect backend root endpoints to SPA frontend entry.
                registry.addViewController("/").setViewName("redirect:" + frontendUrl);
                registry.addViewController("/home").setViewName("redirect:" + frontendUrl);
    }

        @Override
        public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/v1/**")
                                .allowedOrigins("http://localhost:3000", "http://localhost:5173")
                                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                                .allowedHeaders("*")
                                .allowCredentials(true)
                                .maxAge(3600);

                // Legacy API (deprecated compatibility mode)
                registry.addMapping("/api/**")
                                .allowedOrigins("http://localhost:3000", "http://localhost:5173")
                                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                                .allowedHeaders("*")
                                .allowCredentials(true)
                                .maxAge(3600);
        }
}