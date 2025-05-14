package constraints

import (
	"errors"
	"fmt"
)

// RelationshipMetadata defines the constraints for a specific relationship type
type RelationshipMetadata struct {
	FromNodeLabels []string                          // Allowed "from" node labels
	ToNodeLabels   []string                          // Allowed "to" node labels
	PropertyRules  map[string]func(interface{}) bool // Validation functions for properties
}

func ValidateRelationship(relationshipType string, fromLabel string, toLabel string, properties map[string]interface{}) error {
	metadata, exists := Relationships[relationshipType]
	if !exists {
		return errors.New("unknown relationship type")
	}

	// Validate node labels
	if !contains(metadata.FromNodeLabels, fromLabel) {
		return errors.New("invalid from node label")
	}
	if !contains(metadata.ToNodeLabels, toLabel) {
		return errors.New("invalid to node label")
	}

	// Validate properties
	for prop, value := range properties {
		if rule, exists := metadata.PropertyRules[prop]; exists {
			if !rule(value) {
				return fmt.Errorf("invalid value for property %s", prop)
			}
		}
	}

	return nil
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// Relationships defines the map of all relationships and their constraints
var Relationships = map[string]RelationshipMetadata{
	"KNOWS": {
		FromNodeLabels: []string{"Person"},
		ToNodeLabels:   []string{"Knowledge"},
		PropertyRules: map[string]func(interface{}) bool{
			"level": func(value interface{}) bool {
				level, ok := value.(int)
				return ok && level >= 1 && level <= 6
			},
		},
	},
	// Add more relationships here
}
