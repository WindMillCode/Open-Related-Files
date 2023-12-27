import * as vscode from 'vscode'

import { openRelatedFiles } from './openRelatedFiles'
import { getSettingsJSON, notifyError } from './functions'

export function activate(context: vscode.ExtensionContext) {



  context.subscriptions.push(
    vscode.commands.registerCommand(
      'windmillcode-open-related-files.openRelatedFiles',
      openRelatedFiles,
    ),

  )
}

export function deactivate() {}
