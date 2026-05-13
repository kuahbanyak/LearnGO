package pagination

const (
	DefaultLimit = 10
	MaxLimit     = 100
)

type Params struct {
	Page    int
	PerPage int
}

// NewParams creates pagination parameters with validation
func NewParams(page, perPage int) Params {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = DefaultLimit
	}
	if perPage > MaxLimit {
		perPage = MaxLimit
	}
	return Params{Page: page, PerPage: perPage}
}

// Offset calculates the database offset
func (p Params) Offset() int {
	return (p.Page - 1) * p.PerPage
}

// Limit returns the limit value
func (p Params) Limit() int {
	return p.PerPage
}
