# svg2symbol
## A utility tool to convert your svg images into symbols - Generate your symbol definitions by importing your svg files.
### Deployed at https://svg2symbol.herokuapp.com/
### Basic Table of Comparison: Font Icons vs Inline SVG Use
|   | Font Icon Use | Inline SVG Use  |
| :------ | :-: | :-: |
| File Size | ✓ when no. of icons are significantly more, overall file size is relatively smaller |   |
| Accessibility |   | ✓ more built-in tags and read as image, not text by browsers |
| Performance |   | ✓ less prone to loading errors |
| Scalability |   | ✓ resolution independent;no effect on pixel quality when height/width changes |
| Animations  |   | ✓ more built-in tags and each component can be animated;greater versatility |
| Ease of Use | ✓ when only a few icons are required, the template setup is easier | ✓ when many icons are required and repeated use is common, the template setup is relatively less of a hassle |
| Browser Support | ✓ suited for legacy browsers such as IE9+ | ✓ requires polyfills to be rendered in legacy browsers |

### Published in https://geek-cc.medium.com/transforming-svg-files-into-symbols-for-svg-inline-use-no-internet-required-4cd7c9c84bae
#### Preview of Web Application
![Web App Preview Onload](https://github.com/incubated-geek-cc/svg2symbol/blob/main/public/img/preview.png)

#### Enables multiple svg file imports at one go
![Web App Preview Import Multiple Files](https://github.com/incubated-geek-cc/svg2symbol/blob/main/public/img/demo.gif)

#### Displaying embedded code snippets for each icon generated
![Web App Preview View Code](https://github.com/incubated-geek-cc/svg2symbol/blob/main/public/img/preview_2.png)

#### Includes implementation guide for each exported file (exports 2 files)
![Web App Preview Implementation Guide](https://github.com/incubated-geek-cc/svg2symbol/blob/main/public/img/preview_3.png)