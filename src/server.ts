import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { Pool } from "pg";
import config from "./config";
const app: Application = express();
// const port = 5000;

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  connectionString: config.connection_string,
});

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) ,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255),
      age INT,
      is_Active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
      );
      `);
    console.log("Database Connected");
  } catch (err) {
    console.log(err);
  }
};
initDB();
// console.log(pool);
app.get("/", (req: Request, res: Response) => {
  //  res.send("H")
  console.log(req);
  res.status(200).json({
    success: true,
    message: "Hello",
    author: "Avijeet",
  });
});

app.post("/api/v1/users", async (req: Request, res: Response) => {
  //  res.send("H")
  // console.log(req.body);

  try {
    const { name, email, password, age } = req.body;
    const result = await pool.query(
      `INSERT INTO users(name,email,password,age) VALUES($1,$2,$3,$4) RETURNING *`,
      [name, email, password, age],
    );
    console.log(result);

    //   console.log(req);
    //  console.log(password);
    res.status(201).json({
      success: true,
      message: "USER CREATED",
      data: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message,
      data: err,
    });
  }
});

//get all users
app.get("/api/v1/users", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM users`);
    console.log(result);
    res.status(201).json({
      success: true,
      message: "USERS found",
      data: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message,
      data: err,
    });
  }
});

//get single user
app.get("/api/v1/users/:id", async (req: Request, res: Response) => {
  try {
    // Extract and convert the user ID to a number
    const { id } = req.params;
    const userId = Number(id);

    // Validate the user ID
    if (!Number.isInteger(userId)) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }
    const result = await pool.query(
      `SELECT * FROM users WHERE  id=$1`,

      [userId],
    );
    // console.log(result);
    // Check whether the user exists
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }
    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: "USER found",
      data: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message,
      data: err,
    });
  }
});

app.put("/api/v1/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = Number(id);
    const { name, password, age, is_Active } = req.body;
    // Validate the user ID
    if (!Number.isInteger(userId)) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }
    const result = await pool.query(
      `UPDATE users
      SET name = COALESCE($1,name),password = COALESCE($2,password),age =COALESCE($3,age),is_Active = COALESCE($4,is_Active),
      updated_at= NOW()
      WHERE id=$5  RETURNING *`,
      [name ?? null, password ?? null, age ?? null, is_Active ?? null, userId],
    );
    console.log(result);
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }
    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: "USER UPDATED",
      data: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message,
      data: err,
    });
  }
});

app.delete("/api/v1/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = Number(id);
    if (!Number.isInteger(userId)) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }
    const result = await pool.query(
      `
  DELETE FROM users WHERE id=$1
  `,
      [userId],
    );
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }
    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: "USER Deleted successfully",
      data: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message,
      data: err,
    });
  }
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
