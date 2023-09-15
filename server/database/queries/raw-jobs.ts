import * as sqlite3 from 'sqlite3';
import { RawJob } from '../../models/rawJob';
import * as util from 'util';

export class RawJobs {
  private readonly db: sqlite3.Database;
  private readonly dbGet: (sql: string, params?: any) => Promise<unknown>;

  constructor() {
    this.db = new sqlite3.Database(process.env['DB_PATH']!);
    this.dbGet = util.promisify(this.db.get).bind(this.db);
  }

  insertRawJob(job: RawJob): void {
    const sql =
      'INSERT INTO raw_jobs (job_title, company, description, job_link, website_id, stop_trigger, location, job_post_id, post_date) VALUES (?,?,?,?,?,?,?,?,?)';
    this.db.run(sql, [
      job.title,
      job.company,
      job.description,
      job.jobLink,
      job.websiteId,
      job.stopTrigger,
      job.location,
      job.jobPostId,
      job.postDate,
    ]);
  }

  async stopScraping(stopTrigger: string): Promise<boolean> {
    const sql = 'SELECT * FROM raw_jobs WHERE stop_trigger = ?';
    console.log('stopScraping: ' + stopTrigger);
    const row = await this.dbGet(sql, [stopTrigger]);
    return row !== undefined;
  }
}
