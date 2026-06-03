// plugins/sdk.ts

export interface PluginConfig {
  name: string;
  enabled: boolean;
  [key: string]: unknown;
}

export interface Plugin {
  name(): string;
  start(config: PluginConfig): Promise<void>;
  stop(): Promise<void>;
}

export interface CommandMapper {
  mapToCommand(platformMsg: string): { command: string; args: string[] } | null;
}

export interface ResponseFormatter {
  format(output: string, error: string | null): string[];
}
