package config

import (
	"errors"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort        string
	AppEnv         string
	DBHost         string
	DBPort         string
	DBUser         string
	DBPassword     string
	DBName         string
	JWTSecret      string
	JWTExpiryHours int
	AdminEmail     string
	AdminPassword  string
	AdminName      string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment variables")
	}

	jwtExpiry, err := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "24"))
	if err != nil {
		jwtExpiry = 24
	}

	return &Config{
		AppPort:        getEnv("APP_PORT", "8080"),
		AppEnv:         getEnv("APP_ENV", "development"),
		DBHost:         getEnv("DB_HOST", "localhost"),
		DBPort:         getEnv("DB_PORT", "5432"),
		DBUser:         getEnv("DB_USER", "postgres"),
		DBPassword:     getEnv("DB_PASSWORD", "postgres"),
		DBName:         getEnv("DB_NAME", "mediqueue"),
		JWTSecret:      getEnv("JWT_SECRET", "default-secret"),
		JWTExpiryHours: jwtExpiry,
		AdminEmail:     getEnv("ADMIN_EMAIL", "admin@mediqueue.com"),
		AdminPassword:  getEnv("ADMIN_PASSWORD", "Admin@123"),
		AdminName:      getEnv("ADMIN_NAME", "Super Admin"),
	}
}

// Validate checks if the configuration is valid for the current environment
func (c *Config) Validate() error {
	// Critical: JWT secret must not be default value
	if c.JWTSecret == "" || c.JWTSecret == "default-secret" {
		return errors.New("JWT_SECRET must be set and cannot be 'default-secret'")
	}

	// Production-specific validations
	if c.AppEnv == "production" {
		if c.DBPassword == "postgres" || c.DBPassword == "" {
			return errors.New("production database password cannot be default or empty")
		}
		if len(c.JWTSecret) < 32 {
			return errors.New("production JWT_SECRET must be at least 32 characters")
		}
	}

	// Validate JWT expiry
	if c.JWTExpiryHours < 1 || c.JWTExpiryHours > 168 {
		return errors.New("JWT_EXPIRY_HOURS must be between 1 and 168 (1 week)")
	}

	return nil
}

// GetAllowedOrigins returns the list of allowed CORS origins
func (c *Config) GetAllowedOrigins() []string {
	if c.AppEnv == "production" {
		originsEnv := os.Getenv("ALLOWED_ORIGINS")
		if originsEnv == "" {
			log.Fatal("ALLOWED_ORIGINS must be set in production")
		}
		origins := strings.Split(originsEnv, ",")
		// Trim whitespace
		for i, origin := range origins {
			origins[i] = strings.TrimSpace(origin)
		}
		return origins
	}
	// Development defaults
	return []string{"http://localhost:5173", "http://localhost:3000", "http://localhost:4173"}
}

func (c *Config) DSN() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Jakarta",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
