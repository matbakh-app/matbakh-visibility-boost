module.exports = {
  input: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/integrations/**',
    '!src/types/**'
  ],
  options: {
    debug: false,
    removeUnusedKeys: true,
    sort: true,
    lngs: ['de', 'en'],
    ns: [
      'translation',
      'auth',
      'admin',
      'adminPanel',
      'common',
      'cookieConsent',
      'dashboard',
      'features',
      'footer',
      'hero',
      'landing',
      'legal-agb',
      'legal-contact',
      'legal-datenschutz',
      'legal-impressum',
      'legal-imprint',
      'legal-kontakt',
      'legal-nutzung',
      'legal-privacy',
      'legal-terms',
      'legal-usage',
      'nav',
      'navigation',
      'onboarding',
      'packages',
      'pricing',
      'services',
      'trust'
    ],
    defaultLng: 'de',
    defaultNs: 'translation',
    resource: {
      loadPath: 'public/locales/{{lng}}/{{ns}}.json',
      savePath: 'public/locales/{{lng}}/{{ns}}.json',
      jsonIndent: 2
    },
    interpolation: {
      prefix: '{{',
      suffix: '}}'
    },
    func: {
      list: ['t', 'i18next.t', 'i18n.t', 'getTranslation', 'safeT'],
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    trans: {
      component: 'Trans',
      i18nKey: 'i18nKey',
      defaultsKey: 'defaults',
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    keySeparator: '.',
    nsSeparator: ':',
    pluralSeparator: '_',
    contextSeparator: '_',
    keepRemoved: false,
    skipDefaultValues: true
  }
};
