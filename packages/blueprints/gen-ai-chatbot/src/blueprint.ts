import { EnvironmentDefinition, AccountConnection, Role, Environment } from '@amazon-codecatalyst/blueprint-component.environments';
import { SourceRepository, SourceFile, SubstitionAsset } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import { Workflow } from '@amazon-codecatalyst/blueprint-component.workflows';
import {
  BlueprintSynthesisErrorTypes,
  Blueprint as ParentBlueprint,
  Options as ParentOptions,
  Region,
} from '@amazon-codecatalyst/blueprints.blueprint';
import ipaddr from 'ipaddr.js';
import defaults from './defaults.json';
import { getDeploymentWorkflow } from './workflows';

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
   * This is the environment associated with your main Git branch.
   * @displayName Environment
   */
  environment: EnvironmentDefinition<{
    /**
     * @displayName AWS account
     */
    connection: AccountConnection<{
      /**
       * This is the role that will be used to deploy the application. It should have access to deploy all of your resources. See the Readme for more information.
       * @displayName Deploy role
       * @inlinePolicy ./inline-policy-deploy.json
       * @trustPolicy ./trust-policy.json
       */
      deployRole: Role<['codecatalyst*']>;
    }>;
  }>;

  /**
   * @displayName Additional configuraiton options
   * @collapsed true
   */
  code: {
    /**
     * @displayName Deployment region
     */
    region: Region<['*']>;

    /**
     * AWS Regions for this blueprint are limited to the Regions where Amazon Bedrock is available.
     * @displayName Bedrock region
     */
    bedrockRegion: Region<['us-east-1', 'us-west-2']>;

    /**
     * What do you want to name the CloudFormation stack?
     * @validationRegex /^[a-zA-Z0-9-]+$/
     * @validationMessage Must contain only upper and lowercase letters, numbers and underscores
     * @defaultEntropy 8
     * @displayName AWS CloudFormation stack name
     */
    stackName: string;

    /**
     * What do you want to name the S3 bucket where frontend assets will be stored?
     * @validationRegex /^[a-z0-9\-]{1,128}$/
     * @validationMessage Must contain only lowercase letters, numbers and hyphens (-)
     * @defaultEntropy 8
     * @displayName Amazon S3 Bucket name
     */
    bucketNamePrefix: string;

    /**
     * What should happen to the S3 bucket if you delete this CloudFormation stack?
     * @displayName S3 Bucket removal policy
     */
    bucketRemovalPolicy: 'Destroy' | 'Retain';

    /**
     * Select your Lambda development language
     * @displayName Runtime language
     * @hidden true
     */
    runtime: 'Python';

    /**
     * The name of the repository.
     * @displayName Repository name
     * @validationRegex /^[a-zA-Z0-9\-]{1,128}$/
     * @validationMessage Must contain only alphanumeric characters, hyphens (-)
     */
    repositoryName: string;

    /**
     * Allowed IPv4 address range. All addresses must be specified using Classless Inter-Domain Routing (CIDR) notation.
     * @displayName Allowed IPv4 addresses
     * @validationRegex /^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))$/
     * @validationMessage Must be a valid IPv4 address in CIDR notation
     */
    allowedIpV4AddressRanges?: string[];

    /**
     * Allowed IPv6 address range. All addresses must be specified using Classless Inter-Domain Routing (CIDR) notation.
     * @displayName Allowed IPv6 addresses
     * @validationRegex /^s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:)))(%.+)?s*(\/([0-9]|[1-9][0-9]|1[0-1][0-9]|12[0-8]))$/
     * @validationMessage Must be a valid IPv6 address in CIDR notation
     */
    allowedIpV6AddressRanges?: string[];

    /**
     * Allow unauthenticated users to self-register their own accounts.
     * @displayName Self registration
     */
    enableSelfRegistration: 'Enabled' | 'Disabled';

    /**
     * Enables user usage analysis via an admin console.
     * @displayName Usage Analysis
     */
    enableUsageAnalysis: 'Enabled' | 'Disabled';
  };
}

export class Blueprint extends ParentBlueprint {
  constructor(options_: Options) {
    super(options_);
    console.log(defaults);
    // helpful typecheck for defaults
    const typeCheck: Options = {
      outdir: this.outdir,
      ...defaults,
      // typescript needs some help disambiguating enums
      code: defaults.code as Options['code'],
    };
    const options = Object.assign(typeCheck, options_);
    console.log(options);

    this.validateOptions(options);

    // add a repository
    const repository = new SourceRepository(this, {
      title: options.code.repositoryName,
    });

    this.seedRepository(repository, options);

    const cdkContext = new SubstitionAsset('chatbot-genai-cdk/cdk.json');
    new SourceFile(
      repository,
      'cdk.json',
      cdkContext.substitute({
        allowedIpV4AddressRanges: this.toCsv(options.code.allowedIpV4AddressRanges),
        allowedIpV6AddressRanges: this.toCsv(options.code.allowedIpV6AddressRanges),
        region: options.code.region,
        bedrockRegion: options.code.bedrockRegion,
        stackName: options.code.stackName,
        bucketRemovalPolicy: options.code.bucketRemovalPolicy.toUpperCase(),
        bucketNamePrefix: options.code.bucketNamePrefix,
        enableSelfRegistration: options.code.enableSelfRegistration === 'Enabled',
        enableUsageAnalysis: options.code.enableUsageAnalysis === 'Enabled',
      }),
    );

    const environment = new Environment(this, options.environment);
    const workflowBuilder = getDeploymentWorkflow(this, options, environment);

    // write a workflow to my repository
    new Workflow(this, repository, workflowBuilder.getDefinition());
  }

  private seedRepository(repository: SourceRepository, options: Options) {
    repository.copyStaticFiles({
      from: 'chatbot-genai-cdk',
    });
    repository.copyStaticFiles({
      from: 'chatbot-genai',
    });
    repository.copyStaticFiles({
      from: 'docs',
      to: 'docs',
    });
    repository.copyStaticFiles({
      from: 'chatbot-genai-components/frontend',
      to: 'frontend',
    });
    if (options.code.runtime === 'Python') {
      repository.copyStaticFiles({
        from: 'chatbot-genai-components/backend/python',
        to: 'backend',
      });
    }
  }

  private toCsv(values?: string[]) {
    return (values ?? []).map((value, i, row) => {
      if (i + 1 === row.length) {
        return { value };
      }
      return { value, comma: true };
    });
  }

  private validateOptions(options: Options) {
    options.code.allowedIpV4AddressRanges?.forEach(address => {
      try {
        const addr = ipaddr.IPv4.parseCIDR(address);
        if (addr[1] === 0) {
          this.throwSynthesisError({
            name: BlueprintSynthesisErrorTypes.ValidationError,
            message: 'The /0 CIDR range is not supported by AWS WAF.',
          });
        }
      } catch (err: unknown) {
        console.error(err);
        this.throwSynthesisError({
          name: BlueprintSynthesisErrorTypes.ValidationError,
          message: `${address} is not a valid IPv4 address.`,
        });
      }
    });

    options.code.allowedIpV6AddressRanges?.forEach(address => {
      try {
        const addr = ipaddr.IPv6.parseCIDR(address);
        if (addr[1] === 0) {
          this.throwSynthesisError({
            name: BlueprintSynthesisErrorTypes.ValidationError,
            message: 'The /0 CIDR range is not supported by AWS WAF.',
          });
        }
      } catch (err: unknown) {
        console.error(err);
        this.throwSynthesisError({
          name: BlueprintSynthesisErrorTypes.ValidationError,
          message: `${address} is not a valid IPv6 address.`,
        });
      }
    });
  }
}
