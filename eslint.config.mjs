import nextVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextVitals,
  {
    ignores: [
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      '.next/**',
      'app/Docs_dont_track/**',
      'components/ui/**',
    ],
  },
  {
    rules: {
      '@next/next/no-img-element': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];

export default config;
