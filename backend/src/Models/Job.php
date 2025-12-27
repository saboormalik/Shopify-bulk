<?php

namespace App\Models;

use App\Config\Database;
use MongoDB\BSON\ObjectId;

class Job
{
    private $collection;
    
    public function __construct()
    {
        $this->collection = Database::getCollection('jobs');
    }
    
    public function create(array $data): string
    {
        $result = $this->collection->insertOne($data);
        return (string)$result->getInsertedId();
    }
    
    public function findById(string $id): ?array
    {
        try {
            $result = $this->collection->findOne(['_id' => new ObjectId($id)]);
            return $result ? $this->formatDocument($result) : null;
        } catch (\Exception $e) {
            return null;
        }
    }
    
    public function findByShop(string $shop, int $page = 1, int $limit = 20): array
    {
        $skip = ($page - 1) * $limit;
        
        $cursor = $this->collection->find(
            ['shop' => $shop],
            [
                'sort' => ['created_at' => -1],
                'skip' => $skip,
                'limit' => $limit
            ]
        );
        
        $jobs = [];
        foreach ($cursor as $doc) {
            $jobs[] = $this->formatDocument($doc);
        }
        
        return $jobs;
    }
    
    public function findAll(int $page = 1, int $limit = 50): array
    {
        $skip = ($page - 1) * $limit;
        
        $cursor = $this->collection->find(
            [],
            [
                'sort' => ['created_at' => -1],
                'skip' => $skip,
                'limit' => $limit
            ]
        );
        
        $jobs = [];
        foreach ($cursor as $doc) {
            $jobs[] = $this->formatDocument($doc);
        }
        
        return $jobs;
    }
    
    public function countByShop(string $shop): int
    {
        return $this->collection->countDocuments(['shop' => $shop]);
    }
    
    public function countAll(): int
    {
        return $this->collection->countDocuments([]);
    }
    
    public function updateStatus(string $id, string $status, array $additionalData = []): bool
    {
        $updateData = array_merge(
            ['status' => $status, 'updated_at' => new \MongoDB\BSON\UTCDateTime()],
            $additionalData
        );
        
        $result = $this->collection->updateOne(
            ['_id' => new ObjectId($id)],
            ['$set' => $updateData]
        );
        
        return $result->getModifiedCount() > 0;
    }
    
    public function updateProgress(string $id, int $progress, string $message = ''): bool
    {
        $updateData = [
            'progress' => $progress,
            'updated_at' => new \MongoDB\BSON\UTCDateTime()
        ];
        
        if (!empty($message)) {
            $updateData['progress_message'] = $message;
        }
        
        $result = $this->collection->updateOne(
            ['_id' => new ObjectId($id)],
            ['$set' => $updateData]
        );
        
        return $result->getModifiedCount() > 0;
    }
    
    private function formatDocument($document): array
    {
        $document['_id'] = (string)$document['_id'];
        
        if (isset($document['created_at'])) {
            $document['created_at'] = $document['created_at']->toDateTime()->format('Y-m-d H:i:s');
        }
        
        if (isset($document['updated_at'])) {
            $document['updated_at'] = $document['updated_at']->toDateTime()->format('Y-m-d H:i:s');
        }
        
        return (array)$document;
    }
}
