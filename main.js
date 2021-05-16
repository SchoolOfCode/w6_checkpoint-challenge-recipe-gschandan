//EDAMAM API Variables--################################################

const RECIPE_APP_ID = "ac929366"
const RECIPE_APP_KEY = "c9a3f34b5eec7c0fbeae3ab5f919746e"
const AUTH_KEY = `&app_id=${RECIPE_APP_ID}&app_key=${RECIPE_APP_KEY}`
const URI_LENGTH = 32;

//DOM--#################################################################

const foodItemSearchBtn = document.querySelector("#recipe-button");
const itemInputElem = document.querySelector("#food-input");
const recipeResultsElem = document.querySelector(".recipe-results");
const recipeResultsNumElem = document.querySelector("#recipe-result-numbers");
const htmlElem = document.querySelector("html");
const quoteElem = document.querySelector("#quote");
const authorElem = document.querySelector("#author");
const helpBtn = document.querySelector("#help");
const helpOverlay = document.querySelector("#help-overlay");

//Event Listeners--#####################################################

foodItemSearchBtn.addEventListener("click", function(){
  handleRecipeClick();
  getQuote();
});

window.onscroll = function(event){
  //If we have scrolled to the last visible result, fetch some more
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
    getMoreRecipes(moreRecipes);
  };
};

helpBtn.addEventListener("click", displayHelp);
helpOverlay.addEventListener("click", hideHelp);

//Global Variables--####################################################

let numRecipesToDisplay = 10; //limit I made to avoid exceeding free API limit/reduce latency
let moreRecipes;
const recipeDict = {}; //to store recipes for debugging purposes or for later filtering
const filterObj ={
  "quick":"&time=1-30",
  "fast":"&time=1-45",
  "balanced":"&diet=balanced",
  "high-protein":"&diet=high-protein",
  "protein":"&diet=high-protein",
  "fiber":"&diet=high-fiber",
  "low-fat":"&diet=low-fat",
  "fat-free":"&diet=low-fat",
  "low-carb":"&diet=low-carb",
  "carb-free":"&diet=low-carb",
  "alcohol-free":"&health=alcohol-free",
  "immune":"&health=immuno-supportive",
  "dairy":"&health=dairy-free",
  "dairy-free":"&health=dairy-free",
  "eggs":"&health=egg-free",
  "egg":"&health=egg-free",
  "gluten":"&health=gluten-free",
  "gluten-free":"&health=gluten-free",
  "keto":"&health=keto-friendly",
  "peanut-free":"&health=peanut-free",
  "vegan":"&health=vegan",
  "vegetarian":"&health=vegetarian",
  "fodmap":"&health=fodmap-free",
  "chinese":"&cuisineType=chinese",
  "indian":"&cuisineType=indian",
  "american":"&cuisineType=american",
  "french":"&cuisineType=french",
  "caribbean":"&cuisineType=caribbean",
  "italian":"&cuisineType=italian"
};

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
    fetchRecipe(foodToSearch.toLowerCase());
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
    const [searchFilters,searchItem] = parseQuery(food);
    const requestUrl = `https://api.edamam.com/search?q=${searchItem+AUTH_KEY+fromQuery+searchFilters}`
    const recipeSearchResponse = await fetch(requestUrl, {
      method: "GET",
      cache: "force-cache" //to prevent breaking terms of free API limits
    }); 
    const recipeList = await recipeSearchResponse.json();
    moreRecipes = recipeList.more;
    recipeList.hits.forEach(recipe => recipeDict[recipe.recipe.uri.substr(recipe.recipe.uri.lastIndexOf("_")+1)] = recipe.recipe);
    displayRecipeCount(recipeList.count);
    displayRecipeSearchResults(recipeList.hits, moreRecipes);
    console.log(requestUrl);
  } catch (error){
    console.error(`${error}`)
  }
}

function parseQuery(searchString){
  let searchQuery = searchString.split(" ")
  let filterTerms = "";
  let searchFood = "";
  for (let term of searchQuery){
    term in filterObj ? filterTerms += filterObj[term]: searchFood += term;
  }
  return [filterTerms,searchFood];
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
    // olElem.addEventListener("click", function(event){
    //   displayDetails(event.target);
    // });
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
  Capture nutritional info, in x/100g for labelling
  Insert it into a formatted recipe card, for potential styling URI 
  added to the items class for easier ID of specific recipe user interaction
  #################################################################*/
  let totTime = recipe.totalTime;
  let hrsTime = Math.round(totTime/60);
  let yield = recipe.yield;
  let weight = recipe.totalWeight;
  let prepTime = (totTime > 0)? (totTime < 60)? `⏰ Time: ${totTime}m`:`⏰ Time: ${hrsTime} hr${(hrsTime==1)?"":"s"}`: "";
  let label = recipe.label.replace(/recipes?/ig, ' ');

  let energy = Math.floor(recipe.totalNutrients.ENERC_KCAL.quantity*100/weight);
  let fat = Math.floor(recipe.totalNutrients.FAT.quantity*1000/weight)/10;
  let sugar = Math.floor(recipe.totalNutrients.SUGAR.quantity*1000/weight)/10;
  let salt = Math.floor(recipe.totalNutrients.NA.quantity*10/weight)/10;

  [fatColor,sugarColor,saltColor] = getNutritionalColors(fat,sugar,salt);

  const recipeCard = `
  <a href=${recipe.url}><img class="recipe-image ${uri}" src="${recipe.image}" alt="${recipe.label}"></a>
  <div class="recipe-details ${uri}">
    <div class="recipe-info ${uri}">
      <p class="serving-size">🍴 &nbsp; Serves: ${yield}</p>
      <p>${prepTime}</p>
    </div>
  <p class="recipe-title ${uri}">${label}</p>
  </div>
  <p class="nutr-label-legend">Nutritional information per 100g</p>
  <div class="nutrition-label ${uri}">
    <div class="energy" style="background-color:${"white"}">
      <p>ENERGY</p>
      <p>${energy+"kCal"}</p>
    </div>
    <div class="fat" style="background-color:${fatColor}">
      <p>FAT</p>
      <p>${fat+"g"}</p>
    </div>
    <div class="sugars" style="background-color:${sugarColor}">
      <p>SUGARS</p>
      <p>${sugar +"g"}</p>
    </div>
    <div class="salt" style="background-color:${saltColor}">
      <p>SALT</p>
      <p>${salt+"g"}</p>
    </div>
  </div>
  `
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

function getNutritionalColors(fat,sugar,salt){
  /*#################################################################
  Change the colour of the label based on the nutritional values
  Based on https://www.nutrition.org.uk/healthyliving/helpingyoueatwell/324-labels.html?start=3
  #################################################################*/
  let g = "#78C35F;";
  let y = "#FAB03E;";
  let r = "#F05929;";

  let fatColor;
  let sugarColor;
  let saltColor;

  fatColor = (fat > 3.0 && fat <= 17.5)?  y : r;
  sugarColor = (sugar > 5.0 && sugar <= 22.5)?  y : r;
  saltColor = (salt > 0.3 && salt <= 1.5)?  y : r;
  if(fat <= 3.0){fatColor = g};
  if(sugar <= 5.0){sugarColor = g};
  if(salt <= 0.3){saltColor = g};

  return [fatColor,sugarColor,saltColor];
}

async function getQuote(){
  const searchString = itemInputElem.value.split(" ");
  const response = await fetch(`https://api.quotable.io/random?maxLength=150`,{
    method: "GET"
  });
  const data = await response.json();
  quoteElem.innerText = '"'+data.content+'"';
  authorElem.innerHTML = data.author;
}

function displayHelp(){
  helpOverlay.style.display = "grid";
}

function hideHelp(){
  helpOverlay.style.display = "none";
}