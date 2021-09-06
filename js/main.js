

async function start(){
  let passkey = localStorage.getItem('task-passkey');
  if(passkey){
    let pop = Popup({closeIcon: false, closeBlur: false}).show('Loading...');
    await fetch("https://gossamer-second-galleon.glitch.me/wakeup");
    let data = await globalStorage.getItem(passkey);
    data = Object.values(data);
    pages = data;
    changePage(0);
    pop.hide();
  }
  else{
    welcome();
    await fetch("https://gossamer-second-galleon.glitch.me/wakeup");
  }
}

async function login(passkey){
  localStorage.setItem('task-passkey', passkey);
  await globalStorage.setItem(passkey, defaultPages);
  await start();
}

function logout(){
  localStorage.removeItem('task-passkey');
  window.location.reload();
}

async function backup() {
  let passkey = localStorage.getItem('task-passkey');
  await globalStorage.setItem(passkey, pages);
}

setInterval(() => {
  backup();
}, 500);

start()



// Init / Global

let currentPage = 0;

defaultPages = [
  {
    name: "home",
    icon: "home",
    template: "home",
    groups: [],
  },
  // {
  //   name: "calendar",
  //   icon: "calendar_today",
  //   template: "calendar",
  //   groups: [],
  // },
];

pages = [];

document.body.classList.add(localStorage.getItem("themeColor") || "dark");

let sidebar = Temp("body>aside>nav");
let content = Temp("body>.content>main");

////////////---//
// PAGE ///---//
//////////---//

sidebar.on("change", ({ value }) => changePage(value));
content.on("deletePage", () => deletePage());
content.on("editPage", editPage);

let page;
function changePage(pageID) {
  page = pages[pageID];
  currentPage = pageID;
  cleanTasks();
  pages.forEach((item, i) => (item.active = i == pageID));
  sidebar.update({ pages });
  if (pages.length == 0) return content.write("");
  content.setTemplate(page.template || "category");
  content.update({ page, pageID, category: "" });

  if ((page.template == "category"))
    document.querySelector('[name="name"]').focus();
  if (page.template == "calendar")
    document.body.classList.add('full-content')
  else document.body.classList.remove('full-content');

  document.body.classList.add("focus-content");
}

function cleanTasks() {
  pages.forEach((item) =>
    item.groups.forEach((group) => {
      var i = 0;
      while (i < group.tasks.length) {
        if (group.tasks[i].check) group.tasks.splice(i, 1);
        else ++i;
      }
    })
  );
}

async function deletePage(pageID = currentPage) {
  let pop = Popup(
    {},
    `
    <h3>Delete Category ${pages[pageID].name}?</h3>
    <div class="text-center">
      {button b2 trigger="confirm"}Delete{/button}
      {button b4 onclick="[close]"}Cancel{/button}
    </div>
  `
  ).show();

  await pop.on("confirm");
  pop.remove();
  pages.splice(pageID, 1);
  changePage(0);
}

function promptAddSection() {
  let popup = Popup(
    {},
    `
    <h2>Add Category</h2>
    {text name="name" label="Category Name" placeholder="e.g. School, Work, Projects" required/}<br><br>
    <button class="b1" trigger="selectIcon">Select Icon</button>
    {input type="hidden" name="icon" placeholder="custom icon" style="width:150px"/}<br><br>
    {button b2 block trigger="submit"}Create{/button}
  `
  ).show();

  popup.on("selectIcon", async ({ element }) => {
    let icon = await selectIcon();
    element.nextElementSibling.value = icon;
    element.innerHTML = `Select Icon <span class="material-icons">${icon}</span>`;
  });

  popup.on("submit", () => {
    if (!popup.validate().length) {
      addSection(popup.data());
      popup.remove();
    }
  });
}

async function editPage() {
  let page = pages[currentPage];
  let popup = Popup(
    {},
    `
    <h2>Edit Category</h2>
    {text name="name" label="Category Name" placeholder="[name]" value="[name]"/}<br><br>
    <button class="b1" trigger="selectIcon">Select Icon <span class="material-icons">{icon}</span></button>
    {input type="hidden" name="icon" placeholder="custom icon" style="width:150px" value="[icon]"/}<br><br>
    {button b2 block trigger="submit"}Save{/button}
  `
  ).show({ ...page });

  popup.on("selectIcon", async ({ element }) => {
    let icon = await selectIcon();
    element.nextElementSibling.value = icon;
    element.innerHTML = `Select Icon <span class="material-icons">${icon}</span>`;
  });

  await popup.on("submit");
  let data = popup.data();
  page.name = data.name;
  page.icon = data.icon;
  changePage(currentPage);
  return popup.remove();
}

function addSection({ name, icon }) {
  name = name.toLowerCase();
  pages.push({
    name: name,
    icon,
    groups: [],
  });
  changePage(pages.findIndex((item) => item.name == name));
}

//////////////-/\-\
// TRIGGERS /-/  \-\
////////////-/====\-\

content.on("toggle", ({ element, value }) => {
  document.querySelector("#" + value).style.display = element.checked
    ? "block"
    : "none";
});

//////////////////// /_/_/_/
// SUB-CATEGORIES / /_/_/_/
////////////////// /_/_/_/

content.on("editGroup", editGroup);
content.on("moveGroup", moveGroup);
content.on("deleteGroup", deleteGroup);

content.on("toggleGroup", ({ element, value, event }) => {
  setTimeout(() => {
    pages[currentPage].groups[value].closed = !element.parentElement.open;
  }, 0);
});

async function deleteGroup({ value }) {
  let group = pages[currentPage].groups[value];
  let pop = Popup(
    {},
    `
    <h3>Delete Sub-Category ${group.name}?</h3>
    <div class="text-center">
      {button b2 trigger="confirm"}Delete{/button}
      {button b4 onclick="[close]"}Cancel{/button}
    </div>
  `
  ).show();

  await pop.on("confirm");
  pop.remove();
  pages[currentPage].groups.splice(value, 1);
  changePage(currentPage);
}

async function editGroup({ value }) {
  let group = pages[currentPage].groups[value];
  let pop = Popup(
    {},
    `<h3>Edit Sub-Category</h3>
  {text label="Sub-Category Name" name="groupName" placeholder="[name]" value="[name]"/}
  <button class="b2" trigger="submit">Save</button>`
  ).show({ name: group.name });
  await pop.on("submit");
  let data = pop.data();
  group.name = data.groupName.toLowerCase();
  changePage(currentPage);
  pop.remove();
}

async function moveGroup({ value }) {
  let group = pages[currentPage].groups[value];
  let groups = pages[currentPage].groups;
  let pop = Popup(
    {},
    `
    <h3>Move Sub-Category ${group.name}?</h3>
    <label class="form-label" for="form-page">Select Category</label>
    <select name="page" id="form-page" label="Select Category" name="page" options="!disabled:Select Option,1:one">
      {each pages page pageID}
      <option value="{pageID}">{page.name}</option>
      {/each}
    </select>
    {button b2 trigger="move"}Move{/button}
  `
  ).show();

  await pop.on("move");
  pages.find((page, i) => i == pop.data().page).groups.push(group);
  pages[currentPage].groups.splice(value, 1);
  pop.remove();
  changePage(currentPage);
}

function findGroup(category) {
  return pages[currentPage].groups.find(
    (group) => group.name.toLowerCase() == category.toLowerCase()
  );
}

function addGroup(name) {
  pages[currentPage].groups.push({ name, tasks: [] });
}

/////////////=\\
// TASKS ///===\\
///////////=====\\

content.on("checkTask", ({ element, value }) => {
  let group = element.getAttribute("group");
  let pageID = element.getAttribute("page") || currentPage;
  let task = value;
  if (element.textContent == "check_box") {
    element.textContent = "check_box_outline_blank";
    pages[pageID].groups[group].tasks[task].check = false;
    element.parentElement.parentElement.insertBefore(
      element.parentElement,
      element.parentElement.parentElement.firstElementChild
    );
    setTimeout(() => {
      element.parentElement.classList.remove("checked");
    }, 10);
  } else {
    element.textContent = "check_box";
    pages[pageID].groups[group].tasks[task].check = true;
    element.parentElement.parentElement.append(element.parentElement);
    setTimeout(() => {
      element.parentElement.classList.add("checked");
    }, 10);
  }
});

content.on("setToday", ({ element, value }) => {
  let pageID = element.getAttribute("page") || currentPage;
  let task =
    pages[pageID].groups[element.getAttribute("group")].tasks[value];
  element.classList.toggle("on");
  task.today = !task.today;
});

content.on("addTaskFromGroup", ({ value }) => {
  content.update();
  document.querySelector('[name="category"]').value = value;
  document.querySelector('[name="name"]').focus();
});

content.on("addTask", () => {
  submitTask();
});

content.on("addTaskInput", ({ event }) => {
  if (event.keyCode === 13) content.trigger("addTask");
});

content.on("navigateTask", ({ event }) => {
  if (event.target.type == "date") return;

  let next;
  if (event.keyCode == 38) {
    // UP
    next = event.target.offsetParent.previousElementSibling;
    event.preventDefault();
  } else if (event.keyCode == 40) {
    // DOWN
    next = event.target.offsetParent.nextElementSibling;
    event.preventDefault();
  }
  if (next?.classList.contains("task")) {
    let children = [...next.childNodes, ...next.lastElementChild.childNodes];
    children.forEach((child) => {
      if (
        child.getAttribute &&
        child.getAttribute("item") == event.target.getAttribute("item")
      )
        child.focus();
    });
  }
});

content.on("renameTask", ({ value, element }) => {
  let pageID = element.getAttribute("page") || currentPage;
  let group = pages[pageID].groups[element.getAttribute("group")];
  let task = group.tasks.find((task, i) => i == value);
  task.name = element.innerText;
});

content.on("editTask", async ({ value, element }) => {
  let pageID = element.getAttribute("page") || currentPage;
  let group = pages[pageID].groups[element.getAttribute("group")];
  let task = group.tasks[value];
  let pop = Popup().show(
    `
    <h3>Edit Task</h3>
    {text maxlength="38" label="Task Name" name="name2" placeholder="[name]" value="[name]" required/}
    <br><br>
    {checkbox name="hasDate2" trigger="toggle" value="edit-date-input-section" triggerevent="change" label="Has a Date"/}
    <div class="indent {hasDate ? '' : 'hide'}" id="edit-date-input-section">
        {date value="[date]" name="date2"/}<br><br>
        {checkbox name="hasRepeat2" trigger="toggle" value="edit-repeat-input-section" triggerevent="change" label="Repeat"/}
        <div class="indent {hasRepeat ? '' : 'hide'}" id="edit-repeat-input-section">
            {select name="repeatTimes2" options="disabled:Select Repeat Times,daily:Every Day,weekly:Every Week,other:Every Other Week,yearly:Every Year,weekday:Each Weekday,monthly:Every Month"/}
        </div>
    </div><br>
    {button b2 trigger="save"}Save{/button}
  `,
    { ...task }
  );

  document.querySelector('[name="repeatTimes2"]').value = task.repeatTimes;
  if (task.hasDate) document.querySelector('[name="hasDate2"]').checked = true;
  if (task.hasRepeat)
    document.querySelector('[name="hasRepeat2"]').checked = true;

  pop.on("toggle", ({ element, value }) => {
    document.querySelector("#" + value).style.display = element.checked
      ? "block"
      : "none";
  });
  pop.on("hide", () => pop.remove());

  await pop.on("save");

  let data = pop.data();
  group.tasks[value] = {
    ...group.tasks[value],
    name: data.name2,
    hasDate: data.hasDate2,
    date: data.date2,
    hasRepeat: data.hasRepeat2,
    repeatTimes: data.repeatTimes2,
  };
  content.update();

  pop.remove();
});

content.on("moveTask", async ({ value, element }) => {
  let pageID = element.getAttribute("page") || currentPage;
  let groups = pages[pageID].groups;
  let group = groups[element.getAttribute("group")];
  let task = group.tasks[value];

  let pop = Popup(
    {},
    `
    <h3>Move Task</h3>
    <label class="form-label" for="form-page">Select Group</label>
    <select name="group" id="form-group" label="Select Group">
      {each groups group groupID}
      <option value="{groupID}">{group.name}</option>
      {/each}
    </select>
    {button b2 trigger="move"}Move{/button}
  `
  ).show({ groups });

  await pop.on("move");

  groups[pop.data().group].tasks.push(task);
  group.tasks.splice(value, 1);
  pop.remove();
  changePage(currentPage);
});

content.on("updateDate", ({ element, value }) => {
  let pageID = element.getAttribute("page") || currentPage;
  let groupID = element.getAttribute("group");
  pages[pageID].groups[groupID].tasks[value].date = element.value;
});

function generateTasks(values){
  let template = document.querySelector('#tasks-temp').innerHTML;
  return RenderTemplate(template, values);
}

function submitTask() {
  let data = content.data();
  addTask(data);
  let group = findGroup(data.category);
  group.closed = false;
  content.update({ category: data.category });
  document.querySelector('[name="name"]').focus();
}

function addTask(data) {
  if (!findGroup(data.category)) addGroup(data.category);
  if (data.name) findGroup(data.category).tasks.push(data);
}

function sortChecked(tasks) {
  return tasks.sort((a, b) => {
    return a.check === b.check ? 0 : b.check ? -1 : 1;
  });
}


let defaultTasks;
function getDefaultTasks() {
  let result;
  let group = pages[currentPage].groups.find((group) => group.name == "");
  let groupID = pages[currentPage].groups.findIndex((g) => g == group);
  tasks = sortChecked(group.tasks);
  result = { tasks, group, groupID };
  defaultTasks = result;
  return result;
}

let filteredTasks;
function filterAllTasks(condition){
  let result = [];
  pages.forEach((page, taskPageID) => {
    page.groups.forEach((group, groupID) => {
      group.tasks.forEach((task, taskID) => {
        if(condition({page, group, task}))
          result.push({...task, page, group, groupID, taskPageID, taskID});
      })
    })
  })
  filteredTasks = result;
  return result;
}



////////////////../.|.\.\..
// CALENDAR ///.../.|..\.\..
//////////////.../..|..\..\..


let monthInfo = [ {
    name: "January",
    days: 31,
  }, {
    name: "February",
    days: 28,
  }, {
    name: "March",
    days: 31,
  }, {
    name: "April",
    days: 30,
  }, {
    name: "May",
    days: 31,
  }, {
    name: "June",
    days: 30,
  }, {
    name: "July",
    days: 31,
  }, {
    name: "August",
    days: 31,
  }, {
    name: "September",
    days: 30,
  }, {
    name: "October",
    days: 31,
  }, {
    name: "November",
    days: 30,
  }, {
    name: "December",
    days: 31,
  },
];

function generateCalender(month){
  let rowsIteration = [{start:2},{},{},{},{stop:monthInfo[month].days}];
  let rows = [];
  let counter = 0;
  let date = 28;

  rowsIteration.forEach(createRows)

  function createRows(row){
    let cols = [];
    for (let i = 0; i < 7; i++){
      cols.push({date});
      counter++;
      date++;
      if(row.start == counter)date = 1;
      if(row.stop == date)date = 1;
    }
    rows.push(cols)
  }

  return rows;
}


//            ________
/////////////|      X|
// POPUPS ///| <BTN> |
/////////////|_______|

function preferencesPopup() {
  let pop = Popup({ width: 700 })
    .show(
      `
    <h1>Settings</h1>
    <hr>
    <h2>Theme Color</h2>
    {button trigger="theme" value="dark"}Dark{/button}
    {button trigger="theme" value="lighter"}Light{/button}
    <h2>Account</h2>
    {button onclick="logout()"}Logout{/button}
  `
    )
    .on("theme", ({ value }) => {
      setThemeColor(value);
    });
}

////////////====//===//==//=//
// OTHER //====//===//==//=//
//////////====//===//==//=//


function welcome(){
  let popup = Popup({width: 600, closeIcon: false, closeBlur: false});
  let currentSection = 1;
  popup.show(document.getElementById('welcome-popup').innerHTML);
  let sections = document.querySelectorAll(popup.query + ' [section]');
  if(localStorage.getItem('themeColor') == "dark")
    document.querySelector(popup.query + ' [type=checkbox]').checked = true;

  popup.on('changeDark', ({element}) => {
    setThemeColor(element.checked ? 'dark' : 'lighter');
  })
  popup.on('nextSection', () => {
    currentSection++;
    sections.forEach(section => {
      section.style.display = section.getAttribute('section') == currentSection ? 'block' : 'none';
    })
    popup.focus();
    localStorage.setItem('noWelcome', true);
  })
  popup.on('createAccount', () => {
    popup.validate();
    console.log('hello');
  })
  popup.on('login', () => {
    let {passkey} = popup.data();
    passkey += '-tasktest1';
    login(passkey);
    
    currentSection++;
    sections.forEach((section) => {
      section.style.display =
        section.getAttribute("section") == currentSection ? "block" : "none";
    });
  })
}
if(!localStorage.getItem('noWelcome'))welcome();

let theme = localStorage.getItem('theme')
setTheme(theme == "null" || !theme ? 'default' : theme);
function setTheme(name="default"){
  let el = document.querySelector('#theme');
  el.href = 'css/theme/'+name+'.css';
  localStorage.setItem('theme', name);
}


function mobileOpenSidebar() {
  document.body.classList.remove("focus-content");
}

async function selectIcon() {
  let popup = Popup({ width: 410 });

  function generateIcons(filter) {
    filter = filter || "";
    let result = "";
    icons.forEach((icon) => {
      if (icon.indexOf(filter) != -1)
        result +=
          '<button trigger="select" value="' +
          icon +
          '" class="material-icons">' +
          icon +
          "</button>";
    });
    return result;
  }

  popup.show(
    `
    <h3>Select Icon</h3>
    <form action="https://fonts.google.com/icons" target="_blank">
      {input type="search" name="icon.query" placeholder="Search... (or custom icon)" trigger="filter" triggerevent="keyup"/}<br><br>
      {button type="button" class="b3" trigger="customIcon"}Use custom icon{/button}
      {button type="submit" class="b4"}<span class="material-icons">search</span> more{/button}
    </form>
    <br><br>
    <div class="icons-outer">
        {iconsHTML}
    </div>
  `,
    { iconsHTML: generateIcons() }
  );
  popup.on("filter", ({ value }) => {
    document.querySelector(".icons-outer").innerHTML = generateIcons(value);
  });
  return new Promise((resolve, reject) => {
    popup.on("select", ({ value }) => {
      popup.hide();
      resolve(value);
    });
    popup.on("customIcon", () => {
      let value = document.querySelector('[name="icon.query"]').value;
      popup.hide();
      resolve(value);
    });
  });
}



function setThemeColor(value) {
  document.body.classList.remove("dark");
  document.body.classList.remove("darker");
  document.body.classList.remove("light");
  document.body.classList.remove("lighter");
  document.body.classList.add(value);

  localStorage.setItem("themeColor", value);
}



function openTutorial() {
  document.querySelector("aside header button").focus();
  Popup(
    {},
    `<h3>Press <kbd>Tab</kbd>+<kbd>Enter</kbd> to begin</h3>
  <button trigger='start'></button>
  <button trigger='start'></button>`
  )
    .show()
    .on("start", ({ temp }) => {
      temp.hide();
      tutorial();
    });
}

let timeMult = 1;
// tutorial(0);

async function tutorial(mult) {
  timeMult = mult;
  document.querySelector("aside header button").focus();
  await focus("aside header button");
  await click("aside header button");
  await type('.popup [name="name"]', "School ");
  await type('.popup [name="icon"]', "school");
  await click(".popup .b2");

  await type('[name="name"]', "Do my project");
  await type('[name="category"]', "math");
  await click(".btn-addTask");
  await wait(1000);
  await type('[name="name"]', "Go to school event");
  await type('[name="category"]', "");
  await wait(1000);
  await click('[name="hasDate"]');
  await setValue('[name="date"]', "2030-04-09");
  await click('[name="hasRepeat"]');
  await setValue('[name="repeatTimes"]', "yearly");
  await click(".btn-addTask");
  await wait(1000);
  await click(".box .task button:first-child");
  await wait(1000);
  await click(".more button");
  await click('[trigger="deletePage"]');
  await click(".popup .b2");

  // await click("aside header button");
  // await type('.popup [name="name"]', "What will you create?");
  // await type('.popup [name="name"]', "");

  async function type(query, text) {
    await wait(1000);
    let el = document.querySelector(query);
    el.focus();
    el.value = "";
    text.split("").forEach(async (letter, i) => {
      await wait(i * 100);
      el.value += letter;
    });
    await wait(text.length * 100);
  }
  async function setValue(query, text) {
    await wait(1000);
    let el = document.querySelector(query);
    el.focus();
    el.value = text;
  }
  async function click(query) {
    await wait(1000);
    document.querySelector(query).focus();
    await wait(500);
    document.querySelector(query).click();
  }
  async function focus(query) {
    await wait(1000);
    document.querySelector(query).focus();
    await wait(500);
  }
}

async function wait(ms) {
  let p = new Promise((resolve) => {
    if (timeMult == 0) resolve();
    setTimeout(resolve, ms * timeMult);
  });
  await p;
  return;
}

let icons =
  `info check shopping_cart favorite visibility face description fingerprint lock language schedule event thumb_up dashboard home verified calendar_today lightbulb date_range question_answer help paid article trending_up task_alt shopping_bag account_balance perm_identity credit_card history star fact_check assignment build pets analytics work print autorenew savings account_balance_wallet code store room watch_later power_settings_new explore bookmark account_box shopping_basket accessibility launch touch_app assessment view_in_ar leaderboard timeline feedback pan_tool pending bug_report preview stars flight_takeoff card_giftcard dns book alarm assignment_turned_in cached gavel get_app extension label translate help dark_mode hourglass_full loyalty support sticky_note_2 rule group_work settings_applications sensors copyright api track_changes bookmarks subject settings_phone backup https perm_media ads_click open_with wysiwyg g_translate pageview tips_and_updates integration_instructions trending_down accessible model_training upgrade offline_bolt change_history thumbs_up_down invert_colors donut_large theaters opacity commute mark_as_unread not_started contactless tour settings_input_antenna shop plagiarism anchor settings_voice assignment_late settings_input_component settings_remote hourglass_full donut_small online_prediction all_inbox toll assignment_return dynamic_form event_seat settings_power outlet try smart_button rowing hotel_class outbox polymer data_exploration spellcheck shop_two settings_input_hdmi private_connectivity calculate business`.split(
    " "
  );
