package usecase

import (
	"errors"
	"time"

	"mediqueue/internal/entity"

	"github.com/google/uuid"
)

// RescheduleAppointment handles appointment rescheduling
func (u *appointmentUsecase) Reschedule(patientUserID uuid.UUID, appointmentID uuid.UUID, scheduleID uuid.UUID, newDate time.Time) (*entity.Appointment, error) {
	// Get patient
	patient, err := u.patientRepo.FindByUserID(patientUserID)
	if err != nil {
		return nil, errors.New("patient not found")
	}

	// Get appointment
	appointment, err := u.appointmentRepo.FindByID(appointmentID)
	if err != nil {
		return nil, errors.New("appointment not found")
	}

	// Verify ownership
	if appointment.PatientID != patient.ID {
		return nil, errors.New("you can only reschedule your own appointments")
	}

	// Only waiting appointments can be rescheduled
	if appointment.Status != entity.StatusWaiting {
		return nil, errors.New("only waiting appointments can be rescheduled")
	}

	// Get new schedule
	schedule, err := u.scheduleRepo.FindByID(scheduleID)
	if err != nil {
		return nil, errors.New("schedule not found")
	}

	// Check if schedule is active
	if !schedule.IsActive {
		return nil, errors.New("this schedule is not available")
	}

	// Check if doctor is the same (can only reschedule with same doctor)
	if schedule.DoctorID != appointment.DoctorID {
		return nil, errors.New("can only reschedule with the same doctor")
	}

	// Check if new date is in the future
	if newDate.Before(time.Now()) {
		return nil, errors.New("appointment date must be in the future")
	}

	// Check quota for new schedule
	count, err := u.appointmentRepo.CountByScheduleAndDate(scheduleID, newDate)
	if err != nil {
		return nil, errors.New("failed to check availability")
	}

	if count >= int64(schedule.MaxPatient) {
		return nil, errors.New("schedule is fully booked")
	}

	// Update appointment
	appointment.ScheduleID = scheduleID
	appointment.AppointmentDate = newDate

	// Recalculate queue number
	queueNumber, err := u.appointmentRepo.NextQueueNumber(scheduleID, newDate)
	if err != nil {
		queueNumber = 1
	}
	appointment.QueueNumber = queueNumber

	if err := u.appointmentRepo.Update(appointment); err != nil {
		return nil, errors.New("failed to reschedule appointment")
	}

	return appointment, nil
}
