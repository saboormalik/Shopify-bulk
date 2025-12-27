<?php

namespace App\Services;

use Aws\S3\S3Client;
use Psr\Http\Message\UploadedFileInterface;

class S3Service
{
    private S3Client $client;
    private string $bucket;
    
    public function __construct()
    {
        $this->client = new S3Client([
            'version' => 'latest',
            'region'  => $_ENV['AWS_S3_REGION'],
            'credentials' => [
                'key'    => $_ENV['AWS_ACCESS_KEY_ID'],
                'secret' => $_ENV['AWS_SECRET_ACCESS_KEY'],
            ],
        ]);
        
        $this->bucket = $_ENV['AWS_S3_BUCKET'];
    }
    
    public function uploadFile(string $shop, UploadedFileInterface $file): string
    {
        $filename = $file->getClientFilename();
        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        $key = sprintf('imports/%s/%s.%s', $shop, uniqid(), $extension);
        
        $this->client->putObject([
            'Bucket' => $this->bucket,
            'Key'    => $key,
            'Body'   => $file->getStream(),
            'ContentType' => $file->getClientMediaType(),
        ]);
        
        return $key;
    }
    
    public function uploadContent(string $key, string $content, string $contentType = 'text/csv'): string
    {
        $this->client->putObject([
            'Bucket' => $this->bucket,
            'Key'    => $key,
            'Body'   => $content,
            'ContentType' => $contentType,
        ]);
        
        return $key;
    }
    
    public function getSignedUrl(string $key, int $expiresIn = 3600): string
    {
        $cmd = $this->client->getCommand('GetObject', [
            'Bucket' => $this->bucket,
            'Key'    => $key,
        ]);
        
        $request = $this->client->createPresignedRequest($cmd, "+{$expiresIn} seconds");
        
        return (string)$request->getUri();
    }
    
    public function deleteFile(string $key): bool
    {
        $this->client->deleteObject([
            'Bucket' => $this->bucket,
            'Key'    => $key,
        ]);
        
        return true;
    }
}
