!macro customInstall

  ; ================================
  ; Remove old Desktop shortcut
  ; ================================
  Delete "$DESKTOP\SubKaraokeAI.lnk"

  ; ================================
  ; Remove old Start Menu shortcut
  ; ================================
  Delete "$SMPROGRAMS\SubKaraokeAI.lnk"

  ; ================================
  ; Create Desktop shortcut
  ; ================================
  CreateShortCut \
    "$DESKTOP\SubKaraokeAI.lnk" \
    "$INSTDIR\${APP_EXECUTABLE_FILENAME}" \
    "" \
    "$INSTDIR\${APP_EXECUTABLE_FILENAME}" \
    0

  ; ================================
  ; Create Start Menu shortcut
  ; ================================
  CreateShortCut \
    "$SMPROGRAMS\SubKaraokeAI.lnk" \
    "$INSTDIR\${APP_EXECUTABLE_FILENAME}" \
    "" \
    "$INSTDIR\${APP_EXECUTABLE_FILENAME}" \
    0

!macroend