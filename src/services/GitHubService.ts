import { Octokit } from "@octokit/rest";
import {
	type GitHubComment,
	GitHubCommentSchema,
	type GitHubConfig,
	type GitHubEvent,
	GitHubEventSchema,
	type GitHubIssue,
	GitHubIssueSchema,
} from "../types";

export class GitHubService {
	private octokit: Octokit;
	private config: GitHubConfig;

	constructor(config: GitHubConfig) {
		this.config = config;
		this.octokit = new Octokit({
			auth: config.token,
		});
	}

	async getIssue(issueNumber: number): Promise<GitHubIssue> {
		const response = await this.octokit.issues.get({
			owner: this.config.owner,
			repo: this.config.repo,
			issue_number: issueNumber,
		});

		return GitHubIssueSchema.parse(response.data);
	}

	async getIssueComments(issueNumber: number): Promise<GitHubComment[]> {
		const response = await this.octokit.issues.listComments({
			owner: this.config.owner,
			repo: this.config.repo,
			issue_number: issueNumber,
		});

		return response.data.map((comment) => GitHubCommentSchema.parse(comment));
	}

	async addComment(issueNumber: number, body: string): Promise<void> {
		await this.octokit.issues.createComment({
			owner: this.config.owner,
			repo: this.config.repo,
			issue_number: issueNumber,
			body,
		});
	}

	async updateIssue(
		issueNumber: number,
		updates: {
			title?: string;
			body?: string;
			state?: "open" | "closed";
			labels?: string[];
		},
	): Promise<void> {
		await this.octokit.issues.update({
			owner: this.config.owner,
			repo: this.config.repo,
			issue_number: issueNumber,
			...updates,
		});
	}

	async addLabels(issueNumber: number, labels: string[]): Promise<void> {
		await this.octokit.issues.addLabels({
			owner: this.config.owner,
			repo: this.config.repo,
			issue_number: issueNumber,
			labels,
		});
	}

	async removeLabel(issueNumber: number, label: string): Promise<void> {
		await this.octokit.issues.removeLabel({
			owner: this.config.owner,
			repo: this.config.repo,
			issue_number: issueNumber,
			name: label,
		});
	}

	async getPullRequest(prNumber: number): Promise<{
		number: number;
		title: string;
		state: string;
		mergeable: boolean | null;
		merged: boolean;
	}> {
		const response = await this.octokit.pulls.get({
			owner: this.config.owner,
			repo: this.config.repo,
			pull_number: prNumber,
		});

		return response.data;
	}

	async mergePullRequest(
		prNumber: number,
		mergeMethod: "merge" | "squash" | "rebase" = "merge",
	): Promise<void> {
		await this.octokit.pulls.merge({
			owner: this.config.owner,
			repo: this.config.repo,
			pull_number: prNumber,
			merge_method: mergeMethod,
		});
	}

	async updateBranch(branch: string, ref: string): Promise<void> {
		await this.octokit.git.updateRef({
			owner: this.config.owner,
			repo: this.config.repo,
			ref: `heads/${branch}`,
			sha: ref,
		});
	}

	async createFile(
		path: string,
		message: string,
		content: string,
		branch?: string,
	): Promise<void> {
		await this.octokit.repos.createOrUpdateFileContents({
			owner: this.config.owner,
			repo: this.config.repo,
			path,
			message,
			content: Buffer.from(content).toString("base64"),
			branch: branch || this.config.baseBranch,
		});
	}

	async updateFile(
		path: string,
		message: string,
		content: string,
		sha: string,
		branch?: string,
	): Promise<void> {
		await this.octokit.repos.createOrUpdateFileContents({
			owner: this.config.owner,
			repo: this.config.repo,
			path,
			message,
			content: Buffer.from(content).toString("base64"),
			sha,
			branch: branch || this.config.baseBranch,
		});
	}

	async getFile(
		path: string,
		branch?: string,
	): Promise<{ content: string; sha: string } | null> {
		try {
			const response = await this.octokit.repos.getContent({
				owner: this.config.owner,
				repo: this.config.repo,
				path,
				ref: branch || this.config.baseBranch,
			});

			if (Array.isArray(response.data)) {
				return null;
			}

			if (response.data.type === "file" && "content" in response.data) {
				return {
					content: Buffer.from(response.data.content, "base64").toString(
						"utf-8",
					),
					sha: response.data.sha,
				};
			}

			return null;
		} catch (error: unknown) {
			if (
				error &&
				typeof error === "object" &&
				"status" in error &&
				error.status === 404
			) {
				return null;
			}
			throw error;
		}
	}

	parseEvent(eventPath: string): GitHubEvent {
		const fs = require("node:fs");
		const eventData = JSON.parse(fs.readFileSync(eventPath, "utf-8"));
		return GitHubEventSchema.parse(eventData);
	}

	async enableBranchProtection(
		branch: string,
		requiredReviews: number = 1,
	): Promise<void> {
		await this.octokit.repos.updateBranchProtection({
			owner: this.config.owner,
			repo: this.config.repo,
			branch,
			required_status_checks: null,
			enforce_admins: false,
			required_pull_request_reviews: {
				required_approving_review_count: requiredReviews,
				dismiss_stale_reviews: true,
				require_code_owner_reviews: false,
			},
			restrictions: null,
		});
	}

	async disableBranchProtection(branch: string): Promise<void> {
		await this.octokit.repos.deleteBranchProtection({
			owner: this.config.owner,
			repo: this.config.repo,
			branch,
		});
	}

	async createStatusCheck(
		sha: string,
		context: string,
		state: "pending" | "success" | "failure" | "error",
		description: string,
		targetUrl?: string,
	): Promise<void> {
		await this.octokit.repos.createCommitStatus({
			owner: this.config.owner,
			repo: this.config.repo,
			sha,
			state,
			target_url: targetUrl,
			description,
			context,
		});
	}

	async updateStatusCheck(
		sha: string,
		context: string,
		state: "pending" | "success" | "failure" | "error",
		description: string,
		targetUrl?: string,
	): Promise<void> {
		await this.createStatusCheck(sha, context, state, description, targetUrl);
	}

	async getCommitSha(issueNumber: number): Promise<string | null> {
		try {
			// Try to get the PR associated with this issue
			const response = await this.octokit.pulls.list({
				owner: this.config.owner,
				repo: this.config.repo,
				state: "open",
			});

			// Find PR that references this issue
			const pr = response.data.find(
				(pr) =>
					pr.body?.includes(`#${issueNumber}`) ||
					pr.title.includes(`#${issueNumber}`),
			);

			if (pr) {
				return pr.head.sha;
			}

			// If no PR found, try to get the latest commit from the default branch
			const defaultBranch = await this.octokit.repos.get({
				owner: this.config.owner,
				repo: this.config.repo,
			});

			const branchResponse = await this.octokit.repos.getBranch({
				owner: this.config.owner,
				repo: this.config.repo,
				branch: defaultBranch.data.default_branch,
			});

			return branchResponse.data.commit.sha;
		} catch (error) {
			console.warn(
				`Could not get commit SHA for issue #${issueNumber}:`,
				error,
			);
			return null;
		}
	}

	getConfig(): GitHubConfig {
		return this.config;
	}

	async getPullRequestByIssue(issueNumber: number): Promise<{
		number: number;
		title: string;
		body: string | null;
		state: string;
	} | null> {
		try {
			const response = await this.octokit.pulls.list({
				owner: this.config.owner,
				repo: this.config.repo,
				state: "open",
			});

			// Find PR that references this issue
			const pr = response.data.find(
				(pr) =>
					pr.body?.includes(`#${issueNumber}`) ||
					pr.title.includes(`#${issueNumber}`),
			);

			if (pr) {
				return {
					number: pr.number,
					title: pr.title,
					body: pr.body,
					state: pr.state,
				};
			}

			return null;
		} catch (error) {
			console.warn(
				`Could not get PR for issue #${issueNumber}:`,
				error,
			);
			return null;
		}
	}

	async updatePullRequestBody(
		prNumber: number,
		body: string,
	): Promise<void> {
		await this.octokit.pulls.update({
			owner: this.config.owner,
			repo: this.config.repo,
			pull_number: prNumber,
			body,
		});
	}
}
