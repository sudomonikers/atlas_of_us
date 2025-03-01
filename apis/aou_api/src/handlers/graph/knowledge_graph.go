package handlers

import (
    "aou_api/src/models"
    "fmt"
    "net/http"
    "io"

    "github.com/gin-gonic/gin"
)

func GraphManagement(c *gin.Context) {
    appCtx, exists := c.MustGet("appCtx").(*models.AppContext)
    if !exists {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
        return
    }

    // Read the request body
    body, err := io.ReadAll(c.Request.Body)
    if err != nil {
        appCtx.LOGGER.Error("Error reading request body: " + err.Error())
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
        return
    }
    fmt.Printf("Request Body: %s\n", string(body))

    var requestData map[string]interface{}
    if err := json.Unmarshal(body, &requestData); err != nil {
    	appCtx.LOGGER.Error("Error unmarshaling JSON: " + err.Error())
    	c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
    	return
    }


    //parse the text, send a POST request to process.env.LLM_ENDPOINT
	resp, _ := http.Post(os.Getenv("LLM_ENDPOINT"), "application/json", c.Request.Body)
	defer resp.Body.Close()
    responseBody, _ := io.ReadAll(resp.Body)
    var llmResponse LLMResponse
    if err := json.Unmarshal(responseBody, &llmResponse); err != nil {
        appCtx.LOGGER.Error("Error unmarshaling LLM response: " + err.Error())
        c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid LLM response"})
        return
    }



	//Does the input contain any information that might be useful in the Atlas Of Us?
	if llmResponse.Insert {
		//if it does, list the nodes we may want to insert. we should get back an array of possible node insertions
        nodesToEvaluate := llmResponse.NodesToEvaluate
        for _, node := range nodesToEvaluate {
            fmt.Printf("Processing node: %+v\n", node)
            // Check if the node already exists in the database or not
			result, err := appCtx.NEO4J.ExecuteQuery(`
				MATCH (n:Skill {name: '%s'})
				OPTIONAL MATCH (n)-[r]->(m)
				WITH collect(n) AS nodes, collect(r) AS relationships
				UNWIND nodes AS node
				UNWIND relationships AS relationship
				RETURN collect(DISTINCT node) AS nodes, collect(DISTINCT relationship) AS relationships
			`, map[string]any{})
			if err != nil {
				appCtx.LOGGER.Error(err.Error())
				c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
				return
			}
			//TODO clean up the above

			//if it does exist, simply do nothing, but if it doesnt exist, now we need to determine how to enter it
			if result.length {
				return //or pass or whatever go does, basically we want to exit this iteration of the for loop
			} else {
				//now we want to query the llm to see what kind of node this should be, including any subtypesif applicable by passing in the previous context as well as documentation on the different types of nodes we have
				resp, _ := http.Post(os.Getenv("LLM_ENDPOINT"), "application/json", c.Request.Body)

				//if we have a determination, lets insert the node
				result, _ := appCtx.NEO4J.ExecuteQuery(`
					MERGE ()
				`, map[string]any{})

				//now that weve inserted the node, we should figure out if any existing nodes should have relationships to it
			}


        }
    } else {
        c.JSON(http.StatusOK, "Nothing to do here.")
        return
    }

    

    c.JSON(http.StatusOK, result)
}