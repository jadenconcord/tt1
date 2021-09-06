

function replaceBlock(blockName, exportData) {
  let block = TemplateBlocks.find(block => block.name == blockName) || DefaultBlock;

  return BlockTypeActions[block.type](block, exportData);
}

let DefaultBlock;

if(devMode) DefaultBlock = {name: 'default',type: "replace", create: a => ErrorTag + '"'+a.blockName+'" is not a valid block</b>'};
else DefaultBlock = {name: 'default',type: "replace", create: a => a.content};

let BlockTypeActions = {
  replace: (block, exportData) => block.create({...exportData, blockName: block.name}),
  run: (block, exportData) => '`;try{' + block.create(exportData) + '}catch(e){console.error(e)};result+=`',
  eval: (block, exportData) => '`;result += (' + TryEval.start + block.create(exportData) + TryEval.end + ');result+=`',
  tag: replaceBlockTag,
}

function replaceBlockTag(block, exportData){
    let unused = GetUnusedAttribues(block, exportData);
    let result = '';

    if (block.label && exportData.attributes.label) result +=
      `<label class="form-label" for="form-${exportData.attributes.name}">${exportData.attributes.label}</label>`

    result += block.create({unused, ...exportData})
    return result;
}

function GetUnusedAttribues(block, exportData){
  let result = '';
  block.ignore = block.ignore?.split ? block?.ignore?.split(' ') : [];
  Object.keys(exportData.attributes).forEach((name) => {
    if (!block?.ignore?.find(a => a == name))
      result += ` ${name}="${exportData.attributes[name]}"`
  })
  return result;
}


let TemplateBlocks = [{
    name: 'if',
    type: 'replace',
    create: a =>
      `\`;if(${TryEval.start}${a.argument}${TryEval.end}){result+=\`${a.content}\`};result+=\``
  },
  {
    name: 'eval',
    type: 'eval',
    create: a => a.content,
  },
  {
    name: 'run',
    type: 'run',
    create: a => a.content,
  },
  {
    name: 'repeat',
    type: 'run',
    create: a => {
      let i = a.args[1] || 'i';
      return 'for(let ' + i + '=1; ' + i + '<' + (Number(a.args[0]) + 1) + '; ' + i + '++){result+=`' + a.content + '`;}';
    }
  },
  {
    name: 'each',
    type: 'run',
    create: a => a.args[0] +
      '.forEach((' + a.args[1] + (a.args[2] ? ',' + a.args[2] : '') + ')\
       => {result+=`' + a.content + '`;})',
  },
  {
    name: 'skip',
    type: 'replace',
    create: a => a.content,
  },
  {
    name: 'text',
    type: 'tag',
    create: a => `<input type="text" id="form-${a.attributes.name}" ${a.unused}/>`,
    ignore: 'type id',
    label: true,
  },
  {
    name: 'input',
    type: 'tag',
    create: a => `<input id="form-${a.attributes.name}" ${a.unused}/>`,
    ignore: 'label id',
    label: true,
  },
  {
    name: 'range',
    type: 'tag',
    create: a => `<input type="range" name="${a.attributes.name}" id="form-${a.attributes.name}" ${a.unused}/>`,
    ignore: 'label id type',
    label: true,
  },
  {
    name: 'date',
    type: 'tag',
    create: a => `<input type="date" name="${a.attributes.name}" id="form-${a.attributes.name}" ${a.unused}/>`,
    ignore: 'label id type',
    label: true,
  },
  {
    name: 'time',
    type: 'tag',
    create: a => `<input type="time" name="${a.attributes.name}" id="form-${a.attributes.name}" ${a.unused}/>`,
    ignore: 'label id type',
    label: true,
  },
  // {
  //   name: 'color',
  //   type: 'tag',
  //   create: a => `<div class="color-wrap">
  //   <input class="reset-input" value="${a.attributes.value}" name="${a.attributes.name}" id="form-${a.attributes.name}" placeholder="#XXXXXX"
  //   type="text" onkeyup="document.getElementById('color-${a.attributes.name}').value = this.value" ${a.unused}>
  //   <input id="color-${a.attributes.name}" value="${a.attributes.value}" type="color" onchange="document.getElementById('form-${a.attributes.name}').value = this.value">
  //   </div>`,
  //   ignore: ['label', 'id', 'onkeyup', 'value'],
  //   label: true,
  // },
  {
    name: 'color',
    type: 'tag',
    create: a => `<div class="input-color"><input value="${a.attributes.value}" type="color"><input value="${a.attributes.value||''}" name="${a.attributes.name}" id="form-${a.attributes.name}" placeholder="#XXXXXX" type="text" ${a.unused}></div>`,
    ignore: 'label id onkeyup value',
    label: true,
  },
  {
    name: 'select',
    type: 'tag',
    create: a => `<select name="${a.attributes.name}" id="form-${a.attributes.name}" ${a.unused}>
      \`+CommaLangArray(\`${a.attributes.options}\`, 'name', 'text', 'default').reduce((d, c) => d+'<option value="'+c.name+'" '+(c.default ? 'selected' : '')+' '+(c.name == 'disabled' ? 'disabled' : '')+'>'+c.text+'</option>', '')+\`
    </select>`,
    ignore: 'label id options',
    label: true,
  },
  {
    name: 'switch',
    type: 'tag',
    create: a => `<br><label class="switch">
    <input type="checkbox" name="${a.attributes.name}" id="form-${a.attributes.name}" ${a.unused}>
    <span class="slider"></span>
    </label><label for="form-${a.attributes.name}" class="switch-label">${a.attributes.label}</label>`
  },
  {
    name: 'checkbox',
    type: 'tag',
    create: a => `<label class="checkbox">
      <input type="checkbox" name="${a.attributes.name}" ${a.unused}>
      <span class="checkmark"></span>${a.attributes.label}
    </label>`,
    ignore: 'label id onchange',
  },
  {
    name: 'radio',
    type: 'tag',
    create: a => `${CommaLangArray(a.attributes.options, 'name', 'text', 'default').reduce((d, c) => {
      return d+`<label class="radio" ${a.unused}>
                  <input type="radio" value="${c.name}" name="${a.attributes.name}" ${c.default ? 'checked' : ''}>
                  <span class="checkmark"></span>${c.text}
                </label>`;
    }, '')}`,
    label: true,
  },
  {
    name: 'textarea',
    type: 'tag',
    create: a => `<textarea name="${a.attributes.name}" ${a.unused}>${a.content || a.attributes.value || ''}</textarea>`,
    label: true,
    ignore: 'value',
  },
  {
    name: 'button',
    type: 'tag',
    create: a => {
      let result = `<button
      class="${(a.attributes.b1?'b1':(a.attributes.b2?'b2':(a.attributes.b3?'b3':(a.attributes.b4?'b4':'b1'))))+(' '+a.attributes.class||'')}"
      ${a.unused}>${a.content || a.attributes.value}</button>`;
      if (a.attributes.center) result = '<div class="center">' + result + '</div>';
      return result;
    },
    ignore: 'class b1 b2 b3 b4'
  },

  {
    name: 'richtext',
    type: 'tag',
    create: a => {

    if(!LoadedMaterialIcons++){
      var link = document.createElement('link'); 
      link.rel = 'stylesheet'; 
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons'; 
      document.head.appendChild(link);
      console.log('hello');
    }
      
    return `<div class="richtext-outer">
    <div class="toolbar">
        <section><span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('justifyLeft')})" onclick="TextwriteFormat('justifyLeft')" title="align left" tabindex="0">format_align_left</span>
          <span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('justifyCenter')})" onclick="TextwriteFormat('justifyCenter')" title="align center" tabindex="0">format_align_center</span>
          <span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('justifyRight')})" onclick="TextwriteFormat('justifyRight')" title="align right" tabindex="0">format_align_right</span>
          <span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('justifyFull')})" onclick="TextwriteFormat('justifyFull')" title="align block" tabindex="0">format_align_justify</span></section>
        <section><span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('bold')})" onclick="TextwriteFormat('bold')" title="bold" tabindex="0">format_bold</span>
          <span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('italic')})" onclick="TextwriteFormat('italic')" title="italic" tabindex="0">format_italic</span>
          <span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('underline')})" onclick="TextwriteFormat('underline')" title="italic" tabindex="0">format_underlined</span>
          <span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('strikeThrough')})" onclick="TextwriteFormat('strikeThrough')" title="cross out" tabindex="0">format_strikethrough</span></section>
        <section><span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('cut')})" onclick="TextwriteFormat('cut')" title="cut text" tabindex="0">content_cut</span>
          <span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('copy')})" onclick="TextwriteFormat('copy')" title="copy text" tabindex="0">content_copy</span>
          <span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('paste')})" onclick="TextwriteFormat('paste')" title="paste text" tabindex="0">content_paste</span></section>
        <section><span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('insertunorderedlist')})" onclick="TextwriteFormat('insertunorderedlist')" title="list" tabindex="0">format_list_bulleted</span>
          <span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('insertOrderedlist')})" onclick="TextwriteFormat('insertOrderedlist')" title="numbered list tabindex=" 0""="">format_list_numbered</span></section>
        <section><span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('createLink', window.prompt('link url'))})" onclick="TextwriteFormat('createLink', window.prompt('link url'))" title="link" tabindex="0">link</span>
          <span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('insertImage', window.prompt('image url'))})" onclick="TextwriteFormat('insertImage', window.prompt('image url'))" title="image" tabindex="0">image</span>
          <span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('insertHTML', window.prompt('paste HTML code'))})" onclick="TextwriteFormat('insertHTML', window.prompt('paste HTML code'))" title="insert HTML" tabindex="0">code</span>
          <span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('removeFormat')})" onclick="TextwriteFormat('removeFormat')" title="remove formating" tabindex="0">format_clear</span></section>
        <section>
          <select name="font" onchange="TextwriteChangeFont(event)" id="font">
            <option value="" disabled="" selected=""></option>
            <option value="ubuntu, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'">System Font</option>
            <option value="inherit">Inherit (no font)</option>
            <option value="sans">Sans</option>
            <option value="sans-serif">Sans Serif</option>
            <option value="helvetica">helvetica</option>
          </select>
        </section>
        <section><span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('increaseFontSize')})" onclick="TextwriteFormat('increaseFontSize')" title="increase font size" tabindex="0">add</span>
          <span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('decreaseFontSize')})" onclick="TextwriteFormat('decreaseFontSize')" title="decrease font size" tabindex="0">remove</span></section>
        <section><span class="material-icons" onclick="TextwriteFormat('hiliteColor', 'yellow');TextwriteFormat('foreColor', 'black')" title="highlight" tabindex="0">palette</span>
          <span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('foreColor', 'red')})" onclick="TextwriteFormat('foreColor', 'red')" title="text color" tabindex="0">palette</span></section>

        <section><span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('undo')})" onclick="TextwriteFormat('undo')" title="undo">undo</span>
          <span class="material-icons" onkeypress="onEnter(() => {TextwriteFormat('redo')})" onclick="TextwriteFormat('redo')" title="redo">redo</span></section>
      </div>
      <div class="input-area" contenteditable tabindex="0" name="${a.attributes.name}" ${a.unused}>${a.content || a.attributes.value || ''}</div>
    </div>`},
    label: true,
    ignore: 'value',
  },
  {
    name: 'textwrite',
    type: 'tag',
    create: a => {

    if(!LoadedMaterialIcons++){
      var link = document.createElement('link'); 
      link.rel = 'stylesheet'; 
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons'; 
      document.head.appendChild(link);
      console.log('hello');
    }

    document.execCommand("enableObjectResizing", false);
    document.execCommand("enableInlineTableEditing", false);
    document.execCommand("enableAbsolutePositionEditor", false);
      
    return `<div class="textwrite-outer">
    <div class="toolbar">
        <section>
          <span class="material-icons" onclick="TextwriteFormat('bold')" title="bold" tabindex="0">format_bold</span>
          <span class="material-icons" onclick="TextwriteFormat('italic')" title="italic" tabindex="0">format_italic</span>
          <span class="material-icons" onclick="TextwriteFormat('underline')" title="italic" tabindex="0">format_underlined</span>
          <span class="material-icons" onclick="TextwriteFormat('strikeThrough')" title="cross out" tabindex="0">format_strikethrough</span>
          <span class="material-icons" onclick="TextwriteFormat('createLink', window.prompt('link url'))" title="link" tabindex="0">link</span>
          <span class="material-icons" onclick="TextwriteFormat('insertunorderedlist')" title="list" tabindex="0">format_list_bulleted</span>
          <span class="material-icons" onclick="TextwriteFormat('insertOrderedlist')" title="numbered list tabindex=" 0""="">format_list_numbered</span>
          <span class="material-icons" onclick="TextwriteFormat('formatBlock', '<h1>')" title="insert HTML" tabindex="0">title</span>
        </section>
      </div>
      <div class="input-area" contenteditable tabindex="0" name="${a.attributes.name}" ${a.unused}>${a.content || a.attributes.value || ''}</div>
    </div>`},
    label: true,
    ignore: 'value',
  }
];


// Global for blocks
let LoadedMaterialIcons = false;

function TextwriteFormat(command, value) {
  document.execCommand(command, false, value);
  console.log(event.target);
  event.target.parentElement.parentElement.parentElement.children[1].focus();
}

function TextwriteChangeFont(e) {
  TextwriteFormat('fontName', e.target.value);
}





function linkColorInputs(){
    let colorInputs = document.querySelectorAll('.input-color');

    colorInputs.forEach(function (outer) {
        outer.firstChild.onchange = el => el.target.nextSibling.value = el.target.value;
        outer.childNodes[1].onkeyup = el => el.target.previousSibling.value = el.target.value;
    })
}
linkColorInputs();
document.body.addEventListener('DOMSubtreeModified', linkColorInputs);