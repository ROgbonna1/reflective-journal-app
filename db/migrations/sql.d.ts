// Lets TypeScript see `import x from './*.sql'` as a string. The actual
// inlining happens at build time via babel-plugin-inline-import.
declare module '*.sql' {
  const content: string;
  export default content;
}
