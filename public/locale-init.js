// Sets the document language before the app renders (stored choice or browser
// language), so assistive technologies never announce the wrong language.
;(function () {
  try {
    var stored = window.localStorage.getItem('rk_locale')
    var browser = (window.navigator.language || '').toLowerCase()
    document.documentElement.lang =
      stored === 'en' || stored === 'es'
        ? stored
        : browser.indexOf('en') === 0
          ? 'en'
          : 'es'
  } catch {
    // Storage blocked: keep the default language from the markup.
  }
})()
