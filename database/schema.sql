-- Import into a newly created, empty InfinityFree MySQL database.

SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS `departments` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `board` VARCHAR(191) NOT NULL DEFAULT 'MSBTE',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `class_divisions` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `department_id` VARCHAR(191) NOT NULL,
  `academic_year` VARCHAR(191) NOT NULL,
  `year_level` VARCHAR(191) NOT NULL,
  `division` VARCHAR(191) NOT NULL,
  `semester` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `employee_id` VARCHAR(191),
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(191) NOT NULL,
  `full_name` VARCHAR(191) NOT NULL,
  `role` VARCHAR(191) NOT NULL,
  `department_id` VARCHAR(191),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (`email`),
  UNIQUE (`employee_id`),
  FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subjects` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `division_id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `credits` INT DEFAULT 3,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`division_id`) REFERENCES `class_divisions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subject_faculty` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `subject_id` VARCHAR(191) NOT NULL,
  `faculty_user_id` VARCHAR(191) NOT NULL,
  UNIQUE (`subject_id`,`faculty_user_id`),
  FOREIGN KEY (`faculty_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `students` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `division_id` VARCHAR(191) NOT NULL,
  `roll_no` VARCHAR(191) NOT NULL,
  `prn` VARCHAR(191),
  `full_name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191),
  `phone` VARCHAR(191),
  `guardian_phone` VARCHAR(191),
  `photo_url` LONGTEXT,
  `is_active` INT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` DATETIME,
  `deleted_by` VARCHAR(191),
  UNIQUE (`division_id`,`roll_no`),
  UNIQUE (`prn`),
  FOREIGN KEY (`division_id`) REFERENCES `class_divisions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `holiday_calendar` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `event_date` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `is_instructional_day` INT DEFAULT 0,
  `description` LONGTEXT,
  UNIQUE (`event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `attendance_sessions` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `subject_id` VARCHAR(191) NOT NULL,
  `division_id` VARCHAR(191) NOT NULL,
  `faculty_user_id` VARCHAR(191) NOT NULL,
  `session_date` VARCHAR(191) NOT NULL,
  `lecture_slot` VARCHAR(191) NOT NULL,
  `room_no` VARCHAR(191) DEFAULT 'Classroom 204',
  `status` VARCHAR(191) NOT NULL DEFAULT 'SUBMITTED',
  `source` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `locked_at` DATETIME,
  `uploaded_image_reference` LONGTEXT,
  `total_faces` INT DEFAULT 0,
  `recognized_faces` INT DEFAULT 0,
  `unknown_faces` INT DEFAULT 0,
  UNIQUE (`subject_id`,`division_id`,`session_date`,`lecture_slot`),
  FOREIGN KEY (`faculty_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`division_id`) REFERENCES `class_divisions` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `attendance_audit_logs` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `record_id` VARCHAR(191) NOT NULL,
  `session_id` VARCHAR(191) NOT NULL,
  `student_id` VARCHAR(191) NOT NULL,
  `previous_status` VARCHAR(191) NOT NULL,
  `new_status` VARCHAR(191) NOT NULL,
  `changed_by_user_id` VARCHAR(191) NOT NULL,
  `reason` LONGTEXT NOT NULL,
  `changed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `critical_threshold` DOUBLE NOT NULL DEFAULT 60.0,
  `warning_threshold` DOUBLE NOT NULL DEFAULT 75.0,
  `edit_window_hours` INT NOT NULL DEFAULT 24,
  `allow_faculty_late_marking` INT NOT NULL DEFAULT 1,
  `college_name` VARCHAR(191) NOT NULL DEFAULT 'Zeal College of Engineering and Research, Pune',
  `department_name` VARCHAR(191) NOT NULL DEFAULT 'Department of Electronics and Telecommunication (E&TC)',
  `board_name` VARCHAR(191) NOT NULL DEFAULT 'MSBTE (Maharashtra State Board of Technical Education)',
  `face_match_threshold` DOUBLE DEFAULT 0.70,
  `min_face_quality` DOUBLE DEFAULT 0.60,
  `max_image_size_mb` INT DEFAULT 10,
  `duplicate_protection` INT DEFAULT 1,
  `require_confirmation` INT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `biometric_consents` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `student_id` VARCHAR(191) NOT NULL,
  `consent_granted` INT NOT NULL DEFAULT 1,
  `consent_document_version` VARCHAR(191) NOT NULL DEFAULT '1.0-DPDP-2023',
  `ip_address` VARCHAR(191),
  `signed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (`student_id`),
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `face_enrollments` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `student_id` VARCHAR(191) NOT NULL,
  `photo_count` INT NOT NULL DEFAULT 0,
  `encrypted_embedding` LONGTEXT,
  `enrolled_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `face_embedding` LONGTEXT,
  `face_image_reference` LONGTEXT,
  `face_quality` DOUBLE DEFAULT 1.0,
  `status` VARCHAR(191) DEFAULT 'ENROLLED',
  `enrolled_by` VARCHAR(191),
  UNIQUE (`student_id`),
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `biometric_audit_logs` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `action` VARCHAR(191) NOT NULL,
  `student_id` VARCHAR(191),
  `user_id` VARCHAR(191) NOT NULL,
  `details` LONGTEXT NOT NULL,
  `ip_address` VARCHAR(191),
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `attendance_records` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `session_id` VARCHAR(191) NOT NULL,
  `student_id` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `marked_by_user_id` VARCHAR(191) NOT NULL,
  `marked_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `recognition_confidence` DOUBLE,
  `attendance_method` VARCHAR(191) DEFAULT 'MANUAL',
  `original_status` VARCHAR(191),
  `original_method` VARCHAR(191),
  `modified_by` VARCHAR(191),
  `modified_at` DATETIME,
  UNIQUE (`session_id`,`student_id`),
  FOREIGN KEY (`marked_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`session_id`) REFERENCES `attendance_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `student_audit_logs` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `action` VARCHAR(191) NOT NULL,
  `student_id` VARCHAR(191),
  `student_name` VARCHAR(191) NOT NULL,
  `student_roll` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `user_name` VARCHAR(191) NOT NULL,
  `role` VARCHAR(191) NOT NULL,
  `details` LONGTEXT,
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_attempts (id VARCHAR(64) PRIMARY KEY,bucket VARCHAR(64) NOT NULL,attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,INDEX(bucket,attempted_at)) ENGINE=InnoDB;

CREATE INDEX idx_attendance_sessions_session_date ON `attendance_sessions` (`session_date`);

CREATE INDEX idx_attendance_sessions_division_id ON `attendance_sessions` (`division_id`);

CREATE INDEX idx_attendance_sessions_subject_id ON `attendance_sessions` (`subject_id`);

CREATE INDEX idx_attendance_records_session_id ON `attendance_records` (`session_id`);

CREATE INDEX idx_attendance_records_student_id ON `attendance_records` (`student_id`);

CREATE INDEX idx_attendance_audit_logs_record_id ON `attendance_audit_logs` (`record_id`);

CREATE INDEX idx_student_audit_logs_student_id ON `student_audit_logs` (`student_id`);

SET FOREIGN_KEY_CHECKS=1;