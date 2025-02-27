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
const cookbook = []

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
  const {type, name, extra} = req.body
  const result = add_entry(type, name, extra)
  // TODO: implement me
  res.status(500).send("not yet implemented!")
});

const add_entry = (type: string, name: string, extra: recipe | ingredient) => {
  // errors: if the name already exists, if cooktime < 0, type is not recipe/ingredient
  if (type != 'recipe' && type != 'ingredient') {
    return {error: 'placeholder'}
  } else if (cookbook.find(x => x.name == name) != undefined) {
    return {error: 'placeholder'}
  }
  if ('cookTime' in extra) {
    if (extra.cookTime < 0) {
      return {error: 'placeholder'}
    } else {
      cookbook.push({type, name, cookTime: extra.cookTime})
    }
  } else if ('requiredItems' in extra) {
    // Recipe requiredItems can only have one element per name.
    // this was confusing to interpret at 12am
    const copyRequiredItems = new Set(extra.requiredItems.slice().map(x => x.name))
    // yea diff lengths means theres dupes yea hopefully x
    if (copyRequiredItems.size != extra.requiredItems.length) {
      return {error: 'placeholder'}
    } else {
      cookbook.push({type, name, requiredItems: extra.requiredItems})
    }
    
  }
  
  return { }
}
// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req:Request, res:Request) => {
  // TODO: implement me
  res.status(500).send("not yet implemented!")

});

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});

