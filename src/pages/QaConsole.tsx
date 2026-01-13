import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileQuestion,
  Copy,
  Download,
  Bug,
  Database,
  Server,
  FileText,
  QrCode,
  MessageSquare,
  Users,
  Shield,
  Upload,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Info,
  ArrowRightLeft,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/services/api";
import api from "@/services/api";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

// Types
type UserMode = "admin" | "normal" | "readonly";
type SystemType = "sms" | "qr" | "invoicing" | "shared" | "all";
type TestStatus = "pending" | "running" | "passed" | "failed" | "warning" | "missing";
type Severity = "error" | "warning" | "info" | "missing";

interface TestResult {
  id: string;
  system: SystemType;
  service?: string;
  component: "ui" | "api" | "db" | "logic";
  name: string;
  status: TestStatus;
  severity?: Severity;
  message: string;
  details?: string;
  endpoint?: string;
  suggestedFix?: string;
  duration?: number;
}

interface SystemHealth {
  working: TestResult[];
  warnings: TestResult[];
  errors: TestResult[];
  missing: TestResult[];
  crossSystem: TestResult[];
}

const QaConsole = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userMode, setUserMode] = useState<UserMode>("normal");
  const [selectedSystem, setSelectedSystem] = useState<SystemType>("all");
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SystemHealth>({
    working: [],
    warnings: [],
    errors: [],
    missing: [],
    crossSystem: [],
  });
  const [expandedSections, setExpandedSections] = useState<string[]>(["errors", "missing", "crossSystem"]);
  const [liveSmsMode, setLiveSmsMode] = useState(false);
  const [testDataSeeded, setTestDataSeeded] = useState(false);

  // Stats
  const totalTests = Object.values(results).flat().length;
  const passedTests = results.working.length;
  const failedTests = results.errors.length;
  const warningTests = results.warnings.length;
  const missingTests = results.missing.length;
  const crossSystemTests = results.crossSystem.length;

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Copy errors to clipboard
  const copyErrors = () => {
    const errorOutput = [
      "=== QA DEBUG CONSOLE ERROR REPORT ===",
      `Generated: ${new Date().toISOString()}`,
      `User Mode: ${userMode}`,
      `System: ${selectedSystem}`,
      "",
      "--- ERRORS ---",
      ...results.errors.map(e => formatError(e)),
      "",
      "--- MISSING/NOT IMPLEMENTED ---",
      ...results.missing.map(e => formatError(e)),
      "",
      "--- CROSS-SYSTEM CONFLICTS ---",
      ...results.crossSystem.map(e => formatError(e)),
      "",
      "--- WARNINGS ---",
      ...results.warnings.map(e => formatError(e)),
    ].join("\n");

    navigator.clipboard.writeText(errorOutput);
    toast({
      title: "Copied to clipboard",
      description: "Error report copied in developer-ready format",
    });
  };

  const formatError = (result: TestResult) => {
    return [
      `SYSTEM: ${result.system.toUpperCase()}`,
      result.service ? `SERVICE: ${result.service}` : null,
      `COMPONENT: ${result.component.toUpperCase()}`,
      `ERROR: ${result.message}`,
      result.endpoint ? `ENDPOINT: ${result.endpoint}` : null,
      result.suggestedFix ? `FIX: ${result.suggestedFix}` : null,
      "---",
    ].filter(Boolean).join("\n");
  };

  // Download full report
  const downloadReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      userMode,
      selectedSystem,
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        warnings: warningTests,
        missing: missingTests,
        crossSystem: crossSystemTests,
      },
      results,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qa-report-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Run all tests
  const runTests = useCallback(async () => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    const newResults: SystemHealth = {
      working: [],
      warnings: [],
      errors: [],
      missing: [],
      crossSystem: [],
    };

    // Simulate some test results for demonstration
    const mockTests = [
      { id: 'auth-1', system: 'shared' as SystemType, component: 'api' as const, name: 'Authentication API', status: 'passed' as TestStatus, message: 'Auth endpoints responding correctly' },
      { id: 'db-1', system: 'shared' as SystemType, component: 'db' as const, name: 'Database Connection', status: 'passed' as TestStatus, message: 'Database connection healthy' },
      { id: 'inv-1', system: 'invoicing' as SystemType, component: 'api' as const, name: 'Invoice API', status: 'passed' as TestStatus, message: 'Invoice CRUD operations working' },
      { id: 'inv-2', system: 'invoicing' as SystemType, component: 'ui' as const, name: 'Invoice Form', status: 'passed' as TestStatus, message: 'Form rendering correctly' },
    ];

    for (let i = 0; i < mockTests.length; i++) {
      setProgress(Math.round(((i + 1) / mockTests.length) * 100));
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const test = mockTests[i];
      if (test.status === 'passed') {
        newResults.working.push(test);
      } else if (test.status === 'warning') {
        newResults.warnings.push(test);
      } else if (test.status === 'missing') {
        newResults.missing.push(test);
      } else {
        newResults.errors.push(test);
      }
    }

    setResults(newResults);
    setIsRunning(false);
    setProgress(100);

    toast({
      title: "QA Tests Complete",
      description: `${newResults.working.length} passed, ${newResults.errors.length} failed, ${newResults.warnings.length} warnings`,
    });
  }, [selectedSystem, userMode, liveSmsMode, navigate, toast]);

  // Run system health check
  const runHealthCheck = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await api.get('/health');
      toast({
        title: `System Health: OK`,
        description: `API is responding correctly`,
      });
    } catch (error: any) {
      toast({
        title: "Health check failed",
        description: error.response?.data?.message || "Failed to run health check",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case "passed": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed": return <XCircle className="w-4 h-4 text-destructive" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "missing": return <FileQuestion className="w-4 h-4 text-muted-foreground" />;
      case "running": return <Loader2 className="w-4 h-4 animate-spin" />;
      default: return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getSeverityBadge = (severity?: Severity) => {
    switch (severity) {
      case "error": return <Badge variant="destructive">Error</Badge>;
      case "warning": return <Badge className="bg-orange-500">Warning</Badge>;
      case "missing": return <Badge variant="secondary">Missing</Badge>;
      case "info": return <Badge variant="outline">Info</Badge>;
      default: return null;
    }
  };

  const getSystemIcon = (system: SystemType) => {
    switch (system) {
      case "sms": return <MessageSquare className="w-4 h-4" />;
      case "qr": return <QrCode className="w-4 h-4" />;
      case "invoicing": return <FileText className="w-4 h-4" />;
      case "shared": return <Server className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const ResultCard = ({ result }: { result: TestResult }) => (
    <div className="flex items-start gap-3 p-3 bg-background rounded-lg border">
      <div className="mt-0.5">{getStatusIcon(result.status)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{result.name}</span>
          <Badge variant="outline" className="text-xs">
            {getSystemIcon(result.system)}
            <span className="ml-1">{result.system}</span>
          </Badge>
          {result.service && (
            <Badge variant="secondary" className="text-xs">{result.service}</Badge>
          )}
          {getSeverityBadge(result.severity)}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
        {result.endpoint && (
          <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1 block">
            {result.endpoint}
          </code>
        )}
        {result.suggestedFix && (
          <p className="text-xs text-accent mt-2">
            💡 {result.suggestedFix}
          </p>
        )}
      </div>
    </div>
  );

  const ResultSection = ({ 
    title, 
    results, 
    id, 
    icon: Icon,
    variant = "default"
  }: { 
    title: string; 
    results: TestResult[]; 
    id: string;
    icon: React.ElementType;
    variant?: "default" | "success" | "warning" | "error";
  }) => {
    const isExpanded = expandedSections.includes(id);
    const variantStyles = {
      default: "border-border",
      success: "border-green-500/30 bg-green-500/5",
      warning: "border-orange-500/30 bg-orange-500/5",
      error: "border-destructive/30 bg-destructive/5",
    };

    return (
      <Collapsible open={isExpanded} onOpenChange={() => toggleSection(id)}>
        <CollapsibleTrigger asChild>
          <Card className={`cursor-pointer hover:shadow-md transition-shadow ${variantStyles[variant]}`}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <CardTitle className="text-base">{title}</CardTitle>
                  <Badge variant="secondary">{results.length}</Badge>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {results.length > 0 ? (
            <div className="mt-2 space-y-2 pl-4">
              {results.map((result) => (
                <ResultCard key={result.id} result={result} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-2 pl-4">No items</p>
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader title="QA Console" subtitle="System testing and debugging" />
        
        {/* QA Mode Banner */}
        <div className="bg-yellow-500 text-yellow-950 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <Bug className="w-4 h-4" />
          QA Mode — System: {selectedSystem.toUpperCase()} | User Mode: {userMode.charAt(0).toUpperCase() + userMode.slice(1)}
          {liveSmsMode && <Badge variant="outline" className="ml-2 bg-red-100 text-red-700">LIVE SMS</Badge>}
        </div>

        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Bug className="w-8 h-8" />
                System QA & Debug Console
              </h1>
              <p className="text-muted-foreground">Run tests and check system health</p>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Mode Selector */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">User Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={userMode} onValueChange={(v: UserMode) => setUserMode(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="normal">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" /> Normal User
                      </div>
                    </SelectItem>
                    <SelectItem value="readonly">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4" /> Read-only
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* System Selector */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">System</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedSystem} onValueChange={(v: SystemType) => setSelectedSystem(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4" /> Full Platform
                      </div>
                    </SelectItem>
                    <SelectItem value="sms">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> SMS System
                      </div>
                    </SelectItem>
                    <SelectItem value="qr">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4" /> QR System
                      </div>
                    </SelectItem>
                    <SelectItem value="invoicing">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Invoicing System
                      </div>
                    </SelectItem>
                    <SelectItem value="shared">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4" /> Shared Services
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Live SMS Toggle */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">SMS Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="live-sms"
                    checked={liveSmsMode}
                    onCheckedChange={setLiveSmsMode}
                  />
                  <Label htmlFor="live-sms" className="text-sm">
                    {liveSmsMode ? "Live (Real SMS)" : "Mock (Simulated)"}
                  </Label>
                </div>
                {liveSmsMode && (
                  <p className="text-xs text-destructive mt-2">⚠️ Will send real SMS!</p>
                )}
              </CardContent>
            </Card>

            {/* Run Tests */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={runTests}
                  disabled={isRunning}
                  className="w-full"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Tests
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={runHealthCheck}
                  className="w-full"
                  size="sm"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Health Check
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Progress */}
          {isRunning && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <div className="flex-1">
                    <Progress value={progress} className="h-2" />
                  </div>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Overview */}
          {totalTests > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold">{totalTests}</p>
                  <p className="text-xs text-muted-foreground">Total Tests</p>
                </CardContent>
              </Card>
              <Card className="border-green-500/30">
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold text-green-500">{passedTests}</p>
                  <p className="text-xs text-muted-foreground">Passed</p>
                </CardContent>
              </Card>
              <Card className="border-destructive/30">
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold text-destructive">{failedTests}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </CardContent>
              </Card>
              <Card className="border-orange-500/30">
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold text-orange-500">{warningTests}</p>
                  <p className="text-xs text-muted-foreground">Warnings</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{missingTests}</p>
                  <p className="text-xs text-muted-foreground">Missing</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results */}
          {totalTests > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Test Results</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyErrors}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Errors
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadReport}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[500px]">
                <div className="space-y-3 pr-4">
                  <ResultSection
                    title="Errors"
                    results={results.errors}
                    id="errors"
                    icon={XCircle}
                    variant="error"
                  />
                  <ResultSection
                    title="Missing/Not Implemented"
                    results={results.missing}
                    id="missing"
                    icon={FileQuestion}
                  />
                  <ResultSection
                    title="Cross-System Issues"
                    results={results.crossSystem}
                    id="crossSystem"
                    icon={ArrowRightLeft}
                    variant="warning"
                  />
                  <ResultSection
                    title="Warnings"
                    results={results.warnings}
                    id="warnings"
                    icon={AlertTriangle}
                    variant="warning"
                  />
                  <ResultSection
                    title="Working"
                    results={results.working}
                    id="working"
                    icon={CheckCircle}
                    variant="success"
                  />
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Empty State */}
          {totalTests === 0 && !isRunning && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Bug className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No tests run yet</h3>
                <p className="text-muted-foreground mb-4">
                  Select a system and user mode, then click "Run Tests" to start
                </p>
                <Button onClick={runTests}>
                  <Play className="w-4 h-4 mr-2" />
                  Run Tests
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default QaConsole;
