const fs = require('fs-extra');
const path = require('path');
require('cfn-lint');
const ora = require('ora');
require('../src/aws-utils/aws-s3');
const providerName = require('./constants').ProviderName;

const { prePushGraphQLCodegen } = require('./graphql-codegen');
const { prePushAuthTransform } = require('./auth-transform');
const { transformGraphQLSchema } = require('./transform-graphql-schema');

require('../src/utils/archiver');
const pushResources = require('./push-resources');
const yaml = require('js-yaml');

const util = require('util');
util.promisify(require('child_process').exec);

const spinner = ora('Updating resources in the cloud. This may take a few minutes...');
const nestedStackFileName = 'nested-cloudformation-stack.yaml';

async function run(context, resourceDefinition) {
  try {
    const { resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeDeleted } = resourceDefinition;

    const resources = resourcesToBeCreated.concat(resourcesToBeUpdated);
    context.print.info('Validating CloudFormation Templates');

    await pushResources.validateCfnTemplates(context, resources);
    await pushResources.packageResources(context, resources);

    await transformGraphQLSchema(context, {
      handleMigration: opts => pushResources.updateStackForAPIMigration(context, 'api', undefined, opts),
    });

    // await uploadAppSyncFiles(context, resources, allResources);
    await prePushAuthTransform(context, resources);

    await prePushGraphQLCodegen(context, resourcesToBeCreated, resourcesToBeUpdated);
    await updateS3Templates(context, resources);
    const projectDetails = context.amplify.getProjectDetails();

    // Generate CFN Templates
    const rootStack = pushResources.buildRootStack(context, projectDetails);

    context.print.info('Updating root stack...');

    if (resources.length > 0 || resourcesToBeDeleted.length > 0) {
      await updateCloudFormationNestedStack(context, rootStack);
    }
  } catch (err) {
    console.log(err.stack);
    console.log(err.message);
    spinner.fail('An error occurred when pushing the resources to the cloud');
    process.exitCode = 1;
    throw err;
  }
}

async function updateCloudFormationNestedStack(context, nestedStack) {
  context.print.info(`Updating CloudFormation Nested Stack...`);
  const backEndDir = context.amplify.pathManager.getBackendDirPath();
  const nestedStackFilepath = path.normalize(path.join(backEndDir, providerName, nestedStackFileName));

  const jsonString = yaml.safeDump(nestedStack);
  console.log(`Writing YAML for Nested Stack: ${nestedStackFilepath}`);
  context.filesystem.write(nestedStackFilepath, jsonString);
}

function updateS3Templates(context, resourcesToBeUpdated) {
  const promises = [];

  context.print.info('Updating S3 Templates...');
  for (let i = 0; i < resourcesToBeUpdated.length; i += 1) {
    const { category, resourceName } = resourcesToBeUpdated[i];
    const { resourceDir, cfnFiles } = pushResources.getCfnFiles(context, category, resourceName);
    for (let j = 0; j < cfnFiles.length; j += 1) {
      const cfnFile = cfnFiles[j];
      const filePath = path.normalize(path.join(resourceDir, cfnFile));

      if (cfnFile.endsWith('.json')) {
        const yamlCfnFile = filePath.replace('.json', '.yaml');
        if (!fs.existsSync(yamlCfnFile)) {
          pushResources.flipJsonToYaml(filePath);
        }
      }
    }
  }

  return Promise.all(promises);
}

module.exports = {
  run,
};
