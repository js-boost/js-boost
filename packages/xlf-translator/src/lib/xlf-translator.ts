import * as chalk from 'chalk';
import * as fs from 'fs';
import * as util from 'util';
import * as xml2js from 'xml2js';

export class XlfTranslator {
  readFile$ = util.promisify(fs.readFile);
  stringToXml$ = util.promisify(xml2js.parseString);
  copyFile$ = util.promisify(fs.copyFile);
  fileExists$ = util.promisify(fs.access);
  writeFile$ = util.promisify(fs.writeFile);

  constructor(
    private inputXlfFilePath: string,
    private localeFiles: LocaleFile[],
    private translate: TranslateFunction
  ) {
    console.log(chalk.green('XlfTranslator starts with the following params:'));
    console.log(`inputXlfFilePath:`, inputXlfFilePath);
    console.log(`localeFiles:`, localeFiles);
  }

  async start(): Promise<void> {
    try {
      // Step 1: Create termsMap file
      const originalTermsMap = await this.getTermsMap();

      // Step 2: Loop through locales and update translation files
      const localeExecutions$ = this.localeFiles.map(
        async ({ locale, filePath }) => {
          const termsMap = new Map(originalTermsMap);

          // Copy-paste file if it doesn't exist
          try {
            await this.fileExists$(filePath, fs.constants.R_OK);
          } catch (error) {
            await this.copyFile$(this.inputXlfFilePath, filePath);
          }

          const xmlJson = await this.getXmlJsonByPath(filePath);
          const transUnits = xmlJson.xliff.file[0].body[0]['trans-unit'];
          console.log(`There are ${transUnits.length} terms for ${locale}`);

          const localeTermsMap = new Map<number, string>(
            transUnits.map((transUnit: any) => [transUnit.$.id, transUnit])
          );
          const newTransUnits$ = this.getNewTransUnits$(
            termsMap,
            localeTermsMap,
            locale
          );

          xmlJson.xliff.file[0].body[0]['trans-unit'] = await Promise.all(
            newTransUnits$
          );

          // Convert the JavaScript object back to XML
          await this.saveFile(xmlJson, filePath);

          return;
        }
      );

      await Promise.all(localeExecutions$);

      return;
    } catch (error) {
      console.error(error);
    }
  }

  private getNewTransUnits$(
    termsMap: Map<number, any>,
    localeTermsMap: Map<number, any>,
    locale: Locale
  ): Promise<any>[] {
    let counter = 0;
    return Array.from(termsMap).map(async ([id, transUnit]) => {
      let newTransUnit: any = localeTermsMap.get(id);

      if (!newTransUnit || !newTransUnit.target) {
        // Do translation
        newTransUnit = transUnit;
        let sourceText = newTransUnit.source[0];
        const translationText = await this.translate(sourceText, locale);
        newTransUnit.target = [translationText];

        console.log(
          chalk.yellow(
            `Translated [${locale}], '${sourceText}' to '${translationText}' | id: ${transUnit.$.id}`
          )
        );
      }

      if (++counter % 50 === 0) {
        console.log(
          `Processed ${chalk.green(`${counter} terms`)} for ${locale}`
        );
      }

      return newTransUnit;
    });
  }

  private async getTermsMap() {
    const xmlJson = await this.getXmlJsonByPath(this.inputXlfFilePath);
    const transUnits = xmlJson.xliff.file[0].body[0]['trans-unit'];
    const termsMap = new Map<number, any>();

    transUnits.forEach((transUnit: any) => {
      termsMap.set(transUnit.$.id, transUnit);
    });

    return termsMap;
  }

  private async getXmlJsonByPath(filePath: string): Promise<any> {
    // Read the XML file
    const xmlString = await this.readFile$(filePath, 'utf8');
    const xmlJson = await this.stringToXml$(xmlString);

    return xmlJson;
  }

  saveFile(xmlJson: any, filePath: string) {
    const builder = new xml2js.Builder();
    const updatedXml = builder.buildObject(xmlJson);

    // Write the updated XML back to the file
    return this.writeFile$(filePath, updatedXml).then((params: any) => {
      console.log(chalk.green(`Successfully updated ${filePath}`));

      return params;
    });
  }
}

export type Locale = `${string}-${string}`;

export type TranslateFunction = (
  sourceText: string,
  targetLocale: string,
  sourceLocale?: string
) => Promise<string>;

export interface LocaleFile {
  locale: Locale;
  filePath: string;
}
