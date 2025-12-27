<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Store;
use App\Models\Admin;
use Firebase\JWT\JWT;

class AuthController
{
    public function initiateOAuth(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $shop = $params['shop'] ?? '';
        
        if (empty($shop)) {
            $response->getBody()->write(json_encode(['error' => 'Missing shop parameter']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        $state = bin2hex(random_bytes(16));
        $nonce = bin2hex(random_bytes(16));
        
        $_SESSION['oauth_state'] = $state;
        $_SESSION['oauth_nonce'] = $nonce;
        
        $scopes = $_ENV['SHOPIFY_SCOPES'];
        $redirectUri = $_ENV['SHOPIFY_APP_URL'] . '/api/auth/shopify/callback';
        
        $authUrl = "https://{$shop}/admin/oauth/authorize?" . http_build_query([
            'client_id' => $_ENV['SHOPIFY_API_KEY'],
            'scope' => $scopes,
            'redirect_uri' => $redirectUri,
            'state' => $state,
            'grant_options[]' => 'per-user'
        ]);
        
        return $response
            ->withHeader('Location', $authUrl)
            ->withStatus(302);
    }
    
    public function handleCallback(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $code = $params['code'] ?? '';
        $shop = $params['shop'] ?? '';
        $state = $params['state'] ?? '';
        
        if (empty($code) || empty($shop) || $state !== ($_SESSION['oauth_state'] ?? '')) {
            $response->getBody()->write(json_encode(['error' => 'Invalid OAuth callback']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        $tokenUrl = "https://{$shop}/admin/oauth/access_token";
        $client = new \GuzzleHttp\Client();
        
        try {
            $tokenResponse = $client->post($tokenUrl, [
                'json' => [
                    'client_id' => $_ENV['SHOPIFY_API_KEY'],
                    'client_secret' => $_ENV['SHOPIFY_API_SECRET'],
                    'code' => $code
                ]
            ]);
            
            $data = json_decode($tokenResponse->getBody(), true);
            $accessToken = $data['access_token'];
            
            $storeModel = new Store();
            $storeModel->upsert($shop, $accessToken);
            
            $redirectUrl = $_ENV['SHOPIFY_APP_URL'] . "?shop={$shop}&host=" . base64_encode($shop . "/admin");
            
            return $response
                ->withHeader('Location', $redirectUrl)
                ->withStatus(302);
                
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => 'OAuth failed: ' . $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getSession(Request $request, Response $response): Response
    {
        $shop = $request->getAttribute('shop');
        
        $storeModel = new Store();
        $store = $storeModel->findByShop($shop);
        
        if (!$store) {
            $response->getBody()->write(json_encode(['error' => 'Store not found']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        
        $response->getBody()->write(json_encode([
            'shop' => $shop,
            'store' => [
                'id' => (string)$store['_id'],
                'shop' => $store['shop'],
                'name' => $store['name'] ?? $shop,
                'created_at' => $store['created_at']
            ]
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    public function adminLogin(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        
        if ($email !== $_ENV['ADMIN_EMAIL'] || $password !== $_ENV['ADMIN_PASSWORD']) {
            $response->getBody()->write(json_encode(['error' => 'Invalid credentials']));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
        
        $payload = [
            'type' => 'admin',
            'admin_id' => 1,
            'email' => $email,
            'iat' => time(),
            'exp' => time() + (int)$_ENV['JWT_EXPIRATION']
        ];
        
        $token = JWT::encode($payload, $_ENV['JWT_SECRET'], $_ENV['JWT_ALGORITHM']);
        
        $response->getBody()->write(json_encode([
            'token' => $token,
            'admin' => [
                'id' => 1,
                'email' => $email
            ]
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
}
