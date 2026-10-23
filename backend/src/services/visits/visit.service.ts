import ExcelJS from 'exceljs';
import { prisma, isDatabaseConnected } from '../../config/database';
import { logger } from '../../utils/logger';
import { analyticsRepository } from '../../repositories/analytics.repository';
import { projectRepository } from '../../repositories/project.repository';
import {
  VisitRequestDTO,
  CreateVisitRequestInput,
  VisitFilterQuery,
  VisitStatus,
} from '../../types/visit.types';

// In-memory fallback cache if database is disconnected
const memoryVisits: Map<string, VisitRequestDTO[]> = new Map();

/**
 * Safely escape values for Excel export to prevent CSV / Spreadsheet Formula Injection.
 * Prepends a single quote if the value starts with '=', '+', '-', '@', tab, or carriage return.
 */
function sanitizeForExcel(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Validate and normalize mobile numbers
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  const cleaned = rawPhone.trim();
  // Strip illegal non-phone characters but keep digits and leading '+'
  const digitsOnly = cleaned.replace(/[^0-9]/g, '');
  if (digitsOnly.length < 10) {
    throw new Error('Please enter a valid 10-digit mobile number.');
  }

  // Format nicely with country code if 10 digits
  if (digitsOnly.length === 10) {
    return `+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`;
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    const main = digitsOnly.slice(2);
    return `+91 ${main.slice(0, 5)} ${main.slice(5)}`;
  }

  // If starts with +, preserve
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  return `+${digitsOnly}`;
}

export class VisitService {
  /**
   * Persistently record a Schedule Visit request
   */
  async createVisitRequest(input: CreateVisitRequestInput): Promise<VisitRequestDTO> {
    if (!input.customerName || input.customerName.trim().length === 0) {
      throw new Error('Customer name is required to schedule a visit.');
    }

    const normalizedPhone = normalizePhoneNumber(input.mobileNumber);
    const resolvedProjectId = input.projectId || 'prycoons-ai';

    // Fetch project info for assistant name
    const project = (await projectRepository.findById(resolvedProjectId)) || (await projectRepository.findBySlug(resolvedProjectId));
    const assistantId = project ? project.id : resolvedProjectId;
    const assistantName = project ? project.name : (input.assistantName || 'Prycoons AI Assistant');

    const propertyName = input.propertyName && input.propertyName.trim().length > 0
      ? input.propertyName.trim()
      : 'Unspecified';

    const requestId = `VR-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const submittedAt = new Date().toISOString();

    const visitDTO: VisitRequestDTO = {
      requestId,
      submittedAt,
      customerName: input.customerName.trim(),
      mobileNumber: normalizedPhone,
      email: input.email ? input.email.trim() : null,
      propertyName,
      propertyUrl: input.propertyUrl || null,
      locality: input.locality || null,
      city: input.city || 'Ahmedabad',
      bhk: input.bhk || null,
      propertyPrice: input.propertyPrice || null,
      assistantId,
      assistantName,
      conversationId: input.sessionId || null,
      visitStatus: 'New Request',
      customerNotes: input.customerNotes ? input.customerNotes.trim() : null,
      preferredDate: input.preferredDate ? input.preferredDate.trim() : null,
    };

    // Deduplication check: Within last 2 minutes from same phone & property
    const recentCutoff = new Date(Date.now() - 2 * 60 * 1000);

    // Try database persistence first, with resilient fallback to memory
    try {
      const existingRecent = await prisma.lead.findFirst({
        where: {
          phone: normalizedPhone,
          source: 'visit_request',
          createdAt: { gte: recentCutoff },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingRecent) {
        const pref = (existingRecent.preferences as any) || {};
        if (pref.propertyName === propertyName) {
          logger.info(`Idempotent duplicate visit request ignored for ${normalizedPhone} on ${propertyName}`);
          return this.mapLeadToVisitDTO(existingRecent);
        }
      }

      // Ensure sessionId exists in database to avoid foreign key violations
      let validSessionId: string | null = null;
      if (input.sessionId) {
        try {
          const sessionExists = await prisma.chatSession.findUnique({
            where: { id: input.sessionId },
            select: { id: true },
          });
          if (sessionExists) {
            validSessionId = input.sessionId;
          }
        } catch {
          validSessionId = null;
        }
      }

      // Persist to database in Lead table
      const savedLead = await prisma.lead.create({
        data: {
          id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          projectId: assistantId,
          sessionId: validSessionId,
          name: visitDTO.customerName,
          phone: visitDTO.mobileNumber,
          email: visitDTO.email,
          intent: 'schedule_visit',
          source: 'visit_request',
          preferences: {
            ...visitDTO,
            isVisitRequest: true,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Record Analytics Event
      await analyticsRepository.recordEvent({
        projectId: assistantId,
        sessionId: input.sessionId,
        eventType: 'visit_request_created',
        metadata: {
          requestId: visitDTO.requestId,
          propertyName: visitDTO.propertyName,
          customerName: visitDTO.customerName,
          status: visitDTO.visitStatus,
        },
      }).catch(() => {});

      logger.info(`Visit request successfully saved in DB: ${visitDTO.requestId} for ${visitDTO.customerName}`);
      
      // Also mirror to in-memory store so it is immediately accessible
      const list = memoryVisits.get(assistantId) || [];
      list.unshift(visitDTO);
      memoryVisits.set(assistantId, list);
      memoryVisits.set('prycoons-ai', list);

      return this.mapLeadToVisitDTO(savedLead);
    } catch (err: any) {
      logger.warn(`Database write error saving visit request: ${err.message}. Saving to fallback cache.`);
    }

    // In-memory fallback
    const list = memoryVisits.get(assistantId) || [];
    // Check in-memory deduplication
    const existingMemory = list.find(
      (v) =>
        v.mobileNumber === normalizedPhone &&
        v.propertyName === propertyName &&
        Date.now() - new Date(v.submittedAt).getTime() < 120000
    );
    if (existingMemory) {
      logger.info(`Idempotent duplicate visit request ignored in memory for ${normalizedPhone} on ${propertyName}`);
      return existingMemory;
    }
    list.unshift(visitDTO);
    memoryVisits.set(assistantId, list);
    memoryVisits.set('prycoons-ai', list);
    return visitDTO;
  }

  /**
   * Retrieve visit requests with filtering and search
   */
  async getVisitRequests(filters: VisitFilterQuery = {}): Promise<VisitRequestDTO[]> {
    const resolvedProjectId = filters.projectId;
    let results: VisitRequestDTO[] = [];

    // Fetch from database
    try {
      const whereClause: any = {};
      if (resolvedProjectId) {
        whereClause.projectId = resolvedProjectId;
      }

      // Fetch leads that are visit requests or have visit details
      const leads = await prisma.lead.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });

      results = leads
        .filter((lead) => {
          const p = (lead.preferences as any) || {};
          return (
            lead.source === 'visit_request' ||
            lead.intent === 'schedule_visit' ||
            p.isVisitRequest ||
            p.requestId ||
            p.preferredDate
          );
        })
        .map((lead) => this.mapLeadToVisitDTO(lead));
    } catch (err: any) {
      logger.warn(`getVisitRequests DB query error: ${err.message}. Using memory store.`);
    }

    // Include memory fallback items if not already present
    for (const list of memoryVisits.values()) {
      for (const m of list) {
        if (!results.some((r) => r.requestId === m.requestId || (r.mobileNumber === m.mobileNumber && r.propertyName === m.propertyName && Math.abs(new Date(r.submittedAt).getTime() - new Date(m.submittedAt).getTime()) < 60000))) {
          results.push(m);
        }
      }
    }

    // Apply Filters
    if (filters.status && filters.status !== 'all') {
      results = results.filter(
        (r) => r.visitStatus.toLowerCase() === filters.status!.toLowerCase()
      );
    }

    if (filters.locality && filters.locality !== 'all') {
      const locLow = filters.locality.toLowerCase().trim();
      results = results.filter(
        (r) => r.locality && r.locality.toLowerCase().includes(locLow)
      );
    }

    if (filters.search && filters.search.trim().length > 0) {
      const q = filters.search.toLowerCase().trim();
      results = results.filter(
        (r) =>
          r.customerName.toLowerCase().includes(q) ||
          r.mobileNumber.toLowerCase().includes(q) ||
          (r.email && r.email.toLowerCase().includes(q)) ||
          r.propertyName.toLowerCase().includes(q) ||
          (r.locality && r.locality.toLowerCase().includes(q)) ||
          r.requestId.toLowerCase().includes(q)
      );
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      if (!isNaN(start)) {
        results = results.filter((r) => new Date(r.submittedAt).getTime() >= start);
      }
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      if (!isNaN(end)) {
        results = results.filter((r) => new Date(r.submittedAt).getTime() <= end);
      }
    }

    // Sort descending by date
    results.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    return results;
  }

  /**
   * Generate a professionally formatted Excel .xlsx workbook from persistent visit requests
   */
  async exportVisitRequestsToExcel(filters: VisitFilterQuery = {}): Promise<{ buffer: Buffer; filename: string }> {
    const records = await this.getVisitRequests(filters);

    const todayStr = new Date().toISOString().split('T')[0];
    const filename = `Prycoons_Property_Visit_Requests_${todayStr}.xlsx`;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BRIM Real Estate Assistant';
    workbook.lastModifiedBy = 'Prycoons Admin';
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet('Visit Requests', {
      views: [{ state: 'frozen', ySplit: 4, xSplit: 0 }],
      properties: { tabColor: { argb: 'C85C4A' } },
    });

    // ──────────────────────────────────────────────────────────────────────────
    // ROW 1: Main Title Banner
    // ──────────────────────────────────────────────────────────────────────────
    worksheet.mergeCells('A1:P1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'PRYCOONS REAL ESTATE — PROPERTY VISIT REQUESTS';
    titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFC85C4A' }, // Prycoons Terracotta Brand Color
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 36;

    // ──────────────────────────────────────────────────────────────────────────
    // ROW 2: Metadata / Subtitle
    // ──────────────────────────────────────────────────────────────────────────
    worksheet.mergeCells('A2:P2');
    const subCell = worksheet.getCell('A2');
    const exportTime = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'medium',
    });
    subCell.value = `Export Generated: ${exportTime} IST | Total Visit Requests: ${records.length} | Official Contact: admin@prycoons.com (+91 7861072811)`;
    subCell.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FF475569' } };
    subCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8FAFC' },
    };
    subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    worksheet.getRow(2).height = 22;

    // Blank spacer row 3
    worksheet.getRow(3).height = 6;

    // ──────────────────────────────────────────────────────────────────────────
    // ROW 4: Table Headers
    // ──────────────────────────────────────────────────────────────────────────
    const columns = [
      { key: 'requestId', header: 'Request ID', width: 18 },
      { key: 'submittedAt', header: 'Submitted At', width: 22 },
      { key: 'customerName', header: 'Customer Name', width: 22 },
      { key: 'mobileNumber', header: 'Mobile Number', width: 18 },
      { key: 'email', header: 'Email Address', width: 24 },
      { key: 'propertyName', header: 'Property Name', width: 28 },
      { key: 'locality', header: 'Locality', width: 18 },
      { key: 'city', header: 'City', width: 14 },
      { key: 'bhk', header: 'BHK / Config', width: 16 },
      { key: 'propertyPrice', header: 'Property Price', width: 18 },
      { key: 'visitStatus', header: 'Visit Status', width: 16 },
      { key: 'preferredDate', header: 'Preferred Slot / Date', width: 22 },
      { key: 'propertyUrl', header: 'Property URL', width: 34 },
      { key: 'customerNotes', header: 'Customer Notes', width: 30 },
      { key: 'assistantName', header: 'Assistant Name', width: 20 },
      { key: 'conversationId', header: 'Conversation ID', width: 22 },
    ];

    const headerRow = worksheet.getRow(4);
    headerRow.height = 28;

    columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }, // Dark slate header
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
      worksheet.getColumn(idx + 1).width = col.width;
    });

    // Auto-filter on Row 4
    worksheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: columns.length },
    };

    // ──────────────────────────────────────────────────────────────────────────
    // ROW 5+: Data Rows
    // ──────────────────────────────────────────────────────────────────────────
    if (records.length === 0) {
      // Empty state row
      const emptyRow = worksheet.getRow(5);
      emptyRow.height = 30;
      worksheet.mergeCells('A5:P5');
      const emptyCell = emptyRow.getCell(1);
      emptyCell.value = 'No visit requests match the selected filters.';
      emptyCell.font = { name: 'Segoe UI', size: 11, italic: true, color: { argb: 'FF64748B' } };
      emptyCell.alignment = { vertical: 'middle', horizontal: 'center' };
      emptyCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' },
      };
    } else {
      records.forEach((record, rIdx) => {
        const rowNumber = 5 + rIdx;
        const row = worksheet.getRow(rowNumber);
        row.height = 22;

        const isEven = rIdx % 2 === 0;
        const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

        const formattedDate = new Date(record.submittedAt).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        const rowValues = [
          sanitizeForExcel(record.requestId),
          formattedDate,
          sanitizeForExcel(record.customerName),
          sanitizeForExcel(record.mobileNumber),
          sanitizeForExcel(record.email || '—'),
          sanitizeForExcel(record.propertyName),
          sanitizeForExcel(record.locality || '—'),
          sanitizeForExcel(record.city || 'Ahmedabad'),
          sanitizeForExcel(record.bhk || '—'),
          sanitizeForExcel(record.propertyPrice || '—'),
          sanitizeForExcel(record.visitStatus),
          sanitizeForExcel(record.preferredDate || '—'),
          sanitizeForExcel(record.propertyUrl || '—'),
          sanitizeForExcel(record.customerNotes || '—'),
          sanitizeForExcel(record.assistantName),
          sanitizeForExcel(record.conversationId || '—'),
        ];

        rowValues.forEach((val, cIdx) => {
          const cell = row.getCell(cIdx + 1);
          cell.value = val;
          cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF0F172A' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowBg },
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };

          // Alignment logic
          if (cIdx === 0 || cIdx === 1 || cIdx === 3 || cIdx === 7 || cIdx === 8 || cIdx === 10) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: cIdx === 13 };
          }

          // Status badge style color
          if (cIdx === 10) {
            cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF065F46' } };
          }
        });
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return {
      buffer: Buffer.from(buffer),
      filename,
    };
  }

  /**
   * Helper to map Prisma Lead record to VisitRequestDTO
   */
  private mapLeadToVisitDTO(lead: any): VisitRequestDTO {
    const p = (lead.preferences as any) || {};
    return {
      requestId: p.requestId || `VR-${lead.id.slice(-6).toUpperCase()}`,
      submittedAt: p.submittedAt || (lead.createdAt ? new Date(lead.createdAt).toISOString() : new Date().toISOString()),
      customerName: p.customerName || lead.name || 'Website Visitor',
      mobileNumber: p.mobileNumber || lead.phone || '',
      email: p.email || lead.email || null,
      propertyName: p.propertyName || p.preferredBhk || p.interest || 'Unspecified',
      propertyUrl: p.propertyUrl || null,
      locality: p.locality || p.location || null,
      city: p.city || 'Ahmedabad',
      bhk: p.bhk || p.homeType || null,
      propertyPrice: p.propertyPrice || p.budget || null,
      assistantId: p.assistantId || lead.projectId,
      assistantName: p.assistantName || 'BRIM Real Estate Assistant',
      conversationId: p.conversationId || lead.sessionId || null,
      visitStatus: (p.visitStatus as VisitStatus) || 'New Request',
      customerNotes: p.customerNotes || p.notes || null,
      preferredDate: p.preferredDate || null,
    };
  }
}

export const visitService = new VisitService();
