import subprocess
import json
from pathlib import Path


def get_secrets() -> dict[str, str]:
    secrets_file = Path("local-secrets.json")
    if not secrets_file.exists():
        raise Exception("local-secrets.json not found")

    return json.loads(secrets_file.read_text())


def start_localstack():
    print("Starting localstack... ", end="", flush=True)
    subprocess.run(
        ["localstack", "start", "-d"],
        stdout=subprocess.DEVNULL,
    )
    print("done")


def setup_secrets(env_vars: dict[str, str]):
    # Setup secrets
    for key, value in env_vars.items():
        key_name = f"local/{key}"
        subprocess.run(
            [
                "awslocal",
                "secretsmanager",
                "create-secret",
                "--name",
                key_name,
                "--secret-string",
                value,
            ],
            stdout=subprocess.DEVNULL,
        )
        print(f'Created secret "{key_name}"')


def apply_tf():
    print("Applying terraform... ", end="", flush=True)
    subprocess.run(
        ["tflocal", "apply", "-auto-approve"],
        cwd="terraform",
        stdout=subprocess.DEVNULL,
    )
    print("done")


def main():
    print("Starting local environment")
    secrets = get_secrets()
    start_localstack()
    setup_secrets(secrets)
    apply_tf()


if __name__ == "__main__":
    main()
