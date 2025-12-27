<?php

namespace App\Config;

use MongoDB\Client;
use MongoDB\Database as MongoDatabase;

class Database
{
    private static ?MongoDatabase $instance = null;
    
    public static function getInstance(): MongoDatabase
    {
        if (self::$instance === null) {
            $client = new Client($_ENV['MONGODB_URI']);
            self::$instance = $client->selectDatabase($_ENV['MONGODB_DATABASE']);
        }
        
        return self::$instance;
    }
    
    public static function getCollection(string $name)
    {
        return self::getInstance()->selectCollection($name);
    }
}
