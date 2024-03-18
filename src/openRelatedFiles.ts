import * as vscode from 'vscode'
import {  autoOpenSetting, deepCopy, defaultOptionSetting, getActiveDocumentUri, getRootFolderUri, getSettingsJSON, resetLayoutSetting } from './functions'
import path = require('path')
import fg = require('fast-glob')
import {  ChannelManager, InfiniteGlobString, InfiniteGlobStringArray, WMLOpenRelatedFilesSettingsJSON } from './models'
import fs = require('fs')

let currentEditorRelationshipString = ""
let openRelatedFilesLock = false
let channel0 = new ChannelManager("Windmillcode Open Related Files")
let channe1 = new ChannelManager("channel1")

function trimToGetRelationshipString(
  fileUri: vscode.Uri,
  chosenOption: WMLOpenRelatedFilesSettingsJSON["chosenOption"],
  showErrorMessage = false) {
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
  else if(showErrorMessage) {
    vscode.window.showErrorMessage(`
        missing fileRegexPredicate and subStringRemovalArray
        `, {
      modal: true,
      detail: `Please provide a fileRegexPredicate or
          subStringRemovalArray for the option from your
          settings.json or workspace file. If you needed
          assitance watch this video`
    })
    throw new Error("")
  }
  if(fileNameBasis !== fileName){
    currentEditorRelationshipString = fileNameBasis
    return currentEditorRelationshipString
  }
  else {
    return null //the developer wants to work with other files dont trigger things
  }

}


const getFileNamesToSearchAndPathToIgnore = async (
  targetPaths: Array<string>,
  mySettingsJson:WMLOpenRelatedFilesSettingsJSON,
  chosenOption:WMLOpenRelatedFilesSettingsJSON["chosenOption"],
  targetGlob:InfiniteGlobString
) => {
  let basicIgnorePatterns = chosenOption.excludeGlobs?? mySettingsJson.excludeGlobs

  let filesNamesPromise = targetPaths.map(async (targetPath)=>{
    let fGOptions =       {
      unique: true,
      cwd: targetPath,
      onlyFiles: true,
      ignore: basicIgnorePatterns
    }
    let filePaths = await fg(
      targetGlob.filePath,
      fGOptions
    )
    if(filePaths.length === 0){
      filePaths.push(path.basename(targetGlob.filePath))
    }
    return filePaths
    .map((_relativeFilePath)=>{
      return new InfiniteGlobString({
        ...targetGlob,
        filePath:path.join(targetPath,_relativeFilePath),
        _relativeFilePath:path.normalize(_relativeFilePath)
      })
    })
  })
  let filesNames:Array<InfiniteGlobString> = await Promise.all(filesNamesPromise) as any

  filesNames =  filesNames.flat(Infinity)
  let fileExistencePromises = filesNames.map(async file => {
    const exists = await checkFileExistence(file.filePath);
    return exists ? file : null;
  });
  let results  = await Promise.all(fileExistencePromises);
  // return results.filter(file => file !== null)[0] ?? filesNames[0]
  return filesNames[0]



}

const checkFileExistence = (file) => {
  return new Promise((resolve) => {
    fs.access(file, fs.constants.F_OK, (err) => {
      resolve(!err);
    });
  });
};

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

    return {
      ...globString,
      filePath:globString.filePath.replace(/FILE_NAME_BASIS/g, relationshipString)
    }

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
    if(!name){
      return
    }
    mySettingsJson.chosenOption = mySettingsJson.options.find((option) => {
      return option.name === name.label
    })
    await defaultOptionSetting.set(mySettingsJson.chosenOption)
  }
}

async function openOrCreateAndOpenTextDoc(filePath, altPath) {
  try {
    return await vscode.workspace.openTextDocument(filePath);
  } catch (error) {
    console.error(`Error opening ${filePath}: ${error}`);
    // Attempt to create the file if it doesn't exist
    if([null,undefined,""].includes(altPath)){
      return null
    }
  const createFile = path.join(getRootFolderUri().fsPath, altPath, path.basename(filePath));
    const directory = path.dirname(createFile);
    try {
      // Ensure parent directories are created
      await fs.promises.mkdir(directory, { recursive: true });

      // Try to create the file using fs.open with the 'w' flag
      const fileHandle = await fs.promises.open(createFile, 'w');
      await fileHandle.close();

      return await vscode.workspace.openTextDocument(createFile);
    } catch (createError) {
      console.error(`Error creating file ${createFile}: ${createError}`);
      // throw createError; // Propagate the error
    }
  }
}


const openAndShowFile = async (filePath,myViewColum?,section=[0,0,0,0],altPath?:string) => {

  let document = await openOrCreateAndOpenTextDoc(filePath,altPath);
  if(document === null){
    return
  }

  let viewColumn = vscode.ViewColumn.One;

  let finalViewColumn = myViewColum??viewColumn
  section = section.map((part)=>{
    return part === 0 ? part : part -1
  })

  await vscode.window.showTextDocument(document, {
    viewColumn:finalViewColumn,
    preview: false,
    selection:new vscode.Range(
      section[0] ,
      section[1],
      section[2],
      section[3]
    )
  });

};

async function openFilesInEditMode(
  fileMatrix: WMLOpenRelatedFilesSettingsJSON["chosenOption"]["includeGlobs"],
  chosenOption:WMLOpenRelatedFilesSettingsJSON["chosenOption"]
) {
  try {
    if (!fileMatrix || fileMatrix.length === 0) {
      throw new Error('Invalid array structure. Expected a non-empty 3D array.');
    }



    // Notify with fileMatrix
    let resetLayout = await resetLayoutSetting.get()
    if(resetLayout === true){
      vscode.commands.executeCommand(
        "vscode.setEditorLayout",
        chosenOption.setEditorLayout
      )
    }

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    let  numPanes = 0;
    for (const [index0, row] of fileMatrix.entries()) {

      await vscode.commands.executeCommand('workbench.action.focusFirstEditorGroup');

      // @ts-ignore
      for (const [index1, editorGroup] of row.entries()) {
        numPanes += 1
        for (const [index2, editor] of editorGroup.entries()) {
          if([null,undefined].includes(editor)){
            continue
          }

          await openAndShowFile(editor.filePath,numPanes,editor.section,editor.createFileIfNotFoundPath)
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
  channel0.notifyMsg("files to be opened")
  channel0.notifyMsg( allFilesInSortedSections)
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
  channel0.channel.clear()
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
      let defaultOption = await defaultOptionSetting.get()
      if((defaultOption && defaultOption.name !== "Disable") || autoOpen ){
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
      if(relationshipString === null){
        return
      }

      // channel0.notifyMsg(chosenOption.includeGlobs)
      // channel0.notifyMsg("after viewing option "+relationshipString)
      let includeGlobs= updateGlobPlaceholders(chosenOption.includeGlobs, relationshipString)
      // channel0.notifyMsg("files will be  opened based on the resulting glob")
      // channel0.notifyMsg(includeGlobs)

      let targetPaths = chosenOption.searchPaths.map((subPath)=>{
        return  path.join(rootFolderUri.fsPath,subPath)
      })

      let allFilesInSortedSections:Array<any> = await getAllFilesInSortedSections(chosenOption,includeGlobs, targetPaths, fileUri, mySettingsJson)
      if(await warnWhenTooManyFiles(allFilesInSortedSections)){
        return
      }
      updatePathsForVariableFiles(allFilesInSortedSections)

      let resetLayout = await resetLayoutSetting.get()
      if(resetLayout === true){
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
      }
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

export const  setDefaultOption = async(uri?:vscode.Uri)=>{
  let mySettingsJson = new WMLOpenRelatedFilesSettingsJSON(
    deepCopy(getSettingsJSON("windmillcode-open-related-files") ?? {})
  )
  await getChosenOption(mySettingsJson)
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

export const toggleResetLayout = async (uri?: vscode.Uri)=>{
  let myContinue = await vscode.window.showQuickPick(
    ["YES","NO"].map((label)=>{
      return {label}
    }),{
    placeHolder:"YES to reset layout NO to continuously open related files when selecting unrelated files"
  })
  if(myContinue){
    await resetLayoutSetting.set(myContinue.label ==="YES")
  }
}


export const editorChangeDisposable = vscode.window.onDidChangeActiveTextEditor(async (editor) => {

  if(await autoOpenSetting.get() && editor){
    if(openRelatedFilesLock){
      return
    }
    let shouldReturn = false
    const fileName = path.basename(editor.document.fileName);
    try {
      let defaultOption = await defaultOptionSetting.get()
      let prevEditorRelationshipString =  currentEditorRelationshipString
      let newEditorRelationshipString = trimToGetRelationshipString(editor.document.uri,defaultOption,false)
      channel0.notifyMsg("Prev Value: "+prevEditorRelationshipString)
      channel0.notifyMsg("Next Value: "+newEditorRelationshipString)
      if(currentEditorRelationshipString !==""){
        if(prevEditorRelationshipString === newEditorRelationshipString ){
          shouldReturn = true
        }
        if(("extension-output-windmillcode-publisher-0.windmillcode-open-related-files-#1-Windmillcode Open Related Files".includes(fileName))){
          shouldReturn = true
        }
      }

    } finally {
      if(!shouldReturn){
        channel0.notifyMsg("changing layout ")
        openRelatedFiles(editor.document.uri)
        channel0.notifyMsg(`Active editor changed. File: ${fileName}`);
      }
    }
  }

});



let debounceTimer;

export const onSettingsChangedDisposable = vscode.workspace.onDidChangeConfiguration(async (event) => {
  if (event.affectsConfiguration("windmillcode-open-related-files")) {

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
      // Save the current active editor and cursor position
      let activeEditor = vscode.window.activeTextEditor;
      let cursorPosition = deepCopy(activeEditor.visibleRanges[0])




      let mySettingsJson = new WMLOpenRelatedFilesSettingsJSON(
        deepCopy(getSettingsJSON("windmillcode-open-related-files") ?? {})
      );
      let currentSetting = await defaultOptionSetting.get();
      let chosenOption = mySettingsJson.options.find((option) => {
        return option.name === currentSetting.name;
      });
      if (chosenOption) {
        mySettingsJson.chosenOption = chosenOption;
        await defaultOptionSetting.set(mySettingsJson.chosenOption);
      }


      let currentRange = new vscode.Range(cursorPosition[0].line,cursorPosition[0].character,cursorPosition[1].line,cursorPosition[1].character)
      // Restore the cursor position in the previously active editor
      if (currentRange) {
        activeEditor.revealRange(currentRange)
      }
    }, 1000); // Waits for 1 second of inactivity before executing
  }
});




function updatePathsForVariableFiles(allFilesInSortedSections: InfiniteGlobStringArray) {
  // @ts-ignore
  let flatArray:InfiniteGlobString[] = allFilesInSortedSections.flat(Infinity)

  let untrustedGlobs = flatArray.filter((obj:InfiniteGlobString)=> {
    return obj.createFileRelativeToTrustedFilePath === true
  })
  if(untrustedGlobs.length>=0){
    let trustedGlobObj = flatArray.find((obj:InfiniteGlobString)=> {
      return obj.createFileRelativeToTrustedFilePath === false && [null,undefined,""].includes(obj.createFileIfNotFoundPath)
    })

     untrustedGlobs.forEach((obj)=>{
      let targetDir = path.dirname(trustedGlobObj._relativeFilePath)
      obj.createFileIfNotFoundPath = path.join(obj.createFileIfNotFoundPath,targetDir)

    })

  }

  return allFilesInSortedSections
}

