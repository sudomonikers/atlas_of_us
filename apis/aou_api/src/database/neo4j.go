package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

type Neo4jDB struct {
	Driver neo4j.DriverWithContext
}

func NewNeo4jDatabase() *Neo4jDB {
	var driver neo4j.DriverWithContext
	var err error

	dbUri := os.Getenv("NEO4J_URI")
	dbUser := os.Getenv("NEO4J_USER")
	dbPassword := os.Getenv("NEO4J_PASSWORD")

	for i := 1; i <= 3; i++ {
		driver, err = neo4j.NewDriverWithContext(
			dbUri,
			neo4j.BasicAuth(dbUser, dbPassword, ""))
		if err == nil {
			break
		} else {
			log.Println(err)
			log.Printf("Attempt %d: Failed to initialize database. Retrying...", i)
			time.Sleep(3 * time.Second)
		}
	}

	ctx := context.Background()
	err = driver.VerifyConnectivity(ctx)
	if err != nil {
		log.Fatalf("Failed to verify connectivity: %v", err)
	}

	fmt.Println("Connection established.")
	return &Neo4jDB{Driver: driver}
}

func (db *Neo4jDB) Close() {
	ctx := context.Background()
	db.Driver.Close(ctx)
}

func (db *Neo4jDB) ExecuteQuery(query string, params map[string]any) ([]neo4j.Record, error) {
	ctx := context.Background()
	result, err := neo4j.ExecuteQuery(
		ctx,
		db.Driver,
		query,
		params,
		neo4j.EagerResultTransformer,
	)
	if err != nil {
		return nil, err
	}

	// Convert []*neo4j.Record to []neo4j.Record
	records := make([]neo4j.Record, len(result.Records))
	for i, record := range result.Records {
		records[i] = *record
	}

	return records, nil
}
