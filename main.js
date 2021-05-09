const RECIPE_APP_ID = "ac929366"
const RECIPE_APP_KEY = "c9a3f34b5eec7c0fbeae3ab5f919746e"
const authKey = `&app_id=${RECIPE_APP_ID}&app_key=${RECIPE_APP_KEY}`

const foodItemSearchBtn = document.querySelector("#recipe-button");
const itemInputElem = document.querySelector("#food-input");
const recipeResultsElem = document.querySelector(".recipe-results");
const recipeResultsNumElem = document.querySelector("#recipe-result-numbers")
const htmlElem = document.querySelector("html");

foodItemSearchBtn.addEventListener("click", handleRecipeClick);
window.onscroll = function(event){
  //If we have scrolled to the last visible result, fetch some more
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
    getMoreRecipes(moreRecipes);
  };
};
let numRecipesToDisplay = 11;
let moreRecipes;

function handleRecipeClick() {
  /*#################################################################
  Clear any previous search results, and fetch the new results
  #################################################################*/
  while(recipeResultsElem.firstChild){
    recipeResultsElem.removeChild(recipeResultsElem.lastChild);
  }
  const foodToSearch = itemInputElem.value;
  if (foodToSearch){
    console.log("Searching...");
    fetchRecipe(foodToSearch);
  } else{
    console.error("No search item entered. Please enter an item and try again!");
  }
}

async function fetchRecipe(food, from=0) {
  /*#################################################################
  Fetch the recipe by searching with the search query provided
  Call the functions displayRecipeCount, then displayRecipeSearchResults
  #################################################################*/
  try{
    const fromQuery = `&from=${from}`;
    const requestUrl = `https://api.edamam.com/search?q=${food+authKey+fromQuery}`
    const recipeSearchResponse = await fetch(requestUrl, {cache: "force-cache"}); //change this to default after testing completed
    const recipeList = await recipeSearchResponse.json();
    console.log(recipeList);//----------------Remove this later: for debugging only---------------------
    moreRecipes = recipeList.more;
    //displayRecipeCount(recipeList.count); //?bug - returns one less than is available sometimes
    displayRecipeCount(recipeList.hits.length);
    displayRecipeSearchResults(recipeList.hits, moreRecipes);
  } catch (error){
    console.error(`${error}`)
  }
}

function displayRecipeCount(count){
  /*#################################################################
  Clear the search results by removing all children elements of the recipe 
  results section. Display the number of results found, if any, in a h3 elem
  #################################################################*/
  recipeResultsNumElem.removeChild(recipeResultsNumElem.firstChild);
  const h3Elem =  document.createElement("h3");
  h3Elem.id="recipe-count";
  if (count === 0){
    h3Elem.innerHTML = `Unfortuantely your search returned <var id="count">${count}</var> results.`;
  } else{
    h3Elem.innerHTML = `Your search returned <var id="count">${count}</var> result${(count==1)?".":"s."}`;
  }
  recipeResultsNumElem.appendChild(h3Elem);
}

function displayRecipeSearchResults(recipeList, moreRecipes){
  /*#################################################################
  Display 10 search results in an ordered list elem, looping through the
  hits from the query. Display the image, title and some of the health labels
  #################################################################*/
  let olElem = document.querySelector("ol");
  if  (!olElem){
    olElem = document.createElement("ol");
    olElem.classList.add("recipe-list");
    recipeResultsElem.appendChild(olElem);
  };
  recipeList.forEach(recipe => {
    const liElem = document.createElement("li");
    liElem.classList.add("recipe-item")
    liElem.innerHTML= formatRecipeResults(recipe.recipe);
    olElem.appendChild(liElem);
  });
  if ((olElem.getBoundingClientRect().bottom <= window.innerHeight) && moreRecipes){
    getMoreRecipes(moreRecipes);
  }
 
};

function formatRecipeResults(recipe){
  /*#################################################################
  wrap img in an anchor tag, insert text +/- calories, prep time, labels
  #################################################################*/
  let totTime = recipe.totalTime;
  let prepTime = (totTime > 0)? (totTime <= 60)? `Time: ${totTime}mins`:`Time: ${Math.round(totTime/60)}hrs`: "";
  const recipeCard = `
  <a href=${recipe.url}><img class="recipe-image" src="${recipe.image}" alt="${recipe.label}""></a>
  <p>${recipe.label}.<br>Serves: ${recipe.yield}.<br>${prepTime}</p>`
  return recipeCard;
}

function getMoreRecipes(moreRecipes){
  if (moreRecipes){
    fetchRecipe(itemInputElem.value, from=numRecipesToDisplay);
    console.log(`numRecipesToDisplay: ${numRecipesToDisplay}`);
    numRecipesToDisplay += 11;
  }
}