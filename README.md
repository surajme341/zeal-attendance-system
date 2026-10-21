# Zeal Attendance System

React/TypeScript frontend, PHP 8 + MySQL API, and a Python face-recognition service.
Includes role-based Admin, HOD, Faculty and Student portals, attendance reports,
student management, leave/complaint workflows and discipline records.

## Project structure

- `source/client/`: editable React frontend.
- `htdocs/`: prebuilt frontend and PHP API for Apache/InfinityFree.
- `database/schema.sql`: empty database structure.
- `database/update-features.sql`: workflow and discipline tables.
- `database/demo-data.sql`: synthetic demo accounts and one sample student.
- `face-service/`: Python API and model downloader.

## Separate demo installation

1. Create a **new, empty demo MySQL database**, separate from your live college database.
2. Import `database/schema.sql`, then `database/update-features.sql`, then `database/demo-data.sql`, in that order. Import the seed once only.
3. Upload the contents of `htdocs/` to a separate PHP-enabled demo host/folder.
4. Copy `htdocs/api/config.example.php` to `htdocs/api/config.php` on the host. Enter the **demo database** connection settings.
5. Set `allowed_email_domains` to `['example.test']` for this demo installation. These are synthetic email addresses; no email delivery is needed.
6. Set `auth_secret` to a new random secret of at least 32 characters and set `setup_key` to an empty string. Keep config.php out of Git.
7. Open the demo site's login page and use an account below.

| Role | User ID | Password |
| --- | --- | --- |
| Admin | `demo.admin` | `ZealDemo@2026!` |
| Faculty | `demo.faculty` | `ZealDemo@2026!` |
| HOD | `demo.hod` | `ZealDemo@2026!` |
| Student | `demo.student` | `ZealDemo@2026!` |

These intentionally shared demo credentials work only after installing the seed and configuring the demo database. They do not change or access the live college accounts. The demo Admin can edit the demo database. Do not import real student data into this installation. The sample contains no enrolled face, so face matching requires separate consented test enrollment and a running face service.

## Frontend development

```sh
cd source/client
npm ci
npm run build
```

Copy the contents of `source/client/dist/` into `htdocs/`, preserving `api/` and `uploads/`, then upload the updated files. The frontend calls `/api` on the same origin. GitHub stores this project; GitHub Pages cannot run the PHP API, MySQL database or Python service.

## Face service

Large model binaries are not committed. Run `python download_models.py` in `face-service/` to download the OpenCV models, or build its Dockerfile, which downloads them during the build. Configure the Python service's `FACE_SERVICE_KEY` and matching PHP `face_service_key`, and set `face_service_url` to the deployed `/engine` endpoint. Review upstream OpenCV model license terms before redistribution.

## Repository preparation

Prepared from the uploaded attendance project, feature update and face-service package. Real database exports, student photos, hosting configuration and original account lists are excluded. The prebuilt frontend is included as supplied; it has not been rebuilt in this environment. Demo bcrypt hashes were checked locally, but end-to-end login requires a PHP/MySQL deployment and has not yet been tested here.
