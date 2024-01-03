import * as vscode from 'vscode';
import { OperatingSystem } from './models';
import * as path from 'path'
import * as os from 'os'
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const gitignoreParser = require('gitignore-parser');

import fg = require('fast-glob')




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


export let defaultOptionSetting = {
  get:async ()=>{
    return await getSetting("defaultOption")
  },
  set:async (value)=>{
    await saveSetting("defaultOption",value)
  }
}

export let resetLayoutSetting = {
  get:async ()=>{
    return await getSetting("resetLayout")
  },
  set:async (value)=>{
    await saveSetting("resetLayout",value)
  }
}


export function updateNestedStructure<T>(
  obj: T,
  predicate: (kay:number|string,value: any) => any,
  isArray: boolean = Array.isArray(obj)
): T {
  if (isArray) {
    return (obj as any[]).map((item,index0) =>
      typeof item === 'object' && item !== null
        ? updateNestedStructure(item, predicate, Array.isArray(item))
        : predicate(index0,item)
    ) as unknown as T;
  } else {
    const updatedObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = (obj as any)[key];
        updatedObj[key] = typeof value === 'object' && value !== null
          ? updateNestedStructure(value, predicate, Array.isArray(value))
          : predicate(key,value);
      }
    }
    return updatedObj;
  }
}



