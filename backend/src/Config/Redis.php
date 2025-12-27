<?php

namespace App\Config;

use Predis\Client;

class Redis
{
    private static ?Client $instance = null;
    
    public static function getInstance(): Client
    {
        if (self::$instance === null) {
            self::$instance = new Client([
                'scheme' => 'tcp',
                'host'   => $_ENV['REDIS_HOST'],
                'port'   => $_ENV['REDIS_PORT'],
                'password' => $_ENV['REDIS_PASSWORD'] ?? null,
                'database' => $_ENV['REDIS_DB'] ?? 0,
            ]);
        }
        
        return self::$instance;
    }
}
