# Funkin Packer <img src="https://raw.githubusercontent.com/NeeEoo/funkin-packer/master/electron/build/icons/128x128.png" width="32" height="32">

Funkin Packer is a tool for creating sprite sheets in various formats. With features including rotation, trimming, multipacking, exporting to various formats (sparrow, json, css, pixi.js, godot, phaser, cocos2d).

Web version: [https://neeeoo.github.io/funkin-packer/](https://neeeoo.github.io/funkin-packer/)

# Custom templates
Funkin Packer even allows for custom templates using [mustache](http://mustache.github.io/).

There are 3 objects passed to template:

**rects** (Array) list of sprites for export

| prop             | type    | description                     |
| ---              | ---     | ---                             |
| name             | String  | sprite name                     |
| frame            | Object  | frame info (x, y, w, h, hw, hh) |
| rotated          | Boolean | sprite rotation flag            |
| trimmed          | Boolean | sprite trimmed flag             |
| spriteSourceSize | Object  | sprite source size (x, y, w, h) |
| sourceSize       | Object  | original size (w, h)            |
| first            | Boolean | first element in array flag     |
| last             | Boolean | last element in array flag      |

**config** (Object) current export config

| prop           | type    | description                        |
| ---            | ---     | ---                                |
| imageWidth     | Number  | texture width                      |
| imageHeight    | Number  | texture height                     |
| scale          | Number  | texture scale                      |
| format         | String  | texture format                     |
| imageName      | String  | texture name                       |
| imageFile      | String  | texture file (name with extension) |
| base64Export   | Boolean | base64 export flag                 |
| base64Prefix   | String  | prefix for base64 string           |
| imageData      | String  | base64 image data                  |

**appInfo** (Object) application info

| prop           | type    | description          |
| ---            | ---     | ---                  |
| displayName    | String  | App name             |
| version        | String  | App version          |
| url            | String  | App url              |

**Example:**
```
{
  "frames": {
    {{#rects}}
    "{{{name}}}": {
      "frame": {
        "x": {{frame.x}},
        "y": {{frame.y}},
        "w": {{frame.w}},
        "h": {{frame.h}}
      },
      "rotated": {{rotated}},
      "trimmed": {{trimmed}},
      "spriteSourceSize": {
        "x": {{spriteSourceSize.x}},
        "y": {{spriteSourceSize.y}},
        "w": {{spriteSourceSize.w}},
        "h": {{spriteSourceSize.h}}
      },
      "sourceSize": {
        "w": {{sourceSize.w}},
        "h": {{sourceSize.h}}
      },
      "pivot": {
        "x": 0.5,
        "y": 0.5
      }
    }{{^last}},{{/last}}
    {{/rects}}
  },
  "meta": {
    "app": "{{{appInfo.url}}}",
    "version": "{{appInfo.version}}",
    "image": "{{config.imageFile}}",
    "format": "{{config.format}}",
    "size": {
      "w": {{config.imageWidth}},
      "h": {{config.imageHeight}}
    },
    "scale": {{config.scale}}
  }
}
```
