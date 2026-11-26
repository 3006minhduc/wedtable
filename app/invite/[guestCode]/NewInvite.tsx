"use client"

// Renders one of the 2026-11-26 templates: its opening over the page, then the page itself.
import { useState } from "react"
import { caps, display, hand, pinyon, script, serif, sans, smallcaps } from "./fonts"
import { EMBOSS_CSS, useInviteCore, useLockScroll } from "./kit"
import type { InviteInput } from "./kit"
import { StainedIntro, StainedPage } from "./Stained"
import { SatinIntro, SatinPage } from "./Satin"
import { VioletIntro, VioletPage } from "./Violet"

export const NEW_LOOKS = ["stained", "satin", "violet"] as const
const SCENES: Record<string, { Intro: typeof StainedIntro; Page: typeof StainedPage }> = {
  stained: { Intro: StainedIntro, Page: StainedPage },
  satin: { Intro: SatinIntro, Page: SatinPage },
  violet: { Intro: VioletIntro, Page: VioletPage },
}

export default function NewInvite(props: InviteInput & { look: string; skipIntro?: boolean }) {
  const core = useInviteCore(props)
  const L = SCENES[props.look] ?? SCENES.stained
  const [opened, setOpened] = useState(!!props.skipIntro)
  const [revealed, setRevealed] = useState(!!props.skipIntro)
  useLockScroll(!opened)
  const fonts = `${serif.variable} ${sans.variable} ${script.variable} ${caps.variable} ${display.variable} ${pinyon.variable} ${smallcaps.variable} ${hand.variable}`
  const done = () => {
    setRevealed(true)
    setOpened(true)
  }
  return (
    <div className={fonts + " em-root"}>
      <style>{EMBOSS_CSS}</style>
      {!opened && <L.Intro core={core} onOpened={done} onReveal={() => setRevealed(true)} />}
      <L.Page core={core} opened={revealed} />
    </div>
  )
}
