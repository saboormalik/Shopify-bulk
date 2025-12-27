<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Job;
use App\Services\QueueService;

class ExportController
{
    public function products(Request $request, Response $response): Response
    {
        return $this->handleExport($request, $response, 'export', 'products');
    }
    
    public function customers(Request $request, Response $response): Response
    {
        return $this->handleExport($request, $response, 'export', 'customers');
    }
    
    public function orders(Request $request, Response $response): Response
    {
        return $this->handleExport($request, $response, 'export', 'orders');
    }
    
    private function handleExport(Request $request, Response $response, string $type, string $entity): Response
    {
        $shop = $request->getAttribute('shop');
        $data = $request->getParsedBody();
        
        $jobData = [
            'shop' => $shop,
            'type' => $type,
            'entity' => $entity,
            'params' => $data['params'] ?? [],
            'format' => $data['format'] ?? 'csv',
            'status' => 'pending',
            'created_at' => new \MongoDB\BSON\UTCDateTime()
        ];
        
        $jobModel = new Job();
        $jobId = $jobModel->create($jobData);
        
        $queueService = new QueueService();
        $queueService->enqueue($jobId, $jobData);
        
        $response->getBody()->write(json_encode([
            'job_id' => $jobId,
            'status' => 'queued',
            'message' => "Export job created for {$entity}"
        ]));
        
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }
    
    public function download(Request $request, Response $response, array $args): Response
    {
        $jobId = $args['job_id'];
        $shop = $request->getAttribute('shop');
        
        $jobModel = new Job();
        $job = $jobModel->findById($jobId);
        
        if (!$job || $job['shop'] !== $shop) {
            $response->getBody()->write(json_encode(['error' => 'Job not found']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        
        if ($job['status'] !== 'completed') {
            $response->getBody()->write(json_encode(['error' => 'Job not completed yet']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        if (empty($job['file_url'])) {
            $response->getBody()->write(json_encode(['error' => 'No file available']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        
        $response->getBody()->write(json_encode([
            'download_url' => $job['file_url'],
            'filename' => $job['filename'] ?? 'export.csv'
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
}
