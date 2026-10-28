// Citadel rules this codebase does not follow, and why. Everything not listed here is enforced as in Citadel.
export const repoOverrides = {
  // Short names are the house style here (S for state, I for icons, e for events, a/b/p/r...).
  // The UI is written with arrow functions and small helpers; converting hundreds would be churn without benefit.
  'func-style': 'off',
  // Icon and state helpers are capitalised functions (I, S) called without `new`.
  'new-cap': 'off',
  // Chained conditionals are used deliberately in view code.
  'no-nested-ternary': 'off',
  // Helpers are declared after the components that use them; hoisting makes this safe.
  'no-use-before-define': 'off',
  '@typescript-eslint/no-use-before-define': 'off',
  // Components take destructured props, which is idiomatic Preact.
  'no-restricted-syntax': 'off',
  // Flags every `await` followed by an assignment to shared state, which is how the app loads data.
  'require-atomic-updates': 'off',
  // `x != null` deliberately covers both null and undefined.
  eqeqeq: ['error', 'always', { null: 'ignore' }],
  // Unary plus is how numbers are read from storage and inputs here.
  'no-implicit-coercion': [
    'error',
    { allow: ['!!', '+'], disallowTemplateShorthand: false },
  ],
  // Global ambient types (globals.d.ts) cannot import, so they reference other files with import().
  '@typescript-eslint/consistent-type-imports': [
    'error',
    {
      prefer: 'type-imports',
      fixStyle: 'separate-type-imports',
      disallowTypeAnnotations: false,
    },
  ],
  // Prettier prints empty blocks as `{}`, which this rule rejects.
  '@stylistic/curly-newline': 'off',
  // Arrow bodies with a ternary are common in view code and read fine.
  '@stylistic/no-confusing-arrow': 'off',
  // `i++` / `||=` / chained assignment are used throughout; rewriting them would not change behaviour.
  'no-plusplus': 'off',
  'no-multi-assign': 'off',
  'logical-assignment-operators': 'off',
  // Private-ish names (_x) and `() => {}` no-ops are intentional.
  'no-underscore-dangle': 'off',
  'no-empty-function': 'off',
  '@typescript-eslint/no-empty-function': 'off',
  'no-continue': 'off',
  'no-bitwise': 'off',
  'no-alert': 'off',
  // A few helpers take 5-7 positional arguments (dialog and diff builders); splitting them is a separate refactor.
  'max-params': 'off',
  'prefer-destructuring': 'off',
  // Merge.tsx holds the many small side-panel and files components; splitting it is a separate refactor.
  'max-lines': 'off',
};
