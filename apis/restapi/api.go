package main

import (
	"context"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

func main() {

	r := gin.Default()
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})
	r.GET("/match-all", func(c *gin.Context) {

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
		// Iterate over the records and print the node properties
		for _, record := range result.Records {
			node, ok := record.Values[0].(neo4j.Node)
			if !ok {
				fmt.Println("Error casting to neo4j.Node")
				continue
			}
			fmt.Printf("Node ID: %v\n", node.ElementId)
			fmt.Printf("Labels: %v\n", node.Labels)
			fmt.Printf("Properties: %v\n", node.Props)
		}

		c.JSON(200, gin.H{
			"message": result.Records,
		})
	})
	r.Run() // listen and serve on 0.0.0.0:8080

}
