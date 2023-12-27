import * as vscode from 'vscode'

import { editorChangeDisposable, openRelatedFiles,toggleAutoOpen } from './openRelatedFiles'
import { autoOpenSetting, getSettingsJSON, notifyError, notifyMsg } from './functions'

export  function activate(context: vscode.ExtensionContext) {



  context.subscriptions.push(
    vscode.commands.registerCommand(
      'windmillcode-open-related-files.openRelatedFiles',
      openRelatedFiles,
    ),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'windmillcode-open-related-files.autoOpen',
      toggleAutoOpen,
    ),
  )
}

export function deactivate() {
  editorChangeDisposable.dispose()
}
