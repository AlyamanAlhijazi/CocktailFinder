console.log('Script.js is geladen!');

// UPLOAD
function addIngredient() {
  const ingredientsDiv = document.getElementById('ingredients');
  const newRow = document.createElement('div');
  newRow.className = 'ingredient-row';
  newRow.innerHTML = `
        <input type="text" name="ingredientName[]" placeholder="Ingredient name" required>
        <div class="measurements">
          <input type="number" name="ingredientAmount[]" placeholder="Amount" required step="0.01">
          <select name="ingredientUnit[]" required>
              <option value="ml">ml</option>
              <option value="cl">cl</option>
              <option value="oz">oz</option>
          </select>
        </div>
        <div class="alcholicincl">
          <input type="checkbox" name="isAlcoholic[]"> Alcoholic
          <input type="number" name="alcoholPercentage[]" placeholder="%" min="0" max="100" step="0.1">
          <button type="button" class="btnIngredient">X</button>
        </div>
    `;
  newRow
    .querySelector('.btnIngredient')
    .addEventListener('click', removeIngredient);

  ingredientsDiv.appendChild(newRow);
}
function removeIngredient(event) {
  const ingredientRow = event.target.closest('.ingredient-row');
  if (ingredientRow) {
    ingredientRow.remove();
  }
}

// Image displaying
document.addEventListener('DOMContentLoaded', function () {
  console.log(document.getElementById('image'));
  const image = document.getElementById('image');
  if (image) {
    image.addEventListener('change', function (event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const preview = document.getElementById('imagePreview');
          const uploadBox = document.getElementById('uploadBox');

          preview.src = e.target.result;
          preview.style.display = 'block';
          uploadBox.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    });
  }
});

//FILTER
// button filter
document.addEventListener('DOMContentLoaded', function () {
  // Filter toggle functionality
  var openFilter = document.querySelector('.filterOpen');
  if (openFilter) {
    openFilter.onclick = toggleFilter;
  }

  function toggleFilter() {
    var theFilter = document.querySelector('#filtersForm');
    if (theFilter) {
      theFilter.classList.toggle('toonFilter');
    }
  }

  // Ingredient adding functionality
  const addIngredients = document.getElementById('addIngredient');
  const filtersForm = document.getElementById('filtersForm');

  function add() {
    let newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'kruisjenaasttext');

    let newField = document.createElement('input');
    newField.setAttribute('list', 'x');
    newField.setAttribute('placeholder', 'ingredient');
    newField.setAttribute('class', 'fieldIngredient');

    let newButton = document.createElement('button');
    newButton.setAttribute('type', 'button');
    newButton.setAttribute('class', 'btnIngredient');
    newButton.innerHTML = 'x';

    newButton.addEventListener('click', () => {
      newDiv.remove();
    });

    newDiv.appendChild(newField);
    newDiv.appendChild(newButton);

    filtersForm.insertBefore(newDiv, addIngredients);
  }

  if (addIngredients) {
    addIngredients.addEventListener('click', add);
  }

  // Form submission for the filters
  if (filtersForm) {
    filtersForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const ingredients = document.getElementsByClassName('fieldIngredient');
      const alcoholic = document.getElementById('alcoholic').value;
      const glass = document.getElementById('inputGlasses').value;
      const category = document.getElementById('category').value;
      let ingredientList = [];

      for (let i = 0; i < ingredients.length; i++) {
        ingredientList.push(ingredients[i].value.toLowerCase());
      }

      console.log(ingredientList, alcoholic, glass, category);

      try {
        const response = await fetch('/filter-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ingredients: ingredientList,
            alcoholic,
            glass,
            category,
          }),
        });

        if (response.redirected) {
          window.location.href = response.url;
        } else {
          const data = await response.json();
          document.getElementById('message').innerText =
            data.message || 'Something went wrong';
        }
      } catch (error) {
        document.getElementById('message').innerText =
          `Something went wrong: ${error}`;
      }
    });
  }
});

// sorteing
document.addEventListener('DOMContentLoaded', () => {
  const sortSelect = document.getElementById('sort');
  const cocktailList = document.querySelector('.cocktail-list'); // Selecteer de ul
  let drinksList = Array.from(document.querySelectorAll('.cocktail-list li')); // Selecteer de li's als Array

  if (sortSelect && cocktailList) {
    sortSelect.addEventListener('change', () => {
      let selectedOption = sortSelect.value;

      if (selectedOption === 'sorta-z') {
        drinksList.sort((a, b) => {
          let nameA = a.querySelector('h2').innerText.toLowerCase();
          let nameB = b.querySelector('h2').innerText.toLowerCase();
          return nameA.localeCompare(nameB);
        });
      } else if (selectedOption === 'sortz-a') {
        drinksList.sort((a, b) => {
          let nameA = a.querySelector('h2').innerText.toLowerCase();
          let nameB = b.querySelector('h2').innerText.toLowerCase();
          return nameB.localeCompare(nameA);
        });
      }
      // make sure the list is empty before appending sorted items
      cocktailList.innerHTML = '';
      drinksList.forEach((drink) => cocktailList.appendChild(drink));
    });
  }
});

// instructie toggle
const tabs = document.querySelectorAll('[data-tab-target]');
const tabContents = document.querySelectorAll('[data-tab-content]');

document.addEventListener('DOMContentLoaded', () => {
  const defaultTab = document.querySelector('[data-tab-target="#Ingredients"]');
  const defaultContent = document.querySelector('#Ingredients');

  if (defaultTab && defaultContent) {
    defaultTab.classList.add('active');
    defaultContent.classList.add('active');
  }
});

tabs.forEach((tab) => {
  tab.addEventListener('click', (e) => {
    e.preventDefault();

    tabContents.forEach((content) => content.classList.remove('active'));
    tabs.forEach((t) => t.classList.remove('active'));

    const target = document.querySelector(tab.dataset.tabTarget);

    if (target) {
      target.classList.add('active');
      tab.classList.add('active');
    }
  });
});

console.log('Script.js is geladen!');

// settings-dialog
const openButton = document.querySelector('.openDialog');
const settingsContent = document.querySelector('.settingsContent');
const closeButton = document.querySelector('.closeDialog');
function showDialog() {
  console.log('openDialog');
  settingsContent.showModal();
}
openButton.addEventListener('click', showDialog);
function hideDialog() {
  settingsContent.close();
}
closeButton.addEventListener('click', hideDialog);
