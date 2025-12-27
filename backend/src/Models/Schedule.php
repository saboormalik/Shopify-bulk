<?php

namespace App\Models;

use App\Config\Database;
use MongoDB\BSON\ObjectId;

class Schedule
{
    private $collection;

    public function __construct()
    {
        $db = Database::getInstance();
        $this->collection = $db->schedules;
    }

    public function create(array $data): string
    {
        $result = $this->collection->insertOne($data);
        return (string) $result->getInsertedId();
    }

    public function findById(string $id)
    {
        $result = $this->collection->findOne(['_id' => new ObjectId($id)]);
        if ($result) {
            $result['_id'] = (string) $result['_id'];
        }
        return $result;
    }

    public function findByShop(string $shop): array
    {
        $cursor = $this->collection->find(
            ['shop' => $shop],
            ['sort' => ['created_at' => -1]]
        );
        
        $schedules = [];
        foreach ($cursor as $doc) {
            $doc['_id'] = (string) $doc['_id'];
            $schedules[] = $doc;
        }
        
        return $schedules;
    }

    public function findDueSchedules(): array
    {
        $now = new \MongoDB\BSON\UTCDateTime();
        
        $cursor = $this->collection->find([
            'enabled' => true,
            'next_run' => ['$lte' => $now]
        ]);
        
        $schedules = [];
        foreach ($cursor as $doc) {
            $doc['_id'] = (string) $doc['_id'];
            $schedules[] = $doc;
        }
        
        return $schedules;
    }

    public function update(string $id, array $data): bool
    {
        $result = $this->collection->updateOne(
            ['_id' => new ObjectId($id)],
            ['$set' => $data]
        );
        
        return $result->getModifiedCount() > 0;
    }

    public function delete(string $id): bool
    {
        $result = $this->collection->deleteOne(['_id' => new ObjectId($id)]);
        return $result->getDeletedCount() > 0;
    }
}
