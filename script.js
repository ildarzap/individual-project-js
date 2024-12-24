const categoriesList = document.querySelector('.categories__list');
const recipesList = document.querySelector('.recipes__list');
const searchInput = document.querySelector('.search-bar__input');
const searchButton = document.querySelector('.search-bar__button');
const searchError = document.querySelector('.search-bar__error');
const modal = document.querySelector('.modal');
const modalClose = document.querySelector('.modal__close');
const modalTitle = document.querySelector('.modal__title');
const modalImage = document.querySelector('.modal__image');
const modalIngredients = document.querySelector('.modal__ingredients');
const modalInstructions = document.querySelector('.modal__instructions');
const loader = document.querySelector('.recipes__loader');

let currentCategory = '';
let currentRecipes = [];
let isModalOpen = false;

//  функция для показа/скрытия лоадера
const toggleLoader = (loading) => {
  if (isModalOpen) {
    loader.style.display = 'none';
    loader.innerHTML = '';
    return;
  }
  loader.style.display = loading ? 'flex' : 'none';
  loader.innerHTML = loading ? '<div class="loader"><div class="loader__spinner"></div></div>' : '';
  if (loading && !isModalOpen) {
    recipesList.innerHTML = '';
  }
};

//  функция для выполнения fetch-запроса с обработкой ошибок
const fetchData = async (url) => {
  try {
    if (!isModalOpen) {
      toggleLoader(true);
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ошибка! Статус: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
    recipesList.innerHTML = '<p>Не удалось загрузить данные.</p>';
    return null;
  } finally {
    if (!isModalOpen) {
      toggleLoader(false);
    }
  }
};

//  функция для создания элемента списка категорий
const createCategoryElement = (category, index) => {
  const categoryItem = document.createElement('li');
  categoryItem.classList.add('categories__item');
  if (index === 0) {
    categoryItem.classList.add('categories__item--active');
    currentCategory = category.strCategory;
  }
  categoryItem.textContent = category.strCategory;

  categoryItem.addEventListener('click', () => {
    if (isModalOpen) return;
    document
      .querySelector('.categories__item--active')
      ?.classList.remove('categories__item--active');
    categoryItem.classList.add('categories__item--active');
    currentCategory = category.strCategory;
    loadRecipes();
  });
  return categoryItem;
};

//  функция для создания карточки рецепта
const createRecipeCard = (recipe) => {
  const recipeCard = document.createElement('div');
  recipeCard.classList.add('recipe-card');
  recipeCard.addEventListener('click', () => {
    displayModal(recipe.idMeal);
  });
  recipeCard.innerHTML = `
              <img class="recipe-card__image" src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
              <div class="recipe-card__content">
                  <h3 class="recipe-card__title">${recipe.strMeal}</h3>
              </div>
          `;
  return recipeCard;
};

//  функция для создания  модального окна с заголовком, содержимым и иконкой
const createModalSection = (title, content, iconPath) => {
  const container = document.createElement('div');
  container.classList.add('modal__section');

  const titleContainer = document.createElement('div');
  titleContainer.classList.add('modal__section-title');
  titleContainer.innerHTML = `<img class="modal__section-icon" src="${iconPath}"> ${title}`;
  container.appendChild(titleContainer);

  const contentElement = document.createElement('p');
  contentElement.classList.add(`modal__${title.toLowerCase()}`);
  contentElement.textContent = content;
  container.appendChild(contentElement);

  return container;
};

//  функция для форматирования ингредиентов в строку, разделенную запятыми
const formatIngredients = (recipeDetails) => {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = recipeDetails[`strIngredient${i}`];
    const measure = recipeDetails[`strMeasure${i}`];
    if (ingredient && ingredient !== '') {
      ingredients.push(`${measure} ${ingredient}`);
    }
  }
  return ingredients.join(', ');
};

// функция для получения категорий
const fetchCategories = async () => {
  const data = await fetchData('https://www.themealdb.com/api/json/v1/1/categories.php');
  return data?.categories || [];
};

// функция для получения рецептов по категории или поисковому запросу
const fetchRecipes = async (category = '', query = '') => {
  let url;
  if (query) {
    url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`;
  } else if (category) {
    url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`;
  } else {
    url = 'https://www.themealdb.com/api/json/v1/1/random.php';
  }
  const data = await fetchData(url);
  return data?.meals || [];
};

// функция для получения деталей конкретного рецепта
const fetchRecipeDetails = async (recipeId) => {
  const data = await fetchData(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`);
  return data?.meals?.[0] || null;
};

// функция для отображения полученных категорий на странице
const displayCategories = (categories) => {
  categoriesList.innerHTML = '';
  categories.forEach((category, index) => {
    const categoryElement = createCategoryElement(category, index);
    categoriesList.appendChild(categoryElement);
  });
};

// функция для отображения полученных рецептов на странице
const displayRecipes = (recipes) => {
  recipesList.innerHTML = '';
  if (!recipes || recipes.length === 0) {
    recipesList.innerHTML = '<p>Recipes not found</p>';
    return;
  }
  recipes.forEach((recipe) => {
    const recipeCard = createRecipeCard(recipe);
    recipesList.appendChild(recipeCard);
  });
};

// функция для отображения модального окна с деталями рецепта
const displayModal = async (recipeId) => {
  isModalOpen = true;
  const recipeDetails = await fetchRecipeDetails(recipeId);
  if (!recipeDetails) return;

  modalTitle.textContent = recipeDetails.strMeal;
  modalImage.src = recipeDetails.strMealThumb;

  // создание и добавление секции с ингредиентами
  modalIngredients.innerHTML = '';
  const formattedIngredients = formatIngredients(recipeDetails);
  const ingredientsSection = createModalSection(
    'Ingredients',
    formattedIngredients,
    'images/ingredients.svg',
  );
  modalIngredients.appendChild(ingredientsSection);

  // создание и добавление секции с инструкциями
  modalInstructions.innerHTML = '';
  const instructionsSection = createModalSection(
    'Instructions',
    recipeDetails.strInstructions,
    'images/instructions.svg',
  );
  modalInstructions.appendChild(instructionsSection);

  modal.classList.remove('modal--hidden');
  document.body.classList.add('modal-open');
};

// функция для загрузки и отображения категорий
const loadCategories = async () => {
  const categories = await fetchCategories();
  displayCategories(categories);
};

// функция для загрузки и отображения рецептов
const loadRecipes = async () => {
  if (isModalOpen) return;
  const recipes = await fetchRecipes(currentCategory);
  currentRecipes = recipes;
  displayRecipes(currentRecipes);
};

// функция для загрузки и отображения рецептов по поисковому запросу
const loadSearchRecipes = async (query) => {
  if (isModalOpen) return;
  const recipes = await fetchRecipes('', query);
  currentRecipes = recipes;
  displayRecipes(currentRecipes);
};

// функция для валидации поискового запроса
const validateSearch = (query) => {
  const trimmedQuery = query.trim();
  searchError.textContent = '';

  if (!trimmedQuery) {
    searchError.textContent = 'Пожалуйста, введите запрос для поиска.';
    return false;
  }

  return trimmedQuery;
};

// обработчик события клика по кнопке поиска
searchButton.addEventListener('click', () => {
  if (isModalOpen) return;
  const query = searchInput.value;
  const validatedQuery = validateSearch(query);

  if (validatedQuery) {
    loadSearchRecipes(validatedQuery);
  }
});

// обработчик события клика по кнопке закрытия модального окна
modalClose.addEventListener('click', () => {
  isModalOpen = false;
  modal.classList.add('modal--hidden');
  document.body.classList.remove('modal-open');
});

document.addEventListener('click', (event) => {
  if (event.target === modal) {
    isModalOpen = false;
    modal.classList.add('modal--hidden');
    document.body.classList.remove('modal-open');
  }
});

loadCategories();
loadRecipes();
