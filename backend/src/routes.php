<?php

use Slim\Routing\RouteCollectorProxy;
use App\Middleware\CorsMiddleware;
use App\Middleware\SessionTokenMiddleware;
use App\Middleware\AdminAuthMiddleware;
use App\Controllers\AuthController;
use App\Controllers\JobController;
use App\Controllers\StoreController;
use App\Controllers\ExportController;
use App\Controllers\ImportController;
use App\Controllers\WebhookController;
use App\Controllers\SystemController;
use App\Controllers\EntityController;
use App\Controllers\ScheduleController;

$app->add(new CorsMiddleware());

$app->get('/', function ($request, $response) {
    $response->getBody()->write(json_encode([
        'app' => 'Shopify Bulk Manager',
        'version' => '2.0.0',
        'status' => 'running'
    ]));
    return $response->withHeader('Content-Type', 'application/json');
});

$app->group('/api', function (RouteCollectorProxy $group) {
    
    $group->group('/auth', function (RouteCollectorProxy $auth) {
        $auth->get('/shopify', [AuthController::class, 'initiateOAuth']);
        $auth->get('/shopify/callback', [AuthController::class, 'handleCallback']);
        $auth->post('/admin/login', [AuthController::class, 'adminLogin']);
        $auth->get('/session', [AuthController::class, 'getSession'])->add(new SessionTokenMiddleware());
    });
    
    $group->group('/stores', function (RouteCollectorProxy $stores) {
        $stores->get('', [StoreController::class, 'list']);
        $stores->get('/{id}', [StoreController::class, 'get']);
        $stores->put('/{id}', [StoreController::class, 'update']);
        $stores->delete('/{id}', [StoreController::class, 'delete']);
    })->add(new SessionTokenMiddleware());
    
    $group->group('/jobs', function (RouteCollectorProxy $jobs) {
        $jobs->get('', [JobController::class, 'list']);
        $jobs->get('/{id}', [JobController::class, 'get']);
        $jobs->post('', [JobController::class, 'create']);
        $jobs->delete('/{id}', [JobController::class, 'cancel']);
    })->add(new SessionTokenMiddleware());
    
    $group->group('/export', function (RouteCollectorProxy $export) {
        $export->post('/products', [ExportController::class, 'products']);
        $export->post('/customers', [ExportController::class, 'customers']);
        $export->post('/orders', [ExportController::class, 'orders']);
        $export->get('/download/{job_id}', [ExportController::class, 'download']);
    })->add(new SessionTokenMiddleware());
    
    $group->group('/import', function (RouteCollectorProxy $import) {
        $import->post('/products', [ImportController::class, 'products']);
        $import->post('/customers', [ImportController::class, 'customers']);
        $import->post('/upload', [ImportController::class, 'upload']);
    })->add(new SessionTokenMiddleware());
    
    $group->group('/entities', function (RouteCollectorProxy $entities) {
        $entities->get('', [EntityController::class, 'getSupportedEntities']);
        $entities->post('/{entity}/export', [EntityController::class, 'exportEntity']);
        $entities->post('/{entity}/import', [EntityController::class, 'importEntity']);
        $entities->get('/{entity}/template', [EntityController::class, 'getTemplate']);
    })->add(new SessionTokenMiddleware());
    
    $group->group('/schedules', function (RouteCollectorProxy $schedules) {
        $schedules->get('', [ScheduleController::class, 'list']);
        $schedules->post('', [ScheduleController::class, 'create']);
        $schedules->get('/{id}', [ScheduleController::class, 'get']);
        $schedules->put('/{id}', [ScheduleController::class, 'update']);
        $schedules->delete('/{id}', [ScheduleController::class, 'delete']);
    })->add(new SessionTokenMiddleware());
    
    $group->group('/admin', function (RouteCollectorProxy $admin) {
        $admin->get('/stats', [StoreController::class, 'stats']);
        $admin->get('/jobs', [JobController::class, 'adminList']);
        $admin->get('/system/test', [SystemController::class, 'testSystem']);
        $admin->get('/system/health', [SystemController::class, 'getHealth']);
    })->add(new AdminAuthMiddleware());
    
    $group->get('/health', [SystemController::class, 'getHealth']);
    
    $group->post('/webhooks/{topic}', [WebhookController::class, 'handle']);
});
