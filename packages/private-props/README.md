# private-props

The traditional use of the 'private' keyword in TypeScript is no longer necessary, as JavaScript supports private properties ([#privateProps](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties)) natively. This tool is developed to save you hours of manual refactoring work, ensuring your codebase is up-to-date with the latest JavaScript standards.

## Features

- Automatic Refactoring  
  Effortlessly convert TypeScript 'private' properties to native JavaScript private properties + remove 'public' keywords.
- Code Optimization  
  Enhance your code's readability and performance by utilizing JavaScript's native features.
- Safe Refactoring  
  Designed to retain the original logic, functionality and formatting of your code while implementing the latest JavaScript syntax.
- Easy to use  
  Specify your target folder and run the script. It finds all your ts files (also in subfolders) and refactors all the classes.

## Getting Started

1.  Install it  
    `npm i @jsboost/private-props`
2.  Run it
    `node node_modules/@jsboost/private-props {TARGET_FOLDER}`
3.  Enjoy

## Example

```
> node node_modules/@jsboost/private-props sample-folder

Processing file: sample-folder/sample-file.ts
- Renaming 'private privateProperty' to '#privateProperty'
- Renaming 'public publicProperty' to 'publicProperty'
- Renaming 'private privateMethod' to '#privateMethod'
- Renaming 'public publicMethod' to 'publicMethod'
```

### Before

```ts
class SampleClass {
  private privateProperty = 1;
  public publicProperty = 2;

  constructor() {
    this.privateMethod();
    this.publicMethod();
  }

  private privateMethod() {
    console.log('private method', this.privateMethod);
  }

  public publicMethod() {
    console.log('public method', this.publicMethod);
  }
}
```

### After

```ts
class SampleClass {
  #privateProperty = 1;
  publicProperty = 2;

  constructor() {
    this.#privateMethod();
    this.publicMethod();
  }

  #privateMethod() {
    console.log('private method', this.#privateMethod);
  }

  publicMethod() {
    console.log('public method', this.publicMethod);
  }
}
```

## Contributing

We welcome contributions from the community! Whether you're fixing bugs, improving the documentation, or adding new features, your help is appreciated.

## Support and Feedback

If you encounter any issues or have suggestions for improvement, please file an issue on our GitHub repository. Your feedback is invaluable in making this tool better for everyone.

## License

This project is licensed under [specify license type]. Feel free to use, modify, and distribute the code as per the license agreement.
