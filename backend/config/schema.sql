-- Campus Connect AI Database Schema
-- Production Ready Normalized MySQL Database

CREATE DATABASE IF NOT EXISTS `campus_connect_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `campus_connect_db`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'officer', 'recruiter') NOT NULL DEFAULT 'student',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Companies Table
CREATE TABLE IF NOT EXISTS `companies` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `logo` VARCHAR(500) DEFAULT NULL,
  `cover` VARCHAR(500) DEFAULT NULL,
  `industry` VARCHAR(100) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `salary` VARCHAR(100) DEFAULT NULL,
  `hiring` TINYINT(1) DEFAULT 1,
  `open_roles` INT DEFAULT 0,
  `eligibility` VARCHAR(255) DEFAULT NULL,
  `deadline_days` INT DEFAULT 14,
  `rating` DECIMAL(3,1) DEFAULT 4.5,
  `size` VARCHAR(50) DEFAULT NULL,
  `employees` INT DEFAULT 0,
  `culture` JSON DEFAULT NULL,
  `benefits` JSON DEFAULT NULL,
  `process` JSON DEFAULT NULL,
  `stats` JSON DEFAULT NULL,
  `gallery` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_companies_industry` (`industry`),
  KEY `idx_companies_hiring` (`hiring`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Students Table
CREATE TABLE IF NOT EXISTS `students` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `avatar` VARCHAR(500) DEFAULT NULL,
  `headline` VARCHAR(255) DEFAULT NULL,
  `department` VARCHAR(100) DEFAULT NULL,
  `cgpa` DECIMAL(3,2) DEFAULT NULL,
  `graduation_year` INT DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_students_user` (`user_id`),
  KEY `idx_students_department` (`department`),
  KEY `idx_students_cgpa` (`cgpa`),
  CONSTRAINT `fk_students_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Recruiters Table
CREATE TABLE IF NOT EXISTS `recruiters` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `company_id` VARCHAR(36) DEFAULT NULL,
  `designation` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_recruiters_user` (`user_id`),
  KEY `idx_recruiters_company` (`company_id`),
  CONSTRAINT `fk_recruiters_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_recruiters_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Placement Officers Table
CREATE TABLE IF NOT EXISTS `placement_officers` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `department` VARCHAR(100) DEFAULT NULL,
  `designation` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_officers_user` (`user_id`),
  CONSTRAINT `fk_officers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Jobs Table
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` VARCHAR(36) NOT NULL,
  `company_id` VARCHAR(36) NOT NULL,
  `recruiter_id` VARCHAR(36) DEFAULT NULL,
  `company` VARCHAR(255) NOT NULL,
  `logo` VARCHAR(500) DEFAULT NULL,
  `role` VARCHAR(255) NOT NULL,
  `package` VARCHAR(100) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) DEFAULT 'Full-time',
  `remote` TINYINT(1) DEFAULT 0,
  `requirements` JSON DEFAULT NULL,
  `responsibilities` JSON DEFAULT NULL,
  `eligibility` VARCHAR(255) DEFAULT NULL,
  `skills` JSON DEFAULT NULL,
  `match_score` INT DEFAULT 85,
  `posted_days` INT DEFAULT 0,
  `deadline` VARCHAR(100) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_jobs_company` (`company_id`),
  KEY `idx_jobs_recruiter` (`recruiter_id`),
  KEY `idx_jobs_role` (`role`),
  CONSTRAINT `fk_jobs_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_jobs_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Applications Table
CREATE TABLE IF NOT EXISTS `applications` (
  `id` VARCHAR(36) NOT NULL,
  `job_id` VARCHAR(36) NOT NULL,
  `student_id` VARCHAR(36) NOT NULL,
  `role` VARCHAR(255) NOT NULL,
  `company` VARCHAR(255) NOT NULL,
  `logo` VARCHAR(500) DEFAULT NULL,
  `stage` ENUM('applied', 'screening', 'assessment', 'technical', 'hr', 'offer', 'joined') DEFAULT 'applied',
  `status` ENUM('pending', 'shortlisted', 'rejected', 'offered') DEFAULT 'pending',
  `applied_date` VARCHAR(50) DEFAULT NULL,
  `updated_date` VARCHAR(50) DEFAULT NULL,
  `salary` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_app_job_student` (`job_id`, `student_id`),
  KEY `idx_applications_student` (`student_id`),
  KEY `idx_applications_job` (`job_id`),
  KEY `idx_applications_stage` (`stage`),
  CONSTRAINT `fk_applications_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_applications_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Interviews Table
CREATE TABLE IF NOT EXISTS `interviews` (
  `id` VARCHAR(36) NOT NULL,
  `application_id` VARCHAR(36) DEFAULT NULL,
  `job_id` VARCHAR(36) DEFAULT NULL,
  `student_id` VARCHAR(36) NOT NULL,
  `role` VARCHAR(255) NOT NULL,
  `company` VARCHAR(255) NOT NULL,
  `logo` VARCHAR(500) DEFAULT NULL,
  `date` VARCHAR(50) NOT NULL,
  `time` VARCHAR(50) NOT NULL,
  `type` VARCHAR(100) DEFAULT 'Technical',
  `round` VARCHAR(100) DEFAULT 'Round 1',
  `mode` ENUM('online', 'onsite') DEFAULT 'online',
  `meeting_link` VARCHAR(500) DEFAULT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `days_left` INT DEFAULT 0,
  `prep` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_interviews_student` (`student_id`),
  KEY `idx_interviews_app` (`application_id`),
  CONSTRAINT `fk_interviews_app` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_interviews_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Skills Table
CREATE TABLE IF NOT EXISTS `skills` (
  `id` VARCHAR(36) NOT NULL,
  `student_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `level` INT DEFAULT 50,
  `category` VARCHAR(50) DEFAULT 'Core',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_skills_student` (`student_id`),
  CONSTRAINT `fk_skills_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Projects Table
CREATE TABLE IF NOT EXISTS `projects` (
  `id` VARCHAR(36) NOT NULL,
  `student_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `desc` TEXT DEFAULT NULL,
  `stack` JSON DEFAULT NULL,
  `link` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_projects_student` (`student_id`),
  CONSTRAINT `fk_projects_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Certifications Table
CREATE TABLE IF NOT EXISTS `certifications` (
  `id` VARCHAR(36) NOT NULL,
  `student_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `issuer` VARCHAR(255) NOT NULL,
  `year` VARCHAR(10) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_certifications_student` (`student_id`),
  CONSTRAINT `fk_certifications_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Resumes Table
CREATE TABLE IF NOT EXISTS `resumes` (
  `id` VARCHAR(36) NOT NULL,
  `student_id` VARCHAR(36) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_size` INT NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `parsed_content` LONGTEXT DEFAULT NULL,
  `ats_score` INT DEFAULT 0,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_resumes_student` (`student_id`),
  CONSTRAINT `fk_resumes_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `type` ENUM('interview', 'deadline', 'approval', 'announcement', 'application') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `body` TEXT NOT NULL,
  `time` VARCHAR(50) DEFAULT NULL,
  `read_status` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Feedback Table
CREATE TABLE IF NOT EXISTS `feedback` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `rating` INT DEFAULT 5,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_feedback_user` (`user_id`),
  CONSTRAINT `fk_feedback_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. AI Chats Table
CREATE TABLE IF NOT EXISTS `ai_chats` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `tool_type` VARCHAR(50) NOT NULL DEFAULT 'career-advisor',
  `question` TEXT NOT NULL,
  `response` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ai_chats_user` (`user_id`),
  KEY `idx_ai_chats_tool` (`tool_type`),
  KEY `idx_ai_chats_user_tool` (`user_id`, `tool_type`, `created_at`),
  CONSTRAINT `fk_ai_chats_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Announcements Table
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` VARCHAR(36) NOT NULL,
  `officer_id` VARCHAR(36) DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `body` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_announcements_officer` (`officer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

