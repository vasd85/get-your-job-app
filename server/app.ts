import './dotenv';
import * as express from 'express';
import { DatabaseInitializer } from './database/database-initializer';

const app = express();
const port = 3000;

new DatabaseInitializer().initialize();

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
