"use client"

import { useEffect, useReducer } from "react"
import { TitleScreen } from "@/components/underlord/title-screen"
import { Creator } from "@/components/underlord/creator"
import { SpireHub } from "@/components/underlord/spire-hub"
import { Overworld } from "@/components/underlord/overworld"
import { initialState, reducer } from "@/lib/underlord/state"

export function UnderlordGame() {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Boot: hydrate save from localStorage on first mount.
  useEffect(() => {
    dispatch({ type: "boot" })
  }, [])

  if (state.phase === "title" || !state.save) {
    return (
      <TitleScreen
        save={state.save}
        onNew={() => dispatch({ type: "go-creator" })}
        onContinue={() => dispatch({ type: "continue-run" })}
        onWipe={() => dispatch({ type: "wipe-save" })}
      />
    )
  }

  if (state.phase === "creator") {
    return (
      <Creator
        onBack={() => dispatch({ type: "go-title" })}
        onConfirm={(save) => dispatch({ type: "begin-run", save })}
      />
    )
  }

  if (state.phase === "overworld") {
    return (
      <Overworld
        save={state.save}
        selectedRegion={state.selectedRegion}
        onSelect={(id) => dispatch({ type: "select-region", id })}
        onBack={() => dispatch({ type: "back-to-spire" })}
        onRaid={(id) => dispatch({ type: "raid-region", id })}
      />
    )
  }

  // Default: spire hub.
  return (
    <SpireHub
      save={state.save}
      notice={state.notice}
      onClearNotice={() => dispatch({ type: "set-notice", text: null })}
      onOpenOverworld={() => dispatch({ type: "open-overworld" })}
      onOpenStub={(room) =>
        dispatch({
          type: "set-notice",
          text: `${room.name} stands ready, but its rites are not yet inscribed. (Coming next milestone.)`,
        })
      }
    />
  )
}
