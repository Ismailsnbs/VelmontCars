// PDF rapor üretim servisi — ImportCalculation için
import PDFDocument from 'pdfkit';
import { Decimal } from '@prisma/client/runtime/library';

// ─── Tipler ───────────────────────────────────────────────────────────────────

interface VehicleInfo {
  id: string;
  brand: string;
  model: string;
  year: number;
  vin?: string | null;
}

interface CalculationForPdf {
  id: string;
  calculatedAt: Date;
  fobPrice: Decimal;
  fobCurrency: string;
  originCountry: string;
  engineCC: number;
  vehicleType: string;
  modelYear: number;
  shippingCost: Decimal;
  insuranceCost: Decimal;
  exchangeRate: Decimal;
  cifValue: Decimal;
  customsDuty: Decimal;
  fif: Decimal;
  kdv: Decimal;
  gkk: Decimal;
  wharfFee: Decimal;
  generalFif: Decimal;
  bandrol: Decimal;
  totalTaxes: Decimal;
  totalCostUSD: Decimal;
  totalCostTL: Decimal;
  vehicle?: VehicleInfo | null;
}

// ─── Yardımcı sabitler ────────────────────────────────────────────────────────

const MARGIN_LEFT = 50;
const MARGIN_RIGHT = 545;
const ROW_LABEL_X = 50;
const ROW_LABEL_WIDTH = 220;
const ROW_VALUE_X = 270;
const ROW_VALUE_WIDTH = 275;

// ─── Service ──────────────────────────────────────────────────────────────────

export class PdfService {
  generateCalculationPdf(calculation: CalculationForPdf): PDFKit.PDFDocument {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    this.renderHeader(doc, calculation);
    this.renderVehicleSection(doc, calculation.vehicle);
    this.renderInputSection(doc, calculation);
    this.renderCifSection(doc, calculation);
    this.renderTaxBreakdown(doc, calculation);
    this.renderFinalResult(doc, calculation);
    this.renderFooter(doc);

    doc.end();
    return doc;
  }

  // ─── Bölüm render yardımcıları ─────────────────────────────────────────────

  private renderHeader(doc: PDFKit.PDFDocument, calculation: CalculationForPdf): void {
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('IMPORT COST CALCULATION REPORT', { align: 'center' });

    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(
        `Date: ${new Date(calculation.calculatedAt).toLocaleDateString('tr-TR')}`,
        { align: 'right' },
      );
    doc.text(`Calculation ID: ${calculation.id}`, { align: 'right' });

    doc.moveDown(0.5);
    this.drawDivider(doc);
    doc.moveDown();
  }

  private renderVehicleSection(
    doc: PDFKit.PDFDocument,
    vehicle: VehicleInfo | null | undefined,
  ): void {
    if (!vehicle) return;

    this.renderSectionTitle(doc, 'Vehicle Information');

    this.addRow(doc, 'Brand / Model:', `${vehicle.brand} ${vehicle.model}`);
    this.addRow(doc, 'Year:', String(vehicle.year));
    if (vehicle.vin) {
      this.addRow(doc, 'VIN:', vehicle.vin);
    }

    doc.moveDown();
  }

  private renderInputSection(
    doc: PDFKit.PDFDocument,
    calculation: CalculationForPdf,
  ): void {
    this.renderSectionTitle(doc, 'Input Values');

    this.addRow(
      doc,
      'FOB Price:',
      `$${this.formatUSD(calculation.fobPrice)}`,
    );
    this.addRow(doc, 'Currency:', calculation.fobCurrency);
    this.addRow(doc, 'Origin Country:', calculation.originCountry);
    this.addRow(doc, 'Engine CC:', `${calculation.engineCC} cc`);
    this.addRow(doc, 'Vehicle Type:', calculation.vehicleType);
    this.addRow(doc, 'Model Year:', String(calculation.modelYear));
    this.addRow(
      doc,
      'Shipping Cost:',
      `$${this.formatUSD(calculation.shippingCost)}`,
    );
    this.addRow(
      doc,
      'Insurance Cost:',
      `$${this.formatUSD(calculation.insuranceCost)}`,
    );

    doc.moveDown();
  }

  private renderCifSection(
    doc: PDFKit.PDFDocument,
    calculation: CalculationForPdf,
  ): void {
    this.renderSectionTitle(doc, 'CIF Calculation');

    this.addRow(
      doc,
      'CIF Value:',
      `$${this.formatUSD(calculation.cifValue)}`,
    );
    this.addRow(
      doc,
      'Exchange Rate:',
      `1 USD = ${Number(calculation.exchangeRate).toFixed(2)} TRY`,
    );

    doc.moveDown();
  }

  private renderTaxBreakdown(
    doc: PDFKit.PDFDocument,
    calculation: CalculationForPdf,
  ): void {
    this.renderSectionTitle(doc, 'Tax Breakdown');

    this.addRow(doc, 'Customs Duty:', `$${this.formatUSD(calculation.customsDuty)}`);
    this.addRow(doc, 'FIF:', `$${this.formatUSD(calculation.fif)}`);
    this.addRow(doc, 'KDV (VAT):', `$${this.formatUSD(calculation.kdv)}`);
    this.addRow(doc, 'GKK:', `$${this.formatUSD(calculation.gkk)}`);
    this.addRow(doc, 'Wharf Fee:', `$${this.formatUSD(calculation.wharfFee)}`);
    this.addRow(doc, 'General FIF:', `$${this.formatUSD(calculation.generalFif)}`);
    this.addRow(doc, 'Bandrol:', `$${this.formatUSD(calculation.bandrol)}`);

    doc.moveDown(0.5);
    this.drawDivider(doc);
    doc.moveDown(0.5);

    this.addRow(
      doc,
      'TOTAL TAXES:',
      `$${this.formatUSD(calculation.totalTaxes)}`,
      true,
    );

    doc.moveDown();
  }

  private renderFinalResult(
    doc: PDFKit.PDFDocument,
    calculation: CalculationForPdf,
  ): void {
    this.renderSectionTitle(doc, 'Final Result');

    this.addRow(
      doc,
      'Total Cost (USD):',
      `$${this.formatUSD(calculation.totalCostUSD)}`,
      true,
    );
    this.addRow(
      doc,
      'Total Cost (TRY):',
      `\u20ba${this.formatTRY(calculation.totalCostTL)}`,
      true,
    );

    doc.moveDown();
  }

  private renderFooter(doc: PDFKit.PDFDocument): void {
    // Footer sabit pozisyonda
    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        'This document was generated automatically. Tax rates and exchange rates are based on values at the time of calculation.',
        MARGIN_LEFT,
        750,
        { align: 'center', width: MARGIN_RIGHT - MARGIN_LEFT },
      );
  }

  // ─── Temel render yardımcıları ─────────────────────────────────────────────

  private renderSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
    doc.fontSize(13).font('Helvetica-Bold').text(title);
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica');
  }

  private drawDivider(doc: PDFKit.PDFDocument): void {
    doc.moveTo(MARGIN_LEFT, doc.y).lineTo(MARGIN_RIGHT, doc.y).stroke();
  }

  private addRow(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
    bold = false,
  ): void {
    const y = doc.y;
    doc
      .font('Helvetica')
      .fontSize(11)
      .text(label, ROW_LABEL_X, y, { width: ROW_LABEL_WIDTH, continued: false });

    doc
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(11)
      .text(value, ROW_VALUE_X, y, { width: ROW_VALUE_WIDTH, align: 'right' });

    doc.moveDown(0.3);
  }

  // ─── Format yardımcıları ──────────────────────────────────────────────────

  private formatUSD(value: Decimal): string {
    return Number(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private formatTRY(value: Decimal): string {
    return Number(value).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}

export const pdfService = new PdfService();
