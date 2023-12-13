// Test by running: `npx ts-node tools/refactor/rename-private-vars.ts tools/refactor/test-folder`
import * as fs from 'fs';
import * as path from 'path';
import {
  ClassMemberTypes,
  MethodDeclaration,
  Project,
  PropertyDeclaration,
  RenameableNode,
  SyntaxKind,
} from 'ts-morph';

const targetFolder = process.argv[2];
const filePaths = findTsFiles(targetFolder);

filePaths.forEach((filePath) => {
  processFile(filePath);
});

function processFile(filePath: string) {
  console.log(`\nProcessing file: ${filePath}`);

  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(filePath);

  const classes = sourceFile.getClasses();
  const propsToRename: RenameableNode[] = [];
  classes.forEach((cls) => {
    cls.getMembers().forEach((node: ClassMemberTypes) => {
      if (
        ['PropertyDeclaration', 'MethodDeclaration'].includes(
          node.getKindName()
        )
      ) {
        const declaration = node as PropertyDeclaration | MethodDeclaration;
        const nodeName = declaration.getNameNode();

        // PRIVATE
        if (declaration.hasModifier(SyntaxKind.PrivateKeyword)) {
          console.log(
            `- Renaming 'private ${nodeName.getText()}' to '#${nodeName.getText()}'`
          );
          // propsToRename.push(nodeName as RenameableNode);
          (nodeName as RenameableNode).rename(`#${nodeName.getText()}`);
          declaration.toggleModifier('private', false);
          // PUBLIC
        } else if (declaration.hasModifier(SyntaxKind.PublicKeyword)) {
          console.log(
            `- Renaming 'public ${nodeName.getText()}' to '${nodeName.getText()}'`
          );
          declaration.toggleModifier('public', false);
        }
      }
    });
  });
  sourceFile.saveSync();
}

// Find all .ts files withing the target folder
function findTsFiles(targetFolder: string): string[] {
  const tsFiles: string[] = [];

  function traverseFolder(folderPath: string) {
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        traverseFolder(filePath);
      } else if (path.extname(filePath) === '.ts') {
        tsFiles.push(filePath);
      }
    }
  }

  traverseFolder(targetFolder);

  return tsFiles;
}
