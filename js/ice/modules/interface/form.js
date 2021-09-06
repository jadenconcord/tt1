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

function showValidationError(errors){
    errors.forEach(error => {
        let p = document.createElement('p');
        p.className = 'input-validation-error';
        p.textContent = error.message;
        error.element.parentNode.insertBefore(p, error.element.nextSibling);
    })
}

function removeValidationError(query){
    document.querySelectorAll(query + ' .input-validation-error').forEach(msg => msg.remove())
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