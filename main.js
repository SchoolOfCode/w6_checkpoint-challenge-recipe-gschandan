const RECIPE_APP_ID = "ac929366"
const RECIPE_APP_KEY = "c9a3f34b5eec7c0fbeae3ab5f919746e"

const foodItemSearchBtn = document.querySelector("#recipe-button");
const itemInputElem = document.querySelector("#food-input");
const recipeResultsElem = document.querySelector("#recipe-results");

foodItemSearchBtn.addEventListener("click", handleRecipeClick);

function handleRecipeClick() {
  let foodToSearch = itemInputElem.value;
  if (foodToSearch){
    console.log("Searching...");
    fetchRecipe(foodToSearch);
  } else{
    console.error("No search item entered. Please enter an item and try again!");
  }
}

async function fetchRecipe(food) {
  /*#################################################################
  Fetch the recipe by searching with the search query provided
  Call the functions displayRecipeCount, then displayRecipeSearchResults
  #################################################################*/
  try{
    const requestUrl = `https://api.edamam.com/search?q=${food}&app_id=${RECIPE_APP_ID}&app_key=${RECIPE_APP_KEY}`
    const recipeSearchResponse = await fetch(requestUrl);
    const recipeList = await recipeSearchResponse.json();
    console.log(recipeList);//----------------Remove this later: for debugging only---------------------
    displayRecipeCount(recipeList.count);
    displayRecipeSearchResults(recipeList.hits);
  } catch (error){
    console.error(`${error}`)
  }
}

function displayRecipeCount(count){
  /*#################################################################
  Clear the search results by removing all children elements of the recipe 
  results section. Display the number of results found, if any, in a h3 elem
  #################################################################*/
  while(recipeResultsElem.firstChild){
    recipeResultsElem.removeChild(recipeResultsElem.lastChild);
  }
  
  const h3Elem =  document.createElement("h3");
  h3Elem.id="recipe-count";
  if (count === 0){
    h3Elem.innerText = "Unfortuantely your search didn't return any results";
  } else{
    h3Elem.innerText = `Your search returned ${count} result${(count==1)?".":"s."}`;
  }
  recipeResultsElem.appendChild(h3Elem);
}

function displayRecipeSearchResults(recipeList){
  /*#################################################################
  Display 10 search results in an ordered list elem, looping through the
  hits from the query. Display the image, title and some of the health labels
  #################################################################*/
  const olElem = document.createElement("ol");
  olElem.classList.add("recipe-list");
  recipeResultsElem.appendChild(olElem);

  recipeList.forEach(recipe => {
    const liElem = document.createElement("li");
    liElem.classList.add("recipe-item")
    liElem.innerHTML= formatRecipeResults(recipe.recipe);
    olElem.appendChild(liElem);
  });

}

function formatRecipeResults(recipe){
  return recipe.label;

}