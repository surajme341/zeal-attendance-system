-- Additive, rerunnable migration. Back up the database before importing.
-- Does not overwrite students, attendance, users, settings or face enrollments.
SET NAMES utf8mb4;
CREATE TABLE IF NOT EXISTS portal_requests (
 id VARCHAR(191) PRIMARY KEY, kind VARCHAR(32) NOT NULL, student_id VARCHAR(191) NOT NULL,
 department_id VARCHAR(191) NOT NULL, title VARCHAR(191) NOT NULL, description TEXT NOT NULL,
 start_date DATE NULL, end_date DATE NULL, status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
 created_by VARCHAR(191) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 INDEX(department_id,kind,status), INDEX(student_id),
 FOREIGN KEY(student_id) REFERENCES students(id), FOREIGN KEY(department_id) REFERENCES departments(id),
 FOREIGN KEY(created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_request_remarks (
 id VARCHAR(191) PRIMARY KEY, request_id VARCHAR(191) NOT NULL, author_id VARCHAR(191) NOT NULL,
 remark TEXT NOT NULL, new_status VARCHAR(32) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(request_id) REFERENCES portal_requests(id), FOREIGN KEY(author_id) REFERENCES users(id), INDEX(request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS discipline_incidents (
 id VARCHAR(191) PRIMARY KEY, department_id VARCHAR(191) NOT NULL, category VARCHAR(32) NOT NULL,
 incident_date DATE NOT NULL, location VARCHAR(191) NOT NULL, description TEXT NOT NULL,
 action_taken TEXT NOT NULL, created_by VARCHAR(191) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(department_id) REFERENCES departments(id), FOREIGN KEY(created_by) REFERENCES users(id), INDEX(department_id,incident_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS discipline_students (
 incident_id VARCHAR(191) NOT NULL, student_id VARCHAR(191) NOT NULL,
 PRIMARY KEY(incident_id,student_id), FOREIGN KEY(incident_id) REFERENCES discipline_incidents(id),
 FOREIGN KEY(student_id) REFERENCES students(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Existing faculty/HOD without department assignments remain blocked until Admin assigns them in Accounts.
