import { Command, Option } from 'commander';
import { createRequire } from 'module';
import { initCommand } from '../commands/init.js';
import { statusCommand } from '../commands/status.js';
import { doctorCommand } from '../commands/doctor.js';
import { updateCommand } from '../commands/update.js';
import {
  pluginListCommand,
  pluginRegisterCommand,
  pluginStartCommand,
  pluginStopCommand,
} from '../commands/plugin.js';
import {
  wechatBindCommand,
  wechatStatusCommand,
  wechatUnbindCommand,
  wechatNotifyCommand,
  wechatPollCommand,
  wechatBindConfirmCommand,
  wechatReplyCommand,
} from '../wechat/cli.js';

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
  )
  .addCommand(
    new Command('start')
      .description('Start a registered plugin')
      .argument('<name>', 'Plugin name')
      .option('--json', 'Output as JSON')
      .action(async (name, options) => {
        await pluginStartCommand(name, options);
      }),
  )
  .addCommand(
    new Command('stop')
      .description('Stop a running plugin')
      .argument('<name>', 'Plugin name')
      .option('--json', 'Output as JSON')
      .action(async (name, options) => {
        await pluginStopCommand(name, options);
      }),
  );

program
  .command('wechat')
  .description('WeChat binding and notifications')
  .addCommand(
    new Command('bind')
      .description('Bind a WeChat user account')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        await wechatBindCommand('.', options);
      }),
  )
  .addCommand(
    new Command('status')
      .description('Show WeChat binding status')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        await wechatStatusCommand('.', options);
      }),
  )
  .addCommand(
    new Command('unbind')
      .description('Unbind the WeChat user account')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        await wechatUnbindCommand('.', options);
      }),
  )
  .addCommand(
    new Command('notify')
      .description('Send a notification to the bound WeChat user')
      .argument('<change-name>', 'Change name')
      .argument('<question>', 'Question text')
      .argument('<options-json>', 'Options as JSON array')
      .option('--json', 'Output as JSON')
      .action(async (changeName, question, optionsJson, opts) => {
        await wechatNotifyCommand('.', changeName, question, optionsJson, opts);
      }),
  )
  .addCommand(
    new Command('poll')
      .description('Check for pending WeChat replies')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        await wechatPollCommand('.', options);
      }),
  )
  .addCommand(
    new Command('bind-confirm')
      .description('Confirm a WeChat binding (internal)')
      .argument('<user-id>', 'WeChat user ID')
      .argument('<nickname>', 'WeChat nickname')
      .argument('<pairing-code>', 'Pairing code')
      .option('--json', 'Output as JSON')
      .action(async (userId, nickname, pairingCode, options) => {
        await wechatBindConfirmCommand('.', userId, nickname, pairingCode, options);
      }),
  )
  .addCommand(
    new Command('reply')
      .description('Record a WeChat reply (internal)')
      .argument('<reply-value>', 'Reply value')
      .option('--json', 'Output as JSON')
      .action(async (replyValue, options) => {
        await wechatReplyCommand('.', replyValue, options);
      }),
  );

program.parse();
