import chalk from 'chalk';
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

  async start() {
    try {
      // Step 1: Create termsMap file
      const originalTermsMap = await this.getTermsMap();

      // Step 2: Loop through locales and update translation files
      this.localeFiles.forEach(async ({ locale, filePath }) => {
        const termsMap = new Map(originalTermsMap);

        // Copy-paste file if it doesn't exist
        try {
          await this.fileExists$(filePath, fs.constants.R_OK);
        } catch (error) {
          await this.copyFile$(this.inputXlfFilePath, filePath);
        }

        const xmlJson = await this.getXmlJsonByPath(filePath);
        const transUnits = xmlJson.xliff.file[0].body[0]['trans-unit'];
        const localeTermsMap = new Map(
          transUnits.map((transUnit: any) => [transUnit.$.id, transUnit])
        );

        console.log(`There are ${transUnits.length} terms for ${locale}`);
        let counter = 0;
        const transUnits$ = Array.from(termsMap).map(
          async ([id, transUnit]) => {
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
          }
        );

        xmlJson.xliff.file[0].body[0]['trans-unit'] = await Promise.all(
          transUnits$
        );

        // Convert the JavaScript object back to XML
        this.saveFile(xmlJson, filePath);
      });
    } catch (error) {
      console.error(error);
    }
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
