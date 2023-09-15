import * as fs from 'fs';
import * as sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';

const db_path = process.env['DB_PATH'];
const webSites = [{ name: 'Glassdoor', link: 'https://www.glassdoor.com' }];
const languages = [
  'Albanian',
  'Basque',
  'Belarusian',
  'Bosnian',
  'Bulgarian',
  'Catalan',
  'Croatian',
  'Czech',
  'Danish',
  'Dutch',
  'English',
  'Estonian',
  'Finnish',
  'French',
  'Galician',
  'German',
  'Greek',
  'Hungarian',
  'Icelandic',
  'Irish',
  'Italian',
  'Latvian',
  'Lithuanian',
  'Luxembourgish',
  'Macedonian',
  'Maltese',
  'Moldovan',
  'Montenegrin',
  'Norwegian',
  'Polish',
  'Portuguese',
  'Romanian',
  'Russian',
  'Sami',
  'Serbian',
  'Slovak',
  'Slovenian',
  'Spanish',
  'Swedish',
  'Turkish',
  'Ukrainian',
  'Welsh',
];

export class DatabaseInitializer {
  initialize() {
    // Check if the DB_PATH environment variable is set
    if (!db_path) {
      throw new Error('DB_PATH environment variable is not set.');
    }

    // Check if the database file already exists
    if (fs.existsSync(db_path)) {
      console.log('Database already exists. No initialization required.');
      return;
    }

    const db = new sqlite3.Database(db_path);
    db.serialize(() => {
      createWebsitesTable(db);
      createSearchRequestsTable(db);
      createLanguagesTable(db);
      createSearchRequestsToLanguagesTable(db);
      createRawJobsTable(db);
      createRawJobsToSearchRequestTable(db);
      createRankedJobsTable(db);
      createRankedJobsToRawJobsTable(db);

      populateWebsitesTable(db);
      populateLanguagesTable(db);
    });
    db.close();
  }
}

const createWebsitesTable = (db: Database) => {
  db.run(`
      CREATE TABLE websites
      (
          id   INTEGER NOT NULL PRIMARY KEY,
          name TEXT,
          link TEXT
      );
  `);
};

const createSearchRequestsTable = (db: Database) => {
  db.run(`
      CREATE TABLE search_requests
      (
          id      INTEGER NOT NULL PRIMARY KEY,
          request TEXT
      );
  `);
};

const createLanguagesTable = (db: Database) => {
  db.run(`
      CREATE TABLE languages
      (
          id       INTEGER NOT NULL PRIMARY KEY,
          language TEXT
      );
  `);
};

const createSearchRequestsToLanguagesTable = (db: Database) => {
  db.run(`
      CREATE TABLE search_requests_to_languages
      (
          search_request_id INTEGER NOT NULL,
          language_id       INTEGER NOT NULL,
          PRIMARY KEY (search_request_id, language_id),
          FOREIGN KEY (search_request_id) REFERENCES search_requests (id),
          FOREIGN KEY (language_id) REFERENCES languages (id)
      );
  `);
};

const createRawJobsTable = (db: Database) => {
  db.run(`
      CREATE TABLE raw_jobs
      (
          id           INTEGER NOT NULL PRIMARY KEY,
          job_title    TEXT    NOT NULL,
          company      TEXT    NOT NULL,
          description  TEXT    NOT NULL,
          job_link     TEXT    NOT NULL,
          website_id   INTEGER NOT NULL,
          stop_trigger TEXT    NOT NULL,
          location     TEXT,
          job_post_id  TEXT,
          post_date    TEXT,
          FOREIGN KEY (website_id) REFERENCES websites (id)
      );
  `);
};

const createRawJobsToSearchRequestTable = (db: Database) => {
  db.run(`
      CREATE TABLE raw_jobs_to_search_requests
      (
          raw_job_id        INTEGER NOT NULL,
          search_request_id INTEGER NOT NULL,
          PRIMARY KEY (raw_job_id, search_request_id),
          FOREIGN KEY (raw_job_id) REFERENCES raw_jobs (id),
          FOREIGN KEY (search_request_id) REFERENCES search_requests (id)
      );
  `);
};

const createRankedJobsTable = (db: Database) => {
  db.run(`
      CREATE TABLE ranked_jobs
      (
          id                     INTEGER NOT NULL PRIMARY KEY,
          job_title              TEXT,
          company                TEXT,
          location               TEXT,
          working_type           TEXT,
          tech_stack             TEXT,
          mandatory_requirements TEXT,
          desirable_requirements TEXT,
          project_summary        TEXT,
          job_summary            TEXT,
          search_request_id      INTEGER NOT NULL,
          rating                 INTEGER NOT NULL,
          FOREIGN KEY (search_request_id) REFERENCES search_requests (id)
      );
  `);
};

const createRankedJobsToRawJobsTable = (db: Database) => {
  db.run(`
      CREATE TABLE ranked_jobs_to_raw_jobs
      (
          ranked_jobs_id INTEGER NOT NULL,
          raw_jobs_id    INTEGER NOT NULL,
          PRIMARY KEY (ranked_jobs_id, raw_jobs_id),
          FOREIGN KEY (ranked_jobs_id) REFERENCES ranked_jobs (id),
          FOREIGN KEY (raw_jobs_id) REFERENCES raw_jobs (id)
      );
  `);
};

const populateLanguagesTable = (db: Database) => {
  languages.forEach((lang) => {
    db.run('INSERT INTO languages (language) VALUES (?)', [lang], (err) => {
      if (err) {
        console.error(err.message);
      }
    });
  });
};

const populateWebsitesTable = (db: Database) => {
  webSites.forEach((site) => {
    db.run(
      'INSERT INTO websites (name, link) VALUES (?, ?)',
      [site.name, site.link],
      (err) => {
        if (err) {
          console.error(err.message);
        }
      }
    );
  });
};
