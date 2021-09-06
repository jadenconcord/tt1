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

  function show(template, variables ) {
    if (typeof template === "object")
      [template, variables] = [variables, template];

    [template, variables] = [
      template || this.template,
      { ...this.variables, ...variables } || this.variables,
    ];

    this.update(
      template + (options.closeIcon ? popupCloseIcon : ""),
      {...variables, close: 'popupList['+popupID+'].hide()'},
    );

    popup.style.display = "";
    openPopups++;

    if (options.lockScroll) document.body.style.overflowY = "hidden";

    
    this.focus();

    return this;
  }

  function focus(parent=this.element){
    let focused = 0;
    parent.childNodes.forEach((child) => {
      if (child.tabIndex == 0 && !focused++) child.focus();
      else if(!focused) focused = this.focus(child);
    });
    return focused;
  }

  function hide() {
    popup.style.display = "none";
    if (--openPopups <= 0) document.body.style.overflowY = "";
    this.trigger('hide');
    return this;
  }

  function remove(){
    popup.remove();
    return null;
  }

  result = { show, hide, remove, popup, alert, options, focus, ...temp };
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