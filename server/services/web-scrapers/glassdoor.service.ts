import { IWebScraper } from './interfaces/i-web-scraper';
import { Page } from '@playwright/test';
import { RawJobs } from '../../database/queries/raw-jobs';

const baseUrl = 'https://www.glassdoor.com'; // TODO: get from DB
const websiteId = 1; // TODO: get from DB

export enum Period {
  Any = 'Posted Any Time',
  LastDay = 'Last Day',
  Last3Days = 'Last 3 Days',
  LastWeek = 'Last Week',
  Last2Weeks = 'Last 2 Weeks',
  LastMonth = 'Last Month',
}

export class GlassdoorService implements IWebScraper {
  constructor(private page: Page) {}

  async authorize(login: string, password: string) {
    await this.page.goto(baseUrl);
    await this.page.locator('[data-test="emailInput"]').fill(login);
    await this.page.getByTestId('email-form-button').click();
    await this.page.locator('[data-test="passwordInput"]').fill(password);
    await this.page
      .getByRole('button', { name: 'Sign In', exact: true })
      .click();
    await this.page
      .locator('[data-test="desktop-utility-nav-profile-button"]')
      .waitFor({ state: 'visible' });
  }

  async navigateToSearchResultPage(
    searchString: string,
    location: string,
    period?: Period
  ) {
    await this.page.goto(baseUrl + '/Job/index.htm');
    await this.page.getByLabel('Search keyword').fill(searchString);
    await this.page.getByLabel('Search location').clear();
    await this.page.getByLabel('Search location').fill(location);
    await this.page
      .locator('#search-suggestions')
      .getByText(location, { exact: true })
      .click();

    const modal = this.page.locator('[data-test="modal-jobalert"] .modal_main');
    if (await modal.isVisible()) {
      await this.page.getByAltText('Close', { exact: true }).click();
      await modal.waitFor({ state: 'hidden' });
    }

    if (period) {
      await this.page.locator('[data-test="DATEPOSTED"]').click();
      await this.page.locator('#PrimaryDropdown').getByText(period).click();
    }

    await this.page.locator('[data-test="sort-by-header"]').click();
    if (!(await this.page.locator('[data-test="date_desc"]').isVisible())) {
      await this.page.waitForTimeout(1000);
      await this.page.locator('[data-test="sort-by-header"]').click();
    }
    await this.page.locator('[data-test="date_desc"]').click();
    await this.page.waitForTimeout(2000);
  }

  async collectJobs(): Promise<void> {
    let page = 1;
    while (await this.scrapPage()) {
      await this.page.locator('[data-test="pagination-next"]').click();

      page++;
      await this.page
        .locator(`[data-test="pagination-link-${page}"]`)
        .and(this.page.locator('.selected'))
        .waitFor({ state: 'attached' });
    }
  }

  private async scrapPage(): Promise<boolean> {
    const jobs = await this.page.locator('[data-test="jobListing"]').all();
    const db = new RawJobs();

    for (const job of jobs) {
      // stop scraping if stop trigger is found
      const stopTrigger = (await job.getAttribute('data-id'))!;
      if (await db.stopScraping(stopTrigger)) {
        console.log('Stop scraping triggered');
        return false;
      }
      // save job to DB
      await job.click();
      const jobLink = (await job
        .locator('[data-test="job-link"]')
        .getAttribute('href'))!;
      const jobHeader = this.page.locator('[data-test="hero-header-module"]');
      const company = await jobHeader
        .locator('[data-test="employerName"]')
        .innerText();
      const title = await jobHeader
        .locator('[data-test="jobTitle"]')
        .innerText();
      const location = await jobHeader
        .locator('[data-test="location"]')
        .innerText();
      const description = await this.page
        .locator('.jobDescriptionContent')
        .innerText();
      db.insertRawJob({
        title,
        company,
        location,
        description,
        jobLink,
        websiteId,
        stopTrigger,
      });
    }
    // stop scraping if there is no next page
    return this.page.locator('[data-test="pagination-next"]').isEnabled();
  }
}
