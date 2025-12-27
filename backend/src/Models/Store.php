<?php

namespace App\Models;

use App\Config\Database;
use MongoDB\BSON\ObjectId;

class Store
{
    private $collection;
    
    public function __construct()
    {
        $this->collection = Database::getCollection('stores');
    }
    
    public function findByShop(string $shop): ?array
    {
        $result = $this->collection->findOne(['shop' => $shop]);
        return $result ? $this->formatDocument($result) : null;
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
    
    public function upsert(string $shop, string $accessToken): string
    {
        $data = [
            'shop' => $shop,
            'access_token' => $accessToken,
            'is_active' => true,
            'updated_at' => new \MongoDB\BSON\UTCDateTime()
        ];
        
        $result = $this->collection->updateOne(
            ['shop' => $shop],
            [
                '$set' => $data,
                '$setOnInsert' => ['created_at' => new \MongoDB\BSON\UTCDateTime()]
            ],
            ['upsert' => true]
        );
        
        if ($result->getUpsertedId()) {
            return (string)$result->getUpsertedId();
        }
        
        $store = $this->findByShop($shop);
        return $store['_id'];
    }
    
    public function update(string $id, array $data): bool
    {
        $result = $this->collection->updateOne(
            ['_id' => new ObjectId($id)],
            ['$set' => array_merge($data, ['updated_at' => new \MongoDB\BSON\UTCDateTime()])]
        );
        
        return $result->getModifiedCount() > 0;
    }
    
    public function delete(string $id): bool
    {
        $result = $this->collection->deleteOne(['_id' => new ObjectId($id)]);
        return $result->getDeletedCount() > 0;
    }
    
    public function markUninstalled(string $shop): bool
    {
        $result = $this->collection->updateOne(
            ['shop' => $shop],
            [
                '$set' => [
                    'is_active' => false,
                    'uninstalled_at' => new \MongoDB\BSON\UTCDateTime()
                ]
            ]
        );
        
        return $result->getModifiedCount() > 0;
    }
    
    public function updateShopInfo(string $shop, array $data): bool
    {
        $updateData = [
            'name' => $data['name'] ?? null,
            'email' => $data['email'] ?? null,
            'domain' => $data['domain'] ?? null,
            'updated_at' => new \MongoDB\BSON\UTCDateTime()
        ];
        
        $result = $this->collection->updateOne(
            ['shop' => $shop],
            ['$set' => array_filter($updateData, fn($v) => $v !== null)]
        );
        
        return $result->getModifiedCount() > 0;
    }
    
    public function getStats(): array
    {
        $totalStores = $this->collection->countDocuments([]);
        $activeStores = $this->collection->countDocuments(['is_active' => true]);
        
        return [
            'total_stores' => $totalStores,
            'active_stores' => $activeStores,
            'inactive_stores' => $totalStores - $activeStores
        ];
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
        
        unset($document['access_token']);
        
        return (array)$document;
    }
}
