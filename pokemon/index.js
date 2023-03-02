import pg from 'pg'
const { Pool } = pg

let pool

const getPokemon = async (event) => {
  const res = await pool.query(`
  select * from pokemon;
`)

const response = {
statusCode: 200,
headers: {
'content-type': 'application/json'
},
body: JSON.stringify(res.rows),
};
return response;
}

const createPokemon = async (event) => {
const newPokemon = JSON.parse(event.body);
console.log(newPokemon)

// Get the currently logged in user
const userId = event.requestContext.authorizer.jwt.claims.sub

// Persist my pokemon object
await pool.query('BEGIN');

// Insert the new pokemon data
const pokemonQuery = {
text: 'INSERT INTO pokemon (user_uuid, name, type1, type2, hp, attack, defense, sp_attack, sp_defense, speed, total) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
values: [userId, newPokemon.name, newPokemon.type1, newPokemon.type2, newPokemon.hp, newPokemon.attack, newPokemon.defense, newPokemon.sp_attack, newPokemon.sp_defense, newPokemon.speed, newPokemon.total]
};
const pokemonResult = await pool.query(pokemonQuery);

// Commit the transaction
await pool.query('COMMIT');

const response = {
statusCode: 201,
headers: {
'content-type': 'application/json'
},
body: JSON.stringify({message: "ok"}),
};
return response;
}

const deletePokemon = async (event) => {
  console.log(event)
const pokemonId = event.pathParameters.id;
console.log(event)

await pool.query('BEGIN');

// Delete the pokemon
const deletePokemonQuery = {
text: 'DELETE FROM pokemon WHERE id = $1',
values: [pokemonId]
};
await pool.query(deletePokemonQuery);

// Commit the transaction
await pool.query('COMMIT');

const response = {
statusCode: 204,
body: ''
};
return response;
}

export const handler = async (event) => {
if (!pool) {
const connectionString = process.env.DATABASE_URL;
pool = new Pool({
connectionString,
application_name: "",
max: 1,
});
}

console.log(event.requestContext.http.method)
switch (event.requestContext.http.method) {
case 'GET':
return await getPokemon(event);
case 'POST':
return await createPokemon(event);
case 'DELETE':
return await deletePokemon(event);
default:
return {
statusCode: 405,
body: 'Method Not Allowed'
}
}
}