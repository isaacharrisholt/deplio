package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	supa "github.com/isaacharrisholt/deplio/pkg/supabase"
	pg "github.com/supabase/postgrest-go"
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

type messageSuccess struct {
	sqsMessage SQSMessage
	qMessage   QMessage
	response   *http.Response
}

type messageError struct {
	sqsMessage SQSMessage
	error      error
}

type itemFailure struct {
	ItemIdentifier string `json:"itemIdentifier"`
}

type itemFailuresResponse struct {
	BatchItemFailures []itemFailure `json:"batchItemFailures"`
}

func HandleRequest(ctx context.Context, event *SQSEvent) (string, error) {
	fmt.Println("event", *event)

	var wg sync.WaitGroup

	errors := make(chan messageError, len(event.Records))
	successes := make(chan messageSuccess, len(event.Records))

	for _, message := range event.Records {
		wg.Add(1)
		m := message
		go func() {
			defer wg.Done()
			// resp, err := handleMessage(message)
			qMessage, resp, err := handleMessage(m)
			if err != nil {
				errors <- messageError{m, err}
				return
			}
			successes <- messageSuccess{m, *qMessage, resp}
		}()
	}

	wg.Wait()

	close(successes)

	supabase, err := supa.NewClient()
	if err != nil {
		fmt.Println("Error creating Supabase client", err)
		return "", err
	}

	// TODO: make concurrent
	for success := range successes {
		s := success
		err = handleSuccess(supabase, s)
		if err != nil {
			fmt.Println("Error handling success", err)
			errors <- messageError{s.sqsMessage, err}
		}
	}

	close(errors)

	var itemFailures itemFailuresResponse
	for err := range errors {
		itemFailures.BatchItemFailures = append(itemFailures.BatchItemFailures, itemFailure{
			ItemIdentifier: err.sqsMessage.MessageId,
		})
	}

	response, err := json.Marshal(itemFailures)
	if err != nil {
		fmt.Println("Error marshalling response", err)
		return "", err
	}
	return string(response), nil
}

// handleMessage sends the message to the destination
func handleMessage(sqsMessage SQSMessage) (*QMessage, *http.Response, error) {
	var message QMessage
	err := json.Unmarshal([]byte(sqsMessage.Body), &message)
	if err != nil {
		fmt.Println("Error unmarshalling message", err, sqsMessage.Body)
		return nil, nil, err
	}

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	body := strings.NewReader(message.Body)
	req, err := http.NewRequest(message.Method, message.Destination, body)
	if err != nil {
		fmt.Println("Error creating request", err)
		return nil, nil, err
	}

	for key, value := range message.Headers {
		req.Header.Add(key, value)
	}

	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error sending request", err)
		return nil, nil, err
	}

	fmt.Println("Response", resp)
	return &message, resp, nil
}

func handleSuccess(supabase *pg.Client, m messageSuccess) error {
	defer m.response.Body.Close()
	body, err := io.ReadAll(m.response.Body)
	if err != nil {
		fmt.Println("Error reading response body", err)
		return err
	}

	_, _, err = supabase.
		From("q_response").
		Insert(map[string]any{
			"request_id":  m.qMessage.RequestID,
			"status_code": m.response.StatusCode,
			"body":        string(body),
		}, false, "", "", "").
		ExecuteString()

	if err != nil {
		fmt.Println("Error inserting response", err)
		return err
	}
	fmt.Println("Inserted response", m.response.StatusCode, string(body))
	return nil
}

func main() {
	lambda.Start(HandleRequest)
}
