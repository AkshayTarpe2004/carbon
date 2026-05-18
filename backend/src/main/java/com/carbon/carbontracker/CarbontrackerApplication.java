package com.carbon.carbontracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;


@SpringBootApplication
@EnableScheduling
public class CarbontrackerApplication {

	public static void main(String[] args) {
		SpringApplication.run(CarbontrackerApplication.class, args);
	}

}
