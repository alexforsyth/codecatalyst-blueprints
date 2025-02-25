import * as fs from 'fs';
import * as pathing from 'path';
import * as glob from 'glob';
import * as Mustache from 'mustache';

const STATIC_ASSET_DIRECTORY = 'static-assets';

/**
 * Helper that makes working with static assets easier.
 */
export class StaticAsset {
  static findAll<T extends StaticAsset>(this: new (path: string) => T, globPath?: string, globOptions?: any): T[] {
    return glob
      .sync(pathing.join(globPath ?? '**/*'), {
        cwd: STATIC_ASSET_DIRECTORY,
        nodir: true,
        dot: true,
        ...globOptions,
      })
      .map(path => new this(path));
  }

  private content_: Buffer;
  private location: string;

  constructor(public path_: string) {
    this.content_ = fs.readFileSync(pathing.join(STATIC_ASSET_DIRECTORY, path_));
    this.location = path_;
  }

  /**
   * path relative to the static-assets folder
   * @returns path/inside/static-assets.txt
   */
  path(): string {
    return this.location;
  }
  content(): Buffer {
    return this.content_;
  }
  toString(): string {
    return this.content().toString();
  }
}

/**
 * Asset that can perform a mustache subsitution on the content.
 */
export class SubstitionAsset extends StaticAsset {
  constructor(path: string) {
    super(path);
  }

  /**
   * @deprecated
   * @param subsitution
   * @returns
   */
  subsitite(subsitution: any): string {
    return this.substitute(subsitution);
  }

  /**
   * Use Mustache subsitution across this asset.
   * @param subsitution
   * @returns
   */
  substitute(subsitution: any): string {
    return Mustache.render(this.content().toString(), subsitution);
  }
}
