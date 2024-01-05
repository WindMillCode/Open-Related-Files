import * as vscode from 'vscode'

import { editorChangeDisposable, onSettingsChangedDisposable, openRelatedFiles,setDefaultOption,toggleAutoOpen, toggleResetLayout } from './openRelatedFiles'


export  function activate(context: vscode.ExtensionContext) {



  context.subscriptions.push(
    vscode.commands.registerCommand(
      'windmillcode-open-related-files.openRelatedFiles',
      openRelatedFiles,
    ),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'windmillcode-open-related-files.setDefaultOption',
      setDefaultOption,
    ),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'windmillcode-open-related-files.toggleAutoOpen',
      toggleAutoOpen,
    ),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'windmillcode-open-related-files.toggleResetLayout',
      toggleResetLayout,
    ),
  )
}

export function deactivate() {
  editorChangeDisposable.dispose()
  onSettingsChangedDisposable.dispose()
}
