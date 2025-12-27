<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Job;
use App\Services\QueueService;

class JobController
{
    public function list(Request $request, Response $response): Response
    {
        $shop = $request->getAttribute('shop');
        $params = $request->getQueryParams();
        
        $page = (int)($params['page'] ?? 1);
        $limit = (int)($params['limit'] ?? 20);
        
        $jobModel = new Job();
        $jobs = $jobModel->findByShop($shop, $page, $limit);
        $total = $jobModel->countByShop($shop);
        
        $response->getBody()->write(json_encode([
            'jobs' => $jobs,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    public function get(Request $request, Response $response, array $args): Response
    {
        $jobId = $args['id'];
        $shop = $request->getAttribute('shop');
        
        $jobModel = new Job();
        $job = $jobModel->findById($jobId);
        
        if (!$job || $job['shop'] !== $shop) {
            $response->getBody()->write(json_encode(['error' => 'Job not found']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        
        $response->getBody()->write(json_encode(['job' => $job]));
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    public function create(Request $request, Response $response): Response
    {
        $shop = $request->getAttribute('shop');
        $data = $request->getParsedBody();
        
        $jobData = [
            'shop' => $shop,
            'type' => $data['type'],
            'entity' => $data['entity'],
            'params' => $data['params'] ?? [],
            'status' => 'pending',
            'created_at' => new \MongoDB\BSON\UTCDateTime()
        ];
        
        $jobModel = new Job();
        $jobId = $jobModel->create($jobData);
        
        $queueService = new QueueService();
        $queueService->enqueue($jobId, $jobData);
        
        $response->getBody()->write(json_encode([
            'job_id' => $jobId,
            'status' => 'queued'
        ]));
        
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }
    
    public function cancel(Request $request, Response $response, array $args): Response
    {
        $jobId = $args['id'];
        $shop = $request->getAttribute('shop');
        
        $jobModel = new Job();
        $job = $jobModel->findById($jobId);
        
        if (!$job || $job['shop'] !== $shop) {
            $response->getBody()->write(json_encode(['error' => 'Job not found']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        
        if ($job['status'] === 'completed' || $job['status'] === 'failed') {
            $response->getBody()->write(json_encode(['error' => 'Cannot cancel completed or failed job']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        $jobModel->updateStatus($jobId, 'cancelled');
        
        $response->getBody()->write(json_encode(['message' => 'Job cancelled']));
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    public function adminList(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $page = (int)($params['page'] ?? 1);
        $limit = (int)($params['limit'] ?? 50);
        
        $jobModel = new Job();
        $jobs = $jobModel->findAll($page, $limit);
        $total = $jobModel->countAll();
        
        $response->getBody()->write(json_encode([
            'jobs' => $jobs,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
}
