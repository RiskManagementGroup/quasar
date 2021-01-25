import setCssVar from './utils/set-css-var.js'
import { noop } from './utils/event.js'
import { onKeyDownComposition } from './utils/private/key-composition.js'
import { isRuntimeSsrPreHydration, client, iosCorrection } from './plugins/Platform.js'

function getMobilePlatform (is) {
  if (is.ios === true) return 'ios'
  if (is.android === true) return 'android'
}

function getBodyClasses ({ is, has, within }, cfg) {
  const cls = [
    is.desktop === true ? 'desktop' : 'mobile',
    `${ has.touch === false ? 'no-' : '' }touch`
  ]

  if (is.mobile === true) {
    const mobile = getMobilePlatform(is)
    mobile !== void 0 && cls.push('platform-' + mobile)
  }

  if (is.nativeMobile === true) {
    const type = is.nativeMobileWrapper

    cls.push(type)
    cls.push('native-mobile')

    if (
      is.ios === true
      && (cfg[ type ] === void 0 || cfg[ type ].iosStatusBarPadding !== false)
    ) {
      cls.push('q-ios-padding')
    }
  }
  else if (is.electron === true) {
    cls.push('electron')
  }
  else if (is.bex === true) {
    cls.push('bex')
  }

  within.iframe === true && cls.push('within-iframe')

  return cls
}

function applyClientSsrCorrections () {
  const classes = document.body.className
  let newCls = classes

  if (iosCorrection !== void 0) {
    newCls = newCls.replace('desktop', 'platform-ios mobile')
  }

  if (client.has.touch === true) {
    newCls = newCls.replace('no-touch', 'touch')
  }

  if (client.within.iframe === true) {
    newCls += ' within-iframe'
  }

  if (classes !== newCls) {
    document.body.className = newCls
  }
}

function setColors (brand) {
  for (const color in brand) {
    setCssVar(color, brand[ color ])
  }
}

export default {
  install (opts) {
    if (__QUASAR_SSR_SERVER__) {
      const { cfg, $q, ssrContext } = opts
      const cls = getBodyClasses($q.platform, cfg)

      if (cfg.screen !== void 0 && cfg.screen.bodyClass === true) {
        cls.push('screen--xs')
      }

      ssrContext._meta.bodyClasses += cls.join(' ')
      return
    }

    const { cfg } = opts

    if (isRuntimeSsrPreHydration === true) {
      applyClientSsrCorrections()
    }
    else {
      const cls = getBodyClasses(client, cfg)
      document.body.classList.add.apply(document.body.classList, cls)
    }

    cfg.brand !== void 0 && setColors(cfg.brand)

    if (client.is.ios === true) {
      // needed for iOS button active state
      document.body.addEventListener('touchstart', noop)
    }

    window.addEventListener('keydown', onKeyDownComposition, true)
  }
}
