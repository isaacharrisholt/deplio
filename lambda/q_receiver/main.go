package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
)

type SQSAttributes struct {
	ApproximateReceiveCount          string `json:"ApproximateReceiveCount"`
	SentTimestamp                    string `json:"SentTimestamp"`
	SenderId                         string `json:"SenderId"`
	ApproximateFirstReceiveTimestamp string `json:"ApproximateFirstReceiveTimestamp"`
}

type SQSMessage struct {
	MessageId         string                       `json:"messageId"`
	ReceiptHandle     string                       `json:"receiptHandle"`
	Body              string                       `json:"body"`
	Attributes        SQSAttributes                `json:"attributes"`
	MessageAttributes map[string]map[string]string `json:"messageAttributes"`
	Md5OfBody         string                       `json:"md5OfBody"`
	EventSource       string                       `json:"eventSource"`
	EventSourceARN    string                       `json:"eventSourceARN"`
	AwsRegion         string                       `json:"awsRegion"`
}

type SQSEvent struct {
	Records []SQSMessage `json:"Records"`
}

type QMessage struct {
	Destination string            `json:"destination"`
	Body        string            `json:"body"`
	Method      string            `json:"method"`
	Headers     map[string]string `json:"headers"`
	RequestID   string            `json:"request_id"`
}

type messageAndResponse struct {
	message  QMessage
	response *http.Response
}

func HandleRequest(ctx context.Context, event *SQSEvent) (string, error) {
	fmt.Println("event", *event)

	var messages []QMessage

	// Unmarshal the SQS message body into our message struct
	for _, record := range event.Records {
		fmt.Println("record", record)
		var message QMessage
		err := json.Unmarshal([]byte(record.Body), &message)
		if err != nil {
			fmt.Println("Error unmarshalling message", err, record.Body)
			return "", err
		}
		messages = append(messages, message)
	}

	var wg sync.WaitGroup

	errors := make(chan error, len(messages))
	successes := make(chan messageAndResponse, len(messages))

	for _, message := range messages {
		wg.Add(1)
		m := message
		go func() {
			defer wg.Done()
			// resp, err := handleMessage(message)
			resp, err := handleMessage(m)
			if err != nil {
				errors <- err
				return
			}
			successes <- messageAndResponse{m, resp}
		}()
	}

	wg.Wait()

	// TODO: dead letter queue for errors

	close(errors)
	close(successes)

	for s := range successes {
		// TODO: store response in Supabase
		fmt.Println("Success", s)
	}

	return "Hello from Lambda!", nil
}

// handleMessage sends the message to the destination
func handleMessage(message QMessage) (*http.Response, error) {
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	body := strings.NewReader(message.Body)
	req, err := http.NewRequest(message.Method, message.Destination, body)
	if err != nil {
		fmt.Println("Error creating request", err)
		return nil, err
	}

	for key, value := range message.Headers {
		req.Header.Add(key, value)
	}

	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error sending request", err)
		return nil, err
	}

	fmt.Println("Response", resp)
	return resp, nil
}

func main() {
	lambda.Start(HandleRequest)
}
