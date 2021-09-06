

function Temp(query) {
  let element =
    document.querySelector(query) ||
    console.error('Query "' + query + '" not found');

  let templates = getTemplates(query);

  if(templates.length == 0)templates = [{name:'default', text: element.innerHTML}]

  let template = templates[0].text;

  let variables = {};

  function update(template, variables) {
    if (typeof template === "object")
      [template, variables] = [variables, template];

    [template, variables] = [
      template || this.template,
      {...this.variables, ...variables} || this.variables,
    ];

    [this.variables, this.template] = 
      [variables, template];

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
      let result = {}
      names.forEach((name, i) => result[name] = values[i])
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
        element.getAttribute("data-value") || element.value || element.getAttribute("value"),
        event,
        element,
        );
      }
    )
  );
}

function getTemplates(query) {
  let result = [];
  document.querySelectorAll(query+'>script[type="text/template"]')
    .forEach((element) => {
    result.push({
      name: element.getAttribute("name"),
      text: element.innerHTML,
    })
  });
  return result;
}
