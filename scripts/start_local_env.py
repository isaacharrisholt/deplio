import os
import subprocess
import signal
import json

from pathlib import Path


def start_localstack():
    print("Starting localstack... ", end="", flush=True)
    os.environ["DEBUG"] = "1"
    result = subprocess.run(
        [
            "localstack",
            "start",
            "-d",
            "-e",
            "LAMBDA_DOCKER_NETWORK=bridge",
            "--network",
            "bridge",
        ],
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


def initialise_terraform():
    print("Initialising terraform... ", end="", flush=True)
    result = subprocess.run(
        ["tflocal", "init", "-reconfigure"],
        cwd="terraform",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        print("failed")
        print(result.stderr.decode("utf-8"))
        raise Exception("Failed to initialise terraform")
    print("done")


def create_tf_workspace():
    print("Creating terraform workspace... ", end="", flush=True)
    result = subprocess.run(
        ["tflocal", "workspace", "new", "local"],
        cwd="terraform",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    # Ignore error if workspace already exists
    if result.returncode != 0 and "already exists" not in result.stderr.decode("utf-8"):
        print("failed")
        print(result.stderr.decode("utf-8"))
        raise Exception("Failed to create terraform workspace")
    print("done")


def get_doppler_token() -> str:
    token = os.getenv("DOPPLER_TOKEN")
    if not token:
        token = input("Enter your Doppler 'globals' project local token: ").strip()
    return token


def apply_tf(doppler_token: str):
    print("Applying terraform... ", end="", flush=True)
    result = subprocess.run(
        [
            "tflocal",
            "apply",
            "-auto-approve",
            "-var",
            f"doppler_token={doppler_token}",
        ],
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
    token = get_doppler_token()
    start_localstack()
    try:
        initialise_terraform()
        create_tf_workspace()
        apply_tf(token)
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
