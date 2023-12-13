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
