import express, { Request, Response } from "express";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

interface cookbook {
  names: string[]
  entries: cookbookEntry[]
}
// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook = {recipes: [], ingredients: [], entries: []}

// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  } 
  res.json({ msg: parsed_string });
  return;
  
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that 
const parse_handwriting = (recipeName: string): string | null => {
  // implement me
  // Removes hypens (-, _) as whitespace, and  deletes non alphabet/space chars
  const dashesBegone = /-|_/g
  const onlyAlpha = /[^a-zA-Z ]/g
  const removeForbiddenChar = (recipeName.replace(dashesBegone, ' ')).replace(onlyAlpha, '').toLowerCase()
  // if nothing is left return null
  if (removeForbiddenChar.length == 0) {
    return null
  }
  const newNameList = removeForbiddenChar.split(' ').map(x => x[0].toUpperCase() + x.slice(1))

  const res = newNameList.join(' ')
  if (res.length == 0) {
    return null
  }
  
  return res
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req:Request, res:Response) => {
  let {type, name} = req.body
  let extra
  if ('requiredItems' in req.body) {
    // le recipe
    extra = req.body.requiredItems
  } else if ('cookTime' in req.body) {
    // ingredient
    extra = req.body.cookTime
  }
  const result = add_entry(type, name, extra)
  
  // TODO: implement me
  if ('error' in result) {
    res.status(400)
  }
  
  res.json(result);
});

const add_entry = (type: string, name: string, extra: number|requiredItem[]) => {
  // errors: if the name already exists, if cooktime < 0, type is not recipe/ingredient
  if (type != 'recipe' && type != 'ingredient') {
    return {error: 'placeholder'}
  } else if (cookbook.entries.find(x => x.name == name) != undefined) {
    return {error: 'placeholder'}
  }

  if (typeof extra == 'number') {
    if (extra < 0) { 
      return {error: 'placeholder negative cooktime err', cookbook}
    } else { // put dat shit in else
      cookbook.ingredients.push(name)
      cookbook.entries.push({type, name, cookTime: extra})
    }
  } else {
    // Recipe requiredItems can only have one element per name.
    // yo what does this error mean gng
    const copyRequiredItems = new Set(extra.slice().map(x => x.name))
    // yea diff lengths means theres dupes yea hopefully x
    if (copyRequiredItems.size != extra.length) {
      return {error: 'placeholder'}
    } else {
      cookbook.recipes.push(name)
      cookbook.entries.push({type, name, requiredItems: extra.slice()})
    }
  }
  return { }
}
// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req:Request, res:Request) => {
  const name = req.query.name
  const result = summarise(name)
  // TODO: implement me
   // TODO: implement me
   if ('error' in result) {
    res.status(400)
  }
  
  res.json(result);

});

const summarise = (name: string) => {
  // A recipe with the corresponding name cannot be found.
  // The searched name is NOT a recipe name (ie. an ingredient).
  const fetchItem: recipe = cookbook.entries.find(x => x.name == name)
  if (fetchItem == undefined) {
    return {error: 'placeholder err1', COOKBOOK: cookbook.entries, name}
  } else if (fetchItem.type != 'recipe') {
    return {error: 'placeholder err2'}
  }
  
  // The recipe contains recipes or ingredients that aren't in the cookbook.
  // gng wat does this mean
  const ingredientList = fetchItem.requiredItems.map(x => x.name)
  const isInCookbook = ingredientList.filter(x => cookbook.ingredients.includes(x))
  if (isInCookbook.length != ingredientList.length) {
    return {error: 'placeholder err3', cookbook}
  }

  const ingredientsInRecipe = cookbook.entries.filter(x => ingredientList.includes(x.name))
  const cookTime = ingredientsInRecipe.reduce((n, {cookTime}) => n + cookTime, 0);
  const summary = {
    name, 
    cookTime,
    ingredients: fetchItem.requiredItems.slice()
  }
  return summary
}
// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});

