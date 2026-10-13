import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

describe('VerifyAI Excel Test Report Validation Suite', () => {
  const rootDir = process.cwd();
  const baselineExcelPath = path.join(rootDir, 'VerifyAI_Test_Results_305.xlsx');
  const reportsExcelPath = path.join(rootDir, 'reports', 'VerifyAI_Test_Report.xlsx');
  const publicExcelPath = path.join(rootDir, 'public', 'VerifyAI_Test_Report.xlsx');

  const EXPECTED_SHEETS = [
    'Summary',
    'Appium Mobile Tests',
    'Load Stress Tests',
    'Security Tests',
    'Selenium Web Tests',
    'Evidence Verification Tests',
  ];

  const REQUIRED_COLUMNS = [
    'Test ID',
    'Scenario',
    'Expected Result',
    'Actual Result',
    'PASS/FAIL',
    'Execution Timestamp',
  ];

  it('EXC-001: should preserve the existing VerifyAI_Test_Results_305.xlsx baseline', () => {
    expect(fs.existsSync(baselineExcelPath), 'Baseline VerifyAI_Test_Results_305.xlsx must exist').toBe(true);
    const stats = fs.statSync(baselineExcelPath);
    expect(stats.size).toBeGreaterThan(100000); // Baseline is ~302 KB

    const baselineWb = XLSX.readFile(baselineExcelPath);
    expect(baselineWb.SheetNames.length).toBeGreaterThan(0);
  });

  it('EXC-002: should verify generated workbooks exist in both reports/ and public/', () => {
    expect(fs.existsSync(reportsExcelPath), 'reports/VerifyAI_Test_Report.xlsx must exist').toBe(true);
    expect(fs.existsSync(publicExcelPath), 'public/VerifyAI_Test_Report.xlsx must exist').toBe(true);

    const reportStats = fs.statSync(reportsExcelPath);
    const publicStats = fs.statSync(publicExcelPath);
    expect(reportStats.size).toBeGreaterThan(50000);
    expect(publicStats.size).toBeGreaterThan(50000);
  });

  it('EXC-003: should open and parse generated workbook with all expected suite sheets', () => {
    const wb = XLSX.readFile(reportsExcelPath);
    for (const sheet of EXPECTED_SHEETS) {
      expect(wb.SheetNames, `Workbook must include sheet "${sheet}"`).toContain(sheet);
    }
  });

  it('EXC-004: should contain all mandatory columns in every test suite sheet', () => {
    const wb = XLSX.readFile(reportsExcelPath);
    const testSheets = EXPECTED_SHEETS.filter(s => s !== 'Summary');

    for (const sheetName of testSheets) {
      const sheet = wb.Sheets[sheetName];
      expect(sheet, `Sheet ${sheetName} must exist`).toBeDefined();
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);
      expect(rows.length, `Sheet ${sheetName} must contain rows`).toBeGreaterThan(0);

      const firstRow = rows[0];
      for (const col of REQUIRED_COLUMNS) {
        expect(firstRow, `Sheet ${sheetName} row 0 must contain column "${col}"`).toHaveProperty(col);
      }
    }
  });

  it('EXC-005: should validate test rows have non-empty required fields and valid PASS/FAIL statuses', () => {
    const wb = XLSX.readFile(reportsExcelPath);
    const testSheets = EXPECTED_SHEETS.filter(s => s !== 'Summary');

    let totalTestsValidated = 0;

    for (const sheetName of testSheets) {
      const sheet = wb.Sheets[sheetName];
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

      for (const row of rows) {
        expect(row['Test ID']).toBeTruthy();
        expect(row['Scenario']).toBeTruthy();
        expect(row['Expected Result']).toBeTruthy();
        expect(row['Actual Result']).toBeTruthy();
        expect(['PASS', 'FAIL', 'SKIP']).toContain(row['PASS/FAIL']);
        expect(row['Execution Timestamp']).toBeTruthy();
        totalTestsValidated++;
      }
    }

    expect(totalTestsValidated).toBeGreaterThanOrEqual(1500);
  });

  it('EXC-006: should validate Summary sheet metadata and overall verdict', () => {
    const wb = XLSX.readFile(reportsExcelPath);
    const summarySheet = wb.Sheets['Summary'];
    const summaryRows: Record<string, any>[] = XLSX.utils.sheet_to_json(summarySheet);

    const values = summaryRows.map(r => JSON.stringify(r));
    const projectSummary = values.find(v => v.includes('VerifyAI Autonomous Fact-Checking System'));
    expect(projectSummary).toBeDefined();

    const totalsSummary = values.find(v => v.includes('TOTAL DISCOVERED TEST CASES'));
    expect(totalsSummary).toBeDefined();

    const verdictSummary = values.find(v => v.includes('OVERALL VERDICT'));
    expect(verdictSummary).toBeDefined();
  });
});
