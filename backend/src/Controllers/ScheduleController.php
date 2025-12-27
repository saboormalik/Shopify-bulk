<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Schedule;
use MongoDB\BSON\ObjectId;

class ScheduleController
{
    public function create(Request $request, Response $response): Response
    {
        $shop = $request->getAttribute('shop');
        $data = $request->getParsedBody();
        
        $scheduleData = [
            'shop' => $shop,
            'name' => $data['name'] ?? 'Untitled Schedule',
            'type' => $data['type'],
            'entity' => $data['entity'],
            'action' => $data['action'],
            'params' => $data['params'] ?? [],
            'filters' => $data['filters'] ?? [],
            'schedule_type' => $data['schedule_type'],
            'schedule_time' => $data['schedule_time'] ?? null,
            'interval' => $data['interval'] ?? null,
            'day_of_week' => $data['day_of_week'] ?? null,
            'day_of_month' => $data['day_of_month'] ?? null,
            'enabled' => true,
            'last_run' => null,
            'next_run' => $this->calculateNextRun($data),
            'created_at' => new \MongoDB\BSON\UTCDateTime()
        ];
        
        $scheduleModel = new Schedule();
        $scheduleId = $scheduleModel->create($scheduleData);
        
        $response->getBody()->write(json_encode([
            'schedule_id' => $scheduleId,
            'message' => 'Schedule created successfully'
        ]));
        
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    public function list(Request $request, Response $response): Response
    {
        $shop = $request->getAttribute('shop');
        $scheduleModel = new Schedule();
        $schedules = $scheduleModel->findByShop($shop);
        
        $response->getBody()->write(json_encode([
            'schedules' => $schedules
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function get(Request $request, Response $response, array $args): Response
    {
        $shop = $request->getAttribute('shop');
        $scheduleId = $args['id'];
        
        $scheduleModel = new Schedule();
        $schedule = $scheduleModel->findById($scheduleId);
        
        if (!$schedule || $schedule['shop'] !== $shop) {
            $response->getBody()->write(json_encode(['error' => 'Schedule not found']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        
        $response->getBody()->write(json_encode($schedule));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $shop = $request->getAttribute('shop');
        $scheduleId = $args['id'];
        $data = $request->getParsedBody();
        
        $scheduleModel = new Schedule();
        $schedule = $scheduleModel->findById($scheduleId);
        
        if (!$schedule || $schedule['shop'] !== $shop) {
            $response->getBody()->write(json_encode(['error' => 'Schedule not found']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        
        $updateData = [];
        foreach (['name', 'params', 'filters', 'schedule_type', 'schedule_time', 'interval', 'enabled'] as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }
        
        if (!empty($updateData)) {
            $updateData['updated_at'] = new \MongoDB\BSON\UTCDateTime();
            $scheduleModel->update($scheduleId, $updateData);
        }
        
        $response->getBody()->write(json_encode([
            'message' => 'Schedule updated successfully'
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $shop = $request->getAttribute('shop');
        $scheduleId = $args['id'];
        
        $scheduleModel = new Schedule();
        $schedule = $scheduleModel->findById($scheduleId);
        
        if (!$schedule || $schedule['shop'] !== $shop) {
            $response->getBody()->write(json_encode(['error' => 'Schedule not found']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        
        $scheduleModel->delete($scheduleId);
        
        $response->getBody()->write(json_encode([
            'message' => 'Schedule deleted successfully'
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }

    private function calculateNextRun(array $data): \MongoDB\BSON\UTCDateTime
    {
        $now = new \DateTime('now', new \DateTimeZone('UTC'));
        
        switch ($data['schedule_type']) {
            case 'once':
                $nextRun = new \DateTime($data['schedule_time'], new \DateTimeZone('UTC'));
                break;
            
            case 'daily':
                $nextRun = clone $now;
                $nextRun->modify('+1 day');
                break;
            
            case 'weekly':
                $nextRun = clone $now;
                $nextRun->modify('+1 week');
                break;
            
            case 'monthly':
                $nextRun = clone $now;
                $nextRun->modify('+1 month');
                break;
            
            case 'custom':
                $nextRun = clone $now;
                $nextRun->modify("+{$data['interval']} minutes");
                break;
            
            default:
                $nextRun = $now;
        }
        
        return new \MongoDB\BSON\UTCDateTime($nextRun->getTimestamp() * 1000);
    }
}
