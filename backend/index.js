import pg from 'pg'
const { Pool } = pg

let pool

const getLocations = async (event) => {

  const res = await pool.query(`
  select locations.name, locations.timezone, weather.temperature, weather.description, weather.user_uuid
  from locations
  join weather on locations.id = weather.location_id;
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

const createLocation = async (event) => {

  const newLocation = JSON.parse(event.body);
  console.log(newLocation)

  // Get the currently logged in user
  const userId = event.requestContext.authorizer.jwt.claims.sub

  // Persist my locations object
  await pool.query('BEGIN');

    // Insert the new location data
    const locationQuery = {
      text: 'INSERT INTO locations (name, timezone, user_uuid) VALUES ($1, $2, $3) RETURNING id',
      values: [newLocation.name, newLocation.timezone, userId]
    };
    const locationResult = await pool.query(locationQuery);

    // Insert the new weather data
    const weatherQuery = {
      text: 'INSERT INTO weather (location_id, timestamp, temperature, description, user_uuid) VALUES ($1, $2, $3, $4, $5)',
      values: [locationResult.rows[0].id, new Date(), newLocation.weather.temperature, newLocation.weather.description, userId]
    };
    await pool.query(weatherQuery);

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
      return await getLocations(event);
    case 'POST':
      return await createLocation(event);
    default:
      return {
        statusCode: 405,
        body: 'Method Not Allowed',
      }
  }
};