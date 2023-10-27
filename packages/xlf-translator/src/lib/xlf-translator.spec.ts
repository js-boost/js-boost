import * as fs from 'fs';
import * as util from 'util';
import { Locale, XlfTranslator } from './xlf-translator';

describe('translateXlf', () => {
  it('locale file should be created', async () => {
    const localeFile = {
      locale: 'de-DE' as Locale,
      filePath: 'packages/xlf-translator/src/lib/test.de.xlf',
    };

    const translator = new XlfTranslator(
      'packages/xlf-translator/src/lib/test.xlf',
      [localeFile],
      () => Promise.resolve('Translation Result Sample')
    );
    const fileString = await translator
      .start()
      .then(() => util.promisify(fs.readFile)(localeFile.filePath, 'utf-8'));

    expect(fileString).toContain('Translation Result Sample');
  });
});
