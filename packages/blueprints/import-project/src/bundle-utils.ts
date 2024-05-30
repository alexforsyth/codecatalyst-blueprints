import * as fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';

export async function writeAsFile(presignedUrl: string, location: string) {
  const response = await fetch(presignedUrl);
  const writeStream = fs.createWriteStream(location);
  const reader = response.body?.getReader();

  while (true && reader) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    await new Promise<void>((resolve, reject) => {
      writeStream.write(value, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  await new Promise<void>((resolve, reject) => {
    writeStream.end(err => {
      if (err) {
        reject(err);
      } else {
        console.log('File written successfully!');
        resolve();
      }
    });
  });
}

export async function unpackBundle(
  archiveLocation: string,
  _options?: {
    password?: string;
  },
) {
  console.log('Unpacking: ' + archiveLocation);
  const directory = await unzipper.Open.file(archiveLocation);
  const baseDir = path.dirname(archiveLocation);
  for (const file of directory.files) {
    const newDirpath = path.join(baseDir, path.dirname(file.path));
    if (file.type == 'Directory') {
      continue;
    }
    if (!fs.existsSync(newDirpath)) {
      fs.mkdirSync(newDirpath, { recursive: true });
    }
    console.log('Writing: ' + file.path);
    const writeStream = fs.createWriteStream(path.join(baseDir, file.path));
    await new Promise((resolve, reject) => {
      file.stream(_options?.password).pipe(writeStream).on('finish', resolve).on('error', reject);
    });
  }
}
