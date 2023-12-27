import * as vscode from 'vscode';
import { deepCopy } from './functions';

export interface WMLTaskDefinition extends vscode.TaskDefinition {

	task: string;
}
export enum OperatingSystem  {
  AIX = 'AIX',
  MACOS = 'darwin',
  FREEBSD = 'freebsd',
  LINUX = 'linux',
  OPENBSD = 'openbsd',
  SUNOS = 'sunos',
  WINDOWS = 'win32',
};


type InfiniteStringArray = Array<string> | InfiniteStringArray[];

export class WMLOpenRelatedFilesSettingsJSON {
  constructor(params: Partial<WMLOpenRelatedFilesSettingsJSON> = {}) {

    let origParams = Object.entries(params)
      .filter(([key,val]) => {
        return !key.startsWith('param');
      });
    let options = deepCopy(this.options)
    Object.assign(this, { ...Object.fromEntries(origParams) });
    this.options.push(...options)
  }
  excludeGlobs:Array<string> = [
    "**/node_modules/**",
    "**/site-packages/**",
    "**/.git/**"
  ]

  chosenOption:Partial<{
    name:string,
    fileRegexPredicate:string,
    subStringRemovalArray:Array<string>
    setEditorLayout:{
      orientation:0|1,
      groups:Array<{
        groups:WMLOpenRelatedFilesSettingsJSON["chosenOption"]["setEditorLayout"]["groups"],
        size?:number
      }>
    }
    searchPaths:Array<string>
    includeGlobs:InfiniteStringArray
    excludeGlobs:WMLOpenRelatedFilesSettingsJSON["excludeGlobs"]
  }>
  options:Array<WMLOpenRelatedFilesSettingsJSON["chosenOption"]> = [
    {
      "name":"Disable"
    }
  ]
}


