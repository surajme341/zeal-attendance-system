<?php
if($path==='/auth/demo-login')fail('Demo role switching is disabled on the hosted site. Sign in with your own account.',403);
if($path==='/auth/login'&&$method==='POST'){
 need($body,['email','password']);$email=strtolower(trim($body['email']));
 // Database-backed rate limit, including unknown accounts.
 $bucket=hash('sha256',($_SERVER['REMOTE_ADDR']??'').':'.$email);
 query('DELETE FROM login_attempts WHERE attempted_at < UTC_TIMESTAMP() - INTERVAL 15 MINUTE');
 $n=one('SELECT COUNT(*) n FROM login_attempts WHERE bucket=?',[$bucket]);if((int)$n['n']>=10)fail('Too many login attempts. Try again in 15 minutes.',429);
 insertRow('login_attempts',['id'=>uid(),'bucket'=>$bucket]);
 $u=one('SELECT * FROM users WHERE email=? OR employee_id=?',[$email,trim($body['email'])]);$hash=$u['password_hash']??'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi';
 $hash=str_replace('$2a$','$2y$',$hash);
 if(!password_verify($body['password'],$hash)||!$u)fail('Invalid email or password.',401);
 collegeEmail($u['email']);$u=userProfile($u['id']);if($u['role']==='STUDENT'&&!$u['student_id'])fail('Your account has no active student record. Ask the Admin.',403);
 query('DELETE FROM login_attempts WHERE bucket=?',[$bucket]);send(['token'=>issueToken($u),'user'=>$u]);
}
if($path==='/auth/me'&&$method==='GET')send(['user'=>auth()]);
// One-time bootstrap: requires private setup key; only available before any Admin exists.
if($path==='/setup/admin'&&$method==='POST'){
 need($body,['setup_key','email','password','full_name']);
 if(strlen($config['setup_key']??'')<32||str_starts_with($config['setup_key'],'CHANGE_')||!hash_equals($config['setup_key'],$body['setup_key']))fail('Invalid setup key.',403);
 if(one("SELECT id FROM users WHERE role='ADMIN' LIMIT 1"))fail('Admin already exists. Use the password reset tool described in SETUP.md.',409);
 if(strlen($body['password'])<12)fail('Use a password of at least 12 characters.');
 collegeEmail($body['email']);
 insertRow('users',['id'=>uid('user-'),'email'=>strtolower(trim($body['email'])),'full_name'=>trim($body['full_name']),'password_hash'=>password_hash($body['password'],PASSWORD_BCRYPT),'role'=>'ADMIN']);send(['success'=>true,'message'=>'Admin created. Sign in.'],201);
}

if($path==='/setup/reset-password'&&$method==='POST'){
 need($body,['setup_key','email','password']);
 if(strlen($config['setup_key']??'')<32||str_starts_with($config['setup_key'],'CHANGE_')||!hash_equals($config['setup_key'],$body['setup_key']))fail('Invalid setup key.',403);
 if(strlen($body['password'])<12)fail('Use a password of at least 12 characters.');
 $u=one('SELECT id FROM users WHERE email=?',[strtolower(trim($body['email']))])??fail('No account with that email.',404);
 updateRow('users',$u['id'],['password_hash'=>password_hash($body['password'],PASSWORD_BCRYPT)]);
 send(['success'=>true,'message'=>'Password updated. Disable setup_key in config.php when you finish setup.']);
}
