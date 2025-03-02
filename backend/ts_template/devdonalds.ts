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
  const dashes_begone = /-|_/g;
  const only_alpha = /[^a-zA-Z ]/g;
  const remove_forbidden_chars = (recipeName.replace(dashes_begone, ' ')).replace(/ +/g, ' ');
  // got too long
  const remove_non_alpha = remove_forbidden_chars.replace(only_alpha, '').toLowerCase();
  // if nothing is left return null
  if (remove_non_alpha.length === 0) {
    return null;
  }
  const newNameList = remove_non_alpha.split(' ').map(x => x[0].toUpperCase() + x.slice(1));

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
    const copy_required_items = new Set(extra.slice().map(x => x.name));
    // yea diff lengths means theres dupes yea hopefully x
    if (copy_required_items.size !== extra.length) {
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
  // its logn probably?? binary search?  and everything after is n
  const existing_summary = cookbook.summaries.find(x => x.name === name) 
  if (existing_summary !== undefined) {
    return existing_summary
  }
  // err400 A recipe with the corresponding name cannot be found.
  // err400 (after) The searched name is NOT a recipe name (ie. an ingredient).
  const item: recipe = cookbook.entries.find(x => x.name === name);
  if (item === undefined) {
    throw Error('A recipe with the corresponding name cannot be found.');
  } else if (item.type !== 'recipe') {
    throw Error('The searched name is NOT a recipe name (ie. an ingredient).');
  }

  // err400 The recipe contains recipes or ingredients that aren't in the cookbook.
  // gng wat does this mean
  const ingredient_list = item.requiredItems.map(x => x.name);
  const is_in_cookbook = ingredient_list.filter(x => cookbook.ingredients.includes(x));
  if (is_in_cookbook.length !== ingredient_list.length) {
    throw Error('The recipe contains recipes or ingredients that aren\'t in the cookbook.');
  }

  const in_recipe = cookbook.entries.filter(x => ingredient_list.includes(x.name));
  const cookTime = in_recipe.reduce((n, { cookTime }) => n + cookTime, 0);
  const summary = {
    name,
    cookTime,
    ingredients: item.requiredItems.slice()
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
