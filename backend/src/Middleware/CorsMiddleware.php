<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class CorsMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $origin = $request->getHeaderLine('Origin');
        $allowedOrigins = explode(',', $_ENV['CORS_ORIGINS']);
        
        $response = $handler->handle($request);
        
        foreach ($allowedOrigins as $allowedOrigin) {
            $pattern = str_replace('*', '.*', trim($allowedOrigin));
            if (preg_match('#^' . $pattern . '$#', $origin)) {
                $response = $response
                    ->withHeader('Access-Control-Allow-Origin', $origin)
                    ->withHeader('Access-Control-Allow-Credentials', 'true')
                    ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                    ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                break;
            }
        }
        
        return $response;
    }
}
