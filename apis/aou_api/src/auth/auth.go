package auth

import (
	"aou_api/src/models"
	"net/http"

	"crypto/rand"
	"encoding/base64"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
	"golang.org/x/crypto/bcrypt"
)

// Healthcheck
// @Description  Returns a simple health status.
// @ID healthcheck
// @Produce  json
// @Success 200 {string} string "ok"
// @Router / [get]
func Healthcheck(c *gin.Context) {
	c.JSON(http.StatusOK, "ok")
}

// LOGIN/SIGNUP ROUTES
type LoginRequest struct {
	// Username for login
	// Example: testuser
	Username string `json:"username" binding:"required"`
	// Password for login
	// Example: password123
	Password string `json:"password" binding:"required"`
}

// Login endpoint
// @Description Authenticates user credentials and returns a JWT token upon successful login.
// @ID login
// @Accept json
// @Produce json
// @Param request body LoginRequest true "User login credentials"
// @Success 200 {string} string "JWT token"
// @Failure 400 {object} map[string]interface{} "Invalid request"
// @Failure 406 {object} map[string]interface{} "Username and password combo not found!"
// @Failure 401 {object} map[string]interface{} "Invalid username or password"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /login [post]
func Login(c *gin.Context) {
	appCtx, exists := c.MustGet("appCtx").(*models.AppContext)
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	var loginReq LoginRequest
	if err := c.ShouldBindJSON(&loginReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	//authenticate username/password combo here
	result, err := appCtx.NEO4J.ExecuteQuery(`
		MATCH (n:Person)
		WHERE n.username = $username
		RETURN n.password
	`, map[string]any{
		"username": loginReq.Username,
	})
	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	if len(result) != 1 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Username and password combo not found!"})
		return
	}

	storedHashedPassword := result[0].Values[0].(string)
	// Compare the stored hashed password with the provided password
	err = bcrypt.CompareHashAndPassword([]byte(storedHashedPassword), []byte(loginReq.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		return
	}

	token, err := GenerateToken(loginReq.Username)
	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, token)
}

type SignUpRequest struct {
	// Username for registration
	// Example: testuser
	Username string `json:"username" binding:"required"`
	// Password for registration
	// Example: password123
	Password string `json:"password" binding:"required"`
	// Phone number for registration
	// Example: 123-456-7890
	PhoneNumber string `json:"phone" binding:"required"`
}

// SignUp endpoint
// @Description Creates a new user account and returns a JWT token upon successful registration.
// @ID sign-up
// @Accept json
// @Produce json
// @Param request body SignUpRequest true "User registration details"
// @Success 200 {string} string "JWT token"
// @Failure 400 {object} map[string]interface{} "Invalid request"
// @Failure 406 {object} map[string]interface{} "Username or phone number already exists!"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /sign-up [post]
func SignUp(c *gin.Context) {
	appCtx, exists := c.MustGet("appCtx").(*models.AppContext)
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	var signUpReq SignUpRequest
	if err := c.ShouldBindJSON(&signUpReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	//check if username or phone number exists
	result, err := appCtx.NEO4J.ExecuteQuery(`
		MATCH (n:Person)
		WHERE n.phone = $phone OR n.username = $username
		RETURN n
	`, map[string]any{
		"username": signUpReq.Username,
		"phone":    signUpReq.PhoneNumber,
	})
	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	if len(result) > 0 {
		c.JSON(http.StatusNotAcceptable, gin.H{"error": "Username or phone number already exists!"})
		return
	}

	hashedPassword, err := HashPassword(signUpReq.Password)
	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	_, err = appCtx.NEO4J.ExecuteQuery(`
		CREATE (p:Person:L3 {
			username: $username,
			password: $password,
			phone: $phone
		})
	`, map[string]any{
		"username": signUpReq.Username,
		"password": hashedPassword,
		"phone":    signUpReq.PhoneNumber,
	})
	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	token, err := GenerateToken(signUpReq.Username)
	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, token)
}

func GenerateKEY(g *gin.Context) {
	token := GenerateRandomKey()
	g.JSON(http.StatusOK, token)
}

// JWT FUNCS
type Claims struct {
	Username string `json:"username"`
	jwt.StandardClaims
}

var JwtKey = []byte(os.Getenv("JWT_SECRET_KEY"))

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	return string(bytes), err
}

func GenerateToken(username string) (string, error) {
	// The expiration time after which the token will be invalid.
	expirationTime := time.Now().Add(24 * 60 * time.Minute).Unix()

	// Create the JWT claims, which includes the username and expiration time
	claims := &jwt.StandardClaims{
		// In JWT, the expiry time is expressed as unix milliseconds
		ExpiresAt: expirationTime,
		Issuer:    username,
	}

	// Declare the token with the algorithm used for signing, and the claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Create the JWT string
	tokenString, err := token.SignedString(JwtKey)

	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func GenerateRandomKey() string {
	key := make([]byte, 32) // generate a 256 bit key
	_, err := rand.Read(key)
	if err != nil {
		panic("Failed to generate random key: " + err.Error())
	}

	return base64.StdEncoding.EncodeToString(key)
}
