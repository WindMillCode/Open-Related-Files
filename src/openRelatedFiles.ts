import * as vscode from 'vscode'
import { deepCopy, getActiveDocumentUri, getOutputChannel, getRootFolderUri, getSettingsJSON, listFilesRecursively, notifyError, notifyMsg } from './functions'
import path = require('path')
import fg = require('fast-glob')
import { WMLOpenRelatedFilesSettingsJSON } from './models'




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



export const openRelatedFiles = async (uri?: vscode.Uri) => {
  try {
    if (!vscode.workspace.workspaceFolders) {
      vscode.window.showInformationMessage('No folder or workspace opened')
      return
    }


    let mySettingsJson = new WMLOpenRelatedFilesSettingsJSON(
      deepCopy(getSettingsJSON("windmillcode-open-related-files") ?? {})
    )
    const rootFolderUri = getRootFolderUri() as vscode.Uri
    const fileUri = uri || getActiveDocumentUri()

    if (fileUri?.scheme !== 'untitled') {


      await getChosenOption(mySettingsJson)
      let {chosenOption} = mySettingsJson
      if(chosenOption.name ==="Disable"){
        return
      }
      let fileName = path.basename(fileUri.path)
      let fileNameBasis = fileName.replace(
        new RegExp(chosenOption.fileRegexPredicate),''
      )
      chosenOption.includeGlobs= updateGlobPlaceholders(chosenOption.includeGlobs, fileNameBasis)



      let targetPaths = chosenOption.searchPaths.map((subPath)=>{
        return  path.join(rootFolderUri.fsPath,subPath)
      })

      notifyMsg(chosenOption.includeGlobs)
      let allFilesInSortedSections:Array<any> = await getAllFilesInSortedSections(chosenOption,chosenOption.includeGlobs, targetPaths, fileUri, mySettingsJson)
      let allFiles = allFilesInSortedSections.flat(Infinity)
      notifyMsg("files to be opened\n")
      notifyMsg( allFilesInSortedSections)
      if(allFiles.length > 20){
        let myContinue = await vscode.window.showQuickPick(
          ["YES","NO"].map((label)=>{
            return {label}
          }),{
          placeHolder:"This will open a huge amount of files and crash vscode are you sure about this"
        })
        if(!myContinue){
          return
        }
      }
      vscode.commands.executeCommand('workbench.action.closeAllEditors');
      openFilesInLayout(allFilesInSortedSections)
      getOutputChannel().show(true)


    }
    else{
      vscode.window.showErrorMessage("Please open a file in the editor and select it first (meaning click on the code area to put into focus)")
    }



  } catch (e: any) {
    vscode.window.showErrorMessage(e.message)
  }
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
  fileNameBasis: string)
{
  return includeGlobs.map((globString) => {

    if (Array.isArray(globString)) {
      return updateGlobPlaceholders(globString,fileNameBasis)
    }
    return globString.replace("FILE_NAME_BASIS", fileNameBasis)
  })
}

async function getChosenOption(mySettingsJson: WMLOpenRelatedFilesSettingsJSON) {
  if (!mySettingsJson.chosenOption) {
    let options = mySettingsJson.options.map((option) => {
      return { label: option.name }
    })
    let name = await vscode.window.showQuickPick(options, {
      placeHolder: "Select what you are working on"
    })
    mySettingsJson.chosenOption = mySettingsJson.options.find((option) => {
      return option.name === name.label
    })
  }
}

async function openFilesInLayout(fileMatrix) {
  try {
      if (fileMatrix.length !== 1 || fileMatrix[0].length !== 2 || fileMatrix[0][0].length !== 2) {
          throw new Error('Invalid array structure. Expected a 3D array with dimensions [1, 2, 2].');
      }

      const openAndShowFile = async (filePath) => {
          const document = await vscode.workspace.openTextDocument(filePath);
          return vscode.window.showTextDocument(document);
      };

      // Open and show files in one pane
      const topLeftFile = await openAndShowFile(fileMatrix[0][0][0]);
      const bottomLeftFile = await openAndShowFile(fileMatrix[0][0][1]);

      // Split the editor to create two columns
      await vscode.commands.executeCommand('workbench.action.splitEditor');

      // Open and show files in the horizontal pane
      const topRightFile = await openAndShowFile(fileMatrix[0][0][0]);
      const bottomRightFile = await openAndShowFile(fileMatrix[0][0][1]);

      // You can adjust the layout further if needed
      // e.g., using `vscode.commands.executeCommand('workbench.action.splitEditorDown')` to create rows

  } catch (error) {
      console.error(`Error opening files: ${error.message}`);
  }
}
