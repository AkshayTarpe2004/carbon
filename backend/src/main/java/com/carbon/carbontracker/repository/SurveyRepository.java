package com.carbon.carbontracker.repository;

import com.carbon.carbontracker.model.Survey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SurveyRepository extends JpaRepository<Survey, Long> {

    void deleteByUser_Id(Long userId);

    long countByUser_Id(Long userId);

    List<Survey> findByUser_Id(Long userId);
}