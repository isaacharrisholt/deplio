package main

import (
	"context"
	"fmt"

	"github.com/aws/aws-lambda-go/lambda"
)

type QMessage struct {
	Destination string            `json:"destination"`
	Body        any               `json:"body"`
	Method      string            `json:"method"`
	Headers     map[string]string `json:"headers"`
	RequestID   string            `json:"request_id"`
}

func HandleRequest(ctx context.Context, event *any) (string, error) {
	fmt.Println("qMessage", *event)
	return "Hello from Lambda!", nil
}

func main() {
	lambda.Start(HandleRequest)
}
