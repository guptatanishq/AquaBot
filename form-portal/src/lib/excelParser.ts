import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';

export type UnitDef = {
  id: string;
  name: string;
};

export type IndustryDef = {
  id: string;
  name: string;
  units: UnitDef[];
};

export const getAllIndustries = (): string[] => {
  const filePath = path.join(process.cwd(), 'data.xlsx');
  const industries = new Set<string>();
  
  if (fs.existsSync(filePath)) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      const sheet = workbook.Sheets['Industry Id'];
      if (sheet) {
        const rows: any[] = xlsx.utils.sheet_to_json(sheet, { defval: "" });
        for (const row of rows) {
          const name = row['__EMPTY'] || Object.values(row)[0]; // fallback if header name changes
          if (name && typeof name === 'string' && name.trim()) {
            industries.add(name.trim());
          }
        }
      }
    } catch (e) {
      console.error("Error parsing XLSX for all industries:", e);
    }
  }
  return Array.from(industries).sort((a, b) => a.localeCompare(b));
};

export const getIndustryData = (industryNameQuery: string): IndustryDef | null => {
  const filePath = path.join(process.cwd(), 'data.xlsx');
  
  if (fs.existsSync(filePath)) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      const industrySheet = workbook.Sheets['Industry Id'];
      const unitsSheet = workbook.Sheets['Copy of Units Meta'];
      
      if (industrySheet && unitsSheet) {
        const industryRows: any[] = xlsx.utils.sheet_to_json(industrySheet, { defval: "" });
        const unitRows: any[] = xlsx.utils.sheet_to_json(unitsSheet, { defval: "" });
        
        let matchedIndustryId: string | null = null;
        let matchedIndustryName: string = '';

        // Find the industry
        for (const row of industryRows) {
          const name = row['__EMPTY'] || Object.values(row)[0];
          const id = row['Industry ID'];
          if (name && typeof name === 'string' && name.trim().toLowerCase() === industryNameQuery.toLowerCase()) {
            matchedIndustryId = id;
            matchedIndustryName = name.trim();
            break;
          }
        }

        if (matchedIndustryId) {
          // Find the units for this industry
          const matchedUnits: UnitDef[] = [];
          for (const row of unitRows) {
            if (row.industryId === matchedIndustryId) {
              matchedUnits.push({
                id: row.unitId?.toString(),
                name: row.unitName?.toString() || 'Unnamed Unit'
              });
            }
          }

          return {
            id: matchedIndustryId,
            name: matchedIndustryName,
            units: matchedUnits
          };
        }
      }
    } catch (e) {
      console.error("Error parsing XLSX for industry data:", e);
    }
  }

  return null;
};
