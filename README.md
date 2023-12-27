# Open Related Files


# Usage
* Open the file according to your file fileRegexPredicate or subStringRemovalArray in settings.json["windmillcode-open-related-files]["options"]["fileRegexPredicate","subStringRemovalArray"]

* Open Command Pallellete
Hold (Ctrl+ Shift ) Hit P for windows
Hold (Cmd+Shift) Hit P for mac

* type-in and select Windmillcode: Open related files
* select the options you have set in settings.json["windmillcode-open-related-files]["options"]
* vscode will repopulate the workbench according to the files globstrings and matrix you have specified in settings.json["windmillcode-open-related-files]["options"]["setEditorLayout"] and  settings.json["windmillcode-open-related-files]["options"]["includeGlobs"]


# Docs

## class WMLOpenRelatedFilesSettingsJSON

| **Name**               | **Type**                                    | **Default Value**                              | **Description**                                                                                               |
|------------------------|---------------------------------------------|-----------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| `excludeGlobs`         | `Array<string>`                             | `["**/node_modules/**", "**/site-packages/**", "**/.git/**"]` | An array of globs representing files or directories to be excluded when opening related files. for all options provided by the developer               |
| `chosenOption`              | `WMLOpenRelatedFilesSettingsJSON.chosenOption`          | `undefined`                   | The chosen option the developer wants to use when working with files
| `options`              | `Array<Partial<WMLOpenRelatedFilesSettingsJSON["chosenOption"]>>`          | `[ { "name": "Disable" } ]`                   | An array of options for opening related files, each having a name and potentially additional settings based on the chosen option.                                        |

### Property WMLOpenRelatedFilesSettingsJSON.chosenOption
| **Name**               | **Type**                                    | **Default Value**                              | **Description**                                                                                               |
|------------------------|---------------------------------------------|-----------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| `name`                | `string`                                                                                                   | `undefined`       | The name of the chosen option for opening related files.                                                                                   |
| `fileRegexPredicate`  | `regexString ,(meaning the string will be used to create a regexp)`                                                                                                   | `undefined`       | A regexString representing that the option should trigger if the file that matches the regex is in focus on the editor workbench|
| `subStringRemovalArray`  | `Array<string>`                                                                                                   | `undefined`       | Same feature as fileRegexPredicate but uses an array of regular substrings to be used to trim the file name. |
| `setEditorLayout`     | `WMLOpenRelatedFilesSettingsJSON.chosenOption.setEditorLayout` | `undefined`       | An object specifying the layout of the editor when opening related files, including orientation and groups with optional size.          |
| `searchPaths`         | `Array<string>`                                                                                            | `undefined`       | An array of paths to be used for searching related files. so the whole project is not searched                                                                                   |
| `includeGlobs`        | `InfiniteStringArray`                                                                                     | `undefined`       | A matrix of globs representing files to be opened having the same dimensions as WMLOpenRelatedFilesSettingsJSONchosenOption[setEditorLayout"]["groups"] if there are more dimensions then additional editor groups may be opened breaking the intended layout. if dimensions are less than setEditorLayout then vscode placeholders would be left the leftover editor groups. In addition use FILE_NAME_BASIS in the global to specify to the extension how to use the fileRegexPredicate to update the globString to narrow down the possible results to the file that you want to deal with                                                |
| `excludeGlobs`        | `WMLOpenRelatedFilesSettingsJSON["excludeGlobs"]`                                                          | `undefined`       | An array of globs representing files or directories to be excluded when opening related files, inherited from the parent class's property. |


#### Property WMLOpenRelatedFilesSettingsJSON.chosenOption.setEditorLayout
| **Name**           | **Type**                                                                                | **Default Value** | **Description**                                                                                                                                                                            |
|--------------------|-----------------------------------------------------------------------------------------|-------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `orientation`      | `0 \| 1`                                                                                | `undefined`       | layout direction. `1` for left-to-right downward (horizontal) `0` from top-to-bottom leftward layout (vertical).                                    |
| `groups`           | `Array<{ groups: WMLOpenRelatedFilesSettingsJSON["chosenOption"]["setEditorLayout"]["groups"], size?: number }>` | `undefined`       | A multi-dimensional array of objects specifying the editor layout matrix. Each group can contain further nested groups and an optional size parameter for specifying the size of the group. |
| `groups.groups`    | `WMLOpenRelatedFilesSettingsJSON["chosenOption"]["setEditorLayout"]["groups"]`           | `undefined`       | Recursive definition of the groups within the editor layout.                                                                                                                                |
| `groups.size`      | `number `                                                                   | `a value between 0 and 1 vscode best decides for apropriate visual layout`       | An optional parameter specifying the size of the group within the editor layout.                                                                                                           |
