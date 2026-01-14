import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Play, 
  RefreshCw, 
  Copy, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock,
  ChevronDown,
  ChevronRight,
  Shield,
  Database,
  Globe,
  Lock,
  Layers,
  Activity,
  FileJson,
  FileText,
  Trash2,
  Home
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { 
  TestRunner, 
  TestReport, 
  TestResult, 
  TestSuite,
  testUtils,
  generateTextReport,
  generateJSONReport 
} from '@/lib/testRunner';

const statusIcons = {
  passed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  pending: <Clock className="h-4 w-4 text-muted-foreground" />,
  running: <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />,
  skipped: <Clock className="h-4 w-4 text-muted-foreground" />,
};

const categoryIcons = {
  api: <Globe className="h-4 w-4" />,
  auth: <Lock className="h-4 w-4" />,
  frontend: <Layers className="h-4 w-4" />,
  database: <Database className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  integration: <Activity className="h-4 w-4" />,
};

const verdictColors = {
  PASS: 'bg-green-500',
  FAIL: 'bg-red-500',
  PARTIAL: 'bg-yellow-500',
  UNKNOWN: 'bg-muted',
};

function TestResultCard({ test }: { test: TestResult }) {
  const [isOpen, setIsOpen] = useState(test.status === 'failed');

  const copyTestDetails = async () => {
    const details = `
Test: ${test.name}
Status: ${test.status.toUpperCase()}
Category: ${test.category}
Priority: ${test.priority}
Duration: ${test.duration}ms
Message: ${test.message || 'N/A'}
${test.error ? `Error: ${test.error}` : ''}
${test.expected ? `Expected: ${test.expected}` : ''}
${test.actual ? `Actual: ${test.actual}` : ''}
${test.rootCause ? `Root Cause: ${test.rootCause}` : ''}
${test.fix ? `Suggested Fix: ${test.fix}` : ''}
${test.stack ? `Stack Trace: ${test.stack}` : ''}
Timestamp: ${test.timestamp.toISOString()}
    `.trim();
    
    await testUtils.copyToClipboard(details);
    toast.success('Test details copied to clipboard');
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg p-3 mb-2 bg-card">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {statusIcons[test.status]}
              <span className="font-medium">{test.name}</span>
              <Badge variant="outline" className="text-xs">{test.priority}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{test.duration}ms</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); copyTestDetails(); }}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="space-y-2 text-sm">
            {test.message && (
              <div className="flex gap-2">
                <span className="text-muted-foreground min-w-20">Message:</span>
                <span>{test.message}</span>
              </div>
            )}
            {test.expected && (
              <div className="flex gap-2">
                <span className="text-muted-foreground min-w-20">Expected:</span>
                <code className="bg-muted px-1 rounded">{test.expected}</code>
              </div>
            )}
            {test.actual && (
              <div className="flex gap-2">
                <span className="text-muted-foreground min-w-20">Actual:</span>
                <code className="bg-muted px-1 rounded">{test.actual}</code>
              </div>
            )}
            {test.error && (
              <div className="flex gap-2">
                <span className="text-red-500 min-w-20">Error:</span>
                <code className="bg-red-500/10 px-1 rounded text-red-500">{test.error}</code>
              </div>
            )}
            {test.rootCause && (
              <div className="flex gap-2">
                <span className="text-yellow-500 min-w-20">Root Cause:</span>
                <span>{test.rootCause}</span>
              </div>
            )}
            {test.fix && (
              <div className="flex gap-2">
                <span className="text-green-500 min-w-20">Fix:</span>
                <span>{test.fix}</span>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function TestSuiteCard({ suite }: { suite: TestSuite }) {
  const [isOpen, setIsOpen] = useState(suite.failed > 0);
  const totalTests = suite.tests.length;
  const passRate = totalTests > 0 ? Math.round((suite.passed / totalTests) * 100) : 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="mb-4">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                {categoryIcons[suite.category]}
                <CardTitle className="text-lg">{suite.name}</CardTitle>
                <Badge variant="outline">{suite.category}</Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{suite.passed}</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">{suite.failed}</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">{suite.warnings}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={passRate} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground">{passRate}%</span>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-2">
            {suite.tests.map((test) => (
              <TestResultCard key={test.id} test={test} />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function AutomatedTests() {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<TestReport | null>(null);
  const [autoRun, setAutoRun] = useState(false);

  const runTests = useCallback(async () => {
    setIsRunning(true);
    setReport(null);

    const runner = new TestRunner((progressReport) => {
      setReport({ ...progressReport });
    });

    try {
      const finalReport = await runner.runAll();
      setReport(finalReport);
      toast.success(`Tests completed: ${finalReport.passed} passed, ${finalReport.failed} failed`);
    } catch (error) {
      toast.error('Test execution failed');
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  }, []);

  // Auto-run tests on mount if enabled
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autorun') === 'true' || autoRun) {
      runTests();
    }
  }, [autoRun, runTests]);

  const exportReport = (format: 'json' | 'text') => {
    if (!report) return;

    const content = format === 'json' ? generateJSONReport(report) : generateTextReport(report);
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-report-${report.id}.${format === 'json' ? 'json' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Report exported as ${format.toUpperCase()}`);
  };

  const copyFullReport = async () => {
    if (!report) return;
    const content = generateTextReport(report);
    await testUtils.copyToClipboard(content);
    toast.success('Full report copied to clipboard');
  };

  const clearReport = () => {
    setReport(null);
    toast.info('Report cleared');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <Home className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Automated System Tests</h1>
                <p className="text-sm text-muted-foreground">
                  Comprehensive end-to-end testing dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRun(!autoRun)}
                className={autoRun ? 'border-green-500' : ''}
              >
                Auto-run: {autoRun ? 'ON' : 'OFF'}
              </Button>
              <Button
                onClick={runTests}
                disabled={isRunning}
                className="gap-2"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run All Tests
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Quick Stats */}
        {report && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{report.totalTests}</div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-500">{report.passed}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-red-500">{report.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-yellow-500">{report.warnings}</div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{report.confidence}%</div>
                <div className="text-sm text-muted-foreground">Confidence</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className={`inline-flex px-3 py-1 rounded-full text-white font-bold ${verdictColors[report.verdict]}`}>
                  {report.verdict}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Verdict</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* System Health */}
        {report && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>API:</span>
                  {report.systemHealth.api ? (
                    <Badge className="bg-green-500">Healthy</Badge>
                  ) : (
                    <Badge variant="destructive">Unhealthy</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span>Auth:</span>
                  {report.systemHealth.auth ? (
                    <Badge className="bg-green-500">Working</Badge>
                  ) : (
                    <Badge variant="destructive">Failed</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span>Storage:</span>
                  {report.systemHealth.storage ? (
                    <Badge className="bg-green-500">Available</Badge>
                  ) : (
                    <Badge variant="destructive">Unavailable</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="results" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="results">Test Results</TabsTrigger>
              <TabsTrigger value="failures">Failures Only</TabsTrigger>
              <TabsTrigger value="report">Full Report</TabsTrigger>
            </TabsList>
            {report && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={copyFullReport} className="gap-1">
                  <Copy className="h-4 w-4" />
                  Copy Report
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportReport('json')} className="gap-1">
                  <FileJson className="h-4 w-4" />
                  JSON
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportReport('text')} className="gap-1">
                  <FileText className="h-4 w-4" />
                  Text
                </Button>
                <Button variant="outline" size="sm" onClick={clearReport} className="gap-1">
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="results">
            {!report && !isRunning && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Test Results</h3>
                  <p className="text-muted-foreground mb-4">
                    Click "Run All Tests" to start the automated test suite.
                  </p>
                  <Button onClick={runTests}>
                    <Play className="h-4 w-4 mr-2" />
                    Run Tests
                  </Button>
                </CardContent>
              </Card>
            )}

            {isRunning && !report && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <RefreshCw className="h-12 w-12 mx-auto text-blue-500 animate-spin mb-4" />
                  <h3 className="text-lg font-medium mb-2">Running Tests...</h3>
                  <p className="text-muted-foreground">
                    Please wait while we verify all system components.
                  </p>
                </CardContent>
              </Card>
            )}

            {report && (
              <ScrollArea className="h-[calc(100vh-400px)]">
                {report.suites.map((suite) => (
                  <TestSuiteCard key={suite.name} suite={suite} />
                ))}
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="failures">
            {report && (
              <ScrollArea className="h-[calc(100vh-400px)]">
                {report.suites
                  .filter(s => s.failed > 0)
                  .map((suite) => (
                    <Card key={suite.name} className="mb-4">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          {categoryIcons[suite.category]}
                          <CardTitle className="text-lg">{suite.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {suite.tests
                          .filter(t => t.status === 'failed')
                          .map((test) => (
                            <TestResultCard key={test.id} test={test} />
                          ))}
                      </CardContent>
                    </Card>
                  ))}
                {report.suites.every(s => s.failed === 0) && (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                      <h3 className="text-lg font-medium">No Failures!</h3>
                      <p className="text-muted-foreground">
                        All tests passed successfully.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="report">
            {report && (
              <Card>
                <CardHeader>
                  <CardTitle>Full Test Report</CardTitle>
                  <CardDescription>
                    Report ID: {report.id} | Generated: {report.endTime?.toISOString() || 'In Progress'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-500px)]">
                    <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                      {generateTextReport(report)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-8">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          Automated Test Dashboard v1.0 | Tests run against: {import.meta.env.VITE_API_URL || 'https://invoices.ieosuia.com/api'}
        </div>
      </footer>
    </div>
  );
}
