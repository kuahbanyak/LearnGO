package handler

import (
	"bytes"
	"fmt"
	"time"

	"mediqueue/internal/middleware"
	"mediqueue/internal/repository"
	"mediqueue/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jung-kurt/gofpdf"
)

type MedicalRecordExportHandler struct {
	medRecordRepo repository.MedicalRecordRepository
}

func NewMedicalRecordExportHandler(repo repository.MedicalRecordRepository) *MedicalRecordExportHandler {
	return &MedicalRecordExportHandler{medRecordRepo: repo}
}

// ExportMedicalRecordPDF exports a single medical record to PDF
// GET /api/v1/medical-records/:id/pdf
func (h *MedicalRecordExportHandler) ExportPDF(c *gin.Context) {
	claims := middleware.GetCurrentUser(c)
	_ = claims // Just verify authentication

	recordID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid medical record ID")
		return
	}

	record, err := h.medRecordRepo.FindByID(recordID)
	if err != nil {
		response.NotFound(c, "Medical record not found")
		return
	}

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 10)
	pdf.AddPage()

	// Header
	pdf.SetFont("Arial", "B", 18)
	pdf.CellFormat(0, 12, "MediQueue - Rekam Medis", "", 1, "C", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(0, 6, fmt.Sprintf("Dicetak: %s", time.Now().Format("2006-01-02 15:04")), "", 1, "C", false, 0, "")
	pdf.Ln(8)

	// Doctor Info Box
	pdf.SetFillColor(240, 249, 255)
	pdf.Rect(10, pdf.GetY(), 190, 25, "F")
	pdf.SetFont("Arial", "B", 12)
	pdf.SetXY(15, pdf.GetY()+5)
	pdf.CellFormat(0, 6, fmt.Sprintf("Dr. %s", record.Doctor.FullName), "", 1, "L", false, 0, "")
	pdf.SetX(15)
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(0, 5, record.Doctor.Specialization, "", 1, "L", false, 0, "")
	pdf.SetX(15)
	pdf.CellFormat(0, 5, fmt.Sprintf("Tanggal: %s", record.CreatedAt.Format("2006-01-02")), "", 1, "L", false, 0, "")
	pdf.Ln(10)

	// Medical Details
	pdf.SetFont("Arial", "B", 11)
	pdf.SetFillColor(79, 70, 229)
	pdf.SetTextColor(255, 255, 255)
	pdf.CellFormat(0, 8, "  Detail Pemeriksaan", "1", 1, "L", true, 0, "")
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Arial", "", 10)

	details := []struct {
		label string
		value string
	}{
		{"Keluhan", record.Complaint},
		{"Diagnosa", record.Diagnosis},
		{"Kode ICD-10", record.ICDCode},
		{"Tindakan", record.ActionTaken},
		{"Catatan", record.DoctorNotes},
	}

	for _, d := range details {
		if d.value == "" {
			continue
		}
		pdf.SetFont("Arial", "B", 10)
		pdf.CellFormat(50, 7, "  "+d.label+":", "", 0, "L", false, 0, "")
		pdf.SetFont("Arial", "", 10)
		pdf.MultiCell(140, 7, d.value, "", "L", false)
	}

	// Prescriptions
	if len(record.Prescriptions) > 0 {
		pdf.Ln(5)
		pdf.SetFont("Arial", "B", 11)
		pdf.SetFillColor(16, 185, 129)
		pdf.SetTextColor(255, 255, 255)
		pdf.CellFormat(0, 8, "  Resep Obat", "1", 1, "L", true, 0, "")
		pdf.SetTextColor(0, 0, 0)

		pdf.SetFont("Arial", "B", 9)
		pdf.SetFillColor(240, 240, 240)
		pdf.CellFormat(80, 7, "  Nama Obat", "1", 0, "L", true, 0, "")
		pdf.CellFormat(30, 7, "Dosis", "1", 0, "C", true, 0, "")
		pdf.CellFormat(20, 7, "Jumlah", "1", 0, "C", true, 0, "")
		pdf.CellFormat(60, 7, "Aturan Pakai", "1", 1, "L", true, 0, "")

		pdf.SetFont("Arial", "", 9)
		for _, p := range record.Prescriptions {
			pdf.CellFormat(80, 7, "  "+p.MedicineName, "1", 0, "L", false, 0, "")
			pdf.CellFormat(30, 7, p.Dosage, "1", 0, "C", false, 0, "")
			pdf.CellFormat(20, 7, fmt.Sprintf("%d", p.Quantity), "1", 0, "C", false, 0, "")
			pdf.CellFormat(60, 7, p.UsageInstruction, "1", 1, "L", false, 0, "")
		}
	}

	// Footer
	pdf.Ln(10)
	pdf.SetFont("Arial", "I", 8)
	pdf.CellFormat(0, 5, "Dokumen ini dicetak secara otomatis dari sistem MediQueue", "", 1, "C", false, 0, "")

	// Write to buffer
	buf := new(bytes.Buffer)
	if err := pdf.Output(buf); err != nil {
		response.InternalServerError(c, "Failed to generate PDF")
		return
	}

	filename := fmt.Sprintf("rekam_medis_%s.pdf", record.CreatedAt.Format("2006-01-02"))
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.Data(200, "application/pdf", buf.Bytes())
}
