import os
import subprocess
import signal
import json

from pathlib import Path


def get_secrets() -> dict[str, str]:
    secrets_file = Path("local-secrets.json")
    if not secrets_file.exists():
        raise Exception("local-secrets.json not found")

    return json.loads(secrets_file.read_text())


def start_localstack():
    print("Starting localstack... ", end="", flush=True)
    os.environ["DEBUG"] = "1"
    result = subprocess.run(
        ["localstack", "start", "-d", "-e", "LAMBDA_DOCKER_NETWORK=bridge", "--network", "bridge"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        print("failed")
        print(result.stdout.decode("utf-8"))
        print(result.stderr.decode("utf-8"))
        raise Exception("Failed to start localstack")

    result = subprocess.run(
        ["localstack", "wait", "-t", "60"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        print("failed")
        print(result.stdout.decode("utf-8"))
        print(result.stderr.decode("utf-8"))
        raise Exception("Failed to wait for localstack")
    print("done")


def setup_secrets(env_vars: dict[str, str]):
    # Setup secrets
    for key, value in env_vars.items():
        key_name = f"local/{key}"
        result = subprocess.run(
            [
                "awslocal",
                "secretsmanager",
                "create-secret",
                "--name",
                key_name,
                "--secret-string",
                value,
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        if result.returncode != 0:
            print("failed")
            print(result.stderr.decode("utf-8"))
            raise Exception("Failed to create secret")
        print(f'Created secret "{key_name}"')


def apply_tf():
    print("Applying terraform... ", end="", flush=True)
    result = subprocess.run(
        ["tflocal", "apply", "-auto-approve"],
        cwd="terraform",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        print("failed")
        print(result.stdout.decode("utf-8"))
        print(result.stderr.decode("utf-8"))
        raise Exception("Failed to apply terraform")
    print("done")


def stop_localstack():
    print("Stopping localstack... ", end="", flush=True)
    result = subprocess.run(
        ["localstack", "stop"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        print("failed")
        print(result.stderr.decode("utf-8"))
        raise Exception("Failed to stop localstack")
    print("done")


def follow_logs():
    print("Following logs...")
    result = subprocess.run(
        ["localstack", "logs", "-f"],
    )
    if result.returncode != 0:
        raise Exception("Failed to follow logs")


def signal_handler(sig, frame):
    stop_localstack()
    exit(0)


def main():
    print("Starting local environment")
    secrets = get_secrets()
    start_localstack()
    try:
        setup_secrets(secrets)
        apply_tf()
    except Exception as e:
        print(e)
        print("Failed to start local environment")
        stop_localstack()
        exit(1)

    print("Local environment started")
    print("Press Ctrl+C to stop local environment")

    # Register signal handler
    signal.signal(signal.SIGINT, signal_handler)

    follow_logs()


if __name__ == "__main__":
    main()
