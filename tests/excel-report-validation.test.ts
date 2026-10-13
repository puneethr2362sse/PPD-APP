import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

describe('VerifyAI Excel Test Cases & Reports Validation Suite', () => {
  const rootDir = process.cwd();
  const baselineExcelPath = path.join(rootDir, 'VerifyAI_Test_Results_305.xlsx');
  const testCasesExcelPath = path.join(rootDir, 'reports', 'VerifyAI_Test_Cases.xlsx');
  const reportsExcelPath = path.join(rootDir, 'reports', 'VerifyAI_Test_Report.xlsx');

  const EXPECTED_SHEETS = [
    'Summary',
    'Selenium Web Tests',
    'Appium Mobile Tests',
    'Load Stress Tests',
    'Security Tests',
    'Evidence Verification Tests',
    'Web Build Validation',
  ];

  const REQUIRED_COLUMNS = [
    'Test ID',
    'Scenario',
    'Expected Result',
    'Actual Result',
    'Status',
    'Execution Time',
  ];

  it('EXC-001: should preserve the existing VerifyAI_Test_Results_305.xlsx baseline', () => {
    expect(fs.existsSync(baselineExcelPath), 'Baseline VerifyAI_Test_Results_305.xlsx must exist').toBe(true);
    const stats = fs.statSync(baselineExcelPath);
    expect(stats.size).toBeGreaterThan(100000); // Baseline is ~302 KB

    const baselineWb = XLSX.readFile(baselineExcelPath);
    expect(baselineWb.SheetNames.length).toBeGreaterThan(0);
  });

  it('EXC-002: should verify generated VerifyAI_Test_Cases.xlsx exists and is non-empty', () => {
    expect(fs.existsSync(testCasesExcelPath), 'reports/VerifyAI_Test_Cases.xlsx must exist').toBe(true);
    const stats = fs.statSync(testCasesExcelPath);
    expect(stats.size).toBeGreaterThan(50000);
  });

  it('EXC-003: should open and parse VerifyAI_Test_Cases.xlsx with all expected suite sheets', () => {
    const wb = XLSX.readFile(testCasesExcelPath);
    for (const sheet of EXPECTED_SHEETS) {
      expect(wb.SheetNames, `Workbook must include sheet "${sheet}"`).toContain(sheet);
    }
  });

  it('EXC-004: should contain all mandatory columns in every test suite sheet of VerifyAI_Test_Cases.xlsx', () => {
    const wb = XLSX.readFile(testCasesExcelPath);
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

  it('EXC-005: should validate all test rows have non-empty required fields and execution times', () => {
    const wb = XLSX.readFile(testCasesExcelPath);
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
        expect(row['Status']).toBeTruthy();
        expect(row['Execution Time']).toBeTruthy();
        totalTestsValidated++;
      }
    }

    expect(totalTestsValidated).toBeGreaterThanOrEqual(1500);
  });

  it('EXC-006: should validate Summary sheet metadata and overall verdict in VerifyAI_Test_Cases.xlsx', () => {
    const wb = XLSX.readFile(testCasesExcelPath);
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
