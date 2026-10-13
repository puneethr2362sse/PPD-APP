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
  'Scenario': string;
  'Expected Result': string;
  'Actual Result': string;
  'PASS/FAIL': 'PASS' | 'FAIL' | 'SKIP';
  'Execution Timestamp': string;
  'Test Suite': string;
  'Test Name': string;
  'Status': string;
  'Execution Time': string;
  'Error/Failure Message': string;
}

async function runTestsAndGenerateReport() {
  const rootDir = process.cwd();
  const reportsDir = path.join(rootDir, 'reports');
  const publicDir = path.join(rootDir, 'public');
  const rawResultsPath = path.join(reportsDir, 'raw-test-results.json');
  const excelReportPath = path.join(reportsDir, 'VerifyAI_Test_Report.xlsx');
  const publicExcelPath = path.join(publicDir, 'VerifyAI_Test_Report.xlsx');

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('====================================================');
  console.log('🚀 Running VerifyAI Complete Test Matrix (1500 Tests)');
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
  const evidenceTests: FormattedTestCase[] = [];

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
      } else if (normalizedPath.includes('evidence-verification')) {
        suiteCategory = 'AI Vision & Evidence Verification Test Suite';
        idPrefix = 'EVD';
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

      const passFail: 'PASS' | 'FAIL' | 'SKIP' = status === 'PASSED' ? 'PASS' : (status === 'SKIPPED' ? 'SKIP' : 'FAIL');
      const expectedResult = 'Test assertions evaluate successfully with zero unhandled exceptions.';
      const actualResult = status === 'PASSED'
        ? `Assertion passed in ${durationStr} with zero errors.`
        : (failureMsg !== 'None' ? `Failed: ${failureMsg}` : `Finished with status: ${status}`);
      const executionTimestamp = new Date(parsedData.startTime || startTime).toISOString();

      const row: FormattedTestCase = {
        'Test ID': testId,
        'Scenario': description,
        'Expected Result': expectedResult,
        'Actual Result': actualResult,
        'PASS/FAIL': passFail,
        'Execution Timestamp': executionTimestamp,
        'Test Suite': suiteCategory,
        'Test Name': testName,
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
      } else if (normalizedPath.includes('evidence-verification')) {
        evidenceTests.push(row);
      }
    }
  }

  // Sort test cases by Test ID
  const sortById = (a: FormattedTestCase, b: FormattedTestCase) => a['Test ID'].localeCompare(b['Test ID'], undefined, { numeric: true });
  appiumTests.sort(sortById);
  loadTests.sort(sortById);
  securityTests.sort(sortById);
  seleniumTests.sort(sortById);
  evidenceTests.sort(sortById);

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
  const evidenceMetrics = getMetrics(evidenceTests);

  const totalAll = appiumMetrics.total + loadMetrics.total + securityMetrics.total + seleniumMetrics.total + evidenceMetrics.total;
  const totalPassed = appiumMetrics.passed + loadMetrics.passed + securityMetrics.passed + seleniumMetrics.passed + evidenceMetrics.passed;
  const totalFailed = appiumMetrics.failed + loadMetrics.failed + securityMetrics.failed + seleniumMetrics.failed + evidenceMetrics.failed;
  const totalSkipped = appiumMetrics.skipped + loadMetrics.skipped + securityMetrics.skipped + seleniumMetrics.skipped + evidenceMetrics.skipped;
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
    { 'VerifyAI Test Automation Executive Summary': '5. AI Evidence Verification Tests', 'Value / Metric': `${evidenceMetrics.total} Tests (Passed: ${evidenceMetrics.passed}, Failed: ${evidenceMetrics.failed}, Skipped: ${evidenceMetrics.skipped}) - ${evidenceMetrics.passPct}` },
    { 'VerifyAI Test Automation Executive Summary': '', 'Value / Metric': '' },
    { 'VerifyAI Test Automation Executive Summary': 'OVERALL TEST TOTALS', 'Value / Metric': 'METRIC SUMMARY' },
    { 'VerifyAI Test Automation Executive Summary': 'TOTAL DISCOVERED TEST CASES', 'Value / Metric': `${totalAll} / 1500` },
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
      { wch: 65 }, // Scenario
      { wch: 45 }, // Expected Result
      { wch: 45 }, // Actual Result
      { wch: 12 }, // PASS/FAIL
      { wch: 25 }, // Execution Timestamp
      { wch: 35 }, // Test Suite
      { wch: 50 }, // Test Name
      { wch: 12 }, // Status
      { wch: 16 }, // Execution Time
      { wch: 40 }, // Error/Failure Message
    ];
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  };

  addTestSheet('Appium Mobile Tests', appiumTests);
  addTestSheet('Load Stress Tests', loadTests);
  addTestSheet('Security Tests', securityTests);
  addTestSheet('Selenium Web Tests', seleniumTests);
  addTestSheet('Evidence Verification Tests', evidenceTests);

  // Write Excel file to both reports/ and public/ directories
  XLSX.writeFile(workbook, excelReportPath);
  XLSX.writeFile(workbook, publicExcelPath);

  // Clean up raw JSON file
  if (fs.existsSync(rawResultsPath)) {
    fs.unlinkSync(rawResultsPath);
  }

  console.log('\n====================================================');
  console.log('📊 VERIFYAI TEST EXECUTION REPORT SUMMARY');
  console.log('====================================================');
  console.log(`📱 Appium Mobile Tests      : ${appiumMetrics.passed}/${appiumMetrics.total} (Passed: ${appiumMetrics.passed}, Failed: ${appiumMetrics.failed}, Skipped: ${appiumMetrics.skipped})`);
  console.log(`⚡ Load Stress Tests        : ${loadMetrics.passed}/${loadMetrics.total} (Passed: ${loadMetrics.passed}, Failed: ${loadMetrics.failed}, Skipped: ${loadMetrics.skipped})`);
  console.log(`🛡️ Security Tests           : ${securityMetrics.passed}/${securityMetrics.total} (Passed: ${securityMetrics.passed}, Failed: ${securityMetrics.failed}, Skipped: ${securityMetrics.skipped})`);
  console.log(`🌐 Selenium Web Tests       : ${seleniumMetrics.passed}/${seleniumMetrics.total} (Passed: ${seleniumMetrics.passed}, Failed: ${seleniumMetrics.failed}, Skipped: ${seleniumMetrics.skipped})`);
  console.log(`🔍 Evidence AI Tests        : ${evidenceMetrics.passed}/${evidenceMetrics.total} (Passed: ${evidenceMetrics.passed}, Failed: ${evidenceMetrics.failed}, Skipped: ${evidenceMetrics.skipped})`);
  console.log('----------------------------------------------------');
  console.log(`🎯 TOTAL TEST CASES         : ${totalPassed}/${totalAll} (Target: 1500/1500)`);
  console.log(`📈 Overall Pass Rate        : ${overallPassPct}`);
  console.log(`📁 Reports Directory File   : ${excelReportPath}`);
  console.log(`🌐 Public Website Download  : ${publicExcelPath}`);
  console.log('====================================================\n');

  if (totalAll !== 1500) {
    console.error(`⚠️ Warning: Expected exactly 1500 tests, found ${totalAll}`);
  }

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestsAndGenerateReport();
