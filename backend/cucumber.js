module.exports = {
  default: {
    requireModule: ["ts-node/register"],
    require: ["features/step_definitions/**/*.ts", "features/support/**/*.ts"],
    format: ["progress-bar"],
    paths: ["features/**/*.feature"],
  },
};
