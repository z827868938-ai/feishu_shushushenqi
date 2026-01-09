# 开始
- 点击绿色run按钮
- 编辑 [index.ts](#src/index.ts) 并观看实时更新！

# 了解更多

您可以在[多维表格扩展脚本开发指南](https://feishu.feishu.cn/docx/U3wodO5eqome3uxFAC3cl0qanIe)中了解更多信息 ）。

## 安装包
在 Shell 窗格中安装npm包或在 Packages 窗格中搜索并添加。

## 国际化
本模板使用[jquery-i18next](https://locize.com/blog/jquery-i18next/)进行国际化。
- 在js文件中通过$.t()调用，如中文环境下:
```js
console.log($.t('content', {num:888})) // '这是中文内容888'
console.log($.t('title')) // '这是中文标题'
```
## 发布
请先npm run build，连同dist目录一起提交，然后再填写表单：
[共享表单](https://feishu.feishu.cn/share/base/form/shrcnGFgOOsFGew3SDZHPhzkM0e)

- 在标签中使用:
通过将属性data-i18n设置为某个语言配置的key，在使用该语言的时候，将使用该key对应的值覆盖标签的内容，从而实现国际化。
data-i18n-options用于插值，同$.t函数的第二个参数，将替换语言配置中被{{}}包裹的变量。

```html
<h1 data-i18n="title">默认标题</h1>

<h2 data-i18n="content" data-i18n-options='{"num":888}'> </h2>
```

如果要在input等不含子元素的元素中使用，则需要给data-i18n属性值加上 [希望赋值的标签属性] 前缀，
比如，给input的placeholder属性进行国际化配置：

```html
<input data-i18n="[placeholder]title"/>

```





# Getting Started
- Hit run
- Edit [index.ts](#src/index.ts) and watch it live update!

# Learn More

You can learn more in the [Base Extension Development Guide](https://lark-technologies.larksuite.com/docx/HvCbdSzXNowzMmxWgXsuB2Ngs7d)

## Install packages

Install packages in Shell pane or search and add in Packages pane.


## globalization
This template uses [jquery-i18next](https://locize.com/blog/jquery-i18next/) for internationalization.
- Called through $.t() in the js file, such as in Chinese environment:
```js
console.log($.t('content', {num:888})) // '这是中文内容888'
console.log($.t('title')) // '这是中文标题'
```

## Publish
Please npm run build first, submit it together with the dist directory, and then fill in the form:
[Share form](https://feishu.feishu.cn/share/base/form/shrcnGFgOOsFGew3SDZHPhzkM0e)

- Use in tags:
By setting the attribute data-i18n to the key configured in a certain language, when using that language, the value corresponding to the key will be used to overwrite the content of the tag, thereby achieving internationalization.
data-i18n-options are used for interpolation. They are the same as the second parameter of the $.t function and will replace the variables wrapped in {{}} in the language configuration.
```html
<h1 data-i18n="title">默认标题</h1>

<h2 data-i18n="content" data-i18n-options='{"num":888}'> </h2>
```

If you want to use it in an element without child elements such as input, you need to prefix the data-i18n attribute value with [the label attribute you want to assign].
For example, configure internationalization for the placeholder attribute of input:
```html
<input data-i18n="[placeholder]title"/>

```
