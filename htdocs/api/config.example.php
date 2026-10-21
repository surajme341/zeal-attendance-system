<?php
return [
    'allowed_email_domains' => ['zcoer.in'], // Admin-approved college accounts only; confirm actual domains.
    'db_host' => 'sql206.infinityfree.com',
    'db_name' => 'if0_42881911_gitattendance',
    'db_user' => 'if0_42881911',
    'db_password' => 'Suraj341',
    // Set both keys to separate random strings of at least 32 characters.
    'auth_secret' => 'CHANGE_TO_A_RANDOM_STRING_AT_LEAST_32_CHARACTERS',
    'setup_key' => 'CHANGE_TO_A_DIFFERENT_RANDOM_STRING_AT_LEAST_32_CHARACTERS',
    'face_service_url' => '', // Example: https://your-face-server.example.com/engine
    'face_service_key' => '', // Same FACE_SERVICE_KEY as the Python service.
];
