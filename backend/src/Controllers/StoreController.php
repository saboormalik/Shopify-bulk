<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Store;

class StoreController
{
    public function list(Request $request, Response $response): Response
    {
        $shop = $request->getAttribute('shop');
        
        $storeModel = new Store();
        $store = $storeModel->findByShop($shop);
        
        $response->getBody()->write(json_encode(['stores' => [$store]]));
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    public function get(Request $request, Response $response, array $args): Response
    {
        $storeId = $args['id'];
        $shop = $request->getAttribute('shop');
        
        $storeModel = new Store();
        $store = $storeModel->findById($storeId);
        
        if (!$store || $store['shop'] !== $shop) {
            $response->getBody()->write(json_encode(['error' => 'Store not found']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        
        $response->getBody()->write(json_encode(['store' => $store]));
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    public function update(Request $request, Response $response, array $args): Response
    {
        $storeId = $args['id'];
        $shop = $request->getAttribute('shop');
        $data = $request->getParsedBody();
        
        $storeModel = new Store();
        $store = $storeModel->findById($storeId);
        
        if (!$store || $store['shop'] !== $shop) {
            $response->getBody()->write(json_encode(['error' => 'Store not found']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        
        $storeModel->update($storeId, $data);
        
        $response->getBody()->write(json_encode(['message' => 'Store updated']));
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    public function delete(Request $request, Response $response, array $args): Response
    {
        $storeId = $args['id'];
        $shop = $request->getAttribute('shop');
        
        $storeModel = new Store();
        $store = $storeModel->findById($storeId);
        
        if (!$store || $store['shop'] !== $shop) {
            $response->getBody()->write(json_encode(['error' => 'Store not found']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        
        $storeModel->delete($storeId);
        
        $response->getBody()->write(json_encode(['message' => 'Store deleted']));
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    public function stats(Request $request, Response $response): Response
    {
        $storeModel = new Store();
        $stats = $storeModel->getStats();
        
        $response->getBody()->write(json_encode($stats));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
