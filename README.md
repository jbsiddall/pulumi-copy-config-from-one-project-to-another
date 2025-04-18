# Pulumi Copy Config

A Deno script to copy Pulumi configuration values from one stack/project to another, even when they use different encryption passphrases or salts.

## The Problem

Copying configuration, especially secrets, between Pulumi projects or stacks can be challenging. Each stack typically encrypts its secrets using a unique passphrase and salt. Manually decrypting from the source and re-encrypting for the destination is tedious and error-prone. This is particularly common when:

* Reusing common configurations across multiple projects.
* Refactoring a large project into smaller ones.
* Setting up new environments based on existing ones.

## The Solution

This script automates the process by:

1.  Using `pulumi config --show-secrets -j` with the **source** stack's passphrase to export the configuration (including decrypted secrets) as JSON.
2.  Parsing the exported configuration.
3.  Iterating through each configuration key-value pair.
4.  Using `pulumi config set` (with `--secret` or `--plaintext` flag as appropriate) with the **destination** stack's passphrase to import the value into the target stack.

It handles the decryption and re-encryption seamlessly using the provided passphrases for each stack.

## Prerequisites

* **Deno:** Ensure you have Deno installed. ([Installation Guide](https://deno.land/manual/getting_started/installation))
* **Pulumi CLI:** The Pulumi CLI must be installed and configured. ([Installation Guide](https://www.pulumi.com/docs/install/))
* **Pulumi Backend Access:** The script needs access to your Pulumi backend (e.g., Pulumi Service, S3, Azure Blob Storage, Google Cloud Storage). For S3 backends, you'll need AWS credentials.

## Usage

You can run the script directly from its URL using `deno run`. You will need to grant permissions for running the `pulumi` command and for setting environment variables for the `pulumi` subprocess.

```bash
# Define your script URL
SCRIPT_URL="[https://raw.githubusercontent.com/jbsiddall/pulumi-copy-config-from-one-project-to-another/refs/heads/main/copy.js](https://raw.githubusercontent.com/jbsiddall/pulumi-copy-config-from-one-project-to-another/refs/heads/main/copy.js)"

# Run the script (replace placeholders below with actual values)
deno run --allow-run=pulumi --allow-env=PULUMI_CONFIG_PASSPHRASE,PULUMI_BACKEND_URL,AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY \
  "$SCRIPT_URL" \
  --pathFrom YOUR_SOURCE_PROJECT_PATH \
  --pathTo YOUR_DESTINATION_PROJECT_PATH \
  --secretFrom 'YOUR_SOURCE_PULUMI_PASSPHRASE' \
  --secretTo 'YOUR_DESTINATION_PULUMI_PASSPHRASE' \
  --stackFrom YOUR_SOURCE_STACK_NAME \
  --stackTo YOUR_DESTINATION_STACK_NAME \
  --pulumiBackendUrl 'YOUR_PULUMI_BACKEND_URL' \
  --awsAccessKeyId 'YOUR_AWS_ACCESS_KEY_ID_IF_S3' \
  --awsSecretAccessKey 'YOUR_AWS_SECRET_ACCESS_KEY_IF_S3'
```

Note on Permissions:

`--allow-run=pulumi`: Required to execute the pulumi CLI commands.

`--allow-env=...`: Required because this script sets environment variables (PULUMI_CONFIG_PASSPHRASE, PULUMI_BACKEND_URL, etc.) for the pulumi subprocesses it launches.

Arguments
`--pathFrom YOUR_SOURCE_PROJECT_PATH` (Required): Filesystem path to the source Pulumi project directory.

`--pathTo YOUR_DESTINATION_PROJECT_PATH` (Required): Filesystem path to the destination Pulumi project directory.

`--secretFrom 'YOUR_SOURCE_PULUMI_PASSPHRASE` (Required): The Pulumi configuration passphrase for the source stack. Use quotes if the passphrase contains special characters.

`--secretTo 'YOUR_DESTINATION_PULUMI_PASSPHRASE'` (Required): The Pulumi configuration passphrase for the destination stack. Use quotes if the passphrase contains special characters.

`--stackFrom YOUR_SOURCE_STACK_NAME` (Required): The name of the source Pulumi stack (e.g., dev, staging, prod).

`--stackTo YOUR_DESTINATION_STACK_NAME` (Required): The name of the destination Pulumi stack.

`--pulumiBackendUrl YOUR_PULUMI_BACKEND_URL` (Required): The URL of your Pulumi backend (e.g., s3://your-bucket?region=us-east-1, azblob://..., gs://..., or https://api.pulumi.com). Use quotes if the URL contains special characters like ? or &.

`--awsAccessKeyId YOUR_AWS_ACCESS_KEY_ID_S3` (Required for S3 backend): Your AWS Access Key ID if using an S3 backend.

`--awsSecretAccessKey 'YOUR_AWS_SECRET_ACCESS_KEY_S3' (Required for S3 backend): Your AWS Secret Access Key if using an S3 backend.

Example (S3 Backend)
# Define variables (replace placeholders with your actual values)
SCRIPT_URL="[https://raw.githubusercontent.com/jbsiddall/pulumi-copy-config-from-one-project-to-another/refs/heads/main/copy.js](https://raw.githubusercontent.com/jbsiddall/pulumi-copy-config-from-one-project-to-another/refs/heads/main/copy.js)"
SOURCE_PATH="./packages/pulumi-project-1"
DEST_PATH="./packages/pulumi-project-2"
SOURCE_SECRET="your_source_pulumi_stack_secret" # Use quotes if needed: 'your secret'
DEST_SECRET="your_destination_pulumi_stack_secret" # Use quotes if needed
SOURCE_STACK="dev"
DEST_STACK="dev"
# Example S3 URL - use quotes!
BACKEND_URL='s3://your-bucket-name?endpoint=your-s3-endpoint.com&region=your-region&s3ForcePathStyle=true'
AWS_KEY="YOUR_AWS_ACCESS_KEY_ID"
AWS_SECRET="YOUR_AWS_SECRET_ACCESS_KEY"

# Run the command
deno run --allow-run=pulumi --allow-env=PULUMI_CONFIG_PASSPHRASE,PULUMI_BACKEND_URL,AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY \
  "$SCRIPT_URL" \
  --pathFrom "$SOURCE_PATH" \
  --pathTo "$DEST_PATH" \
  --secretFrom "$SOURCE_SECRET" \
  --secretTo "$DEST_SECRET" \
  --stackFrom "$SOURCE_STACK" \
  --stackTo "$DEST_STACK" \
  --pulumiBackendUrl "$BACKEND_URL" \
  --awsAccessKeyId "$AWS_KEY" \
  --awsSecretAccessKey "$AWS_SECRET"

# Example Output:
# ┏ ⚠️  Deno requests run access to "pulumi".
# ┃  Need run access to "pulumi" to run Pulumi commands.
# ┃  Allow? [y/n/A] (y = yes, n = no, A = allow all run permissions) > y
# ┏ ⚠️  Deno requests env access to "PULUMI_CONFIG_PASSPHRASE, PULUMI_BACKEND_URL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY".
# ┃  Need env access to "PULUMI_CONFIG_PASSPHRASE, PULUMI_BACKEND_URL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY" to pass configuration/credentials to Pulumi commands.
# ┃  Allow? [y/n/A] (y = yes, n = no, A = allow all env permissions) > y
# ✅ Granted run access to "pulumi".
# ✅ Granted env access to "PULUMI_CONFIG_PASSPHRASE, PULUMI_BACKEND_URL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY".
# 1/7 cloudflareAccountId
# 2/7 cloudflareApiKey
# 3/7 cloudflareServiceClientId
# 4/7 cloudflareServiceClientSecret
# 5/7 githubToken
# 6/7 postgresSuperUserPassword
# 7/7 socksProxy

Security Considerations
Passphrases: This script requires Pulumi stack passphrases as command-line arguments. Be mindful of your shell history and process list visibility when running this script.

AWS Credentials: Similarly, if using an S3 backend, AWS credentials are required via command-line arguments. Ensure these are handled securely and consider alternatives like temporary credentials or instance profiles if running in an environment that supports them (though the script would need modification to use them implicitly).

Contributing
Contributions are welcome! Please feel free to open an issue or submit a pull request.

License
MIT
