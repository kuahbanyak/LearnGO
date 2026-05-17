package handler

import (
	"bytes"
	"fmt"
	"time"

	"mediqueue/internal/entity"
	"mediqueue/internal/repository"
	"mediqueue/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jung-kurt/gofpdf"
)

type ExportHandler struct {
	appointmentRepo repository.AppointmentRepository
}

func NewExportHandler(appointmentRepo repository.AppointmentRepository) *ExportHandler {
	return &ExportHandler{appointmentRepo: appointmentRepo}
}

// ExportAppointments exports appointments to PDF
// GET /api/v1/export/appointments?start_date=&end_date=&doctor_id=&status=&format=pdf
func (h *ExportHandler) ExportAppointments(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	doctorID := c.Query("doctor_id")
	status := c.Query("status")

	// Parse dates
	start, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		start = time.Now().AddDate(0, -1, 0) // Default to 1 month ago
	}
	end, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		end = time.Now() // Default to today
	}

	// Get appointments
	appointments, err := h.appointmentRepo.GetByDateRange(start, end, doctorID, status)
	if err != nil {
		response.InternalServerError(c, "Failed to retrieve appointments")
		return
	}

	h.exportPDF(c, appointments)
}

func (h *ExportHandler) exportPDF(c *gin.Context, appointments []entity.Appointment) {
	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 10)
	pdf.AddPage()

	// Title
	pdf.SetFont("Arial", "B", 16)
	pdf.CellFormat(0, 10, "MediQueue - Appointment Report", "", 1, "C", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(0, 6, fmt.Sprintf("Generated: %s", time.Now().Format("2006-01-02 15:04")), "", 1, "C", false, 0, "")
	pdf.Ln(5)

	// Table header
	pdf.SetFont("Arial", "B", 10)
	pdf.SetFillColor(79, 70, 229) // Primary color
	pdf.SetTextColor(255, 255, 255)
	
	colWidths := []float64{10, 15, 45, 45, 35, 35, 25, 40}
	headers := []string{"No", "Queue", "Patient Name", "Doctor", "Date", "Time", "Status", "Created"}
	
	for i, header := range headers {
		pdf.CellFormat(colWidths[i], 8, header, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	// Table data
	pdf.SetFont("Arial", "", 9)
	pdf.SetTextColor(0, 0, 0)
	
	for i, apt := range appointments {
		if i > 0 && i%20 == 0 {
			pdf.AddPage()
			// Re-add header on new page
			pdf.SetFont("Arial", "B", 10)
			pdf.SetFillColor(79, 70, 229)
			pdf.SetTextColor(255, 255, 255)
			for j, header := range headers {
				pdf.CellFormat(colWidths[j], 8, header, "1", 0, "C", true, 0, "")
			}
			pdf.Ln(-1)
			pdf.SetFont("Arial", "", 9)
			pdf.SetTextColor(0, 0, 0)
		}

		pdf.CellFormat(colWidths[0], 7, fmt.Sprintf("%d", i+1), "1", 0, "C", false, 0, "")
		pdf.CellFormat(colWidths[1], 7, fmt.Sprintf("%d", apt.QueueNumber), "1", 0, "C", false, 0, "")
		pdf.CellFormat(colWidths[2], 7, apt.Patient.FullName, "1", 0, "L", false, 0, "")
		pdf.CellFormat(colWidths[3], 7, apt.Doctor.FullName, "1", 0, "L", false, 0, "")
		pdf.CellFormat(colWidths[4], 7, apt.AppointmentDate.Format("2006-01-02"), "1", 0, "C", false, 0, "")
		if apt.Schedule != nil {
			pdf.CellFormat(colWidths[5], 7, fmt.Sprintf("%s-%s", apt.Schedule.StartTime, apt.Schedule.EndTime), "1", 0, "C", false, 0, "")
		} else {
			pdf.CellFormat(colWidths[5], 7, "-", "1", 0, "C", false, 0, "")
		}
		pdf.CellFormat(colWidths[6], 7, string(apt.Status), "1", 0, "C", false, 0, "")
		pdf.CellFormat(colWidths[7], 7, apt.CreatedAt.Format("2006-01-02 15:04"), "1", 0, "C", false, 0, "")
		pdf.Ln(-1)
	}

	// Footer
	pdf.Ln(5)
	pdf.SetFont("Arial", "I", 8)
	pdf.CellFormat(0, 5, fmt.Sprintf("Total appointments: %d", len(appointments)), "", 1, "L", false, 0, "")

	// Write to buffer
	buf := new(bytes.Buffer)
	if err := pdf.Output(buf); err != nil {
		response.InternalServerError(c, "Failed to generate PDF file")
		return
	}

	// Set headers for download
	filename := fmt.Sprintf("appointments_%s.pdf", time.Now().Format("20060102"))
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.Data(200, "application/pdf", buf.Bytes())
}
