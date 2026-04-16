package repository

import (
	"mediqueue/internal/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PatientRepository interface {
	FindByUserID(userID uuid.UUID) (*entity.Patient, error)
	FindByID(id uuid.UUID) (*entity.Patient, error)
	FindAll(limit, offset int, search string) ([]entity.Patient, int64, error)
	Create(patient *entity.Patient) error
	Update(patient *entity.Patient) error
}

type patientRepository struct {
	db *gorm.DB
}

func NewPatientRepository(db *gorm.DB) PatientRepository {
	return &patientRepository{db: db}
}

func (r *patientRepository) FindByUserID(userID uuid.UUID) (*entity.Patient, error) {
	var patient entity.Patient
	err := r.db.Preload("User").Where("user_id = ?", userID).First(&patient).Error
	if err != nil {
		return nil, err
	}
	return &patient, nil
}

func (r *patientRepository) FindByID(id uuid.UUID) (*entity.Patient, error) {
	var patient entity.Patient
	err := r.db.Preload("User").First(&patient, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &patient, nil
}

func (r *patientRepository) FindAll(limit, offset int, search string) ([]entity.Patient, int64, error) {
	var patients []entity.Patient
	var total int64

	query := r.db.Model(&entity.Patient{}).Preload("User")
	if search != "" {
		query = query.Joins("JOIN users ON users.id = patients.user_id").
			Where("users.full_name ILIKE ? OR patients.nik ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	query.Count(&total)
	err := query.Limit(limit).Offset(offset).Find(&patients).Error
	return patients, total, err
}

func (r *patientRepository) Create(patient *entity.Patient) error {
	return r.db.Create(patient).Error
}

func (r *patientRepository) Update(patient *entity.Patient) error {
	return r.db.Save(patient).Error
}
