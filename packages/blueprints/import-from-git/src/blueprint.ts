import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { MergeStrategies, Blueprint as ParentBlueprint, Options as ParentOptions } from '@amazon-codecatalyst/blueprints.blueprint';
import defaults from './defaults.json';
import { BlueprintOwnershipFile, SourceRepository } from '@amazon-codecatalyst/blueprint-component.source-repositories';

/**
 * This is the 'Options' interface. The 'Options' interface is interpreted by the wizard to dynamically generate a selection UI.
 * 1. It MUST be called 'Options' in order to be interpreted by the wizard
 * 2. This is how you control the fields that show up on a wizard selection panel. Keeping this small leads to a better user experience.
 * 3. You can use JSDOCs and annotations such as: '?', @advanced, @hidden, @display - textarea, etc. to control how the wizard displays certain fields.
 * 4. All required members of 'Options' must be defined in 'defaults.json' to synth your blueprint locally
 * 5. The 'Options' member values defined in 'defaults.json' will be used to populate the wizard selection panel with default values
 */
export interface Options extends ParentOptions {
  /**
   * This executes git clone with the provided git url. This works on repositories up to 200mb in size.
   * <br>
   * Using private repos: https://\<username\>:\<password\>@github.com/username/repository.git
   * @placeholder https://<username>:<password>@github.com/username/repository.git
   * @displayName Repository Git Url
   * @validationRegex .*
   */
  gitUrl: string;

  /**
   * @collapsed true
   */
  advanced: {
    /**
     * If this is enabled, clone runs with --depth 1 to limit the size of git objects.
     * This is recommended to reduce overall repository size and source provider stability.
     */
    limitHistory: boolean;
  };
}

/**
 * This is the actual blueprint class.
 * 1. This MUST be the only 'class' exported, as 'Blueprint'
 * 2. This Blueprint should extend another ParentBlueprint
 */
export class Blueprint extends ParentBlueprint {
  constructor(options_: Options) {
    super({
      outdir: options_.outdir,
    });

    // helpful typecheck for defaults
    const typeCheck: Options = {
      outdir: this.outdir,
      ...defaults,
    };
    const options = Object.assign(typeCheck, options_);

    const sourceRepo = new SourceRepository(this, {
      title: 'my-repo',
    });
    sourceRepo.setResynthStrategies([
      {
        identifier: 'dont-override-sample-code',
        description: 'This strategy is applied accross all sample code. The blueprint will create sample code, but skip attempting to update it.',
        strategy: MergeStrategies.neverUpdate,
        globs: [
          '**/src/**',
          '**/css/**',
        ],
      },
    ]);

    new BlueprintOwnershipFile(sourceRepo, {
      resynthesis: {
        strategies: [
          {
            identifier: 'dont-override-sample-code',
            description: 'This strategy is applied accross all sample code. The blueprint will create sample code, but skip attempting to update it.',
            strategy: MergeStrategies.neverUpdate,
            globs: [
              '**/src/**',
              '**/css/**',
            ],
          },
        ],
      },
    });

    if (options.gitUrl) {
      const outputLocation = path.join(this.outdir, 'src');
      fs.mkdirSync(outputLocation, { recursive: true });
      let depth: string[] = [];
      if (options.advanced.limitHistory) {
        depth = ['--depth', '1'];
      }
      cp.spawnSync('git', ['clone', ...depth, options.gitUrl], {
        cwd: outputLocation,
      });
    }
  }
}
