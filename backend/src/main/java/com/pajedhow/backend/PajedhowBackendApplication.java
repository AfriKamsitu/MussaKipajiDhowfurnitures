package com.pajedhow.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class PajedhowBackendApplication {

    public static void main(String[] args) {

        SpringApplication.run(PajedhowBackendApplication.class, args);
    }
}
