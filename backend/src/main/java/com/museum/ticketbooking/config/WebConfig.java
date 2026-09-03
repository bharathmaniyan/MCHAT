package com.museum.ticketbooking.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.qr.storage-path:uploads/qr}")
    private String qrStoragePath;

    @Value("${app.image.storage-path:uploads/images}")
    private String imageStoragePath;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(frontendUrl)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path qrUploadDir = Paths.get(qrStoragePath).toAbsolutePath().normalize();
        registry.addResourceHandler("/qr/**")
                .addResourceLocations("file:" + qrUploadDir.toString() + "/");

        Path imageUploadDir = Paths.get(imageStoragePath).toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/images/**")
                .addResourceLocations("file:" + imageUploadDir.toString() + "/");
    }
}
