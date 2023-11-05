package supabase

import (
	"errors"
	"fmt"
	"log"
	"os"

	pg "github.com/supabase/postgrest-go"
)

// NewClient creates a new Supabase client.
func NewClient() (*pg.Client, error) {
	supabaseUrl := os.Getenv("PUBLIC_SUPABASE_URL")
	supabaseKey := os.Getenv("PRIVATE_SUPABASE_SERVICE_ROLE_KEY")

	if supabaseUrl == "" || supabaseKey == "" {
		log.Printf("Missing environment variable.")
		return nil, errors.New("missing environment variable")
	}

	headers := map[string]string{
		"apikey":        supabaseKey,
		"authorization": fmt.Sprintf("Bearer %s", supabaseKey),
	}
	return pg.NewClient(supabaseUrl+"/rest/v1", "", headers), nil
}
