import * as sqlite3 from 'sqlite3';
import * as util from 'util';
import { Website } from '../../models/website';

export class Websites {
  private readonly db: sqlite3.Database;
  private readonly dbGet: (sql: string, params?: any) => Promise<unknown>;

  constructor() {
    this.db = new sqlite3.Database(process.env['DB_PATH']!);
    this.dbGet = util.promisify(this.db.get).bind(this.db);
  }

  async getWebsite(name: string): Promise<Website> {
    const sql = 'SELECT * FROM websites WHERE name = ?';
    const row = (await this.dbGet(sql, [name])) as Website | undefined;
    if (row === undefined) {
      throw new Error(`Website with name ${name} not found`);
    }
    return row;
  }
}
