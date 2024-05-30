import { ProjenBlueprint } from '@amazon-codecatalyst/blueprint-util.projen-blueprint';
import { NpmAccess } from 'projen/lib/javascript/node-package';

const project = new ProjenBlueprint({
  authorName: 'Amazon Web Services',
  publishingOrganization: 'blueprints',
  packageName: '@amazon-codecatalyst/blueprints.import-project',
  displayName: 'Import into CodeCatalyst',
  description: 'Imports the provided project resource bundle into CodeCatalyst',
  name: 'import-project',
  defaultReleaseBranch: 'main',
  npmAccess: NpmAccess.PUBLIC,
  projenrcTs: true,
  sampleCode: false,
  github: false,
  eslint: true,
  jest: false,
  npmignoreEnabled: true,
  tsconfig: {
    compilerOptions: {
      lib: ['es2019', 'dom'],
      esModuleInterop: true,
      noImplicitAny: false,
    },
  },
  copyrightOwner: 'blueprints',
  deps: [
    '@amazon-codecatalyst/blueprints.blueprint',
    'projen',
    'unzipper',
    '@amazon-codecatalyst/blueprint-component.workflows',
    '@amazon-codecatalyst/blueprint-component.source-repositories',
    '@amazon-codecatalyst/blueprint-component.environments',
  ],

  devDeps: [
    'ts-node',
    'typescript',
    '@amazon-codecatalyst/blueprint-util.projen-blueprint',
    '@amazon-codecatalyst/blueprint-util.cli',
    '@types/yaml',
  ],
  keywords: ['project-launcher', 'blueprint'],
  homepage: '',
});

project.synth();
