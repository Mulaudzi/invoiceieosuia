<?php

final class IeosuiaAuthController {
    private const FLOW_COOKIE = 'invoice_ieosuia_oauth_flow';

    public function start(): void {
        $this->session(); $verifier=$this->b64(random_bytes(48)); $state=$this->b64(random_bytes(32));
        $type=($_GET['account_type']??'customer')==='admin'?'admin':'customer';
        $screenHint=(($_GET['screen_hint']??'')==='signup'&&$type==='customer')?'signup':'login';
        $pending=['verifier'=>$verifier,'state'=>$state,'account_type'=>$type,'created_at'=>time()];
        $_SESSION['ieosuia_oauth']=$pending;
        $this->storeFlowCookie($pending);
        $query=http_build_query(['client_id'=>$_ENV['AUTH_CLIENT_ID']??'invoice-web','redirect_uri'=>$this->redirectUri(),'response_type'=>'code','scope'=>'openid profile email','account_type'=>$type,'screen_hint'=>$screenHint,'state'=>$state,'code_challenge'=>$this->b64(hash('sha256',$verifier,true)),'code_challenge_method'=>'S256'],'','&',PHP_QUERY_RFC3986);
        header('Location: '.$this->issuer().'/oauth/authorize?'.$query,true,302); exit;
    }

    public function callback(): void {
        $this->session();
        $pending=is_array($_SESSION['ieosuia_oauth']??null)?$_SESSION['ieosuia_oauth']:$this->readFlowCookie();
        $response=array_merge($_GET,$_POST);
        unset($_SESSION['ieosuia_oauth']); $this->clearFlowCookie();
        if(isset($response['error'])) $this->fail('provider_rejected', ['provider_error'=>$this->safeProviderError((string)$response['error'])]);
        if(!is_array($pending)) $this->fail('flow_missing');
        if(time()-(int)($pending['created_at']??0)>900) $this->fail('flow_expired');
        if(empty($response['state'])) $this->fail('state_missing');
        if(!hash_equals((string)($pending['state']??''),(string)$response['state'])) $this->fail('state_mismatch');
        if(empty($response['code'])) $this->fail('code_missing');
        $tokens=$this->request('/oauth/token',['grant_type'=>'authorization_code','client_id'=>$_ENV['AUTH_CLIENT_ID']??'invoice-web','redirect_uri'=>$this->redirectUri(),'code'=>(string)$response['code'],'code_verifier'=>(string)$pending['verifier']]);
        $profile=$this->request('/oauth/userinfo',null,(string)($tokens['access_token']??''));
        $type=(string)($pending['account_type']??'customer');
        if(($profile['account_type']??'')!==$type||($profile['application']??'')!=='invoice'||empty($profile['sub'])||empty($profile['email'])||empty($profile['email_verified'])) $this->fail('identity_not_allowed');
        $db=Database::getConnection(); $email=strtolower((string)$profile['email']);
        if($type==='admin'){$stmt=$db->prepare("SELECT * FROM admin_users WHERE identity_uuid=? AND LOWER(email)=? AND status='active' LIMIT 1");$stmt->execute([(string)$profile['sub'],$email]);$admin=$stmt->fetch();if(!$admin)$this->fail('local_access_missing');$token=bin2hex(random_bytes(32));$ip=$_SERVER['REMOTE_ADDR']??'0.0.0.0';$db->prepare("DELETE FROM admin_sessions WHERE admin_user_id=?")->execute([$admin['id']]);$db->prepare("INSERT INTO admin_sessions(session_token,ip_address,step,admin_user_id,last_activity,expires_at) VALUES(?,?,99,?,NOW(),DATE_ADD(NOW(),INTERVAL 24 HOUR))")->execute([$token,$ip,$admin['id']]);$db->prepare('UPDATE admin_users SET last_login_at=NOW() WHERE id=?')->execute([$admin['id']]);header('Location: '.$this->frontend().'/guymhan/auth/callback#ieosuia_admin_token='.rawurlencode($token),true,302);exit;}
        $stmt=$db->prepare('SELECT * FROM users WHERE identity_uuid = ? LIMIT 1'); $stmt->execute([(string)$profile['sub']]); $user=$stmt->fetch();
        $emailStmt=$db->prepare('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1');$emailStmt->execute([$email]);$emailUser=$emailStmt->fetch();
        if($user&&$emailUser&&(int)$user['id']!==(int)$emailUser['id'])$this->fail('identity_conflict');
        if(!$user)$user=$emailUser;
        if($user&&!empty($user['identity_uuid'])&&!hash_equals((string)$user['identity_uuid'],(string)$profile['sub'])) $this->fail('identity_conflict');
        if(!$user){$stmt=$db->prepare("INSERT INTO users(name,email,password,plan,email_verified_at,status,identity_uuid,created_at,updated_at) VALUES(?,?,NULL,'free',NOW(),'active',?,NOW(),NOW())");$stmt->execute([(string)($profile['name']??$email),$email,(string)$profile['sub']]);$user=['id'=>(int)$db->lastInsertId(),'identity_uuid'=>(string)$profile['sub'],'status'=>'active'];}
        else{if(($user['status']??'')!=='active')$this->fail('local_access_missing');$db->prepare("UPDATE users SET identity_uuid=?,email_verified_at=COALESCE(email_verified_at,NOW()),updated_at=NOW() WHERE id=?")->execute([(string)$profile['sub'],$user['id']]);$user['identity_uuid']=(string)$profile['sub'];}
        $token=Auth::generateToken((int)$user['id']); header('Location: '.$this->frontend().'/auth/callback#ieosuia_token='.rawurlencode($token),true,302); exit;
    }

    public function disabled():void{Response::error('Use central IEOSUIA authentication.',410);}

    private function request(string $path,?array $fields=null,string $bearer=''): array { $curl=curl_init($this->issuer().$path);$headers=['Accept: application/json'];if($bearer!=='')$headers[]='Authorization: Bearer '.$bearer;curl_setopt_array($curl,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>15,CURLOPT_HTTPHEADER=>$headers,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2]);if($fields!==null)curl_setopt_array($curl,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>http_build_query($fields,'','&',PHP_QUERY_RFC3986)]);$body=curl_exec($curl);$status=(int)curl_getinfo($curl,CURLINFO_RESPONSE_CODE);curl_close($curl);$data=is_string($body)?json_decode($body,true):null;if($status<200||$status>=300||!is_array($data))$this->fail('provider_unavailable');return $data; }
    private function storeFlowCookie(array $pending):void{$payload=$this->b64(json_encode($pending,JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR));$signature=$this->b64(hash_hmac('sha256',$payload,$this->flowSecret(),true));setcookie(self::FLOW_COOKIE,$payload.'.'.$signature,['expires'=>time()+900,'path'=>'/api/auth/ieosuia','secure'=>$this->https(),'httponly'=>true,'samesite'=>'Lax']);}
    private function readFlowCookie():?array{$parts=explode('.',(string)($_COOKIE[self::FLOW_COOKIE]??''),2);if(count($parts)!==2||!hash_equals($this->b64(hash_hmac('sha256',$parts[0],$this->flowSecret(),true)),$parts[1]))return null;$json=base64_decode(strtr($parts[0].str_repeat('=',(4-strlen($parts[0])%4)%4),'-_','+/'),true);$value=$json===false?null:json_decode($json,true);return is_array($value)?$value:null;}
    private function clearFlowCookie():void{setcookie(self::FLOW_COOKIE,'',['expires'=>1,'path'=>'/api/auth/ieosuia','secure'=>$this->https(),'httponly'=>true,'samesite'=>'Lax']);}
    private function flowSecret():string{$secret=(string)($_ENV['AUTH_FLOW_SECRET']??$_ENV['JWT_SECRET']??'');if($secret==='')throw new RuntimeException('AUTH flow secret is not configured.');return $secret;}
    private function safeProviderError(string $error):string{return preg_match('/^[a-zA-Z0-9_.-]{1,64}$/',$error)?$error:'unspecified';}
    private function session(): void { if(session_status()!==PHP_SESSION_ACTIVE){session_name('invoice_ieosuia_sso');session_set_cookie_params(['path'=>'/api/auth/ieosuia','secure'=>$this->https(),'httponly'=>true,'samesite'=>'Lax']);session_start();} }
    private function issuer(): string{return rtrim((string)($_ENV['AUTH_ISSUER']??'https://auth.ieosuia.com'),'/');} private function redirectUri(): string{return (string)($_ENV['AUTH_REDIRECT_URI']??'https://invoices.ieosuia.com/api/auth/ieosuia/callback');} private function frontend(): string{return rtrim((string)($_ENV['FRONTEND_URL']??'https://invoices.ieosuia.com'),'/');} private function b64(string $v): string{return rtrim(strtr(base64_encode($v),'+/','-_'),'=');} private function https(): bool{return ($_SERVER['HTTPS']??'')!==''&&($_SERVER['HTTPS']??'')!=='off';} private function fail(string $reason,array $context=[]): never{$suffix=$context?' '.json_encode($context,JSON_UNESCAPED_SLASHES):'';error_log('IEOSUIA SSO failed: '.$reason.$suffix);header('Location: '.$this->frontend().'/?sso=failed&reason='.rawurlencode($reason),true,302);exit;}
}
