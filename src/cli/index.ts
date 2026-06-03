import { Command, Option } from 'commander';
import { createRequire } from 'module';
import { initCommand } from '../commands/init.js';
import { statusCommand } from '../commands/status.js';
import { doctorCommand } from '../commands/doctor.js';
import { updateCommand } from '../commands/update.js';
import { pluginListCommand, pluginRegisterCommand } from '../commands/plugin.js';

const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

const program = new Command();

program
  .name('comet')
  .description('OpenSpec + Superpowers dual-star development workflow')
  .version(version);

program
  .command('init [path]')
  .description('Initialize Comet workflow in your project')
  .option('--yes', 'Auto-install missing components, skip existing')
  .option('--skip-existing', 'Never overwrite existing components')
  .option('--overwrite', 'Overwrite manifest-managed files')
  .option('--json', 'Output as JSON')
  .addOption(new Option('--scope <scope>', 'Install scope').choices(['global', 'project']))
  .action(async (targetPath = '.', options) => {
    try {
      await initCommand(targetPath, options);
    } catch (error) {
      if (error instanceof Error && error.name === 'ExitPromptError') {
        console.log('\n  Cancelled.\n');
        process.exit(0);
      }
      throw error;
    }
  });

program
  .command('status [path]')
  .description('Show active changes and workflow status')
  .option('--json', 'Output as JSON')
  .action(async (targetPath = '.', options) => {
    await statusCommand(targetPath, options);
  });

program
  .command('doctor [path]')
  .description('Diagnose Comet installation health')
  .option('--json', 'Output as JSON')
  .addOption(
    new Option('--scope <scope>', 'Install scope to diagnose').choices([
      'auto',
      'global',
      'project',
    ]),
  )
  .action(async (targetPath = '.', options) => {
    await doctorCommand(targetPath, options);
  });

program
  .command('update [path]')
  .description('Update comet skill files to latest version')
  .option('--json', 'Output as JSON')
  .addOption(new Option('--language <lang>', 'Language for skills').choices(['en', 'zh']))
  .addOption(new Option('--scope <scope>', 'Install scope').choices(['global', 'project']))
  .addOption(new Option('--skip-npm', 'Skip npm package self-update').hideHelp())
  .action(async (targetPath = '.', options) => {
    await updateCommand(targetPath, options);
  });

program
  .command('plugin')
  .description('Manage plugins')
  .addCommand(
    new Command('list')
      .description('List registered plugins')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        await pluginListCommand('.', options);
      }),
  )
  .addCommand(
    new Command('register')
      .description('Register a plugin')
      .argument('<name>', 'Plugin name (directory under plugins/)')
      .option('--json', 'Output as JSON')
      .action(async (name, options) => {
        await pluginRegisterCommand('.', name, options);
      }),
  );

program.parse();
