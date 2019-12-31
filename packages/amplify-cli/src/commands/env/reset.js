const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const { getConfirmation } = require('../../extensions/amplify-helpers/delete-project');

module.exports = {
  name: 'remove',
  run: async context => {
    const allEnvs = context.amplify.getEnvDetails();

    const confirmation = await getConfirmation(context);
    if (confirmation.proceed) {
      const spinner = ora('Deleting resources from the cloud. This may take a few minutes...');
      spinner.start();
      const promises = [];

      const rmFile = async filePath => {
        spinner.info(`Removing file ${filePath}`);
        await fs.remove(filePath);
      };
      const rmDir = async dirPath => {
        spinner.info(`Removing directory ${dirPath}`);
        await fs.remove(dirPath);
      };
      const deleteEnv = async envName => {
        spinner.info(`Deleting environment ${envName} from the cloud`);
        await context.amplify.removeEnvFromCloud(context, envName, confirmation.deleteS3);
        spinner.info(`Successfully removed environment ${envName} from the cloud`);
      };
      Object.keys(allEnvs).map(envName => promises.push(deleteEnv(envName)));

      const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
      const awsInfoFilePath = path.join(dotConfigDirPath, 'local-aws-info.json');
      const envInfoFilePath = path.join(dotConfigDirPath, 'local-env-info.json');

      promises.push(rmFile(awsInfoFilePath));
      promises.push(rmFile(envInfoFilePath));
      promises.push(rmFile(context.amplify.pathManager.getProviderInfoFilePath()));
      promises.push(rmDir(context.amplify.pathManager.getCurrentCloudBackendDirPath()));
      promises.push(rmFile(context.amplify.pathManager.getAmplifyMetaFilePath()));

      await Promise.all(promises);
      spinner.succeed('Successfully reset project.');
    }
  },
};
