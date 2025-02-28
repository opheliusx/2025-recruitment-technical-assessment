import express, { Request, Response } from 'express';

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

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook = { recipes: [], ingredients: [], entries: [], summaries: [] };

// Task 1 helper (don't touch)
app.post('/parse', (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input);
  if (parsed_string == null) {
    res.status(400).send('this string is cooked');
    return;
  }
  res.json({ msg: parsed_string });
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that
const parse_handwriting = (recipeName: string): string | null => {
  // Removes hypens (-, _) as whitespace, and  deletes non alphabet/space chars
  const dashesBegone = /-|_/g;
  const onlyAlpha = /[^a-zA-Z ]/g;
  const removeForbiddenCharPt1 = (recipeName.replace(dashesBegone, ' ')).replace(/ +/g, ' ');
  // got too long
  const removeForbiddenChar = removeForbiddenCharPt1.replace(onlyAlpha, '').toLowerCase();
  // if nothing is left return null
  if (removeForbiddenChar.length === 0) {
    return null;
  }
  const newNameList = removeForbiddenChar.split(' ').map(x => x[0].toUpperCase() + x.slice(1));

  const res = newNameList.join(' ');
  return res;
};

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post('/entry', (req:Request, res:Response) => {
  const { type, name } = req.body;
  let extra;
  // typeguarding due to dual type nature 
  if ('requiredItems' in req.body) {
    // le recipe
    extra = req.body.requiredItems;
  } else if ('cookTime' in req.body) {
    // ingredient
    extra = req.body.cookTime;
  }
  try {
    const result = add_entry(type, name, extra);
    res.json(result);
  } catch (err) {
    res.status(400).send(err);
  }
});

const add_entry = (type: string, name: string, extra: number|requiredItem[]) => {
  // errors: if the name already exists, if cooktime < 0, type is not recipe/ingredient
  if (type !== 'recipe' && type !== 'ingredient') {
    throw Error('Type must be recipe/ingredient');
  } else if (cookbook.entries.find(x => x.name === name) !== undefined) {
    throw Error('Name already exists');
  }

  if (typeof extra === 'number') {
    if (extra < 0) {
      throw Error('Cooktime must be a non negative number');
    } else { // put dat shit in else
      cookbook.ingredients.push(name);
      cookbook.entries.push({ type, name, cookTime: extra });
    }
  } else {
    // Recipe requiredItems can only have one element per name.
    // yo what does this error mean gng
    const copyRequiredItems = new Set(extra.slice().map(x => x.name));
    // yea diff lengths means theres dupes yea hopefully x
    if (copyRequiredItems.size !== extra.length) {
      throw Error('Recipe requiredItems can only have one element per name');
    } else {
      cookbook.recipes.push(name);
      cookbook.entries.push({ type, name, requiredItems: extra.slice() });
    }
  }
  return { };
};

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get('/summary', (req:Request, res:Request) => {
  const name = req.query.name;
  try {
    const result = summarise(name);
    res.json(result);
  } catch (err) {
    res.status(400).send(err);
  }
});

const summarise = (name: string) => {
  // i got bored so i added that if a summary exists it just gets returned
  // probably more efficient idk if the original code takes a long time for large datasets
  const existingSummary = cookbook.summaries.find(x => x.name === name) 
  if (existingSummary !== undefined) {
    return existingSummary
  }
  // err400 A recipe with the corresponding name cannot be found.
  // err400 (after) The searched name is NOT a recipe name (ie. an ingredient).
  const fetchItem: recipe = cookbook.entries.find(x => x.name === name);
  if (fetchItem === undefined) {
    throw Error('A recipe with the corresponding name cannot be found.');
  } else if (fetchItem.type !== 'recipe') {
    throw Error('The searched name is NOT a recipe name (ie. an ingredient).');
  }

  // err400 The recipe contains recipes or ingredients that aren't in the cookbook.
  // gng wat does this mean
  const ingredientList = fetchItem.requiredItems.map(x => x.name);
  const isInCookbook = ingredientList.filter(x => cookbook.ingredients.includes(x));
  if (isInCookbook.length !== ingredientList.length) {
    throw Error('The recipe contains recipes or ingredients that aren\'t in the cookbook.');
  }

  const ingredientsInRecipe = cookbook.entries.filter(x => ingredientList.includes(x.name));
  const cookTime = ingredientsInRecipe.reduce((n, { cookTime }) => n + cookTime, 0);
  const summary = {
    name,
    cookTime,
    ingredients: fetchItem.requiredItems.slice()
  };
  cookbook.summaries.push(summary)
  return summary;
};
// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log('Running on: http://127.0.0.1:8080');
});
