<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Store;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

class WebhookController
{
    private Logger $logger;
    
    public function __construct()
    {
        $this->logger = new Logger('webhooks');
        $this->logger->pushHandler(new StreamHandler(__DIR__ . '/../../logs/webhooks.log', Logger::INFO));
    }
    
    public function handle(Request $request, Response $response, array $args): Response
    {
        $topic = $args['topic'];
        $shop = $request->getHeaderLine('X-Shopify-Shop-Domain');
        $hmac = $request->getHeaderLine('X-Shopify-Hmac-Sha256');
        
        $body = (string)$request->getBody();
        
        if (!$this->verifyWebhook($body, $hmac)) {
            $this->logger->warning('Invalid webhook signature', ['shop' => $shop, 'topic' => $topic]);
            $response->getBody()->write(json_encode(['error' => 'Invalid signature']));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
        
        $data = json_decode($body, true);
        
        $this->logger->info('Webhook received', [
            'shop' => $shop,
            'topic' => $topic,
            'data' => $data
        ]);
        
        switch ($topic) {
            case 'app-uninstalled':
                $this->handleAppUninstalled($shop, $data);
                break;
                
            case 'shop-update':
                $this->handleShopUpdate($shop, $data);
                break;
                
            default:
                $this->logger->warning('Unknown webhook topic', ['topic' => $topic]);
        }
        
        $response->getBody()->write(json_encode(['status' => 'received']));
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    private function verifyWebhook(string $body, string $hmac): bool
    {
        $calculatedHmac = base64_encode(hash_hmac('sha256', $body, $_ENV['SHOPIFY_API_SECRET'], true));
        return hash_equals($calculatedHmac, $hmac);
    }
    
    private function handleAppUninstalled(string $shop, array $data): void
    {
        $this->logger->info('App uninstalled', ['shop' => $shop]);
        
        $storeModel = new Store();
        $storeModel->markUninstalled($shop);
    }
    
    private function handleShopUpdate(string $shop, array $data): void
    {
        $this->logger->info('Shop updated', ['shop' => $shop, 'data' => $data]);
        
        $storeModel = new Store();
        $storeModel->updateShopInfo($shop, $data);
    }
}
