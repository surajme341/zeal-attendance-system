<?php
return [
    'allowed_email_domains' => ['zcoer.in'], // Admin-approved college accounts only; confirm actual domains.
    'db_host' => 'COPY_MYSQL_HOSTNAME_FROM_CONTROL_PANEL',
    'db_name' => 'COPY_FULL_DATABASE_NAME',
    'db_user' => 'COPY_DATABASE_USERNAME',
    'db_password' => 'COPY_HOSTING_CONTROL_PANEL_PASSWORD',
    // Set both keys to separate random strings of at least 32 characters.
    'auth_secret' => 'CHANGE_TO_A_RANDOM_STRING_AT_LEAST_32_CHARACTERS',
    'setup_key' => 'CHANGE_TO_A_DIFFERENT_RANDOM_STRING_AT_LEAST_32_CHARACTERS',
    'face_service_url' => '', // Example: https://your-face-server.example.com/engine
    'face_service_key' => '', // Same FACE_SERVICE_KEY as the Python service.
];
