package knowledge_graph

type Node struct {
	Id        int64          `json:"Id"`
	ElementId string         `json:"ElementId"`
	Labels    []string       `json:"Labels"`
	Props     map[string]any `json:"Props"`
}

type Relationship struct {
	Id             int64          `json:"Id"`
	ElementId      string         `json:"ElementId"`
	StartId        int64          `json:"StartId"`
	StartElementId string         `json:"StartElementId"`
	EndId          int64          `json:"EndId"`
	EndElementId   string         `json:"EndElementId"`
	Type           string         `json:"Type"`
	Props          map[string]any `json:"Props"`
}

type GetNodesResponse struct {
	Values []interface{} `json:"Values"`
	Keys   []string      `json:"Keys"`
}

type GetNodesResult []GetNodesResponse
