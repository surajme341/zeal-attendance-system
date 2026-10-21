<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
date_default_timezone_set('UTC');
require __DIR__.'/core.php';
try {
 if(!file_exists(__DIR__.'/config.php'))fail('Copy api/config.example.php to api/config.php and enter your hosting database details.',503);
 $config=require __DIR__.'/config.php';
 if(strlen($config['auth_secret']??'')<32||str_starts_with($config['auth_secret'],'CHANGE_'))fail('Set a random auth_secret in api/config.php.',503);
 $method=$_SERVER['REQUEST_METHOD'];
 $path='/'.trim($_GET['route']??preg_replace('#^/api#','',parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH)),'/');
 $raw=file_get_contents('php://input');$body=$raw!==''?json_decode($raw,true):[];
 if(!is_array($body))fail('Request body must be a JSON object.');
 if(strlen($raw)>16*1024*1024)fail('Request too large.',413);
 $user=null;$q=$_GET;unset($q['route']);
 require __DIR__.'/routes-auth.php';
 auth();
 preflightScope($path,$q,$body);
 require __DIR__.'/routes-workflows.php';
 require __DIR__.'/routes-general.php';
 require __DIR__.'/routes-students.php';
 require __DIR__.'/routes-attendance.php';
 require __DIR__.'/routes-face.php';
 fail('API endpoint not found.',404);
} catch(ApiError $e){send(['error'=>$e->getMessage()],$e->http);}
catch(PDOException $e){error_log((string)$e);send(['error'=>($e->getCode()==='23000'?'This entry conflicts with an existing record or references an invalid student, subject or division.':'Database error. Verify config.php, SQL import and hosting error logs.')],$e->getCode()==='23000'?409:500);}
catch(Throwable $e){error_log((string)$e);send(['error'=>'Server error. Check the PHP error log.'],500);}
