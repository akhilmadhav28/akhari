import { Component, type ErrorInfo, type ReactNode } from 'react'
import { probeWebGL } from '@/lib/perf/device'
import { FallbackWorkflow } from '@/components/fallback/FallbackWorkflow'

/**
 * Makes 3D failure loud instead of silent.
 *
 * The scene is code-split and mounted inside Suspense, so two things could go
 * wrong and produce *exactly* the same result as everything working — a page
 * with no modules on it:
 *
 *   · the three.js chunk fails to load (offline, blocked, bad cache)
 *   · the browser refuses a WebGL context (acceleration off, driver blocked)
 *
 * Neither threw anything visible. Both now report themselves three ways: to the
 * console, onto `<html data-scene="…">`, and — when the scene actually failed —
 * as a small on-page badge, because a failure nobody can see is the reason this
 * took so long to pin down in the first place.
 *
 * Adding `?debug` to the URL shows the badge unconditionally, including the GPU
 * renderer string. That is the fastest way to find out what a machine you don't
 * have in front of you is actually doing.
 *
 * The page stays fully usable either way — every section reads correctly without
 * the scene behind it, so a visitor whose GPU is disabled gets a plain dark site
 * rather than a broken one.
 */

interface Props {
  children: ReactNode
}

interface State {
  failed: boolean
  reason: string
  renderer: string
  debug: boolean
}

export class SceneBoundary extends Component<Props, State> {
  state: State = { failed: false, reason: '', renderer: '', debug: false }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { failed: true, reason: `scene failed to mount: ${error.message}` }
  }

  componentDidMount(): void {
    const debug =
      typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug')

    const probe = probeWebGL()

    if (!probe.supported) {
      document.documentElement.dataset.scene = 'no-webgl'
      console.error(
        '[akhari] WebGL is unavailable, so the 3D workflow cannot render.\n' +
          'Most often this is graphics acceleration being switched off:\n' +
          '  edge://settings/system  →  "Use graphics acceleration when available"\n' +
          'Check edge://gpu for a blocklisted driver. Open /diag.html for details.',
      )
      this.setState({
        failed: true,
        reason: 'WebGL context refused',
        renderer: probe.renderer,
        debug,
      })
      return
    }

    document.documentElement.dataset.scene = `ok:${probe.powerPreference}`
    this.setState({ renderer: probe.renderer, debug })
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    document.documentElement.dataset.scene = 'error'
    console.error('[akhari] The 3D scene failed to mount.', error, info.componentStack)
  }

  render() {
    const { failed, reason, renderer, debug } = this.state

    const badge =
      failed || debug ? (
        <div
          className="fixed bottom-4 left-4 z-[300] max-w-[22rem] rounded-lg border px-3.5 py-2.5 font-mono text-[0.68rem] leading-relaxed backdrop-blur"
          style={{
            borderColor: failed ? 'rgba(224,128,63,0.5)' : 'rgba(126,156,134,0.4)',
            background: 'rgba(15,12,10,0.92)',
            color: failed ? '#E0803F' : '#7E9C86',
          }}
        >
          <div className="font-semibold">
            {failed ? '3D scene unavailable' : '3D scene running'}
          </div>
          {failed && <div className="mt-1 text-ink-dim">{reason}</div>}
          <div className="mt-1 break-words text-faint">GPU: {renderer || 'unknown'}</div>
        </div>
      ) : null

    return (
      <>
        {/* When WebGL is unavailable the SVG build of the same graph takes over,
            driven by the same scroll store and the same measured anchors. The
            visitor still watches the workflow assemble — flat instead of lit. */}
        {failed ? <FallbackWorkflow /> : this.props.children}
        {badge}
      </>
    )
  }
}
