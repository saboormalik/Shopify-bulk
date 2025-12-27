<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Job;
use App\Services\QueueService;
use App\Services\S3Service;

class ImportController
{
    public function products(Request $request, Response $response): Response
    {
        return $this->handleImport($request, $response, 'import', 'products');
    }
    
    public function customers(Request $request, Response $response): Response
    {
        return $this->handleImport($request, $response, 'import', 'customers');
    }
    
    private function handleImport(Request $request, Response $response, string $type, string $entity): Response
    {
        $shop = $request->getAttribute('shop');
        $data = $request->getParsedBody();
        
        if (empty($data['file_key'])) {
            $response->getBody()->write(json_encode(['error' => 'Missing file_key parameter']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        $jobData = [
            'shop' => $shop,
            'type' => $type,
            'entity' => $entity,
            'file_key' => $data['file_key'],
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
            'status' => 'queued',
            'message' => "Import job created for {$entity}"
        ]));
        
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }
    
    public function upload(Request $request, Response $response): Response
    {
        $shop = $request->getAttribute('shop');
        $uploadedFiles = $request->getUploadedFiles();
        
        if (empty($uploadedFiles['file'])) {
            $response->getBody()->write(json_encode(['error' => 'No file uploaded']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        $uploadedFile = $uploadedFiles['file'];
        
        if ($uploadedFile->getError() !== UPLOAD_ERR_OK) {
            $response->getBody()->write(json_encode(['error' => 'File upload error']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        $s3Service = new S3Service();
        $fileKey = $s3Service->uploadFile($shop, $uploadedFile);
        
        $response->getBody()->write(json_encode([
            'file_key' => $fileKey,
            'message' => 'File uploaded successfully'
        ]));
        
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }
}
