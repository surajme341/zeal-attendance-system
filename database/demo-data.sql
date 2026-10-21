-- DEMO ONLY: import into a separate EMPTY database after schema.sql and update-features.sql.
-- Never import this into the live college database. No existing rows are modified.
START TRANSACTION;
INSERT INTO departments (id,code,name) VALUES ('demo-dept','DEMO','Demo Department');
INSERT INTO class_divisions (id,department_id,academic_year,year_level,division,semester) VALUES ('demo-class','demo-dept','2026-27','TY','A',5);
INSERT INTO system_settings (id,college_name) VALUES ('demo-settings','Zeal Attendance - DEMO');
INSERT INTO users (id,employee_id,email,password_hash,full_name,role,department_id) VALUES ('demo-admin','demo.admin','demo.admin@example.test','$2b$12$9tyQez.wUW0M0Ev11qt9/.stiml13Wb4V55EJXG7byAYKzPFFYqyq','Demo Admin','ADMIN','demo-dept');
INSERT INTO users (id,employee_id,email,password_hash,full_name,role,department_id) VALUES ('demo-faculty','demo.faculty','demo.faculty@example.test','$2b$12$9tyQez.wUW0M0Ev11qt9/.stiml13Wb4V55EJXG7byAYKzPFFYqyq','Demo Faculty','FACULTY','demo-dept');
INSERT INTO users (id,employee_id,email,password_hash,full_name,role,department_id) VALUES ('demo-hod','demo.hod','demo.hod@example.test','$2b$12$9tyQez.wUW0M0Ev11qt9/.stiml13Wb4V55EJXG7byAYKzPFFYqyq','Demo Hod','HOD','demo-dept');
INSERT INTO users (id,employee_id,email,password_hash,full_name,role,department_id) VALUES ('demo-student','demo.student','demo.student@example.test','$2b$12$9tyQez.wUW0M0Ev11qt9/.stiml13Wb4V55EJXG7byAYKzPFFYqyq','Demo Student','STUDENT','demo-dept');
INSERT INTO subjects (id,division_id,code,name) VALUES ('demo-subject','demo-class','DEMO101','Demo Subject');
INSERT INTO subject_faculty (id,subject_id,faculty_user_id) VALUES ('demo-assignment','demo-subject','demo-faculty');
INSERT INTO students (id,division_id,roll_no,full_name,email) VALUES ('demo-student-record','demo-class','demo.student','Demo Student','demo.student@example.test');
COMMIT;
