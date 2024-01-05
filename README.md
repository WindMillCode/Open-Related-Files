<div class="aside">
<div class="gfm-embed" data-url="https://www.gofundme.com/f/strengthen-our-business-to-take-on-bigger-initiati/widget/medium"></div><script defer src="https://www.gofundme.com/static/js/embed.js"></script>
<div/>

# Windmillcode Open Related Files


# Overview
* do you work on a project where you need to shift between related files. is the file management overwhelming this extension amins to solve that

# Usage
* Open the file according to your file fileRegexPredicate or subStringRemovalArray in settings.json["windmillcode-open-related-files]["options"]["fileRegexPredicate","subStringRemovalArray"]

* Open Command Pallellete
Hold (Ctrl+ Shift ) Hit P for windows
Hold (Cmd+Shift) Hit P for mac

* type-in and select Windmillcode: Open related files
* select the options you have set in settings.json["windmillcode-open-related-files]["options"]
* vscode will repopulate the workbench according to the files globstrings and matrix you have specified in settings.json["windmillcode-open-related-files]["options"]["setEditorLayout"] and  settings.json["windmillcode-open-related-files]["options"]["includeGlobs"]



## Example
* paste this into your settings.json and modify according to your project
* ask chapgpt to modify it for your framework
```ts
"windmillcode-open-related-files": {
  "options": [
    {
      "name": "React Development",
      "searchPaths": ["apps/frontend/ReactApp/src"],
      "fileRegexPredicate": "\\.(jsx|js|tsx|ts|scss|css)$",
      "setEditorLayout": {
        "orientation": 1,
        "groups": [
          {
            "groups": [{}, {}],
            "size": 0.5
          }
        ]
      },
      "includeGlobs": [
        [
          [
            {
              "filePath": "**/src/components/**/FILE_NAME_BASIS.js",
              "section": [30, 0, 90, 0]
            },
            {
              "filePath": "**/src/components/**/FILE_NAME_BASISComponent.tsx",
              "section": [30, 0, 90, 0]
            }
          ],
          [
            "**/src/components/**/FILE_NAME_BASISComponent.module.css",
            "**/src/components/**/FILE_NAME_BASISComponent.module.scss"
          ]
        ],
        [
          [
            {
              "filePath": "**/src/__tests__/**/FILE_NAME_BASIS.test.js",
              "section": [30, 0, 90, 0]
            },
            {
              "filePath": "**/src/__tests__/**/FILE_NAME_BASIS.test.jsx",
              "section": [30, 0, 90, 0]
            }
          ]
        ]
      ]
    },
    {
      "name": "Ruby on Rails Development",
      "searchPaths": ["apps/backend/RailsApp/"],
      "fileRegexPredicate": "\\.(rb|html.erb)$",
      "setEditorLayout": {
        "orientation": 1,
        "groups": [
          {
            "groups": [{}, {}],
            "size": 0.5
          }
        ]
      },
      "includeGlobs": [
        [
          [
            {
              "filePath": "**/app/controllers/**/FILE_NAME_BASIS_controller.rb",
              "section": [30, 0, 90, 0]
            }
          ],
          [
            "**/app/models/**/FILE_NAME_BASIS.rb",
            "**/app/views/**/FILE_NAME_BASIS.*"
          ]
        ],
        [
          [
            {
              "filePath": "**/test/**/FILE_NAME_BASIS_test.rb",
              "section": [30, 0, 90, 0]
            }
          ]
        ]
      ]
    },

    {
      "name": "Spring Boot Development",
      "searchPaths": ["apps/backend/SpringBootApp/src"],
      "fileRegexPredicate": "\\.(java|xml)$",
      "setEditorLayout": {
        "orientation": 1,
        "groups": [
          {
            "groups": [{}],
            "size": 0.5
          },
          {
            "groups": [{}, {}],
            "size": 0.5
          }
        ]
      },
      "includeGlobs": [
        [
          [
            {
              "filePath": "**/src/main/java/**/FILE_NAME_BASISController.java",
              "section": [10, 0, 90, 0]
            }
          ],
          [
            "**/src/main/java/**/FILE_NAME_BASISEntity.java",
            "**/src/main/java/**/FILE_NAME_BASISRepository.java"
          ],
          [
            {
              "filePath": "**/src/test/java/**/FILE_NAME_BASISTest.java",
              "section": [20, 3, 70, 10]
            }
          ]
        ]
      ]
    }

  ]
}
```

# Commands

| Title | Command | Description |
| ----------- | ------- | ----------- |
| Windmillcode Open Related Files: Open | `windmillcode-open-related-files.openRelatedFiles` | When auto open is disabled opens the related files according to the default option |
| Windmillcode Open Related Files: Set Default Option | `windmillcode-open-related-files.setDefaultOption` | Sets the default option of related file to work with  |
| Windmillcode Open Related Files: Toggle Auto Open | `windmillcode-open-related-files.toggleAutoOpen` | When an editor is selected, opened, focused, if the file matches the matchers in the default option opens the relative files if not does nothing |
| Windmillcode Open Related Files: Toggle Reset Layout | `windmillcode-open-related-files.toggleResetLayout` | When an editor is selected whether to close all files and start over with the selected files or keep preivous files open and continue to edit |

# Settings

| Vscode Setting | Type | Default | Description |
| ------- | ---- | ------- | ----------- |
| `windmillcode-open-related-files.autoOpen` | boolean | `false` | If set to `true`, auto opens all related files when switching to an unrelated file. If set to `false`, auto-open is disabled. |
| `windmillcode-open-related-files.defaultOption` | WMLOpenRelatedFilesSettingsJSON["chosenOption"] | `null` | The default option to be used to open related files. (Tip use the command to set the default setting before manually editing so you can see the shape) |
| `windmillcode-open-related-files.resetLayout` | boolean | `false` | If set to true closes editors with new editors set to false to continue with current files in layout while opening new files |



# Docs

## WMLOpenRelatedFiles JSON Settings


* __Important Note__ - WMLOpenRelatedFilesSettingsJSON.chosenOption not available on the object its available as windmillcode-open-related-files.defaultOption, you would typically use the `windmillcode-open-related-files.defaultOption` to set this as its a duplicate from one of your selected options in the WMLOpenRelatedFilesSettingsJSON.options array
| **Name**               | **Type**                                    | **Default Value**                              | **Description**                                                                                               |
|------------------------|---------------------------------------------|-----------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| `excludeGlobs`         | `Array<string>`                             | `["**/node_modules/**", "**/site-packages/**", "**/.git/**"]` | An array of globs representing files or directories to be excluded when opening related files. for all options provided by the developer               |
| `chosenOption`              | `WMLOpenRelatedFilesSettingsJSON.chosenOption`          | `undefined`                   | The chosen option the developer wants to use when working with files.
| `options`              | `Array<Partial<WMLOpenRelatedFilesSettingsJSON["chosenOption"]>>`          | `[ { "name": "Disable" } ]`                   | An array of options for opening related files, each having a name and potentially additional settings based on the chosen option.                                        |

### Property WMLOpenRelatedFilesSettingsJSON.chosenOption
| **Name**               | **Type**                                    | **Default Value**                              | **Description**                                                                                               |
|------------------------|---------------------------------------------|-----------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| `name`                | `string`                                                                                                   | `undefined`       | The name of the chosen option for opening related files.                                                                                   |
| `fileRegexPredicate`  | `regexString ,(meaning the string will be used to create a regexp)`                                                                                                   | `undefined`       | A regexString representing that the option should trigger if the file that matches the regex is in focus on the editor workbench|
| `subStringRemovalArray`  | `Array<string>`                                                                                                   | `undefined`       | Same feature as fileRegexPredicate but uses an array of regular substrings to be used to trim the file name. |
| `setEditorLayout`     | `WMLOpenRelatedFilesSettingsJSON.chosenOption.setEditorLayout` | `undefined`       | An object specifying the layout of the editor when opening related files, including orientation and groups with optional size.          |
| `searchPaths`         | `Array<string>`                                                                                            | `undefined`       | An array of paths to be used for searching related files. so the whole project is not searched                                                                                   |
| `includeGlobs`        | `WMLOpenRelatedFilesSettingsJSON.chosenOption.includeGlobs` | `undefined`       | A matrix of globs representing files to be opened having the same dimensions as WMLOpenRelatedFilesSettingsJSONchosenOption[setEditorLayout"]["groups"] if there are more dimensions then additional editor groups may be opened breaking the intended layout. if dimensions are less than setEditorLayout then vscode placeholders would be left the leftover editor groups. In addition use FILE_NAME_BASIS in the global to specify to the extension how to use the fileRegexPredicate to update the globString to narrow down the possible results to the file that you want to deal with                                                |
| `excludeGlobs`        | `WMLOpenRelatedFilesSettingsJSON["excludeGlobs"]`                                                          | `undefined`       | An array of globs representing files or directories to be excluded when opening related files, inherited from the parent class's property. |


### Property WMLOpenRelatedFilesSettingsJSON.includeGlobs

| Level      | Type                                            | Description |
|------------|-------------------------------------------------|-------------|
| Base Level | `{ filePath: string, sections: Array<[number, number, number, number]> } \| string` | At the base level, each element of the array is an object with two properties: `filePath` (a globString representing the path of a file) and `sections` (an array of tuples, each containing four numbers representing specific sections of the file). Or it can be a simple globString and the section will deafult to [0,0,0,0] |
| Nested Levels | `InfiniteStringFilePath[]` | At nested levels, the structure is an array of `InfiniteStringFilePath`, representing deeper nested arrays with the same structure as the base level. This allows for an infinite nesting of such arrays. |

#### Base Level

| Property | Type                 | Description |
|----------|----------------------|-------------|
| filePath | `string`               | A globString representing the path of a file. |
| sections | `Array<[number,number,number,number]>` | An array of tuples, each containing four numbers. These numbers represent specific sections of the file in this manner [startLine,startChar,endLine,endChar] it will open the file at start line and highlight a section of the file from start to end values |



#### Property WMLOpenRelatedFilesSettingsJSON.chosenOption.setEditorLayout
| **Name**           | **Type**                                                                                | **Default Value** | **Description**                                                                                                                                                                            |
|--------------------|-----------------------------------------------------------------------------------------|-------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `orientation`      | `0 \| 1`                                                                                | `undefined`       | layout direction. `1` for left-to-right downward (horizontal) `0` from top-to-bottom leftward layout (vertical).                                    |
| `groups`           | `Array<{ groups: WMLOpenRelatedFilesSettingsJSON["chosenOption"]["setEditorLayout"]["groups"], size?: number }>` | `undefined`       | A multi-dimensional array of objects specifying the editor layout matrix. Each group can contain further nested groups and an optional size parameter for specifying the size of the group. |
| `groups.groups`    | `WMLOpenRelatedFilesSettingsJSON["chosenOption"]["setEditorLayout"]["groups"]`           | `undefined`       | Recursive definition of the groups within the editor layout.                                                                                                                                |
| `groups.size`      | `number `                                                                   | `a value between 0 and 1 vscode best decides for apropriate visual layout`       | An optional parameter specifying the size of the group within the editor layout.                                                                                                           |
