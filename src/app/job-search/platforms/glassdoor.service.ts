import {IJobSearch} from "../interfaces/i-job-search";
import {Browser, Page} from "@playwright/test";

export type Job = {
  jobLink: string,
  employerName: string,
  jobTitle: string,
  location: string,
  description: string,
}

export class GlassdoorService implements IJobSearch {
  constructor(private browser: Browser, private page: Page) {
  }

  async authorize(login: string, password: string) {
    await this.page.goto('https://www.glassdoor.com/index.htm');
    await this.page.locator('[data-test="emailInput"]').fill(login);
    await this.page.getByTestId('email-form-button').click();
    await this.page.locator('[data-test="passwordInput"]').fill(password);
    await this.page.getByRole('button', {name: 'Sign In', exact: true}).click();
    await this.page.locator('[data-test="desktop-utility-nav-profile-button"]').waitFor({
      state: "visible",
      timeout: 10_000
    });
  }

  async navigateToSearchResultPage(searchString: string, location: string) {
    await this.page.goto('https://www.glassdoor.com/Job/index.htm');
    await this.page.getByLabel('Search keyword').fill(searchString);
    await this.page.getByLabel('Search location').clear();
    await this.page.getByLabel('Search location').fill(location);
    await this.page.locator('#search-suggestions').getByText('Netherlands', {exact: true}).click();

    const modal = this.page.locator('[data-test="modal-jobalert"] .modal_main');
    if (await modal.isVisible()) {
      await this.page.getByAltText("Close", {exact: true}).click()
      await modal.waitFor({state: "hidden"})
    }

    await this.page.locator('[data-test="sort-by-header"]').click();
    await this.page.locator('[data-test="date_desc"]').click();
  }

  async collectJobs() {
    let jobList: Job[] = [];
    const jobs = await this.page.locator('[data-test="jobListing"]').all();
    for (const job of jobs) {
      await job.click();
      const jobLink = (await job.locator('[data-test="job-link"]').getAttribute('href'))!;
      const jobHeader = this.page.locator('[data-test="hero-header-module"]');
      const employerName = await jobHeader.locator('[data-test="employerName"]').innerText();
      const jobTitle = await jobHeader.locator('[data-test="jobTitle"]').innerText();
      const location = await jobHeader.locator('[data-test="location"]').innerText();
      const description = await this.page.locator('.jobDescriptionContent').innerText();
      await this.page.getByText('Show More', {exact: true}).click();

      jobList.push({jobLink, employerName, jobTitle, location, description})
    }

    await this.page.locator('[data-test="pagination-next"]').click();

    return jobList;
  }

}
