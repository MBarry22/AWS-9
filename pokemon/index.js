import pg from 'pg'
const { Pool } = pg

let pool
const getPokemon = async (event) => {
  const res = await pool.query(`
    SELECT * FROM pokemon;
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

  // Persist the new pokemon data
  await pool.query('BEGIN');

  const pokemonQuery = {
    text: 'INSERT INTO pokemon (name, type1, type2, hp, attack, defense, sp_attack, sp_defense, speed, total) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
    values: [newPokemon.name, newPokemon.type1, newPokemon.type2, newPokemon.hp, newPokemon.attack, newPokemon.defense, newPokemon.sp_attack, newPokemon.sp_defense, newPokemon.speed, newPokemon.total]
  };
  const pokemonResult = await pool.query(pokemonQuery);

  // Commit the transaction
  await pool.query('COMMIT');

  const response = {
    statusCode: 201,
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({id: pokemonResult.rows[0].id}),
  };
  return response;
}

const updatePokemon = async (event) => {
  const pokemonId = event.pathParameters.id;
  const updatedPokemon = JSON.parse(event.body);
  console.log(updatedPokemon);

  await pool.query('BEGIN');

  // Update the pokemon data
  const updateQuery = {
    text: 'UPDATE pokemon SET name = $1, type1 = $2, type2 = $3, hp = $4, attack = $5, defense = $6, sp_attack = $7, sp_defense = $8, speed = $9, total = $10 WHERE id = $11',
    values: [updatedPokemon.name, updatedPokemon.type1, updatedPokemon.type2, updatedPokemon.hp, updatedPokemon.attack, updatedPokemon.defense, updatedPokemon.sp_attack, updatedPokemon.sp_defense, updatedPokemon.speed, updatedPokemon.total, pokemonId]
  };
  await pool.query(updateQuery);

  // Commit the transaction
  await pool.query('COMMIT');

  const response = {
    statusCode: 200,
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({message: "ok"}),
  };
  return response;
}

const deletePokemon = async (event) => {
  const pokemonId = event.pathParameters.id;

  await pool.query('BEGIN');

  // Delete the pokemon data
  const deleteQuery = {
    text: 'DELETE FROM pokemon WHERE id = $1',
    values: [pokemonId]
  };
  await pool.query(deleteQuery);

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
        return getPokemon(event);
    case 'POST':
        return createPokemon(event);
    case 'DELETE':
        return deletePokemon(event);
    default:
        return {
            statusCode: 405,
            body: 'Method Not Allowed'
        };
    }
}

// Path: backend\pokemons.js
