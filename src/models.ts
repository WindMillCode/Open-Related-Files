import * as vscode from 'vscode';
import { deepCopy,  updateNestedStructure } from './functions';


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


export type InfiniteStringArray = Array<string> | InfiniteStringArray[];
export type InfiniteGlobString = Array<{
  filePath:string,
  sections:Array<[number,number,number,number]>
}> | InfiniteGlobString[];



export class ChannelManager {

  constructor(channelName:string = "Windmillcode"){
    this.channel = vscode.window.createOutputChannel(channelName)
  }
  channel:vscode.OutputChannel
  private notify =(message: any): void => {
    try {
      this.channel.appendLine(JSON.stringify(message,null,2));
    } catch (error) {

      this.channel.appendLine(message);
    }
  }
  notifyMsg = (message: any): void => {
    this.notify(message);
  }
  notifyError = (err?: any, msg?: any): void => {
    if (err?.stderr) {
        this.notify(err.stderr);
    }
    if (err?.stdout) {
        this.notify(err.stdout);
    }
    if (msg) {
        this.notify(msg);
    }
  };
}

export class WMLOpenRelatedFilesSettingsJSON {
  constructor(params: Partial<WMLOpenRelatedFilesSettingsJSON> = {}) {

    let origParams = Object.entries(params)
      .filter(([key,val]) => {
        return !key.startsWith('param');
      });
    let options = deepCopy(this.options)
    Object.assign(this, { ...Object.fromEntries(origParams) });
    this.options.push(...options)

    this.options = this.options.map((option)=>{
      option.includeGlobs =  updateNestedStructure(option.includeGlobs,(key:string,val)=>{

        if(typeof(val) === "string" && !["filePath","section"].includes(key)){
          return {
            filePath:val,
            section:[0,0,0,0]
          }
        }
        return val

      })
      return option
    })

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
    includeGlobs:InfiniteGlobString
    excludeGlobs:Array<string>
  }>
  options:Array<WMLOpenRelatedFilesSettingsJSON["chosenOption"]> = [
    {
      "name":"Disable"
    }
  ]
}
