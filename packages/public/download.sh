#!/bin/bash

set -eu

read -p "Enter the API version: " version

# Download the version
curl -LsSf http://localhost:8000/openapi.json?version=$version | jq | sed 's/"operationId": ".*:\(.*\)"/"operationId": "\1"/g' > openapi.json

