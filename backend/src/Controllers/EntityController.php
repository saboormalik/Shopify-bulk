<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Job;
use App\Services\QueueService;

class EntityController
{
    private const SUPPORTED_ENTITIES = [
        'products',
        'variants',
        'smart_collections',
        'custom_collections',
        'customers',
        'companies',
        'discounts',
        'draft_orders',
        'orders',
        'payouts',
        'pages',
        'blog_posts',
        'redirects',
        'files',
        'metaobjects',
        'menus',
        'metafields',
        'shop',
        'inventory',
        'locations'
    ];

    private const READ_ONLY_ENTITIES = ['orders', 'payouts', 'shop'];

    public function exportEntity(Request $request, Response $response, array $args): Response
    {
        $entity = $args['entity'] ?? null;

        if (!in_array($entity, self::SUPPORTED_ENTITIES)) {
            $response->getBody()->write(json_encode([
                'error' => 'Unsupported entity type',
                'supported_entities' => self::SUPPORTED_ENTITIES
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $shop = $request->getAttribute('shop');
        $data = $request->getParsedBody();
        
        $jobData = [
            'shop' => $shop,
            'type' => 'export',
            'entity' => $entity,
            'params' => $data['params'] ?? [],
            'filters' => $data['filters'] ?? [],
            'format' => $data['format'] ?? 'csv',
            'schedule' => $data['schedule'] ?? null,
            'repeat' => $data['repeat'] ?? null,
            'status' => $data['schedule'] ? 'scheduled' : 'pending',
            'created_at' => new \MongoDB\BSON\UTCDateTime()
        ];
        
        $jobModel = new Job();
        $jobId = $jobModel->create($jobData);
        
        if (!$data['schedule']) {
            $queueService = new QueueService();
            $queueService->enqueue($jobId, $jobData);
        }
        
        $response->getBody()->write(json_encode([
            'job_id' => $jobId,
            'status' => $jobData['status'],
            'message' => "Export job created for {$entity}"
        ]));
        
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    public function importEntity(Request $request, Response $response, array $args): Response
    {
        $entity = $args['entity'] ?? null;

        if (!in_array($entity, self::SUPPORTED_ENTITIES)) {
            $response->getBody()->write(json_encode([
                'error' => 'Unsupported entity type'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        if (in_array($entity, self::READ_ONLY_ENTITIES)) {
            $response->getBody()->write(json_encode([
                'error' => "Entity '{$entity}' is read-only and cannot be imported"
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $shop = $request->getAttribute('shop');
        $data = $request->getParsedBody();
        
        if (empty($data['file_key'])) {
            $response->getBody()->write(json_encode(['error' => 'file_key is required']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        $jobData = [
            'shop' => $shop,
            'type' => 'import',
            'entity' => $entity,
            'file_key' => $data['file_key'],
            'params' => $data['params'] ?? [],
            'command_mode' => $data['command_mode'] ?? 'UPDATE',
            'schedule' => $data['schedule'] ?? null,
            'repeat' => $data['repeat'] ?? null,
            'status' => $data['schedule'] ? 'scheduled' : 'pending',
            'created_at' => new \MongoDB\BSON\UTCDateTime()
        ];
        
        $jobModel = new Job();
        $jobId = $jobModel->create($jobData);
        
        if (!$data['schedule']) {
            $queueService = new QueueService();
            $queueService->enqueue($jobId, $jobData);
        }
        
        $response->getBody()->write(json_encode([
            'job_id' => $jobId,
            'status' => $jobData['status'],
            'message' => "Import job created for {$entity}"
        ]));
        
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    public function getSupportedEntities(Request $request, Response $response): Response
    {
        $response->getBody()->write(json_encode([
            'entities' => self::SUPPORTED_ENTITIES,
            'read_only' => self::READ_ONLY_ENTITIES
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getTemplate(Request $request, Response $response, array $args): Response
    {
        $entity = $args['entity'] ?? null;
        $format = $request->getQueryParams()['format'] ?? 'csv';

        if (!in_array($entity, self::SUPPORTED_ENTITIES)) {
            $response->getBody()->write(json_encode(['error' => 'Unsupported entity type']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $shop = $request->getAttribute('shop');
        
        $jobData = [
            'shop' => $shop,
            'type' => 'template',
            'entity' => $entity,
            'format' => $format,
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
            'message' => "Template generation job created for {$entity}"
        ]));
        
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }
}
