const chalk = require('chalk');
const util = require('util');

const inspect = obj => {
  return util.inspect(obj, { depth: null });
};

module.exports = {
  name: 'get',
  run: async context => {
    const envInfo = context.amplify.getEnvInfo();
    const envName = context.parameters.options.name || envInfo.envName;

    let envFound = false;
    const allEnvs = context.amplify.getEnvDetails();

    if (context.parameters.options.json) {
      if (allEnvs[envName]) {
        context.print.fancy(JSON.stringify(allEnvs[envName], null, 4));
      } else {
        context.print.fancy(JSON.stringify({ error: `No environment found with name: '${envName}'` }, null, 4));
      }
      return;
    }

    Object.keys(allEnvs).forEach(env => {
      if (env === envName) {
        envFound = true;
        context.print.info('');
        context.print.info(chalk.red(env));
        context.print.info('--------------');

        Object.keys(allEnvs[env]).forEach(provider => {
          context.print.info(`Provider: ${provider}`);

          Object.keys(allEnvs[env][provider]).forEach(providerAttr => {
            const element = inspect(allEnvs[env][provider][providerAttr]);
            context.print.info(`${providerAttr}: ${element}`);
          });

          context.print.info('--------------');
          context.print.info('');
        });

        context.print.info('');
      }
    });

    if (!envFound) {
      context.print.error('No environment found with the corresponding name provided');
    }
  },
};
