<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Slim\Psr7\Response;

class AdminAuthMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $authHeader = $request->getHeaderLine('Authorization');
        
        if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
            $response = new Response();
            $response->getBody()->write(json_encode(['error' => 'Missing authorization header']));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
        
        $token = substr($authHeader, 7);
        
        try {
            $payload = JWT::decode($token, new Key($_ENV['JWT_SECRET'], $_ENV['JWT_ALGORITHM']));
            
            if ($payload->type !== 'admin') {
                throw new \Exception('Invalid admin token');
            }
            
            $request = $request->withAttribute('admin_id', $payload->admin_id);
            $request = $request->withAttribute('admin_email', $payload->email);
            
            return $handler->handle($request);
            
        } catch (\Exception $e) {
            $response = new Response();
            $response->getBody()->write(json_encode(['error' => 'Invalid admin token']));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
    }
}
