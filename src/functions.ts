import * as vscode from 'vscode';
import { OperatingSystem } from './models';
import * as path from 'path'
import * as os from 'os'
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const gitignoreParser = require('gitignore-parser');

import fg = require('fast-glob')


let _channel: vscode.OutputChannel;
export function getOutputChannel(): vscode.OutputChannel {
	if (!_channel) {
		_channel = vscode.window.createOutputChannel('Windmillcode');
	}
	return _channel;
}

export const notify = (message: any): void => {
  let channel = getOutputChannel();
  try {
    channel.appendLine(JSON.stringify(message,null,2));
  } catch (error) {

    channel.appendLine(message);
  }
};

export const notifyMsg = (message: any): void => {
  notify(message);
};

export const notifyError = (err?: any, msg?: any): void => {
  if (err?.stderr) {
      notify(err.stderr);
  }
  if (err?.stdout) {
      notify(err.stdout);
  }
  if (msg) {
      notify(msg);
  }
};


export function getSettingsJSON(extensionName) {

  let workspaceFolder = vscode.workspace.workspaceFolders[0].uri.toString()
  const settingsPath = path.join(workspaceFolder, '.settings.json');

  if (fs.existsSync(settingsPath)) {
      // Read the content of .settings.json
      const settingsJsonContent = fs.readFileSync(settingsPath, 'utf8');
      const settingsJson = JSON.parse(settingsJsonContent);
      return settingsJson

  }

  // Fall back to other workspace settings
  const workspaceConfig = vscode.workspace.getConfiguration(extensionName);


  console.log('Fallback to other workspace setting:', workspaceConfig);
  return workspaceConfig;
}



export const getActiveDocumentFsPath = (): string | undefined => {
  return vscode.window.activeTextEditor?.document?.uri?.fsPath
}

export const getActiveDocumentUri = (): vscode.Uri | undefined => {
  return vscode.window.activeTextEditor?.document?.uri
}

export const getRootFolderUri = (): vscode.Uri | undefined => {
  if (vscode.workspace.workspaceFolders) {
    const [rootFolder] = vscode.workspace.workspaceFolders
    return rootFolder.uri
  }
}


export function listFilesRecursively(dir, ignoreEntity=[]) {
  let result = [];

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      // Check if the directory should be ignored
      if (!ignoreEntity.some(regex => regex.test(file))) {
        // If it's a directory and not ignored, recursively call the function
        result = result.concat(listFilesRecursively(filePath, ignoreEntity));
      }
    } else {
      // Check if the file should be ignored
      if (!ignoreEntity.some(regex => regex.test(file))) {
        // If it's a file and not ignored, add the file path to the result array
        result.push(filePath);
      }
    }
  });

  return result;
}


export let   deepCopy=(obj)=>{
  return JSON.parse(JSON.stringify(obj));
}


async function  getSetting(key) {
  return await vscode.workspace.getConfiguration().get('windmillcode-open-related-files.'+key);
}

async function saveSetting(key,value) {
  await vscode.workspace.getConfiguration().update('windmillcode-open-related-files.'+key, value);
}

export let autoOpenSetting = {
  get:async ()=>{
    return await getSetting("autoOpen")
  },
  set:async (value)=>{
    await saveSetting("autoOpen",value)
  }
}
