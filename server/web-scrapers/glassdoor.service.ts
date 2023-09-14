import { IWebScraper } from './interfaces/i-web-scraper';
import { Page } from '@playwright/test';
import { Job } from '../models/job';

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
    await this.page.locator('[data-test="date_desc"]').click();
  }

  async collectJobs(): Promise<Job[]> {
    let jobList: Job[] = [];

    const nextPage = this.page.locator('[data-test="pagination-next"]');

    let i = 0;
    while ((await nextPage.isEnabled()) && i < 3) {
      i++;
      console.log(i);
      const jobs = await this.collectOnePage();
      jobList = [...jobList, ...jobs];
      await nextPage.click();
    }

    return jobList;
  }

  // TODO implement this method to use it for stopping the scraping
  private stopTrigger = async () => {};

  private collectOnePage = async () => {
    let jobList: Job[] = [];
    const jobs = await this.page.locator('[data-test="jobListing"]').all();
    for (const job of jobs) {
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
      await this.page.getByText('Show More', { exact: true }).click();
      const stopTrigger = (await job.getAttribute('data-id'))!;

      jobList.push({
        title,
        company,
        location,
        description,
        jobLink,
        websiteId,
        stopTrigger,
      });
    }

    return jobList;
  };
}
