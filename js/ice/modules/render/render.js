
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
  textarea.innerHTML = html
  return textarea.value;
}

function ExcapeBracketsInSkipBlock(html) {
  let result = html;

  // {skip}{}{/skip} => {skip}&bl;&br;{/skip}
  let left = /({skip}.+?){(.+?{\/skip})/s;
  let right = /({skip}.+?)}(.+?{\/skip})/s;
  result = RegexReplaceAll(result, left, match =>
    match[1] + '&bl;' + match[2]);
  result = RegexReplaceAll(result, right, match =>
    match[1] + '&br;' + match[2]);

  return result;
}

function EncodeExcapedCharicters(html) {
  let result = html;

  result = result.replaceAll('\\', '\\\\') // \ => \\
    .replaceAll('{{', '&bl;')
    .replaceAll('}}', '&br;')
  return result;
}

function EndBlocks(template) {
  // {block/} => {block}{/block}
  let regex = /{((\w+)( [^}]+)?)\/}/s;
  return RegexReplaceAll(template, regex, match => {
    let [undefined, start, end] = match;
    return '{' + start + '}' + '{/' + end + '}';
  });
}

function FormatEvalBlocks(template) {
  // {js} -> {eval}js{/eval}
  let regex = /{(([^{/ ]*?)( [^{]*?)?)}(?!.*{\/\2}.*)/gs;
  return template.replace(regex, '{eval}$1{/eval}');
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
  let args = argument?.split(' ');
  let exportData = {
    argument,
    args,
    content,
    attributes
  };
  return replaceBlock(blockName, exportData);
}

function GetPerams(text) {
  let attributes = {}
  let regex = /(\w+)(?:="([^"]*?)")?/ // name="value" or name
  if (!text?.match(regex)) return {};
  let encoded = AttributeEncodeBoxBrackets(text);
  RegexReplaceAll(encoded, regex, match => {
    let [_, name, value] = match;
    attributes[name] = value || true;
    return '';
  });
  return attributes;
}

function AttributeEncodeBoxBrackets(text) {
  return text
    .replaceAll('[[', '&boxl;')
    .replaceAll(']]', '&boxr;')
    .replaceAll('[', '`+'+TryEvalTEXT.start)
    .replaceAll(']', TryEvalTEXT.end+'+`')
    .replaceAll('&boxl;', '[')
    .replaceAll('&boxr;', ']')
}

function DecodeBrackets(html) {
  return html.replaceAll('&bl;', '{')
    .replaceAll('&br;', '}')
    .replaceAll('&a;', '&')
}

function EvalTemplate(text, variables = {}) {
  let js = 'let result = `' + text + '\`; return result;';
  try {
    return Function(Object.keys(variables) + '', js)(...Object.values(variables))
  } catch (error) {
    console.error(js);
    console.error(error);
    console.error("Error Evaluating template: " + error.message + ': Line: ' + error.lineNumber + '\n\n' +
      text.split('\n')[error.lineNumber - 3] + '\n' + " ".repeat(error.columnNumber - 1) + '^\n');
    return '';
  }
}

function RegexReplaceAll(text, regex, getReplacement) {
  let limit = 1000;
  let result = text;
  while (result.match(regex) && --limit > 0) {
    let match = result.match(regex);
    result = result.replace(match[0], getReplacement(match))
  }
  limit > 1000 && console.error('RegexReplace: 1000 limit reached, loop may not have an end');
  return result;
}

let TryEval;
let ErrorTag = '<b style="color:#d22;outline:.2em solid #d22;background:#000">';
if(devMode){
  TryEval = {
    start:'(()=>{let RES;try{RES=',

    end:'}catch(e){RES = ErrorTag+e.message+\'</b>\'\
    ;console.error(e)} return nullify(RES)})()'
  };
  TryEvalTEXT = {
    start: "(()=>{let RES;try{RES=",
    end: "}catch(e){RES = ''\
    ;console.error(e)} return nullify(RES)})()",
  };
}

else{
  TryEvalTEXT = TryEval = {
    start:'(()=>{let RES;try{RES=',
    end:'}catch(e){} return nullify(RES)})()'
  };
}

function nullify(any){
  if(typeof any === "number")return any;
  else return any || '';
}
