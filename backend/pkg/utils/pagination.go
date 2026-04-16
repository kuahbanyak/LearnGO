package utils

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

type PaginationQuery struct {
	Page    int
	PerPage int
	Offset  int
}

func GetPagination(c *gin.Context) PaginationQuery {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 10
	}

	return PaginationQuery{
		Page:    page,
		PerPage: perPage,
		Offset:  (page - 1) * perPage,
	}
}
