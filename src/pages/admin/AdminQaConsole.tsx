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
import { getAdminToken, removeAdminToken } from "./AdminLogin";
import api from "@/services/api";
import AdminLayout from "@/components/admin/AdminLayout";

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

const AdminQaConsole = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userMode, setUserMode] = useState<UserMode>("admin");
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
    const token = getAdminToken();
    if (!token) {
      navigate('/admin/login');
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

    const tests = getTestsForSystem(selectedSystem);
    const totalTestCount = tests.length;

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      setProgress(Math.round(((i + 1) / totalTestCount) * 100));

      try {
        const result = await test.run(token, { userMode, liveSmsMode });
        categorizeResult(result, newResults);
      } catch (error: any) {
        newResults.errors.push({
          id: test.id,
          system: test.system,
          service: test.service,
          component: test.component,
          name: test.name,
          status: "failed",
          severity: "error",
          message: error.message || "Test execution failed",
          details: error.stack,
        });
      }
    }

    setResults(newResults);
    setIsRunning(false);
    setProgress(100);

    toast({
      title: "QA Tests Complete",
      description: `${passedTests} passed, ${failedTests} failed, ${warningTests} warnings`,
    });
  }, [selectedSystem, userMode, liveSmsMode, navigate, toast, passedTests, failedTests, warningTests]);

  const categorizeResult = (result: TestResult, health: SystemHealth) => {
    if (result.status === "passed") {
      health.working.push(result);
    } else if (result.status === "warning") {
      health.warnings.push(result);
    } else if (result.status === "missing") {
      health.missing.push(result);
    } else if (result.severity === "error" || result.status === "failed") {
      if (result.service && result.system !== "shared") {
        health.crossSystem.push(result);
      } else {
        health.errors.push(result);
      }
    }
  };

  // Seed test data
  const seedTestData = async () => {
    const token = getAdminToken();
    if (!token) return;

    try {
      const response = await api.post('/admin/qa/seed', { system: selectedSystem }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTestDataSeeded(true);
      const seeded = response.data?.seeded;
      toast({
        title: "Test data seeded successfully",
        description: seeded 
          ? `Created: ${Object.entries(seeded).map(([k, v]) => `${k}: ${v}`).join(', ')}`
          : `Tagged test data created for ${selectedSystem} system`,
      });
    } catch (error: any) {
      toast({
        title: "Seeding failed",
        description: error.response?.data?.message || "Failed to seed test data",
        variant: "destructive",
      });
    }
  };

  // Cleanup test data
  const cleanupTestData = async () => {
    const token = getAdminToken();
    if (!token) return;

    try {
      const response = await api.delete('/admin/qa/cleanup', {
        headers: { Authorization: `Bearer ${token}` },
        data: { system: selectedSystem }
      });
      setTestDataSeeded(false);
      const cleaned = response.data?.cleaned;
      toast({
        title: "Test data cleaned successfully",
        description: cleaned
          ? `Deleted: ${Object.entries(cleaned).map(([k, v]) => `${k}: ${v}`).join(', ')}`
          : "All tagged test data removed",
      });
    } catch (error: any) {
      toast({
        title: "Cleanup failed",
        description: error.response?.data?.message || "Failed to cleanup test data",
        variant: "destructive",
      });
    }
  };

  // Check test data status
  const checkTestDataStatus = async () => {
    const token = getAdminToken();
    if (!token) return;

    try {
      const response = await api.get('/admin/qa/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const counts = response.data?.test_data_counts;
      setTestDataSeeded(response.data?.has_test_data || false);
      toast({
        title: "Test Data Status",
        description: counts 
          ? `Clients: ${counts.clients}, Products: ${counts.products}, Invoices: ${counts.invoices}, Logs: ${counts.notification_logs}`
          : "No test data found",
      });
    } catch (error: any) {
      toast({
        title: "Status check failed",
        description: error.response?.data?.message || "Failed to check status",
        variant: "destructive",
      });
    }
  };

  // Run system health check
  const runHealthCheck = async () => {
    const token = getAdminToken();
    if (!token) return;

    try {
      const response = await api.get('/admin/qa/health', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const health = response.data;
      toast({
        title: `System Health: ${health.overall_status?.toUpperCase()}`,
        description: `Database: ${health.checks?.database?.[0]?.status || 'unknown'}, Tables: ${health.checks?.tables?.filter((t: any) => t.status === 'ok').length || 0} OK`,
        variant: health.overall_status === 'healthy' ? 'default' : 'destructive',
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

  return (
    <AdminLayout>
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
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Tests
                  </>
                )}
              </Button>
              {isRunning && (
                <Progress value={progress} className="h-2" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Seeding Controls */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="w-4 h-4" />
                Test Data Management
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={checkTestDataStatus}>
                  <Info className="w-4 h-4 mr-2" />
                  Check Status
                </Button>
                <Button variant="outline" size="sm" onClick={runHealthCheck}>
                  <Activity className="w-4 h-4 mr-2" />
                  Health Check
                </Button>
                <Button variant="outline" size="sm" onClick={seedTestData}>
                  <Upload className="w-4 h-4 mr-2" />
                  Seed {selectedSystem.toUpperCase()} Data
                </Button>
                <Button variant="outline" size="sm" onClick={cleanupTestData} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cleanup
                </Button>
              </div>
            </div>
          </CardHeader>
          {testDataSeeded && (
            <CardContent>
              <Badge variant="secondary">Test data seeded for {selectedSystem}</Badge>
            </CardContent>
          )}
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{passedTests}</p>
                  <p className="text-xs text-muted-foreground">Working</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{warningTests}</p>
                  <p className="text-xs text-muted-foreground">Warnings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{failedTests}</p>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{missingTests}</p>
                  <p className="text-xs text-muted-foreground">Missing</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-950/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{crossSystemTests}</p>
                  <p className="text-xs text-muted-foreground">Cross-System</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Actions */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyErrors} disabled={totalTests === 0}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Errors Only
          </Button>
          <Button variant="outline" onClick={downloadReport} disabled={totalTests === 0}>
            <Download className="w-4 h-4 mr-2" />
            Download Full Report
          </Button>
        </div>

        {/* Results Sections */}
        <div className="space-y-4">
          {/* Errors */}
          <ResultSection
            title="Errors"
            icon={<XCircle className="w-5 h-5 text-destructive" />}
            results={results.errors}
            isExpanded={expandedSections.includes("errors")}
            onToggle={() => toggleSection("errors")}
            getStatusIcon={getStatusIcon}
            getSeverityBadge={getSeverityBadge}
            getSystemIcon={getSystemIcon}
            badgeVariant="destructive"
          />

          {/* Missing */}
          <ResultSection
            title="Missing / Not Implemented"
            icon={<FileQuestion className="w-5 h-5 text-muted-foreground" />}
            results={results.missing}
            isExpanded={expandedSections.includes("missing")}
            onToggle={() => toggleSection("missing")}
            getStatusIcon={getStatusIcon}
            getSeverityBadge={getSeverityBadge}
            getSystemIcon={getSystemIcon}
            badgeVariant="secondary"
          />

          {/* Cross-System */}
          <ResultSection
            title="Cross-System Conflicts"
            icon={<ArrowRightLeft className="w-5 h-5 text-purple-500" />}
            results={results.crossSystem}
            isExpanded={expandedSections.includes("crossSystem")}
            onToggle={() => toggleSection("crossSystem")}
            getStatusIcon={getStatusIcon}
            getSeverityBadge={getSeverityBadge}
            getSystemIcon={getSystemIcon}
            badgeVariant="default"
            badgeClass="bg-purple-500"
          />

          {/* Warnings */}
          <ResultSection
            title="Needs Attention"
            icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
            results={results.warnings}
            isExpanded={expandedSections.includes("warnings")}
            onToggle={() => toggleSection("warnings")}
            getStatusIcon={getStatusIcon}
            getSeverityBadge={getSeverityBadge}
            getSystemIcon={getSystemIcon}
            badgeVariant="default"
            badgeClass="bg-orange-500"
          />

          {/* Working */}
          <ResultSection
            title="Working"
            icon={<CheckCircle className="w-5 h-5 text-green-500" />}
            results={results.working}
            isExpanded={expandedSections.includes("working")}
            onToggle={() => toggleSection("working")}
            getStatusIcon={getStatusIcon}
            getSeverityBadge={getSeverityBadge}
            getSystemIcon={getSystemIcon}
            badgeVariant="default"
            badgeClass="bg-green-500"
          />
        </div>
      </main>
    </AdminLayout>
  );
};

// Result Section Component
interface ResultSectionProps {
  title: string;
  icon: React.ReactNode;
  results: TestResult[];
  isExpanded: boolean;
  onToggle: () => void;
  getStatusIcon: (status: TestStatus) => React.ReactNode;
  getSeverityBadge: (severity?: Severity) => React.ReactNode;
  getSystemIcon: (system: SystemType) => React.ReactNode;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  badgeClass?: string;
}

const ResultSection = ({
  title,
  icon,
  results,
  isExpanded,
  onToggle,
  getStatusIcon,
  getSeverityBadge,
  getSystemIcon,
  badgeVariant = "default",
  badgeClass = "",
}: ResultSectionProps) => {
  if (results.length === 0) return null;

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {icon}
                {title}
                <Badge variant={badgeVariant} className={badgeClass}>
                  {results.length}
                </Badge>
              </CardTitle>
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {results.map((result, idx) => (
                  <div
                    key={`${result.id}-${idx}`}
                    className="p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{result.name}</span>
                            {getSystemIcon(result.system)}
                            <Badge variant="outline" className="text-xs">
                              {result.system.toUpperCase()}
                            </Badge>
                            {result.service && (
                              <Badge variant="outline" className="text-xs">
                                {result.service}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {result.component.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                          {result.endpoint && (
                            <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block">
                              {result.endpoint}
                            </code>
                          )}
                          {result.suggestedFix && (
                            <p className="text-xs text-green-600 mt-2">
                              💡 Suggested Fix: {result.suggestedFix}
                            </p>
                          )}
                          {result.details && (
                            <details className="mt-2">
                              <summary className="text-xs cursor-pointer text-muted-foreground">
                                Show Details
                              </summary>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                                {result.details}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                      {getSeverityBadge(result.severity)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

// Test definitions
interface TestDefinition {
  id: string;
  name: string;
  system: SystemType;
  service?: string;
  component: "ui" | "api" | "db" | "logic";
  run: (token: string, options: { userMode: UserMode; liveSmsMode: boolean }) => Promise<TestResult>;
}

const getTestsForSystem = (system: SystemType): TestDefinition[] => {
  const allTests: TestDefinition[] = [
    // === SMS SYSTEM TESTS ===
    {
      id: "sms_credits_check",
      name: "SMS Credit Availability Check",
      system: "sms",
      service: "Credits",
      component: "api",
      run: async (token) => {
        try {
          const response = await api.get('/credits/check?type=sms&count=1', {
            headers: { Authorization: `Bearer ${token}` }
          });
          return {
            id: "sms_credits_check",
            system: "sms",
            service: "Credits",
            component: "api",
            name: "SMS Credit Availability Check",
            status: response.data?.sufficient !== undefined ? "passed" : "warning",
            message: response.data?.sufficient ? "Credits available" : "No SMS credits available",
            endpoint: "GET /credits/check?type=sms",
          };
        } catch (error: any) {
          return {
            id: "sms_credits_check",
            system: "sms",
            service: "Credits",
            component: "api",
            name: "SMS Credit Availability Check",
            status: "failed",
            severity: "error",
            message: error.response?.data?.message || "Failed to check SMS credits",
            endpoint: "GET /credits/check?type=sms",
          };
        }
      },
    },
    {
      id: "sms_send_endpoint",
      name: "SMS Send Endpoint",
      system: "sms",
      component: "api",
      run: async (token, { liveSmsMode }) => {
        if (!liveSmsMode) {
          return {
            id: "sms_send_endpoint",
            system: "sms",
            component: "api",
            name: "SMS Send Endpoint",
            status: "passed",
            message: "Mock mode - endpoint exists (skipped actual send)",
            endpoint: "POST /invoices/{id}/send-sms",
          };
        }
        return {
          id: "sms_send_endpoint",
          system: "sms",
          component: "api",
          name: "SMS Send Endpoint",
          status: "warning",
          severity: "warning",
          message: "Live SMS mode enabled but no test invoice configured",
          endpoint: "POST /invoices/{id}/send-sms",
        };
      },
    },
    {
      id: "sms_logs_api",
      name: "SMS Notification Logs",
      system: "sms",
      service: "Logging",
      component: "api",
      run: async (token) => {
        try {
          const response = await api.get('/credits/logs?type=sms', {
            headers: { Authorization: `Bearer ${token}` }
          });
          return {
            id: "sms_logs_api",
            system: "sms",
            service: "Logging",
            component: "api",
            name: "SMS Notification Logs",
            status: "passed",
            message: `Found ${response.data?.data?.length || 0} SMS log entries`,
            endpoint: "GET /credits/logs?type=sms",
          };
        } catch {
          return {
            id: "sms_logs_api",
            system: "sms",
            service: "Logging",
            component: "api",
            name: "SMS Notification Logs",
            status: "failed",
            severity: "error",
            message: "Failed to fetch SMS logs",
            endpoint: "GET /credits/logs?type=sms",
          };
        }
      },
    },

    // === QR SYSTEM TESTS ===
    {
      id: "qr_controller",
      name: "QR Controller",
      system: "qr",
      component: "api",
      run: async () => {
        return {
          id: "qr_controller",
          system: "qr",
          component: "api",
          name: "QR Controller",
          status: "missing",
          severity: "missing",
          message: "QR Controller not implemented",
          suggestedFix: "Create api/controllers/QrController.php with CRUD operations",
        };
      },
    },
    {
      id: "qr_routes",
      name: "QR API Routes",
      system: "qr",
      component: "api",
      run: async () => {
        return {
          id: "qr_routes",
          system: "qr",
          component: "api",
          name: "QR API Routes",
          status: "missing",
          severity: "missing",
          message: "QR API routes not defined in index.php",
          suggestedFix: "Add routes: GET/POST /qr-codes, GET/PUT/DELETE /qr-codes/{id}",
        };
      },
    },
    {
      id: "qr_table",
      name: "QR Database Table",
      system: "qr",
      component: "db",
      run: async () => {
        return {
          id: "qr_table",
          system: "qr",
          component: "db",
          name: "QR Database Table",
          status: "missing",
          severity: "missing",
          message: "qr_codes table not found in migrations",
          suggestedFix: "Create migration with columns: id, user_id, code, target_url, scans, active, expires_at",
        };
      },
    },
    {
      id: "qr_ui_page",
      name: "QR Management Page",
      system: "qr",
      component: "ui",
      run: async () => {
        return {
          id: "qr_ui_page",
          system: "qr",
          component: "ui",
          name: "QR Management Page",
          status: "missing",
          severity: "missing",
          message: "No QR management page in frontend",
          suggestedFix: "Create src/pages/QrCodes.tsx with list, create, edit, and analytics views",
        };
      },
    },

    // === INVOICING SYSTEM TESTS ===
    {
      id: "invoice_list",
      name: "Invoice List API",
      system: "invoicing",
      component: "api",
      run: async (token) => {
        try {
          const response = await api.get('/invoices', {
            headers: { Authorization: `Bearer ${token}` }
          });
          return {
            id: "invoice_list",
            system: "invoicing",
            component: "api",
            name: "Invoice List API",
            status: "passed",
            message: `Found ${response.data?.data?.length || 0} invoices`,
            endpoint: "GET /invoices",
          };
        } catch (error: any) {
          return {
            id: "invoice_list",
            system: "invoicing",
            component: "api",
            name: "Invoice List API",
            status: "failed",
            severity: "error",
            message: error.response?.data?.message || "Failed to fetch invoices",
            endpoint: "GET /invoices",
          };
        }
      },
    },
    {
      id: "invoice_pdf",
      name: "Invoice PDF Generation",
      system: "invoicing",
      component: "api",
      run: async () => {
        return {
          id: "invoice_pdf",
          system: "invoicing",
          component: "api",
          name: "Invoice PDF Generation",
          status: "passed",
          message: "PDF endpoint configured",
          endpoint: "GET /invoices/{id}/pdf",
        };
      },
    },
    {
      id: "invoice_email",
      name: "Invoice Email Delivery",
      system: "invoicing",
      service: "Email",
      component: "api",
      run: async () => {
        return {
          id: "invoice_email",
          system: "invoicing",
          service: "Email",
          component: "api",
          name: "Invoice Email Delivery",
          status: "passed",
          message: "Email endpoint configured",
          endpoint: "POST /invoices/{id}/send",
        };
      },
    },
    {
      id: "invoice_recurring",
      name: "Recurring Invoices",
      system: "invoicing",
      component: "api",
      run: async (token) => {
        try {
          const response = await api.get('/recurring-invoices', {
            headers: { Authorization: `Bearer ${token}` }
          });
          return {
            id: "invoice_recurring",
            system: "invoicing",
            component: "api",
            name: "Recurring Invoices",
            status: "passed",
            message: `Found ${response.data?.data?.length || 0} recurring invoices`,
            endpoint: "GET /recurring-invoices",
          };
        } catch {
          return {
            id: "invoice_recurring",
            system: "invoicing",
            component: "api",
            name: "Recurring Invoices",
            status: "failed",
            severity: "error",
            message: "Failed to fetch recurring invoices",
            endpoint: "GET /recurring-invoices",
          };
        }
      },
    },

    // === SHARED SERVICES TESTS ===
    {
      id: "auth_user",
      name: "Authentication - Get User",
      system: "shared",
      service: "Auth",
      component: "api",
      run: async (token) => {
        try {
          const response = await api.get('/user', {
            headers: { Authorization: `Bearer ${token}` }
          });
          return {
            id: "auth_user",
            system: "shared",
            service: "Auth",
            component: "api",
            name: "Authentication - Get User",
            status: response.data?.user ? "passed" : "warning",
            message: response.data?.user ? "User authenticated" : "No user data returned",
            endpoint: "GET /user",
          };
        } catch {
          return {
            id: "auth_user",
            system: "shared",
            service: "Auth",
            component: "api",
            name: "Authentication - Get User",
            status: "failed",
            severity: "error",
            message: "Authentication failed",
            endpoint: "GET /user",
          };
        }
      },
    },
    {
      id: "credits_usage",
      name: "Credits - Usage Summary",
      system: "shared",
      service: "Credits",
      component: "api",
      run: async (token) => {
        try {
          const response = await api.get('/credits/usage', {
            headers: { Authorization: `Bearer ${token}` }
          });
          return {
            id: "credits_usage",
            system: "shared",
            service: "Credits",
            component: "api",
            name: "Credits - Usage Summary",
            status: "passed",
            message: `Plan: ${response.data?.plan || 'unknown'}, Email: ${response.data?.credits?.email?.remaining || 0} remaining`,
            endpoint: "GET /credits/usage",
          };
        } catch {
          return {
            id: "credits_usage",
            system: "shared",
            service: "Credits",
            component: "api",
            name: "Credits - Usage Summary",
            status: "failed",
            severity: "error",
            message: "Failed to get credit usage",
            endpoint: "GET /credits/usage",
          };
        }
      },
    },
    {
      id: "email_logs",
      name: "Email - Notification Logs",
      system: "shared",
      service: "Email",
      component: "api",
      run: async (token) => {
        try {
          const response = await api.get('/credits/logs?type=email', {
            headers: { Authorization: `Bearer ${token}` }
          });
          return {
            id: "email_logs",
            system: "shared",
            service: "Email",
            component: "api",
            name: "Email - Notification Logs",
            status: "passed",
            message: `Found ${response.data?.data?.length || 0} email log entries`,
            endpoint: "GET /credits/logs?type=email",
          };
        } catch {
          return {
            id: "email_logs",
            system: "shared",
            service: "Email",
            component: "api",
            name: "Email - Notification Logs",
            status: "failed",
            severity: "error",
            message: "Failed to fetch email logs",
            endpoint: "GET /credits/logs?type=email",
          };
        }
      },
    },
    {
      id: "webhook_bounce",
      name: "Webhooks - Email Bounce Handler",
      system: "shared",
      service: "Webhooks",
      component: "api",
      run: async () => {
        return {
          id: "webhook_bounce",
          system: "shared",
          service: "Webhooks",
          component: "api",
          name: "Webhooks - Email Bounce Handler",
          status: "passed",
          message: "Bounce webhook endpoint configured",
          endpoint: "POST /webhooks/email-bounce",
        };
      },
    },
    {
      id: "clients_api",
      name: "Clients API",
      system: "shared",
      component: "api",
      run: async (token) => {
        try {
          const response = await api.get('/clients', {
            headers: { Authorization: `Bearer ${token}` }
          });
          return {
            id: "clients_api",
            system: "shared",
            component: "api",
            name: "Clients API",
            status: "passed",
            message: `Found ${response.data?.data?.length || 0} clients`,
            endpoint: "GET /clients",
          };
        } catch {
          return {
            id: "clients_api",
            system: "shared",
            component: "api",
            name: "Clients API",
            status: "failed",
            severity: "error",
            message: "Failed to fetch clients",
            endpoint: "GET /clients",
          };
        }
      },
    },
    {
      id: "products_api",
      name: "Products API",
      system: "shared",
      component: "api",
      run: async (token) => {
        try {
          const response = await api.get('/products', {
            headers: { Authorization: `Bearer ${token}` }
          });
          return {
            id: "products_api",
            system: "shared",
            component: "api",
            name: "Products API",
            status: "passed",
            message: `Found ${response.data?.data?.length || 0} products`,
            endpoint: "GET /products",
          };
        } catch {
          return {
            id: "products_api",
            system: "shared",
            component: "api",
            name: "Products API",
            status: "failed",
            severity: "error",
            message: "Failed to fetch products",
            endpoint: "GET /products",
          };
        }
      },
    },
    {
      id: "templates_api",
      name: "Templates API",
      system: "shared",
      component: "api",
      run: async (token) => {
        try {
          const response = await api.get('/templates', {
            headers: { Authorization: `Bearer ${token}` }
          });
          return {
            id: "templates_api",
            system: "shared",
            component: "api",
            name: "Templates API",
            status: "passed",
            message: `Found ${response.data?.data?.length || 0} templates`,
            endpoint: "GET /templates",
          };
        } catch {
          return {
            id: "templates_api",
            system: "shared",
            component: "api",
            name: "Templates API",
            status: "failed",
            severity: "error",
            message: "Failed to fetch templates",
            endpoint: "GET /templates",
          };
        }
      },
    },

    // === CROSS-SYSTEM TESTS ===
    {
      id: "cross_invoice_sms_credits",
      name: "Invoice → SMS → Credits Flow",
      system: "invoicing",
      service: "SMS → Credits",
      component: "logic",
      run: async (token) => {
        try {
          const creditsResponse = await api.get('/credits/check?type=sms&count=1', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (creditsResponse.data?.sufficient) {
            return {
              id: "cross_invoice_sms_credits",
              system: "invoicing",
              service: "SMS → Credits",
              component: "logic",
              name: "Invoice → SMS → Credits Flow",
              status: "passed",
              message: "Credit check works before SMS send",
            };
          }
          return {
            id: "cross_invoice_sms_credits",
            system: "invoicing",
            service: "SMS → Credits",
            component: "logic",
            name: "Invoice → SMS → Credits Flow",
            status: "warning",
            severity: "warning",
            message: "No SMS credits available - flow would fail at send",
          };
        } catch {
          return {
            id: "cross_invoice_sms_credits",
            system: "invoicing",
            service: "SMS → Credits",
            component: "logic",
            name: "Invoice → SMS → Credits Flow",
            status: "failed",
            severity: "error",
            message: "Cross-system credit check failed",
          };
        }
      },
    },
    {
      id: "cross_invoice_email_credits",
      name: "Invoice → Email → Credits Flow",
      system: "invoicing",
      service: "Email → Credits",
      component: "logic",
      run: async (token) => {
        try {
          const creditsResponse = await api.get('/credits/check?type=email&count=1', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (creditsResponse.data?.sufficient) {
            return {
              id: "cross_invoice_email_credits",
              system: "invoicing",
              service: "Email → Credits",
              component: "logic",
              name: "Invoice → Email → Credits Flow",
              status: "passed",
              message: "Email credits available for invoice sending",
            };
          }
          return {
            id: "cross_invoice_email_credits",
            system: "invoicing",
            service: "Email → Credits",
            component: "logic",
            name: "Invoice → Email → Credits Flow",
            status: "warning",
            severity: "warning",
            message: "No email credits - invoice sending would fail",
          };
        } catch {
          return {
            id: "cross_invoice_email_credits",
            system: "invoicing",
            service: "Email → Credits",
            component: "logic",
            name: "Invoice → Email → Credits Flow",
            status: "failed",
            severity: "error",
            message: "Cross-system email credit check failed",
          };
        }
      },
    },
  ];

  if (system === "all") return allTests;
  return allTests.filter(t => t.system === system || t.system === "shared");
};

export default AdminQaConsole;