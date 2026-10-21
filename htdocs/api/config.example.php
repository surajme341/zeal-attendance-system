<?php
return [
    'allowed_email_domains' => ['zcoer.in'], // Admin-approved college accounts only; confirm actual domains.
    'db_host' => 'YOUR_DATABASE_HOST',
    'db_name' => 'YOUR_DATABASE_NAME',
    'db_user' => 'YOUR_DATABASE_USERNAME',
    'db_password' => 'YOUR_DATABASE_PASSWORD',
    // Set both keys to separate random strings of at least 32 characters.
    'auth_secret' => 'CHANGE_TO_A_RANDOM_STRING_AT_LEAST_32_CHARACTERS',
    'setup_key' => 'CHANGE_TO_A_DIFFERENT_RANDOM_STRING_AT_LEAST_32_CHARACTERS',
    'face_service_url' => '', // Example: https://your-face-server.example.com/engine
    'face_service_key' => '', // Same FACE_SERVICE_KEY as the Python service.
];
