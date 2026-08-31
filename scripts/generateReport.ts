import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import * as XLSX from 'xlsx';

interface VitestAssertion {
  ancestorTitles: string[];
  fullName: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending' | 'todo';
  title: string;
  duration?: number;
  failureMessages?: string[];
}

interface VitestResultFile {
  name: string;
  status: string;
  assertionResults: VitestAssertion[];
}

interface VitestJsonReport {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  numTodoTests: number;
  startTime: number;
  success: boolean;
  testResults: VitestResultFile[];
}

interface FormattedTestCase {
  'Test ID': string;
  'Test Name': string;
  'Test Suite': string;
  'Description': string;
  'Status': string;
  'Execution Time': string;
  'Error/Failure Message': string;
}

async function runTestsAndGenerateReport() {
  const rootDir = process.cwd();
  const reportsDir = path.join(rootDir, 'reports');
  const rawResultsPath = path.join(reportsDir, 'raw-test-results.json');
  const excelReportPath = path.join(reportsDir, 'VerifyAI_Test_Report.xlsx');

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  console.log('====================================================');
  console.log('🚀 Running VerifyAI Complete Test Matrix (1200 Tests)');
  console.log('====================================================');

  const startTime = Date.now();

  try {
    // Run vitest with json reporter
    const vitestCmd = `npx vitest run --reporter=json --outputFile="${rawResultsPath}"`;
    execSync(vitestCmd, { stdio: 'inherit', cwd: rootDir });
  } catch (err: any) {
    // Vitest may exit with 1 if there are failures, but output json is still created
    console.log('ℹ️ Vitest finished (some assertions may have failed). Processing results...');
  }

  if (!fs.existsSync(rawResultsPath)) {
    console.error('❌ Error: Vitest JSON output was not generated.');
    process.exit(1);
  }

  const rawJsonContent = fs.readFileSync(rawResultsPath, 'utf-8');
  const parsedData: VitestJsonReport = JSON.parse(rawJsonContent);

  const appiumTests: FormattedTestCase[] = [];
  const loadTests: FormattedTestCase[] = [];
  const securityTests: FormattedTestCase[] = [];
  const seleniumTests: FormattedTestCase[] = [];

  for (const fileResult of parsedData.testResults) {
    const normalizedPath = fileResult.name.replace(/\\/g, '/');

    for (const test of fileResult.assertionResults) {
      let suiteCategory = 'Other';
      let idPrefix = 'TEST';

      if (normalizedPath.includes('/appium-mobile/')) {
        suiteCategory = 'Appium Mobile Native & Expo Test Suite';
        idPrefix = 'MOB';
      } else if (normalizedPath.includes('/load-stress/')) {
        suiteCategory = 'High-Concurrency Load & Stress Test Suite';
        idPrefix = 'LOAD';
      } else if (normalizedPath.includes('/security/')) {
        suiteCategory = 'Security & Vulnerability Test Suite';
        idPrefix = 'SEC';
      } else if (normalizedPath.includes('/selenium-web/')) {
        suiteCategory = 'Selenium Web Application E2E Suite';
        idPrefix = 'WEB';
      }

      // Extract ID from title if formatted like MOB-001, otherwise generate
      const idMatch = test.title.match(/^([A-Z]+-\d+)/);
      const testId = idMatch ? idMatch[1] : `${idPrefix}-${test.title.substring(0, 10)}`;

      const testName = test.title.replace(/^[A-Z]+-\d+:\s*/, '').trim();
      const description = test.ancestorTitles.length > 0 
        ? `${test.ancestorTitles.join(' > ')} > ${testName}`
        : testName;

      let status = 'PASSED';
      if (test.status === 'failed') status = 'FAILED';
      else if (test.status === 'skipped' || test.status === 'pending' || test.status === 'todo') status = 'SKIPPED';

      const durationMs = typeof test.duration === 'number' ? Math.round(test.duration) : 0;
      const durationStr = durationMs >= 1000 ? `${(durationMs / 1000).toFixed(2)}s` : `${durationMs}ms`;
      const failureMsg = test.failureMessages && test.failureMessages.length > 0 
        ? test.failureMessages.join('\n').substring(0, 500) 
        : 'None';

      const row: FormattedTestCase = {
        'Test ID': testId,
        'Test Name': testName,
        'Test Suite': suiteCategory,
        'Description': description,
        'Status': status,
        'Execution Time': durationStr,
        'Error/Failure Message': failureMsg,
      };

      if (normalizedPath.includes('/appium-mobile/')) {
        appiumTests.push(row);
      } else if (normalizedPath.includes('/load-stress/')) {
        loadTests.push(row);
      } else if (normalizedPath.includes('/security/')) {
        securityTests.push(row);
      } else if (normalizedPath.includes('/selenium-web/')) {
        seleniumTests.push(row);
      }
    }
  }

  // Sort test cases by Test ID
  const sortById = (a: FormattedTestCase, b: FormattedTestCase) => a['Test ID'].localeCompare(b['Test ID'], undefined, { numeric: true });
  appiumTests.sort(sortById);
  loadTests.sort(sortById);
  securityTests.sort(sortById);
  seleniumTests.sort(sortById);

  // Calculate suite metrics
  const getMetrics = (list: FormattedTestCase[]) => {
    const total = list.length;
    const passed = list.filter(t => t.Status === 'PASSED').length;
    const failed = list.filter(t => t.Status === 'FAILED').length;
    const skipped = list.filter(t => t.Status === 'SKIPPED').length;
    const passPct = total > 0 ? ((passed / total) * 100).toFixed(2) + '%' : '0.00%';
    return { total, passed, failed, skipped, passPct };
  };

  const appiumMetrics = getMetrics(appiumTests);
  const loadMetrics = getMetrics(loadTests);
  const securityMetrics = getMetrics(securityTests);
  const seleniumMetrics = getMetrics(seleniumTests);

  const totalAll = appiumMetrics.total + loadMetrics.total + securityMetrics.total + seleniumMetrics.total;
  const totalPassed = appiumMetrics.passed + loadMetrics.passed + securityMetrics.passed + seleniumMetrics.passed;
  const totalFailed = appiumMetrics.failed + loadMetrics.failed + securityMetrics.failed + seleniumMetrics.failed;
  const totalSkipped = appiumMetrics.skipped + loadMetrics.skipped + securityMetrics.skipped + seleniumMetrics.skipped;
  const overallPassPct = totalAll > 0 ? ((totalPassed / totalAll) * 100).toFixed(2) + '%' : '0.00%';
  const totalDurationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  // Construct Summary sheet data
  const summaryRows = [
    { 'VerifyAI Test Automation Executive Summary': 'Project Name', 'Value / Metric': 'VerifyAI Autonomous Fact-Checking System' },
    { 'VerifyAI Test Automation Executive Summary': 'Report Date & Time', 'Value / Metric': new Date().toLocaleString() },
    { 'VerifyAI Test Automation Executive Summary': 'Target Environment', 'Value / Metric': 'Vercel Serverless / Node.js / React 19' },
    { 'VerifyAI Test Automation Executive Summary': 'Total Test Execution Time', 'Value / Metric': `${totalDurationSec} seconds` },
    { 'VerifyAI Test Automation Executive Summary': '', 'Value / Metric': '' },
    { 'VerifyAI Test Automation Executive Summary': 'TEST SUITE BREAKDOWN', 'Value / Metric': 'COUNT / STATUS' },
    { 'VerifyAI Test Automation Executive Summary': '1. Appium Mobile Tests', 'Value / Metric': `${appiumMetrics.total} Tests (Passed: ${appiumMetrics.passed}, Failed: ${appiumMetrics.failed}, Skipped: ${appiumMetrics.skipped}) - ${appiumMetrics.passPct}` },
    { 'VerifyAI Test Automation Executive Summary': '2. Load Stress Tests', 'Value / Metric': `${loadMetrics.total} Tests (Passed: ${loadMetrics.passed}, Failed: ${loadMetrics.failed}, Skipped: ${loadMetrics.skipped}) - ${loadMetrics.passPct}` },
    { 'VerifyAI Test Automation Executive Summary': '3. Security Tests', 'Value / Metric': `${securityMetrics.total} Tests (Passed: ${securityMetrics.passed}, Failed: ${securityMetrics.failed}, Skipped: ${securityMetrics.skipped}) - ${securityMetrics.passPct}` },
    { 'VerifyAI Test Automation Executive Summary': '4. Selenium Web Tests', 'Value / Metric': `${seleniumMetrics.total} Tests (Passed: ${seleniumMetrics.passed}, Failed: ${seleniumMetrics.failed}, Skipped: ${seleniumMetrics.skipped}) - ${seleniumMetrics.passPct}` },
    { 'VerifyAI Test Automation Executive Summary': '', 'Value / Metric': '' },
    { 'VerifyAI Test Automation Executive Summary': 'OVERALL TEST TOTALS', 'Value / Metric': 'METRIC SUMMARY' },
    { 'VerifyAI Test Automation Executive Summary': 'TOTAL DISCOVERED TEST CASES', 'Value / Metric': `${totalAll} / 1200` },
    { 'VerifyAI Test Automation Executive Summary': 'TOTAL PASSED', 'Value / Metric': totalPassed },
    { 'VerifyAI Test Automation Executive Summary': 'TOTAL FAILED', 'Value / Metric': totalFailed },
    { 'VerifyAI Test Automation Executive Summary': 'TOTAL SKIPPED', 'Value / Metric': totalSkipped },
    { 'VerifyAI Test Automation Executive Summary': 'OVERALL PASS PERCENTAGE', 'Value / Metric': overallPassPct },
    { 'VerifyAI Test Automation Executive Summary': 'OVERALL VERDICT', 'Value / Metric': totalFailed === 0 ? 'PASSED (100% SUCCESS)' : 'FAILED' },
  ];

  // Create Excel Workbook
  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 45 }, { wch: 75 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  const addTestSheet = (sheetName: string, tests: FormattedTestCase[]) => {
    const sheet = XLSX.utils.json_to_sheet(tests);
    sheet['!cols'] = [
      { wch: 12 }, // Test ID
      { wch: 60 }, // Test Name
      { wch: 40 }, // Test Suite
      { wch: 70 }, // Description
      { wch: 12 }, // Status
      { wch: 16 }, // Execution Time
      { wch: 40 }, // Error Message
    ];
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  };

  addTestSheet('Appium Mobile Tests', appiumTests);
  addTestSheet('Load Stress Tests', loadTests);
  addTestSheet('Security Tests', securityTests);
  addTestSheet('Selenium Web Tests', seleniumTests);

  // Write Excel file
  XLSX.writeFile(workbook, excelReportPath);

  // Clean up raw JSON file
  if (fs.existsSync(rawResultsPath)) {
    fs.unlinkSync(rawResultsPath);
  }

  console.log('\n====================================================');
  console.log('📊 VERIFYAI TEST EXECUTION REPORT SUMMARY');
  console.log('====================================================');
  console.log(`📱 Appium Mobile Tests : ${appiumMetrics.passed}/${appiumMetrics.total} (Passed: ${appiumMetrics.passed}, Failed: ${appiumMetrics.failed}, Skipped: ${appiumMetrics.skipped})`);
  console.log(`⚡ Load Stress Tests   : ${loadMetrics.passed}/${loadMetrics.total} (Passed: ${loadMetrics.passed}, Failed: ${loadMetrics.failed}, Skipped: ${loadMetrics.skipped})`);
  console.log(`🛡️ Security Tests      : ${securityMetrics.passed}/${securityMetrics.total} (Passed: ${securityMetrics.passed}, Failed: ${securityMetrics.failed}, Skipped: ${securityMetrics.skipped})`);
  console.log(`🌐 Selenium Web Tests  : ${seleniumMetrics.passed}/${seleniumMetrics.total} (Passed: ${seleniumMetrics.passed}, Failed: ${seleniumMetrics.failed}, Skipped: ${seleniumMetrics.skipped})`);
  console.log('----------------------------------------------------');
  console.log(`🎯 TOTAL TEST CASES    : ${totalPassed}/${totalAll} (Target: 1200/1200)`);
  console.log(`📈 Overall Pass Rate   : ${overallPassPct}`);
  console.log(`📁 Excel Report File   : ${excelReportPath}`);
  console.log('====================================================\n');

  if (totalAll !== 1200) {
    console.error(`⚠️ Warning: Expected exactly 1200 tests, found ${totalAll}`);
  }

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestsAndGenerateReport();
