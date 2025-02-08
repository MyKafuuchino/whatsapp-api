import chalk from "chalk";

const log = {
  info: (message: string) => {
    console.log(chalk.blue(`[INFO] ${new Date().toISOString()} - ${message}`));
  },
  success: (message: string) => {
    console.log(chalk.green(`[SUCCESS] ${new Date().toISOString()} - ${message}`));
  },
  warning: (message: string) => {
    console.warn(chalk.yellow(`[WARNING] ${new Date().toISOString()} - ${message}`));
  },
  error: (message: string, error?: unknown) => {
    console.error(
        chalk.red(`[ERROR] ${new Date().toISOString()} - ${message}`),
        error ? `\n${chalk.red(error)}` : ''
    );
  },
}
export default log;
