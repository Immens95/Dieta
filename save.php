<?php
// Simple API to save JSON data back to files (for development/XAMPP)
header('Content-Type: application/json');

// Get the raw POST data
$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

if (!$data || !isset($data['filename']) || !isset($data['content'])) {
    echo json_encode(['error' => 'Invalid data']);
    exit;
}

$filename = $data['filename'];
$content = $data['content'];

// Whitelist of allowed files
$allowedFiles = ['foods.json', 'recipes.json', 'users.json', 'plans.json'];

if (!in_array($filename, $allowedFiles)) {
    echo json_encode(['error' => 'File not allowed']);
    exit;
}

$filePath = __DIR__ . '/data/' . $filename;

if (file_put_contents($filePath, json_encode($content, JSON_PRETTY_PRINT))) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['error' => 'Failed to write file']);
}
?>
