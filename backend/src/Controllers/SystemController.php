<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use MongoDB\Client as MongoClient;
use Predis\Client as RedisClient;
use Aws\S3\S3Client;
use PHPMailer\PHPMailer\PHPMailer;

class SystemController
{
    public function testSystem(Request $request, Response $response): Response
    {
        $results = [
            'timestamp' => date('Y-m-d H:i:s'),
            'tests' => []
        ];
        
        $results['tests']['mongodb'] = $this->testMongoDB();
        $results['tests']['redis'] = $this->testRedis();
        $results['tests']['s3'] = $this->testS3();
        $results['tests']['disk'] = $this->testDisk();
        $results['tests']['php'] = $this->testPHP();
        
        $allPassed = true;
        foreach ($results['tests'] as $test) {
            if ($test['status'] !== 'ok') {
                $allPassed = false;
                break;
            }
        }
        
        $results['overall'] = $allPassed ? 'healthy' : 'unhealthy';
        
        $response->getBody()->write(json_encode($results, JSON_PRETTY_PRINT));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($allPassed ? 200 : 503);
    }
    
    public function getHealth(Request $request, Response $response): Response
    {
        $health = [
            'timestamp' => date('Y-m-d H:i:s'),
            'status' => 'ok',
            'uptime' => $this->getUptime(),
            'memory' => [
                'used' => memory_get_usage(true),
                'used_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
                'peak' => memory_get_peak_usage(true),
                'peak_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
                'limit' => ini_get('memory_limit')
            ],
            'load' => sys_getloadavg(),
            'services' => [
                'mongodb' => $this->quickCheckMongoDB(),
                'redis' => $this->quickCheckRedis()
            ]
        ];
        
        $isHealthy = $health['services']['mongodb'] && $health['services']['redis'];
        
        if (!$isHealthy) {
            $this->sendAlert('System Health Alert', json_encode($health, JSON_PRETTY_PRINT));
        }
        
        $response->getBody()->write(json_encode($health, JSON_PRETTY_PRINT));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($isHealthy ? 200 : 503);
    }
    
    private function testMongoDB(): array
    {
        try {
            $client = new MongoClient($_ENV['MONGODB_URI']);
            $db = $client->selectDatabase($_ENV['MONGODB_DATABASE']);
            
            $result = $db->command(['ping' => 1]);
            
            $collections = iterator_to_array($db->listCollections());
            
            return [
                'status' => 'ok',
                'message' => 'Connected successfully',
                'database' => $_ENV['MONGODB_DATABASE'],
                'collections_count' => count($collections),
                'response_time_ms' => 0
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
    
    private function testRedis(): array
    {
        try {
            $redis = new RedisClient([
                'scheme' => 'tcp',
                'host' => $_ENV['REDIS_HOST'],
                'port' => $_ENV['REDIS_PORT'],
                'password' => $_ENV['REDIS_PASSWORD'] ?? null
            ]);
            
            $start = microtime(true);
            $redis->ping();
            $responseTime = round((microtime(true) - $start) * 1000, 2);
            
            $redis->set('health_check', time(), 'EX', 60);
            $value = $redis->get('health_check');
            
            $info = $redis->info();
            
            return [
                'status' => 'ok',
                'message' => 'Connected successfully',
                'response_time_ms' => $responseTime,
                'memory_used_mb' => isset($info['Memory']['used_memory']) ? 
                    round($info['Memory']['used_memory'] / 1024 / 1024, 2) : 'N/A'
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
    
    private function testS3(): array
    {
        try {
            $s3 = new S3Client([
                'version' => 'latest',
                'region' => $_ENV['AWS_REGION'],
                'credentials' => [
                    'key' => $_ENV['AWS_ACCESS_KEY_ID'],
                    'secret' => $_ENV['AWS_SECRET_ACCESS_KEY']
                ]
            ]);
            
            $start = microtime(true);
            $result = $s3->headBucket([
                'Bucket' => $_ENV['AWS_S3_BUCKET']
            ]);
            $responseTime = round((microtime(true) - $start) * 1000, 2);
            
            return [
                'status' => 'ok',
                'message' => 'Bucket accessible',
                'bucket' => $_ENV['AWS_S3_BUCKET'],
                'region' => $_ENV['AWS_REGION'],
                'response_time_ms' => $responseTime
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
    
    private function testDisk(): array
    {
        try {
            $path = __DIR__ . '/../../';
            $total = disk_total_space($path);
            $free = disk_free_space($path);
            $used = $total - $free;
            $usedPercent = round(($used / $total) * 100, 2);
            
            return [
                'status' => $usedPercent > 90 ? 'warning' : 'ok',
                'message' => 'Disk space checked',
                'total_gb' => round($total / 1024 / 1024 / 1024, 2),
                'free_gb' => round($free / 1024 / 1024 / 1024, 2),
                'used_gb' => round($used / 1024 / 1024 / 1024, 2),
                'used_percent' => $usedPercent
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
    
    private function testPHP(): array
    {
        return [
            'status' => 'ok',
            'version' => PHP_VERSION,
            'extensions' => [
                'mongodb' => extension_loaded('mongodb'),
                'redis' => extension_loaded('redis'),
                'curl' => extension_loaded('curl'),
                'openssl' => extension_loaded('openssl'),
                'mbstring' => extension_loaded('mbstring')
            ],
            'max_execution_time' => ini_get('max_execution_time'),
            'memory_limit' => ini_get('memory_limit'),
            'upload_max_filesize' => ini_get('upload_max_filesize')
        ];
    }
    
    private function quickCheckMongoDB(): bool
    {
        try {
            $client = new MongoClient($_ENV['MONGODB_URI']);
            $db = $client->selectDatabase($_ENV['MONGODB_DATABASE']);
            $db->command(['ping' => 1]);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
    
    private function quickCheckRedis(): bool
    {
        try {
            $redis = new RedisClient([
                'scheme' => 'tcp',
                'host' => $_ENV['REDIS_HOST'],
                'port' => $_ENV['REDIS_PORT'],
                'password' => $_ENV['REDIS_PASSWORD'] ?? null
            ]);
            $redis->ping();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
    
    private function getUptime(): string
    {
        if (file_exists('/proc/uptime')) {
            $uptime = file_get_contents('/proc/uptime');
            $uptime = explode(' ', $uptime)[0];
            $days = floor($uptime / 86400);
            $hours = floor(($uptime % 86400) / 3600);
            $minutes = floor(($uptime % 3600) / 60);
            return "{$days}d {$hours}h {$minutes}m";
        }
        return 'N/A';
    }
    
    private function sendAlert(string $subject, string $body): void
    {
        try {
            if (!isset($_ENV['SMTP_HOST']) || !isset($_ENV['ALERT_EMAIL'])) {
                error_log("SMTP or alert email not configured");
                return;
            }
            
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $_ENV['SMTP_HOST'];
            $mail->SMTPAuth = true;
            $mail->Username = $_ENV['SMTP_USERNAME'];
            $mail->Password = $_ENV['SMTP_PASSWORD'];
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = $_ENV['SMTP_PORT'];
            
            $mail->setFrom($_ENV['SMTP_FROM_EMAIL'], $_ENV['SMTP_FROM_NAME']);
            $mail->addAddress($_ENV['ALERT_EMAIL']);
            
            $mail->Subject = $subject;
            $mail->Body = $body;
            $mail->isHTML(false);
            
            $mail->send();
        } catch (\Exception $e) {
            error_log("Failed to send alert email: " . $e->getMessage());
        }
    }
}
