<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Slim\Psr7\Response;

class SessionTokenMiddleware implements MiddlewareInterface
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
            $payload = JWT::decode($token, new Key($_ENV['SHOPIFY_API_SECRET'], 'HS256'));
            
            $shop = str_replace('https://', '', $payload->dest ?? '');
            
            if (empty($shop)) {
                throw new \Exception('Invalid shop in session token');
            }
            
            $request = $request->withAttribute('shop', $shop);
            $request = $request->withAttribute('user_id', $payload->sub ?? null);
            $request = $request->withAttribute('session_payload', $payload);
            
            return $handler->handle($request);
            
        } catch (\Exception $e) {
            $response = new Response();
            $response->getBody()->write(json_encode(['error' => 'Invalid session token: ' . $e->getMessage()]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
    }
}
