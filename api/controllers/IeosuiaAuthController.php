<?php

final class IeosuiaAuthController {
    public function start(): void {
        $this->session(); $verifier=$this->b64(random_bytes(48)); $state=$this->b64(random_bytes(32));
        $type=($_GET['account_type']??'customer')==='admin'?'admin':'customer';
        $screenHint=(($_GET['screen_hint']??'')==='signup'&&$type==='customer')?'signup':'login';
        $_SESSION['ieosuia_oauth']=['verifier'=>$verifier,'state'=>$state,'account_type'=>$type,'created_at'=>time()];
        $query=http_build_query(['client_id'=>$_ENV['AUTH_CLIENT_ID']??'invoice-web','redirect_uri'=>$this->redirectUri(),'response_type'=>'code','scope'=>'openid profile email','account_type'=>$type,'screen_hint'=>$screenHint,'state'=>$state,'code_challenge'=>$this->b64(hash('sha256',$verifier,true)),'code_challenge_method'=>'S256'],'','&',PHP_QUERY_RFC3986);
        header('Location: '.$this->issuer().'/oauth/authorize?'.$query,true,302); exit;
    }

    public function callback(): void {
        $this->session(); $pending=$_SESSION['ieosuia_oauth']??null; unset($_SESSION['ieosuia_oauth']);
        if(!is_array($pending)||time()-(int)($pending['created_at']??0)>600||!isset($_GET['state'],$_GET['code'])||!hash_equals((string)$pending['state'],(string)$_GET['state'])) $this->fail('invalid_response');
        $tokens=$this->request('/oauth/token',['grant_type'=>'authorization_code','client_id'=>$_ENV['AUTH_CLIENT_ID']??'invoice-web','redirect_uri'=>$this->redirectUri(),'code'=>(string)$_GET['code'],'code_verifier'=>(string)$pending['verifier']]);
        $profile=$this->request('/oauth/userinfo',null,(string)($tokens['access_token']??''));
        $type=(string)($pending['account_type']??'customer');
        if(($profile['account_type']??'')!==$type||empty($profile['sub'])||empty($profile['email'])||empty($profile['email_verified'])) $this->fail('identity_not_allowed');
        $db=Database::getConnection(); $email=strtolower((string)$profile['email']);
        if($type==='admin'){$stmt=$db->prepare("SELECT * FROM admin_users WHERE identity_uuid=? AND LOWER(email)=? AND status='active' LIMIT 1");$stmt->execute([(string)$profile['sub'],$email]);$admin=$stmt->fetch();if(!$admin)$this->fail('local_access_missing');$token=bin2hex(random_bytes(32));$ip=$_SERVER['REMOTE_ADDR']??'0.0.0.0';$db->prepare("DELETE FROM admin_sessions WHERE admin_user_id=?")->execute([$admin['id']]);$db->prepare("INSERT INTO admin_sessions(session_token,ip_address,step,admin_user_id,last_activity,expires_at) VALUES(?,?,99,?,NOW(),DATE_ADD(NOW(),INTERVAL 24 HOUR))")->execute([$token,$ip,$admin['id']]);$db->prepare('UPDATE admin_users SET last_login_at=NOW() WHERE id=?')->execute([$admin['id']]);header('Location: '.$this->frontend().'/guymhan/auth/callback#ieosuia_admin_token='.rawurlencode($token),true,302);exit;}
        $stmt=$db->prepare('SELECT * FROM users WHERE identity_uuid = ? OR (identity_uuid IS NULL AND LOWER(email) = ?) ORDER BY identity_uuid IS NOT NULL DESC LIMIT 1'); $stmt->execute([(string)$profile['sub'],$email]); $user=$stmt->fetch();
        if($user&&!empty($user['identity_uuid'])&&!hash_equals((string)$user['identity_uuid'],(string)$profile['sub'])) $this->fail('identity_conflict');
        if(!$user){$stmt=$db->prepare("INSERT INTO users(name,email,password,plan,email_verified_at,status,identity_uuid,created_at,updated_at) VALUES(?,?,NULL,'free',NOW(),'active',?,NOW(),NOW())");$stmt->execute([(string)($profile['name']??$email),$email,(string)$profile['sub']]);$user=['id'=>(int)$db->lastInsertId(),'identity_uuid'=>(string)$profile['sub'],'status'=>'active'];}
        elseif(empty($user['identity_uuid'])){$db->prepare('UPDATE users SET identity_uuid=?,email_verified_at=COALESCE(email_verified_at,NOW()),updated_at=NOW() WHERE id=?')->execute([(string)$profile['sub'],$user['id']]);$user['identity_uuid']=(string)$profile['sub'];}
        if(($user['status']??'inactive')!=='active')$this->fail('local_access_missing');
        $token=Auth::generateToken((int)$user['id']); header('Location: '.$this->frontend().'/auth/callback#ieosuia_token='.rawurlencode($token),true,302); exit;
    }

    public function disabled():void{Response::error('Use central IEOSUIA authentication.',410);}

    private function request(string $path,?array $fields=null,string $bearer=''): array { $curl=curl_init($this->issuer().$path);$headers=['Accept: application/json'];if($bearer!=='')$headers[]='Authorization: Bearer '.$bearer;curl_setopt_array($curl,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>15,CURLOPT_HTTPHEADER=>$headers]);if($fields!==null)curl_setopt_array($curl,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>http_build_query($fields,'','&',PHP_QUERY_RFC3986)]);$body=curl_exec($curl);$status=(int)curl_getinfo($curl,CURLINFO_RESPONSE_CODE);curl_close($curl);$data=is_string($body)?json_decode($body,true):null;if($status<200||$status>=300||!is_array($data))$this->fail('provider_unavailable');return $data; }
    private function session(): void { if(session_status()!==PHP_SESSION_ACTIVE){session_name('invoice_ieosuia_sso');session_set_cookie_params(['path'=>'/api/auth/ieosuia','secure'=>$this->https(),'httponly'=>true,'samesite'=>'Lax']);session_start();} }
    private function issuer(): string{return rtrim((string)($_ENV['AUTH_ISSUER']??'https://auth.ieosuia.com'),'/');} private function redirectUri(): string{return (string)($_ENV['AUTH_REDIRECT_URI']??'https://invoices.ieosuia.com/api/auth/ieosuia/callback');} private function frontend(): string{return rtrim((string)($_ENV['FRONTEND_URL']??'https://invoices.ieosuia.com'),'/');} private function b64(string $v): string{return rtrim(strtr(base64_encode($v),'+/','-_'),'=');} private function https(): bool{return ($_SERVER['HTTPS']??'')!==''&&($_SERVER['HTTPS']??'')!=='off';} private function fail(string $reason): never{error_log('IEOSUIA SSO failed: '.$reason);header('Location: '.$this->frontend().'/?sso=failed&reason='.rawurlencode($reason),true,302);exit;}
}
