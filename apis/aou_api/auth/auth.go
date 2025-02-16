package auth

import (
	"aou_api/models"
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
func Healthcheck(c *gin.Context) {
	c.JSON(http.StatusOK, "ok")
}

// LOGIN/SIGNUP ROUTES
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

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
		c.JSON(http.StatusNotAcceptable, gin.H{"error": "Username and password combo not found!"})
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
	Username    string `json:"username"`
	Password    string `json:"password"`
	PhoneNumber string `json:"phone"`
	Email       string `json:"email"`
}

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
			phone: $phone,
			email: $email
		})
	`, map[string]any{
		"username": signUpReq.Username,
		"password": hashedPassword,
		"phone":    signUpReq.PhoneNumber,
		"email":    signUpReq.Email,
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
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
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
