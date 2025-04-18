import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const configItemSchema = z.object({
  value: z.string(),
  secret: z.boolean(),
});

const configSchema = z.record(z.string(), configItemSchema);

const command = new Command()
  .name("pulumi-copy-config")
  .description("Copy Pulumi config from one stack/project to another")
  .option("--pathFrom <path:string>", "Source path", { required: true })
  .option("--pathTo <path:string>", "Destination path", { required: true })
  .option("--secretFrom <secret:string>", "Source secret passphrase", {
    required: true,
  })
  .option("--secretTo <secret:string>", "Destination secret passphrase", {
    required: true,
  })
  .option("--stackFrom <stack:string>", "Source stack", { required: true })
  .option("--stackTo <stack:string>", "Destination stack", { required: true })
  .option("--pulumiBackendUrl <url:string>", "Pulumi backend URL", {
    required: true,
  })
  .option("--awsAccessKeyId <key:string>", "AWS Access Key ID for S3 backend", {
    required: true,
  })
  .option(
    "--awsSecretAccessKey <key:string>",
    "AWS Secret Access Key for S3 backend",
    { required: true },
  )

  .action(async (options) => {
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const getConfigCmdArgs = [
      "pulumi",
      "config",
      "-j",
      "--show-secrets",
      "--stack",
      options.stackFrom,
    ];

    const getCmd = new Deno.Command("pulumi", {
      args: getConfigCmdArgs.slice(1),
      cwd: options.pathFrom,
      env: {
        PULUMI_CONFIG_PASSPHRASE: options.secretFrom,
        PULUMI_BACKEND_URL: options.pulumiBackendUrl,
        AWS_ACCESS_KEY_ID: options.awsAccessKeyId,
        AWS_SECRET_ACCESS_KEY: options.awsSecretAccessKey,
      },
      stdout: "piped",
      stderr: "piped",
    });

    const {
      code: getCode,
      stdout: getStdout,
      stderr: getStderr,
    } = await getCmd.output();
    const getStdoutStr = decoder.decode(getStdout).trim();
    const getStderrStr = decoder.decode(getStderr).trim();

    if (getCode !== 0) {
      console.error(
        `Command failed with exit code ${getCode}: ${getConfigCmdArgs.join(" ")}: ${getStderrStr}`,
      );
      console.error("STUFF", {
        args: getConfigCmdArgs.slice(1),
        cwd: options.pathFrom,
        env: {
          PULUMI_CONFIG_PASSPHRASE: options.secretFrom,
          PULUMI_BACKEND_URL: options.pulumiBackendUrl,
          AWS_ACCESS_KEY_ID: options.awsAccessKeyId,
          AWS_SECRET_ACCESS_KEY: options.awsSecretAccessKey,
        },
      });
      Deno.exit(1);
    }

    const configRaw = getStdoutStr;

    let configJson;
    try {
      const parsedJson = JSON.parse(configRaw);
      configJson = configSchema.parse(parsedJson);
    } catch (error) {
      console.error(
        "Error parsing config JSON or schema validation failed:",
        error,
      );
      Deno.exit(1);
    }

    const totalConfigs = Object.keys(configJson).length;
    let count = 0;
    for (const [key, item] of Object.entries(configJson)) {
      count++;
      const value = item.value;
      const isSecret = item.secret;

      // Strip project name prefix and colon from key
      const strippedKey = key.includes(":")
        ? key.split(":").slice(1).join(":")
        : key;

      console.log(`${count}/${totalConfigs} ${strippedKey}`);

      const flag = isSecret ? "--secret" : "--plaintext";
      const setCmdArgs = [
        "config",
        "set",
        "--stack",
        options.stackTo,
        strippedKey,
        flag,
        "-v",
        "10",
      ];

      const cmd = new Deno.Command("pulumi", {
        env: {
          PULUMI_CONFIG_PASSPHRASE: options.secretTo,
          PULUMI_BACKEND_URL: options.pulumiBackendUrl,
          AWS_ACCESS_KEY_ID: options.awsAccessKeyId,
          AWS_SECRET_ACCESS_KEY: options.awsSecretAccessKey,
        },
        args: setCmdArgs,
        cwd: options.pathTo,
        stdout: "piped",
        stderr: "piped",
        stdin: "piped",
      });

      const child = cmd.spawn();
      const writer = child.stdin.getWriter();
      await writer.write(encoder.encode(String(value)));
      await writer.close();

      const { code, stdout, stderr } = await child.output();
      const stderrStr = decoder.decode(stderr).trim();

      if (code !== 0) {
        const fullCommandString = `pulumi ${setCmdArgs.join(" ")}`;
        console.error(
          `Command failed with exit code ${code}: ${fullCommandString}: ${stderrStr}`,
        );
        Deno.exit(1);
      }
    }
  });

command.parse(Deno.args);
