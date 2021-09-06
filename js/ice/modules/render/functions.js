function CommaLangArray(text, forName = "name", forValue = "value", forDefault = "def") {
  let result = [];
  let matchValid = /^((,|^)!?\w+:[^,]+)+,?$/ // name:value,!name:value...
  let matchPair = /(!?)(\w+):([^,]+)/ // name:value

  if (!text.match(matchValid))return text;

  while (text.match(matchPair)) {
    let [pair, Default, name, value] = text.match(matchPair);
    result[result.length] = {
      [forName]: name,
      [forValue]: value,
      [forDefault]: Default == '!'
    };
    text = text.replace(pair, '')
  }
  return result;
}