import * as vscode from 'vscode'
import {  autoOpenSetting, deepCopy, getActiveDocumentUri, getOutputChannel, getRootFolderUri, getSettingsJSON, listFilesRecursively, notifyError, notifyMsg } from './functions'
import path = require('path')
import fg = require('fast-glob')
import { WMLOpenRelatedFilesSettingsJSON } from './models'

let defaultOption:WMLOpenRelatedFilesSettingsJSON["chosenOption"] = null

let currentEditorRelationshipString = ""
let openRelatedFilesLock = false

function trimToGetRelationshipString(fileUri: vscode.Uri,chosenOption: WMLOpenRelatedFilesSettingsJSON["chosenOption"],) {
  let fileName = path.basename(fileUri.path)
  let fileNameBasis = ""
  if (chosenOption.fileRegexPredicate) {
    fileNameBasis = fileName.replace(
      new RegExp(chosenOption.fileRegexPredicate), ''
    )
  }
  else if (chosenOption.subStringRemovalArray) {
    fileNameBasis = chosenOption.subStringRemovalArray
      .reduce((acc, val) => {
        return acc.replace(val, "")
      }, fileName)
  }
  else {
    vscode.window.showErrorMessage(`
        missing fileRegexPredicate and subStringRemovalArray
        `, {
      modal: true,
      detail: `Please provide a fileRegexPredicate or
          subStringRemovalArray for the option from your
          settings.json or workspace file. If you needed
          assitance watch this video`
    })
  }
  currentEditorRelationshipString = fileNameBasis
  return fileNameBasis

}


const getFileNamesToSearchAndPathToIgnore = async (
  targetPaths: Array<string>,filePath: string,
  mySettingsJson:WMLOpenRelatedFilesSettingsJSON,
  chosenOption:WMLOpenRelatedFilesSettingsJSON["chosenOption"],
  targetGlobs:Array<string>
) => {

  let basicIgnorePatterns = chosenOption.excludeGlobs?? mySettingsJson.excludeGlobs
  let filesNamesPromise = targetPaths.map(async (targetPath)=>{
    let filePaths = await fg(
      targetGlobs,
      {
        unique: true,
        cwd: targetPath,
        onlyFiles: true,
        ignore: basicIgnorePatterns
      },
    )
    return filePaths
    .map((filePath)=>{
      return path.join(targetPath,filePath)
    })
  })
  let filesNames = await Promise.all(filesNamesPromise)
  return filesNames.flat(Infinity)[0]

}

async function getAllFilesInSortedSections(
  chosenOption:WMLOpenRelatedFilesSettingsJSON["chosenOption"],
  includeGlobs:WMLOpenRelatedFilesSettingsJSON["chosenOption"]["includeGlobs"],
  targetPaths: string[],
  fileUri: vscode.Uri, mySettingsJson: WMLOpenRelatedFilesSettingsJSON)  {

    return await Promise.all(
      includeGlobs.map(async (globString) => {
        if (Array.isArray(globString)) {
          return await  getAllFilesInSortedSections(chosenOption,globString,targetPaths,fileUri,mySettingsJson)
        }
        return (await getFileNamesToSearchAndPathToIgnore(
          targetPaths,
          fileUri.fsPath,
          mySettingsJson,
          chosenOption,
          globString
        ))
      })
    )
}



function updateGlobPlaceholders(
  includeGlobs:WMLOpenRelatedFilesSettingsJSON["chosenOption"]["includeGlobs"],
  relationshipString: string)
{
  return includeGlobs.map((globString) => {

    if (Array.isArray(globString)) {
      return updateGlobPlaceholders(globString,relationshipString)
    }
    return globString.replace("FILE_NAME_BASIS", relationshipString)
  })
}

async function getChosenOption(mySettingsJson: WMLOpenRelatedFilesSettingsJSON) {
  if (!mySettingsJson.chosenOption) {
    let options = mySettingsJson.options.map((option) => {
      return { label: option.name }
    })
    let name = await vscode.window.showQuickPick(options, {
      placeHolder: "Select what you are working on (this will become your default option)"
    })
    mySettingsJson.chosenOption = defaultOption = mySettingsJson.options.find((option) => {
      return option.name === name.label
    })
  }
}

async function openFilesInEditMode(
  fileMatrix: WMLOpenRelatedFilesSettingsJSON["chosenOption"]["includeGlobs"],
  chosenOption:WMLOpenRelatedFilesSettingsJSON["chosenOption"]
) {
  try {
    if (!fileMatrix || fileMatrix.length === 0) {
      throw new Error('Invalid array structure. Expected a non-empty 3D array.');
    }

    const openAndShowFile = async (filePath,myViewColum?) => {
      let document = await vscode.workspace.openTextDocument(filePath);

      let viewColumn = vscode.ViewColumn.One;

      let finalViewColumn = myViewColum??viewColumn

      return vscode.window.showTextDocument(document, {
        viewColumn:finalViewColumn,
        preview: false
      });
    };

    // Notify with fileMatrix
    vscode.commands.executeCommand(
      "vscode.setEditorLayout",
      chosenOption.setEditorLayout
    )
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    let  numPanes = 0;
    for (const [index0, row] of fileMatrix.entries()) {

      await vscode.commands.executeCommand('workbench.action.focusFirstEditorGroup');

      // @ts-ignore
      for (const [index1, editorGroup] of row.entries()) {
        numPanes += 1
        for (const [index2, editor] of editorGroup.entries()) {
          await openAndShowFile(editor,numPanes)
          await delay(100);
        }

      }
    }
  } catch (error) {
    console.error(`Error opening files: ${error.message}`);
  }
}
let warnWhenTooManyFiles = async (allFilesInSortedSections:Array<any>)=>{
  let allFiles = allFilesInSortedSections.flat(Infinity)
  notifyMsg("files to be opened")
  notifyMsg( allFilesInSortedSections)
  if(allFiles.length > 20){
    let myContinue = await vscode.window.showQuickPick(
      ["YES","NO"].map((label)=>{
        return {label}
      }),{
      placeHolder:"This will open a huge amount of files and crash vscode are you sure about this"
    })
    if(!myContinue){
      return true
    }
  }
  if(allFiles.length ===0){
    return true
  }
}

export const openRelatedFiles = async (uri?: vscode.Uri) => {
  openRelatedFilesLock = true
  try {
    if (!vscode.workspace.workspaceFolders) {
      vscode.window.showInformationMessage('No folder or workspace opened')
      return
    }


    let mySettingsJson = new WMLOpenRelatedFilesSettingsJSON(
      deepCopy(getSettingsJSON("windmillcode-open-related-files") ?? {})
    )
    const rootFolderUri = getRootFolderUri() as vscode.Uri
    const fileUri = uri ?? getActiveDocumentUri()

    if (fileUri?.scheme !== 'untitled' &&  fileUri) {


      let chosenOption
      let autoOpen = await autoOpenSetting.get()

      if(autoOpen && defaultOption){
        chosenOption = defaultOption
      }
      else{
        await getChosenOption(mySettingsJson)
        chosenOption = mySettingsJson.chosenOption
      }
      if(chosenOption.name ==="Disable"){
        return
      }
      let relationshipString = trimToGetRelationshipString(fileUri, chosenOption)
      notifyMsg("after viewing option "+relationshipString)
      let includeGlobs= updateGlobPlaceholders(chosenOption.includeGlobs, relationshipString)
      notifyMsg(includeGlobs)


      let targetPaths = chosenOption.searchPaths.map((subPath)=>{
        return  path.join(rootFolderUri.fsPath,subPath)
      })


      let allFilesInSortedSections:Array<any> = await getAllFilesInSortedSections(chosenOption,includeGlobs, targetPaths, fileUri, mySettingsJson)
      if(await warnWhenTooManyFiles(allFilesInSortedSections)){
        return
      }


      // getOutputChannel().show(true)
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
      await openFilesInEditMode(allFilesInSortedSections,chosenOption)



    }
    else{
      vscode.window.showErrorMessage("Please open a file in the editor and select it first (meaning click on the code area to put into focus)")
    }



  } catch (e: any) {

    vscode.window.showErrorMessage(e.message)
  } finally{
    openRelatedFilesLock = false
  }
}




export const toggleAutoOpen = async (uri?: vscode.Uri)=>{
  let myContinue = await vscode.window.showQuickPick(
    ["YES","NO"].map((label)=>{
      return {label}
    }),{
    placeHolder:"Select YES to auto open related files, Select NO to disallow"
  })
  if(myContinue){
    await autoOpenSetting.set(myContinue.label ==="YES")
  }
}



export const editorChangeDisposable = vscode.window.onDidChangeActiveTextEditor(async (editor) => {


  if(await autoOpenSetting.get() && editor){
      if(openRelatedFilesLock){
        return
      }
      const fileName = path.basename(editor.document.fileName);
      try {
        let prevEditorRelationshipString =  currentEditorRelationshipString
        let newEditorRelationshipString = trimToGetRelationshipString(editor.document.uri,defaultOption)
        // notifyMsg("Prev Value: "+prevEditorRelationshipString)
        // notifyMsg("Next Value: "+newEditorRelationshipString)
        if(currentEditorRelationshipString !==""){
          if(prevEditorRelationshipString === newEditorRelationshipString ){
            return
          }
        }

      } finally {
        notifyMsg("changing layout ")
        openRelatedFiles(editor.document.uri)
        notifyMsg(`Active editor changed. File: ${fileName}`);
      }





  }

});




