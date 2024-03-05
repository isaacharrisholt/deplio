#!/bin/bash

set -eu

read -p "Enter the API version: " version

# Download the version
curl -sSf -o openapi.json http://localhost:8000/openapi.json?version=$version

