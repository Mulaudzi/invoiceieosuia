<?php

class AdminSystemController {
    public function index(): void {
        $request = new Request();
        $section = strtolower((string) ($request->query('section') ?? 'overview'));
        $search = trim((string) ($request->query('search') ?? ''));
        $limit = min(200, max(10, (int) ($request->query('limit') ?? 100)));
        try {
            $data = match ($section) {
                'users' => $this->users($search, $limit),
                'invoices' => $this->invoices($search, $limit),
                'payments' => $this->payments($search, $limit),
                'schedules' => $this->schedules($search, $limit),
                'clients' => $this->clients($search, $limit),
                'products' => $this->products($search, $limit),
                'events' => $this->events($search, $limit),
                'uploads' => $this->uploads($search, $limit),
                'errors' => $this->errors($search, $limit),
                default => $this->overview(),
            };
            Response::json(['section' => $section, 'data' => $data, 'generated_at' => date('c')]);
        } catch (Throwable $error) {
            error_log('Admin system console: ' . $error->getMessage());
            Response::error('System information could not be loaded right now. Please try again.', 500);
        }
    }

    private function overview(): array {
        $db = Database::getConnection();
        $scalar = fn(string $sql) => $db->query($sql)->fetchColumn();
        $invoiceRows = Invoice::query()->get(); $model = new Invoice();
        $outstanding = 0.0; $paid = 0.0; $overdue = 0; $drafts = 0;
        foreach ($invoiceRows as $row) { $invoice = $model->withRelations($row); $paid += (float) $invoice['amount_paid']; $outstanding += (float) $invoice['balance_due']; if ($invoice['status'] === 'Overdue') $overdue++; if ($invoice['status'] === 'Draft') $drafts++; }
        return [
            'users' => (int) $scalar('SELECT COUNT(*) FROM users'),
            'verified_users' => (int) $scalar('SELECT COUNT(*) FROM users WHERE email_verified_at IS NOT NULL'),
            'businesses' => (int) $scalar("SELECT COUNT(*) FROM users WHERE business_name IS NOT NULL AND business_name <> ''"),
            'clients' => (int) $scalar('SELECT COUNT(*) FROM clients'),
            'invoices' => count($invoiceRows), 'drafts' => $drafts, 'overdue' => $overdue,
            'paid' => round($paid, 2), 'outstanding' => round($outstanding, 2),
            'schedules' => (int) $scalar('SELECT COUNT(*) FROM recurring_invoices'),
            'active_schedules' => (int) $scalar("SELECT COUNT(*) FROM recurring_invoices WHERE status = 'active'"),
            'products' => (int) $scalar('SELECT COUNT(*) FROM products'),
            'uploads' => count($this->uploads('', 10000)),
            'recent_users' => $db->query('SELECT id, name, email, business_name, email_verified_at, created_at FROM users ORDER BY created_at DESC LIMIT 8')->fetchAll(PDO::FETCH_ASSOC),
            'recent_invoices' => $this->invoices('', 8),
        ];
    }

    private function users(string $search, int $limit): array {
        $db = Database::getConnection(); $like = '%' . $search . '%';
        $stmt = $db->prepare("SELECT u.id,u.name,u.email,u.business_name,u.phone,u.plan,u.status,u.email_verified_at,u.created_at,(SELECT COUNT(*) FROM invoices i WHERE i.user_id=u.id) invoice_count,(SELECT COUNT(*) FROM clients c WHERE c.user_id=u.id) client_count,(SELECT COALESCE(SUM(i.total),0) FROM invoices i WHERE i.user_id=u.id) invoiced_total FROM users u WHERE (?='' OR u.name LIKE ? OR u.email LIKE ? OR u.business_name LIKE ?) ORDER BY u.created_at DESC LIMIT $limit");
        $stmt->execute([$search,$like,$like,$like]); return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function invoices(string $search, int $limit): array {
        $db = Database::getConnection(); $like = '%' . $search . '%';
        $stmt = $db->prepare("SELECT i.*,u.name owner_name,u.email owner_email,u.business_name,c.name client_name,c.email client_email FROM invoices i JOIN users u ON u.id=i.user_id LEFT JOIN clients c ON c.id=i.client_id WHERE (?='' OR i.invoice_number LIKE ? OR u.email LIKE ? OR u.business_name LIKE ? OR c.name LIKE ?) ORDER BY i.created_at DESC LIMIT $limit");
        $stmt->execute([$search,$like,$like,$like,$like]); $rows=$stmt->fetchAll(PDO::FETCH_ASSOC); $model=new Invoice();
        return array_map(function($row) use($model){$related=$model->withRelations($row); unset($related['metadata'],$related['template_snapshot'],$related['items']); return $related;},$rows);
    }

    private function payments(string $search, int $limit): array {
        $rows=$this->invoices($search,200); $payments=[];
        foreach($rows as $invoice) foreach(($invoice['payment_history']??[]) as $payment) $payments[]=['id'=>$payment['id']??'','invoice_id'=>$invoice['id'],'invoice_number'=>$invoice['invoice_number'],'owner_name'=>$invoice['owner_name'],'owner_email'=>$invoice['owner_email'],'client_name'=>$invoice['client_name'],'amount'=>(float)($payment['amount']??0),'payment_date'=>$payment['payment_date']??null,'reference'=>$payment['reference']??'','voided_at'=>$payment['voided_at']??null,'created_at'=>$payment['created_at']??null];
        usort($payments,fn($a,$b)=>strcmp((string)($b['payment_date']??''),(string)($a['payment_date']??''))); return array_slice($payments,0,$limit);
    }

    private function schedules(string $search, int $limit): array {
        $db=Database::getConnection();$like='%'.$search.'%';$stmt=$db->prepare("SELECT ri.*,u.name owner_name,u.email owner_email,u.business_name,c.name client_name,c.email client_email,(SELECT COUNT(*) FROM invoices i WHERE i.recurring_invoice_id=ri.id) invoice_count FROM recurring_invoices ri JOIN users u ON u.id=ri.user_id LEFT JOIN clients c ON c.id=ri.client_id WHERE (?='' OR u.email LIKE ? OR u.business_name LIKE ? OR c.name LIKE ? OR ri.description LIKE ?) ORDER BY ri.created_at DESC LIMIT $limit");$stmt->execute([$search,$like,$like,$like,$like]);return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function clients(string $search, int $limit): array {
        $db=Database::getConnection();$like='%'.$search.'%';$stmt=$db->prepare("SELECT c.id,c.name,c.email,c.phone,c.company,c.status,c.created_at,u.name owner_name,u.email owner_email,u.business_name,(SELECT COUNT(*) FROM invoices i WHERE i.client_id=c.id) invoice_count,(SELECT COALESCE(SUM(i.total),0) FROM invoices i WHERE i.client_id=c.id) invoiced_total FROM clients c JOIN users u ON u.id=c.user_id WHERE (?='' OR c.name LIKE ? OR c.email LIKE ? OR c.company LIKE ? OR u.email LIKE ? OR u.business_name LIKE ?) ORDER BY c.created_at DESC LIMIT $limit");$stmt->execute([$search,$like,$like,$like,$like,$like]);return$stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function products(string $search, int $limit): array {
        $db=Database::getConnection();$like='%'.$search.'%';$stmt=$db->prepare("SELECT p.id,p.name,p.description,p.price,p.tax_rate,p.category,p.created_at,u.name owner_name,u.email owner_email,u.business_name FROM products p JOIN users u ON u.id=p.user_id WHERE (?='' OR p.name LIKE ? OR p.category LIKE ? OR u.email LIKE ? OR u.business_name LIKE ?) ORDER BY p.created_at DESC LIMIT $limit");$stmt->execute([$search,$like,$like,$like,$like]);return$stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function events(string $search, int $limit): array {
        $events=[];
        foreach($this->users($search,50) as $row)$events[]=['type'=>'Customer joined','subject'=>$row['name'],'business'=>$row['business_name'],'occurred_at'=>$row['created_at']];
        foreach($this->invoices($search,80) as $row)$events[]=['type'=>'Invoice created','subject'=>$row['invoice_number'],'business'=>$row['business_name'],'occurred_at'=>$row['created_at']];
        foreach($this->payments($search,80) as $row)$events[]=['type'=>empty($row['voided_at'])?'Payment recorded':'Payment voided','subject'=>$row['invoice_number'],'business'=>$row['owner_name'],'occurred_at'=>$row['voided_at']?:($row['created_at']?:$row['payment_date'])];
        foreach($this->schedules($search,50) as $row)$events[]=['type'=>'Schedule created','subject'=>$row['description'],'business'=>$row['business_name'],'occurred_at'=>$row['created_at']];
        usort($events,fn($a,$b)=>strcmp((string)$b['occurred_at'],(string)$a['occurred_at']));return array_slice($events,0,$limit);
    }

    private function uploads(string $search, int $limit): array {
        $root=realpath(__DIR__.'/../uploads');if(!$root)return[];$files=[];$iterator=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root,FilesystemIterator::SKIP_DOTS));
        foreach($iterator as $file){if(!$file->isFile())continue;$relative=str_replace('\\','/',substr($file->getPathname(),strlen($root)+1));if($search!==''&&stripos($relative,$search)===false)continue;$files[]=['name'=>$file->getFilename(),'folder'=>dirname($relative)==='.'?'uploads':dirname($relative),'type'=>$file->getExtension(),'size'=>$file->getSize(),'updated_at'=>date('c',$file->getMTime())];}
        usort($files,fn($a,$b)=>strcmp($b['updated_at'],$a['updated_at']));return array_slice($files,0,$limit);
    }

    private function errors(string $search, int $limit): array {
        $path=__DIR__.'/../error_log';if(!is_file($path)||!is_readable($path))return[];$lines=file($path,FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES)?:[];$lines=array_slice($lines,-1000);$result=[];
        foreach(array_reverse($lines) as $line){$safe=preg_replace(['#(?:/[^\s:]+)+#','#[A-Za-z]:\\\\[^\s]+#','/(password|token|secret|authorization)\s*[=:]\s*[^\s]+/i'],['[server path]','[server path]','$1=[hidden]'],mb_substr($line,0,1200));if($search!==''&&stripos($safe,$search)===false)continue;$result[]=['message'=>$safe];if(count($result)>=$limit)break;}return$result;
    }
}
