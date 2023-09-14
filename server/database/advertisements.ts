import * as sqlite3 from 'sqlite3';
import { Job } from '../models/job';

export class Advertisements {
  private db: sqlite3.Database;

  constructor(dbPath: string) {
    this.db = new sqlite3.Database(dbPath);
  }

  // Create new advertisement
  createAdvertisement(job: Job): void {
    const sql =
      'INSERT INTO advertisements (job_title, company, description, job_link, website_id, stop_trigger, location, ad_post_id, post_date) VALUES (?,?,?,?,?,?,?,?,?)';
    this.db.run(sql, [
      job.title,
      job.company,
      job.description,
      job.jobLink,
      job.websiteId,
      job.stopTrigger,
      job.location,
      job.adPostId,
      job.postDate,
    ]);
  }

  // Read advertisement by ID
  readAdvertisement(id: number): void {
    const sql = 'SELECT * FROM advertisements WHERE id = ?';
    this.db.get(sql, [id], (err, row) => {
      console.log(row);
    });
  }

  // Update advertisement by ID
  // updateAdvertisement(id: number, title: string, description: string): void {
  //   const sql = 'UPDATE advertisements SET job_title = ?, description = ? WHERE id = ?';
  //   this.db.run(sql, [title, description, id]);
  // }

  // Delete advertisement by ID
  deleteAdvertisement(id: number): void {
    const sql = 'DELETE FROM advertisements WHERE id = ?';
    this.db.run(sql, [id]);
  }
}
