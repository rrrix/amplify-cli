const configurationManager = require('../../lib/configuration-manager');
const providerName = require('../../lib/constants').ProviderName;
const aws = require('aws-sdk');

async function awsCliS3Sync(context, resourceBuildDir, deploymentRootKey) {
  const { spawnSync } = require('child_process');
  const projectDetails = context.amplify.getProjectDetails();
  const { envName } = context.amplify.getEnvInfo();
  const projectBucket = projectDetails.amplifyMeta.providers
    ? projectDetails.amplifyMeta.providers[providerName].DeploymentBucketName
    : projectDetails.teamProviderInfo[envName][providerName].DeploymentBucketName;

  const configuration = {
    accessKeyId: null,
    secretAccessKey: null,
    sessionToken: null,
    region: null,
    ...(await configurationManager.loadConfiguration(context)),
  };

  const awscliOptions = {
    env: {
      ...process.env,
      AWS_DEFAULT_REGION: configuration.region || process.env.AWS_DEFAULT_REGION || aws.config.region,
      AWS_ACCESS_KEY_ID: configuration.accessKeyId,
      AWS_SECRET_ACCESS_KEY: configuration.secretAccessKey,
      AWS_SESSION_TOKEN: configuration.sessionToken,
    },
  };
  // We're going to use the AWS CLI to copy files, as it's highly optimized for this task
  const awsS3SyncCommand = `aws s3 sync ${resourceBuildDir} s3://${projectBucket}/${deploymentRootKey}/`;

  context.print.info(`Using AWS CLI for S3 transfer: ${awsS3SyncCommand}`);

  const s3target = `s3://${projectBucket}/${deploymentRootKey}/`;
  const s3SyncResult = spawnSync('aws', ['s3', 'sync', resourceBuildDir, s3target], awscliOptions);

  if (s3SyncResult.stdout) {
    context.print.info(s3SyncResult.stdout.toString());
  }
  if (s3SyncResult.stderr) {
    context.print.error(s3SyncResult.stderr.toString());
  }
}

module.exports = {
  awsCliS3Sync,
};
