package io.framemind;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class FrameMindApplication {

    public static void main(String[] args) {
        SpringApplication.run(FrameMindApplication.class, args);
    }
}
