const subcommand = 'gql-compile';

module.exports = {
  name: subcommand,
  run: async context => {
    try {
      const {
        parameters: { options },
      } = context;
      await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', {
        forceCompile: true,
        minify: options['minify'],
      });
    } catch (err) {
      context.print.error(err.toString());
      context.print.error(err.stack);
      process.exitCode = 1;
    }
  },
};
