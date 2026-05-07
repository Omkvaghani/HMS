<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(array_map('trim', explode(',', env(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173'
    )))),

    'allowed_origins_patterns' => [
        // Allow any subdomain of the configured booking-engine host (e.g. *.localhost:5173).
        '#^https?://([a-z0-9-]+\.)?'.preg_quote(env('BOOKING_ENGINE_HOST', 'localhost'), '#').'(:\d+)?$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
