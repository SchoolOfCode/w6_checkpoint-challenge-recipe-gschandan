const RECIPE_APP_ID = "ac929366"
const RECIPE_APP_KEY = "c9a3f34b5eec7c0fbeae3ab5f919746e"
const AUTH_KEY = `&app_id=${RECIPE_APP_ID}&app_key=${RECIPE_APP_KEY}`
const URI_LENGTH = 32;

//DOM--#################################################################
const foodItemSearchBtn = document.querySelector("#recipe-button");
const itemInputElem = document.querySelector("#food-input");
const recipeResultsElem = document.querySelector(".recipe-results");
const recipeResultsNumElem = document.querySelector("#recipe-result-numbers")
const htmlElem = document.querySelector("html");

//Event Listeners--#####################################################
foodItemSearchBtn.addEventListener("click", handleRecipeClick);
window.onscroll = function(event){
  //If we have scrolled to the last visible result, fetch some more
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
    getMoreRecipes(moreRecipes);
  };
};

//Global Variables--####################################################

let numRecipesToDisplay = 10; //limit I have placed due to avoid exceeding free API limit and reduce latency
let moreRecipes;
const recipeDict = {};

//Functions--##########################################################

function handleRecipeClick() {
  /*#################################################################
  Clear any previous search results, and fetch the new results
  #################################################################*/
  while(recipeResultsElem.firstChild){
    recipeResultsElem.removeChild(recipeResultsElem.lastChild);
  }
  const foodToSearch = itemInputElem.value;
  if (foodToSearch){
    fetchRecipe(foodToSearch);
  } else{
    console.error("No search item entered. Please enter an item and try again!");
  }
}

async function fetchRecipe(food, from=0) {
  /*#################################################################
  Fetch the recipe by searching with the search query provided
  Call the functions displayRecipeCount, then displayRecipeSearchResults
  Store if there are more recipes available in moreRecipes
  Store the retireved recipes in a dict with their URI as the key
  #################################################################*/
  try{
    const fromQuery = `&from=${from}`;
    const requestUrl = `https://api.edamam.com/search?q=${food+AUTH_KEY+fromQuery}`
    const recipeSearchResponse = await fetch(requestUrl, {cache: "force-cache"}); //change this to default after testing completed
    const recipeList = await recipeSearchResponse.json();
    moreRecipes = recipeList.more;
    recipeList.hits.forEach(recipe => recipeDict[recipe.recipe.uri.substr(recipe.recipe.uri.lastIndexOf("_")+1)] = recipe.recipe);
    displayRecipeCount(recipeList.count); //?bug - returns one less than is available sometimes
    //displayRecipeCount(recipeList.hits.length);
    displayRecipeSearchResults(recipeList.hits, moreRecipes);
  } catch (error){
    console.error(`${error}`)
  }
}

function displayRecipeCount(count){
  /*#################################################################
  Clear the search results by removing all children elements of the recipe 
  results section. Display the number of results found, if any, in a var elem 
  in the h3 elem
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
  Display 10 (or more) search results in an ordered list elem, looping through the
  hits from the query. Display the image, title and some of the health labels
  If the 10 results are fully displayed in the viewport and there is space and
  more recipes available, grab some more recipes and display them
  Use the URI of the recipe as it's ID for referencing
  #################################################################*/
  let olElem = document.querySelector("ol");
  if  (!olElem){
    olElem = document.createElement("ol");
    olElem.classList.add("recipe-list");
    recipeResultsElem.appendChild(olElem);
    olElem.addEventListener("click", function(event){
      displayDetails(event.target);
    });
  };
  recipeList.forEach((recipe,index) => {
    const liElem = document.createElement("li");
    liElem.classList.add("recipe-item")
    let uri = recipe.recipe.uri.substr(recipe.recipe.uri.lastIndexOf("_")+1);
    liElem.innerHTML= formatRecipeResults(recipe.recipe, uri);
    liElem.classList.add(uri);
    olElem.appendChild(liElem);
  });
  if ((olElem.getBoundingClientRect().bottom <= window.innerHeight) && moreRecipes){
    getMoreRecipes(moreRecipes);
  }

};

function formatRecipeResults(recipe, uri){
  /*#################################################################
  wrap img in an anchor tag, insert text +/- calories, prep time, labels
  #################################################################*/
  let totTime = recipe.totalTime;
  let prepTime = (totTime > 0)? (totTime <= 60)? `Time: ${totTime}mins`:`Time: ${Math.round(totTime/60)}hrs`: "";
  const recipeCard = `
  <img class="${uri}" src="${recipe.image}" alt="${recipe.label}"">
  <p id="info" class="recipe-details ${uri}">${recipe.label}.<br>Serves: ${recipe.yield}.<br>${prepTime}</p>`
  return recipeCard;
}

function getMoreRecipes(moreRecipes){
  /*#################################################################
  fetch more recipes if they reach the bottom of the page
  #################################################################*/
  if (moreRecipes){
    fetchRecipe(itemInputElem.value, from=numRecipesToDisplay);
    numRecipesToDisplay += 11;
  }
}
/* <a href=${recipe.url}></a> */

function displayDetails(item){
  /*#################################################################
  Get the recipe ID of the clicked on element, if they clicked on the space
  #################################################################*/
  let recipeClicked = item.className.substr(item.className.lastIndexOf(" ")+1);
  if (item.parentNode.nodeName != "LI"){
    return; //do nothing if the space between the recipe cards was clicked
  }
  console.log(item.parentNode)
  if (item.parentNode.classList.contains("detailed-recipe")){
    item.parentNode.classList.remove("detailed-recipe");
  } else{
    item.parentNode.classList.add("detailed-recipe");
  }
  console.log(recipeDict[recipeClicked]);
  // fetchLargerImage()
}