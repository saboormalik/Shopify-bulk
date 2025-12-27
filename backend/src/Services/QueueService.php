<?php

namespace App\Services;

use App\Config\Redis;

class QueueService
{
    private $redis;
    private string $queueName = 'shopify_jobs';
    
    public function __construct()
    {
        $this->redis = Redis::getInstance();
    }
    
    public function enqueue(string $jobId, array $jobData): bool
    {
        $payload = json_encode([
            'job_id' => $jobId,
            'data' => $jobData
        ]);
        
        $this->redis->rpush($this->queueName, $payload);
        
        $this->redis->publish('job_created', $payload);
        
        return true;
    }
    
    public function getQueueLength(): int
    {
        return $this->redis->llen($this->queueName);
    }
    
    public function getJobStatus(string $jobId): ?array
    {
        $key = "job_status:{$jobId}";
        $data = $this->redis->get($key);
        
        return $data ? json_decode($data, true) : null;
    }
    
    public function setJobStatus(string $jobId, array $status): bool
    {
        $key = "job_status:{$jobId}";
        $this->redis->setex($key, 3600, json_encode($status));
        
        return true;
    }
}
