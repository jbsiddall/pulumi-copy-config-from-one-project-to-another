# pulumi-copy-config Deno Script

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Deno script to copy Pulumi configuration values from one stack/project to another, even when they use different encryption passphrases or salts.

## Quick Start

```bash
# Run with --help to see all options
deno https://raw.githubusercontent.com/jbsiddall/pulumi-copy-config-from-one-project-to-another/main/copy.js --help
```

---

## The Problem

Copying configuration, especially secrets, between Pulumi projects or stacks can be challenging. Each stack typically encrypts its secrets using a unique passphrase and salt. Manually decrypting from the source and re-encrypting for the destination is tedious and error-prone. This is particularly common when:

* Reusing common configurations across multiple projects
* Refactoring a large project into smaller ones
* Setting up new environments based on existing ones (cloning)

## The Solution

This script automates the process by:

1. Using pulumi config --show-secrets -j with the source stack passphrase to export the configuration (including decrypted secrets) as JSON
2. Parsing the exported configuration
3. Iterating through each configuration key-value pair
4. Using pulumi config set with --secret or --plaintext flag as appropriate with the destination stack passphrase to import the value into the target stack

It handles the decryption and re-encryption seamlessly using the provided passphrases for each stack.

## Prerequisites

* Deno: Ensure you have Deno installed (Installation Guide: https://deno.land/manual/getting_started/installation)
* Pulumi CLI: The Pulumi CLI must be installed and configured (Installation Guide: https://www.pulumi.com/docs/install/)
* Pulumi Backend Access: The script needs access to your Pulumi backend (for example, Pulumi Service, S3, Azure Blob Storage, or Google Cloud Storage)
* AWS Credentials: Required for this script to work (this script uses S3 for backend storage)

## Usage

```bash
deno --allow-run=pulumi https://raw.githubusercontent.com/jbsiddall/pulumi-copy-config-from-one-project-to-another/main/copy.js --pathFrom YOUR_SOURCE_PROJECT_PATH --pathTo YOUR_DESTINATION_PROJECT_PATH --secretFrom YOUR_SOURCE_PULUMI_PASSPHRASE --secretTo YOUR_DESTINATION_PULUMI_PASSPHRASE --stackFrom YOUR_SOURCE_STACK_NAME --stackTo YOUR_DESTINATION_STACK_NAME --pulumiBackendUrl YOUR_PULUMI_BACKEND_URL --awsAccessKeyId YOUR_AWS_ACCESS_KEY_ID --awsSecretAccessKey YOUR_AWS_SECRET_ACCESS_KEY
```

### Arguments

| Argument              | Description                                                                                                                            | Required |
|-----------------------|----------------------------------------------------------------------------------------------------------------------------------------|----------|
| --pathFrom            | Filesystem path to the source Pulumi project directory                                                                                  | Yes      |
| --pathTo              | Filesystem path to the destination Pulumi project directory                                                                             | Yes      |
| --secretFrom          | The Pulumi configuration passphrase for the source stack. Use quotes if the passphrase contains special characters                        | Yes      |
| --secretTo            | The Pulumi configuration passphrase for the destination stack. Use quotes if the passphrase contains special characters                     | Yes      |
| --stackFrom           | The name of the source Pulumi stack (for example, dev or prod)                                                                          | Yes      |
| --stackTo             | The name of the destination Pulumi stack                                                                                                 | Yes      |
| --pulumiBackendUrl    | The URL of your Pulumi backend (for example, s3://your-bucket?region=us-east-1, azblob://..., gs://..., or https://api.pulumi.com). Use quotes if the URL contains special characters like ? or & | Yes |
| --awsAccessKeyId      | Your AWS Access Key ID                                                                                                                  | Yes      |
| --awsSecretAccessKey  | Your AWS Secret Access Key                                                                                                              | Yes      |

## Permissions

* --allow-run=pulumi: Required to execute the pulumi CLI commands

## Example (S3 Backend)

```bash
# Define variables (replace placeholders with your actual values)
SOURCE_PATH=./packages/pulumi-project-1
DEST_PATH=./packages/pulumi-project-2
SOURCE_SECRET=your_source_pulumi_stack_secret
DEST_SECRET=your_destination_pulumi_stack_secret
SOURCE_STACK=dev
DEST_STACK=dev
BACKEND_URL=s3://your-bucket-name?endpoint=your-s3-endpoint.com&region=your-region&s3ForcePathStyle=true
AWS_KEY=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET=YOUR_AWS_SECRET_ACCESS_KEY

# Run the command
deno --allow-run=pulumi https://raw.githubusercontent.com/jbsiddall/pulumi-copy-config-from-one-project-to-another/main/copy.js --pathFrom $SOURCE_PATH --pathTo $DEST_PATH --secretFrom $SOURCE_SECRET --secretTo $DEST_SECRET --stackFrom $SOURCE_STACK --stackTo $DEST_STACK --pulumiBackendUrl $BACKEND_URL --awsAccessKeyId $AWS_KEY --awsSecretAccessKey $AWS_SECRET
```

### Example Output

```
┏ ⚠️  Deno requests run access to pulumi.
┃  Need run access to pulumi to run Pulumi commands.
┃  Allow? [y/n/A] (y = yes, n = no, A = allow all run permissions) > y
┗ ✅ Granted run access to pulumi.
1/7 cloudflareAccountId
2/7 cloudflareApiKey
3/7 cloudflareServiceClientId
4/7 cloudflareServiceClientSecret
5/7 githubToken
6/7 postgresSuperUserPassword
7/7 socksProxy
```

## Security Considerations

* Passphrases: This script requires Pulumi stack passphrases as command-line arguments. Be mindful of your shell history and process list visibility when running this script.
* AWS Credentials: AWS credentials are required via command-line arguments. Ensure these are handled securely and consider alternatives like temporary credentials or instance profiles where possible.

