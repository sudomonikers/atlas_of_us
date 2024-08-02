package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

func executeCypherFromFile(filePath string, driver neo4j.DriverWithContext, ctx context.Context, dbBase string) error {
	query, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}

	// Split the file content into individual statements
	statements := strings.Split(string(query), ";\n")

	for _, statement := range statements {
		// Trim whitespace
		trimmedStatement := strings.TrimSpace(statement)

		// Skip empty statements
		if trimmedStatement == "" {
			continue
		}

		// Execute the non-empty statement
		_, err = neo4j.ExecuteQuery(
			ctx,
			driver,
			trimmedStatement,
			map[string]any{},
			neo4j.EagerResultTransformer,
			neo4j.ExecuteQueryWithDatabase(dbBase))
		if err != nil {
			return err // Consider accumulating errors if you want to attempt all statements before returning
		}
	}

	return nil
}

func walkCypherFiles(dirPath string, driver neo4j.DriverWithContext, ctx context.Context, dbBase string) error {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return err
	}

	// Separate files and directories
	var files []os.DirEntry
	var dirs []os.DirEntry
	for _, entry := range entries {
		if entry.IsDir() {
			dirs = append(dirs, entry)
		} else {
			files = append(files, entry)
		}
	}

	// Process .cypher files first
	for _, file := range files {
		if strings.HasSuffix(file.Name(), ".cypher") {
			fullPath := filepath.Join(dirPath, file.Name())
			fmt.Println("Executing Cypher from:", fullPath)
			err := executeCypherFromFile(fullPath, driver, ctx, dbBase)
			if err != nil {
				fmt.Println("Error executing Cypher file:", fullPath, err)
				// Decide on your error handling policy here
				continue // or return err
			}
		}
	}

	// Then, recursively handle directories
	for _, dir := range dirs {
		fullPath := filepath.Join(dirPath, dir.Name())
		err := walkCypherFiles(fullPath, driver, ctx, dbBase)
		if err != nil {
			return err
		}
	}

	return nil
}

func main() {
	ctx := context.Background()
	// URI examples: "neo4j://localhost", "neo4j+s://xxx.databases.neo4j.io"
	dbUri := "neo4j://localhost"
	dbUser := "neo4j"
	dbPassword := "password"
	dbBase := "neo4j"
	driver, err := neo4j.NewDriverWithContext(
		dbUri,
		neo4j.BasicAuth(dbUser, dbPassword, ""))
	if err != nil {
		panic(err)
	}
	defer driver.Close(ctx)

	err = driver.VerifyConnectivity(ctx)
	if err != nil {
		panic(err)
	}
	fmt.Println("Connection established.")

	result, err := neo4j.ExecuteQuery(
		ctx,
		driver,
		"MATCH (n) RETURN n",
		map[string]any{},
		neo4j.EagerResultTransformer,
		neo4j.ExecuteQueryWithDatabase(dbBase))
	if err != nil {
		fmt.Println("Error executing query:", err)
		return
	}

	fmt.Println("Existing records: ", len(result.Records))
	// Loop through results and do something with them
	for _, record := range result.Records {
		fmt.Println(record.AsMap())
	}

	//delete all records
	fmt.Println("Deleting records...")
	deleteResult, err := neo4j.ExecuteQuery(ctx, driver,
		"MATCH (n) DETACH DELETE n",
		map[string]any{}, neo4j.EagerResultTransformer,
		neo4j.ExecuteQueryWithDatabase(dbBase))
	if err != nil {
		fmt.Println("Error executing query:", err)
		return
	}
	fmt.Println(deleteResult)

	//Recreating database
	fmt.Println("Recreating database...")
	err = walkCypherFiles("../Layer1", driver, ctx, dbBase)
	if err != nil {
		fmt.Println("Error walking Cypher files:", err)
	}
	fmt.Println("Done")
}
