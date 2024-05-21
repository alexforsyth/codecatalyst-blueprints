// import * as cp from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import path from 'path';
// import { Environment } from '@amazon-codecatalyst/blueprint-component.environments';
// import { SourceRepository } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import { KVSchema, OptionsSchemaDefinition, Blueprint as ParentBlueprint, Options as ParentOptions } from '@amazon-codecatalyst/blueprints.blueprint';
// eslint-disable-next-line import/no-extraneous-dependencies
import defaults from './defaults.json';

export interface Options extends ParentOptions {
  clone: {
    location: string;
    password?: string;
  };

  elements?: {
    /**
     * @readOnly
     */
    environments?: OptionsSchemaDefinition<'environments', KVSchema>;

    secrets?: OptionsSchemaDefinition<'secrets', KVSchema>;
  };
}

// const FETCH_TIMEOUT = 30_000;

/**
 * This is the actual blueprint class.
 * 1. This MUST be the only 'class' exported, as 'Blueprint'
 * 2. This Blueprint should extend another ParentBlueprint
 */
export class Blueprint extends ParentBlueprint {
  private readonly state: {
    options: Options;
  };

  constructor(options_: Options) {
    super(options_);
    console.log(defaults);
    // helpful typecheck for defaults
    const typeCheck: Options = {
      outdir: this.outdir,
      ...defaults,
    };

    const options = Object.assign(typeCheck, options_);

    this.state = {
      options,
    };
  }

  override synth(): void {
    const durablePathToBundle = path.join(this.context.durableStoragePath, 'input-bundle', makeHash(this.state.options.clone.location));

    if (!fs.existsSync(durablePathToBundle)) {
      // dont do some stuff
    }
    super.synth();
  }
}

/**
 * Generates a seeded entropy string of a max 5 length
 * @param length number: max 10
 * @returns string
 */
const makeHash = (str: string, length: number = 5) => {
  return crypto
    .createHash('sha256')
    .update(str)
    .digest('hex')
    .slice(2, 2 + (length || 5));
};
