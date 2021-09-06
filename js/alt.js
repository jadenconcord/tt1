// Sat Jun 12 02:29:51 PM PDT 2021
function CommaLangArray(
  text,
  forName = "name",
  forValue = "value",
  forDefault = "def"
) {
  let result = [];
  let matchValid = /^((,|^)!?\w+:[^,]+)+,?$/; // name:value,!name:value...
  let matchPair = /(!?)(\w+):([^,]+)/; // name:value

  if (!text.match(matchValid)) return text;

  while (text.match(matchPair)) {
    let [pair, Default, name, value] = text.match(matchPair);
    result[result.length] = {
      [forName]: name,
      [forValue]: value,
      [forDefault]: Default == "!",
    };
    text = text.replace(pair, "");
  }
  return result;
}

let devMode = localStorage.getItem("devMode");
console.log('ICE JS: run "ICE()" to open the homepage');

function ICE() {
  window.location = "ice";
}

function replaceBlock(blockName, exportData) {
  let block =
    TemplateBlocks.find((block) => block.name == blockName) || DefaultBlock;

  return BlockTypeActions[block.type](block, exportData);
}

let DefaultBlock;

if (devMode)
  DefaultBlock = {
    name: "default",
    type: "replace",
    create: (a) => ErrorTag + '"' + a.blockName + '" is not a valid block</b>',
  };
else
  DefaultBlock = { name: "default", type: "replace", create: (a) => a.content };

let BlockTypeActions = {
  replace: (block, exportData) =>
    block.create({ ...exportData, blockName: block.name }),
  run: (block, exportData) =>
    "`;try{" +
    block.create(exportData) +
    "}catch(e){console.error(e)};result+=`",
  eval: (block, exportData) =>
    "`;result += (" +
    TryEval.start +
    block.create(exportData) +
    TryEval.end +
    ");result+=`",
  tag: replaceBlockTag,
};

function replaceBlockTag(block, exportData) {
  let unused = GetUnusedAttribues(block, exportData);
  let result = "";

  if (block.label && exportData.attributes.label)
    result += `<label class="form-label" for="form-${exportData.attributes.name}">${exportData.attributes.label}</label>`;

  result += block.create({ unused, ...exportData });
  return result;
}

function GetUnusedAttribues(block, exportData) {
  let result = "";
  block.ignore = block.ignore?.split ? block?.ignore?.split(" ") : [];
  Object.keys(exportData.attributes).forEach((name) => {
    if (!block?.ignore?.find((a) => a == name))
      result += ` ${name}="${exportData.attributes[name]}"`;
  });
  return result;
}

let TemplateBlocks = [
  {
    name: "if",
    type: "replace",
    create: (a) =>
      `\`;if(${TryEval.start}${a.argument}${TryEval.end}){result+=\`${a.content}\`};result+=\``,
  },
  {
    name: "eval",
    type: "eval",
    create: (a) => a.content,
  },
  {
    name: "run",
    type: "run",
    create: (a) => a.content,
  },
  {
    name: "repeat",
    type: "run",
    create: (a) => {
      let i = a.args[1] || "i";
      return (
        "for(let " +
        i +
        "=1; " +
        i +
        "<" +
        (Number(a.args[0]) + 1) +
        "; " +
        i +
        "++){result+=`" +
        a.content +
        "`;}"
      );
    },
  },
  {
    name: "each",
    type: "run",
    create: (a) =>
      a.args[0] +
      ".forEach((" +
      a.args[1] +
      (a.args[2] ? "," + a.args[2] : "") +
      ")\
       => {result+=`" +
      a.content +
      "`;})",
  },
  {
    name: "skip",
    type: "replace",
    create: (a) => a.content,
  },
  {
    name: "text",
    type: "tag",
    create: (a) =>
      `<input type="text" id="form-${a.attributes.name}" ${a.unused}/>`,
    ignore: "type id",
    label: true,
  },
  {
    name: "input",
    type: "tag",
    create: (a) => `<input id="form-${a.attributes.name}" ${a.unused}/>`,
    ignore: "label id",
    label: true,
  },
  {
    name: "range",
    type: "tag",
    create: (a) =>
      `<input type="range" name="${a.attributes.name}" id="form-${a.attributes.name}" ${a.unused}/>`,
    ignore: "label id type",
    label: true,
  },
  {
    name: "date",
    type: "tag",
    create: (a) =>
      `<input type="date" name="${a.attributes.name}" id="form-${a.attributes.name}" ${a.unused}/>`,
    ignore: "label id type",
    label: true,
  },
  {
    name: "time",
    type: "tag",
    create: (a) =>
      `<input type="time" name="${a.attributes.name}" id="form-${a.attributes.name}" ${a.unused}/>`,
    ignore: "label id type",
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
    name: "color",
    type: "tag",
    create: (a) =>
      `<div class="input-color"><input value="${
        a.attributes.value
      }" type="color"><input value="${a.attributes.value || ""}" name="${
        a.attributes.name
      }" id="form-${a.attributes.name}" placeholder="#XXXXXX" type="text" ${
        a.unused
      }></div>`,
    ignore: "label id onkeyup value",
    label: true,
  },
  {
    name: "select",
    type: "tag",
    create: (
      a
    ) => `<select name="${a.attributes.name}" id="form-${a.attributes.name}" ${a.unused}>
      \`+CommaLangArray(\`${a.attributes.options}\`, 'name', 'text', 'default').reduce((d, c) => d+'<option value="'+c.name+'" '+(c.default ? 'selected' : '')+' '+(c.name == 'disabled' ? 'disabled' : '')+'>'+c.text+'</option>', '')+\`
    </select>`,
    ignore: "label id options",
    label: true,
  },
  {
    name: "switch",
    type: "tag",
    create: (a) => `<br><label class="switch">
    <input type="checkbox" name="${a.attributes.name}" id="form-${a.attributes.name}" ${a.unused}>
    <span class="slider"></span>
    </label><label for="form-${a.attributes.name}" class="switch-label">${a.attributes.label}</label>`,
  },
  {
    name: "checkbox",
    type: "tag",
    create: (a) => `<label class="checkbox">
      <input type="checkbox" name="${a.attributes.name}" ${a.unused}>
      <span class="checkmark"></span>${a.attributes.label}
    </label>`,
    ignore: "label id onchange",
  },
  {
    name: "radio",
    type: "tag",
    create: (a) =>
      `${CommaLangArray(a.attributes.options, "name", "text", "default").reduce(
        (d, c) => {
          return (
            d +
            `<label class="radio" ${a.unused}>
                  <input type="radio" value="${c.name}" name="${
              a.attributes.name
            }" ${c.default ? "checked" : ""}>
                  <span class="checkmark"></span>${c.text}
                </label>`
          );
        },
        ""
      )}`,
    label: true,
  },
  {
    name: "textarea",
    type: "tag",
    create: (a) =>
      `<textarea name="${a.attributes.name}" ${a.unused}>${
        a.content || a.attributes.value || ""
      }</textarea>`,
    label: true,
    ignore: "value",
  },
  {
    name: "button",
    type: "tag",
    create: (a) => {
      let result = `<button
      class="${
        (a.attributes.b1
          ? "b1"
          : a.attributes.b2
          ? "b2"
          : a.attributes.b3
          ? "b3"
          : a.attributes.b4
          ? "b4"
          : "b1") + (" " + a.attributes.class || "")
      }"
      ${a.unused}>${a.content || a.attributes.value}</button>`;
      if (a.attributes.center)
        result = '<div class="center">' + result + "</div>";
      return result;
    },
    ignore: "class b1 b2 b3 b4",
  },

  {
    name: "richtext",
    type: "tag",
    create: (a) => {
      if (!LoadedMaterialIcons++) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
        document.head.appendChild(link);
        console.log("hello");
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
      <div class="input-area" contenteditable tabindex="0" name="${
        a.attributes.name
      }" ${a.unused}>${a.content || a.attributes.value || ""}</div>
    </div>`;
    },
    label: true,
    ignore: "value",
  },
  {
    name: "textwrite",
    type: "tag",
    create: (a) => {
      if (!LoadedMaterialIcons++) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
        document.head.appendChild(link);
        console.log("hello");
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
      <div class="input-area" contenteditable tabindex="0" name="${
        a.attributes.name
      }" ${a.unused}>${a.content || a.attributes.value || ""}</div>
    </div>`;
    },
    label: true,
    ignore: "value",
  },
];

// Global for blocks
let LoadedMaterialIcons = false;

function TextwriteFormat(command, value) {
  document.execCommand(command, false, value);
  console.log(event.target);
  event.target.parentElement.parentElement.parentElement.children[1].focus();
}

function TextwriteChangeFont(e) {
  TextwriteFormat("fontName", e.target.value);
}

function linkColorInputs() {
  let colorInputs = document.querySelectorAll(".input-color");

  colorInputs.forEach(function (outer) {
    outer.firstChild.onchange = (el) =>
      (el.target.nextSibling.value = el.target.value);
    outer.childNodes[1].onkeyup = (el) =>
      (el.target.previousSibling.value = el.target.value);
  });
}
linkColorInputs();
document.body.addEventListener("DOMSubtreeModified", linkColorInputs);
function RenderTemplate(template, variables) {
  let result = template;

  // &copy; -> ©
  // result = DecodeHTML(result); // Only needed for <template> tag

  // {skip}{}{/skip} => {skip}&bl;&br;{/skip}
  result = ExcapeBracketsInSkipBlock(result);

  // \ {{ }} => \\ { }
  result = EncodeExcapedCharicters(result);

  // {block/} => {block}{/block}
  result = EndBlocks(result);

  // {js} -> {eval}js{/eval}
  result = FormatEvalBlocks(result);

  // {button}{/button} => <button></button>
  result = RenderBlocks(result);

  // &bl;&br; => {}
  result = DecodeBrackets(result);

  // 1+1 => 2
  result = EvalTemplate(result, variables);

  return result;
}

function DecodeHTML(html) {
  let textarea = document.createElement("textarea");
  textarea.innerHTML = html;
  return textarea.value;
}

function ExcapeBracketsInSkipBlock(html) {
  let result = html;

  // {skip}{}{/skip} => {skip}&bl;&br;{/skip}
  let left = /({skip}.+?){(.+?{\/skip})/s;
  let right = /({skip}.+?)}(.+?{\/skip})/s;
  result = RegexReplaceAll(
    result,
    left,
    (match) => match[1] + "&bl;" + match[2]
  );
  result = RegexReplaceAll(
    result,
    right,
    (match) => match[1] + "&br;" + match[2]
  );

  return result;
}

function EncodeExcapedCharicters(html) {
  let result = html;

  result = result
    .replaceAll("\\", "\\\\") // \ => \\
    .replaceAll("{{", "&bl;")
    .replaceAll("}}", "&br;");
  return result;
}

function EndBlocks(template) {
  // {block/} => {block}{/block}
  let regex = /{((\w+)( [^}]+)?)\/}/s;
  return RegexReplaceAll(template, regex, (match) => {
    let [undefined, start, end] = match;
    return "{" + start + "}" + "{/" + end + "}";
  });
}

function FormatEvalBlocks(template) {
  // {js} -> {eval}js{/eval}
  let regex = /{(([^{/ ]*?)( [^{]*?)?)}(?!.*{\/\2}.*)/gs;
  return template.replace(regex, "{eval}$1{/eval}");
}

function RenderBlocks(template) {
  // {block arguments}content{/block}
  let regex = /{(\w+)(?: ([^}]+))?}((?!.*{(\w+)( [^}]+)?}.*{\/\4}.*).*){\/\1}/s;
  return RegexReplaceAll(template, regex, RenderBlock);
}

function RenderBlock(match) {
  // {blockname argument}content{/blockname}
  let [undefined, blockName, argument, content] = match;
  let attributes = GetPerams(argument);
  let args = argument?.split(" ");
  let exportData = {
    argument,
    args,
    content,
    attributes,
  };
  return replaceBlock(blockName, exportData);
}

function GetPerams(text) {
  let attributes = {};
  let regex = /(\w+)(?:="([^"]*?)")?/; // name="value" or name
  if (!text?.match(regex)) return {};
  let encoded = AttributeEncodeBoxBrackets(text);
  RegexReplaceAll(encoded, regex, (match) => {
    let [_, name, value] = match;
    attributes[name] = value || true;
    return "";
  });
  return attributes;
}

function AttributeEncodeBoxBrackets(text) {
  return text
    .replaceAll("[[", "&boxl;")
    .replaceAll("]]", "&boxr;")
    .replaceAll("[", "`+" + TryEvalTEXT.start)
    .replaceAll("]", TryEvalTEXT.end + "+`")
    .replaceAll("&boxl;", "[")
    .replaceAll("&boxr;", "]");
}

function DecodeBrackets(html) {
  return html
    .replaceAll("&bl;", "{")
    .replaceAll("&br;", "}")
    .replaceAll("&a;", "&");
}

function EvalTemplate(text, variables = {}) {
  let js = "let result = `" + text + "`; return result;";
  try {
    return Function(
      Object.keys(variables) + "",
      js
    )(...Object.values(variables));
  } catch (error) {
    console.error(js);
    console.error(error);
    console.error(
      "Error Evaluating template: " +
        error.message +
        ": Line: " +
        error.lineNumber +
        "\n\n" +
        text.split("\n")[error.lineNumber - 3] +
        "\n" +
        " ".repeat(error.columnNumber - 1) +
        "^\n"
    );
    return "";
  }
}

function RegexReplaceAll(text, regex, getReplacement) {
  let limit = 1000;
  let result = text;
  while (result.match(regex) && --limit > 0) {
    let match = result.match(regex);
    result = result.replace(match[0], getReplacement(match));
  }
  limit > 1000 &&
    console.error("RegexReplace: 1000 limit reached, loop may not have an end");
  return result;
}

let TryEval;
let ErrorTag = '<b style="color:#d22;outline:.2em solid #d22;background:#000">';
if (devMode) {
  TryEval = {
    start: "(()=>{let RES;try{RES=",

    end: "}catch(e){RES = ErrorTag+e.message+'</b>'\
    ;console.error(e)} return nullify(RES)})()",
  };
  TryEvalTEXT = {
    start: "(()=>{let RES;try{RES=",
    end: "}catch(e){RES = ''\
    ;console.error(e)} return nullify(RES)})()",
  };
} else {
  TryEvalTEXT = TryEval = {
    start: "(()=>{let RES;try{RES=",
    end: "}catch(e){} return nullify(RES)})()",
  };
}

function nullify(any) {
  if (typeof any === "number") return any;
  else return any || "";
}

function Temp(query) {
  let element =
    document.querySelector(query) ||
    console.error('Query "' + query + '" not found');

  let templates = getTemplates(query);

  if (templates.length == 0)
    templates = [{ name: "default", text: element.innerHTML }];

  let template = templates[0].text;

  let variables = {};

  function update(template, variables) {
    if (typeof template === "object")
      [template, variables] = [variables, template];

    [template, variables] = [
      template || this.template,
      { ...this.variables, ...variables } || this.variables,
    ];

    [this.variables, this.template] = [variables, template];

    this.write(RenderTemplate(template, variables));

    return this;
  }

  function write(html) {
    this.element.innerHTML = html;
    enableTriggers(this);
    return this;
  }

  function data() {
    return GetFormData(this.element);
  }

  function validate() {
    let errors = validateForm(this.element);
    removeValidationError(this.query);
    showValidationError(errors);
    return errors;
  }

  function isValid() {
    return validateForm(this.element).length === 0;
  }

  function link(...names) {
    return (...values) => {
      let result = {};
      names.forEach((name, i) => (result[name] = values[i]));
      this.update(result);
    };
  }

  function on(eventName, func) {
    if (func) return (this.resolvers[eventName] = func) && this;
    else return new Promise((resolve) => (this.resolvers[eventName] = resolve));
  }

  function trigger(eventName, value, event, element) {
    if (this.resolvers[eventName])
      this.resolvers[eventName]({ event, element, value, temp: this });
    return this;
  }

  function setTemplate(name) {
    this.template = this.templates.find(
      (template) => template.name == name
    ).text;
    return this;
  }

  return {
    element,
    query,
    template,
    templates,
    setTemplate,
    variables,
    write,
    update,
    data,
    validate,
    isValid,
    link,
    on,
    trigger,
    resolvers: [],
  };
}

function enableTriggers(temp) {
  let elements = document.querySelectorAll(
    temp.query + " [trigger]," + temp.query + " [data-trigger]"
  );
  elements.forEach((element) =>
    element.addEventListener(
      element.getAttribute("triggerevent") || "click",
      (event) => {
        temp.trigger(
          element.getAttribute("trigger") ||
            element.getAttribute("data-trigger"),
          element.getAttribute("data-value") ||
            element.value ||
            element.getAttribute("value"),
          event,
          element
        );
      }
    )
  );
}

function getTemplates(query) {
  let result = [];
  document
    .querySelectorAll(query + '>script[type="text/template"]')
    .forEach((element) => {
      result.push({
        name: element.getAttribute("name"),
        text: element.innerHTML,
      });
    });
  return result;
}
let openPopups = 0;
let popupList = [];

function Popup(options = {}, template = "") {
  let result = {};
  options = {
    closeBlur: true,
    closeIcon: true,
    lockScroll: true,
    width: undefined,
    height: undefined,
    ...options,
  };

  let { popup, id } = GeneratePopup(options, template);
  let temp = Temp("#" + id);

  function show(template, variables) {
    if (typeof template === "object")
      [template, variables] = [variables, template];

    [template, variables] = [
      template || this.template,
      { ...this.variables, ...variables } || this.variables,
    ];

    this.update(template + (options.closeIcon ? popupCloseIcon : ""), {
      ...variables,
      close: "popupList[" + popupID + "].hide()",
    });

    popup.style.display = "";
    openPopups++;

    if (options.lockScroll) document.body.style.overflowY = "hidden";

    focusChildren(this.element);

    return this;
  }

  function hide() {
    popup.style.display = "none";
    if (--openPopups <= 0) document.body.style.overflowY = "";
    this.trigger("hide");
    return this;
  }

  function remove() {
    popup.remove();
    return null;
  }

  result = { show, hide, remove, popup, alert, options, ...temp };
  popup.firstElementChild.popup = result;
  let popupID = popupList.push(result) - 1;
  return result;
}

let popupCloseIcon = `<button class="b-icon close-icon" onclick="this.parentElement.popup.hide()">
        <svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	    width="1rem" height="1rem" viewBox="0 0 348.333 348.334" style="enable-background:new 0 0 348.333 348.334;"
	    xml:space="preserve"><path d="M336.559,68.611L231.016,174.165l105.543,105.549c15.699,15.705,15.699,41.145,0,56.85
		c-7.844,7.844-18.128,11.769-28.407,11.769c-10.296,0-20.581-3.919-28.419-11.769L174.167,231.003L68.609,336.563
		c-7.843,7.844-18.128,11.769-28.416,11.769c-10.285,0-20.563-3.919-28.413-11.769c-15.699-15.698-15.699-41.139,0-56.85
		l105.54-105.549L11.774,68.611c-15.699-15.699-15.699-41.145,0-56.844c15.696-15.687,41.127-15.687,56.829,0l105.563,105.554
		L279.721,11.767c15.705-15.687,41.139-15.687,56.832,0C352.258,27.466,352.258,52.912,336.559,68.611z"/></svg></button>`;

let popupCount = 0;

function GeneratePopup(options, template) {
  let popup = document.createElement("div");
  let section = document.createElement("section");
  let templateElement = document.createElement("script");
  let id = "popup" + ++popupCount;

  popup.appendChild(section);
  popup.classList.add("popup");
  popup.style.display = "none";

  section.classList.add("box");
  section.style.position = "relative";
  section.id = id;

  templateElement.type = "text/template";
  templateElement.innerHTML = template;

  options = setPopupSize(options, section);

  if (options.closeBlur) {
    popup.addEventListener("click", (e) => {
      if (e.target.classList.contains("popup"))
        e.target.firstElementChild.popup.hide();
    });
  }

  section.appendChild(templateElement);
  document.body.appendChild(popup);

  return { popup, id };
}

function setPopupSize(options, section) {
  if (options.width)
    section.style.width =
      typeof options.width == "number"
        ? options.width / 16 + "rem"
        : optoins.width;
  if (options.height)
    section.style.height =
      typeof options.height == "number"
        ? options.height / 16 + "rem"
        : options.height;
  return options;
}

function focusChildren(parent) {
  let focused = 0;
  parent.childNodes.forEach((child) => {
    if (child.tabIndex == 0 && !focused++) child.focus();
    else if (!focused) focused = focusChildren(child);
  });
  return focused;
}
function validateForm(container) {
  let result = [];
  container.childNodes.forEach((el) => {
    if (el.validity?.valid == false)
      result.push({
        message: el.validationMessage,
        element: el,
        validity: el.validity,
      });

    if (!el.validity && el.childNodes.length > 0) {
      let innerValidity = validateForm(el);
      if (innerValidity.length) result = [...result, innerValidity];
    }
  });
  return result;
}

function showValidationError(errors) {
  errors.forEach((error) => {
    let p = document.createElement("p");
    p.className = "input-validation-error";
    p.textContent = error.message;
    error.element.parentNode.insertBefore(p, error.element.nextSibling);
  });
}

function removeValidationError(query) {
  document
    .querySelectorAll(query + " .input-validation-error")
    .forEach((msg) => msg.remove());
}

function GetFormData(container) {
  var result = {};
  container.childNodes.forEach((el) => {
    let data = GetElementData(el);
    if (data) result[data.name] = data.value;
    else if (el.hasChildNodes())
      result = {
        ...result,
        ...GetFormData(el),
      };
  });
  return result;
}

function GetElementData(el) {
  let methodResult;
  FormValueMethods.forEach((method) => {
    if (method.tags && !method.tags.every((tag) => el.tagName != tag))
      methodResult = method;
    else if (method.condition && method.condition(el)) methodResult = method;
  });
  return (
    methodResult && {
      name: methodResult.name(el),
      value: methodResult.value(el),
    }
  );
}

let FormValueMethods = [
  {
    tags: ["INPUT", "TEXTAREA"],
    name: (el) => el.name || "undefined",
    value: (el) => el.value,
  },
  {
    tags: ["SELECT"],
    name: (el) => el.name || "undefined",
    value: (el) => el.options[el.selectedIndex].value,
  },
  {
    condition: (el) =>
      el?.classList?.contains("checkbox") || el?.classList?.contains("switch"),
    name: (el) => el.firstElementChild?.name || "undefined",
    value: (el) => el.firstElementChild?.checked,
  },
  {
    condition: (el) =>
      el?.classList?.contains("radio") && el.firstElementChild.checked,
    name: (el) => el.firstElementChild.name || "undefined",
    value: (el) => el.firstElementChild.value,
  },
  {
    condition: (el) => el?.classList?.contains("input-color"),
    name: (el) => el.firstElementChild.name || "undefined",
    value: (el) => el.firstElementChild.value,
  },
];
