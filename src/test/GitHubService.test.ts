import { GitHubService } from "../services/GitHubService";
import type {
	GitHubComment,
	GitHubConfig,
	GitHubEvent,
	GitHubIssue,
} from "../types";

// Mock the Octokit library
jest.mock("@octokit/rest", () => {
	return {
		Octokit: jest.fn().mockImplementation(() => ({
			issues: {
				get: jest.fn(),
				listComments: jest.fn(),
				createComment: jest.fn(),
				update: jest.fn(),
				addLabels: jest.fn(),
				removeLabel: jest.fn(),
			},
			pulls: {
				get: jest.fn(),
				merge: jest.fn(),
			},
			git: {
				updateRef: jest.fn(),
			},
			repos: {
				createOrUpdateFileContents: jest.fn(),
				getContent: jest.fn(),
				updateBranchProtection: jest.fn(),
				deleteBranchProtection: jest.fn(),
			},
		})),
	};
});

describe("GitHubService", () => {
	let githubService: GitHubService;
	let mockOctokit: {
		issues: {
			get: jest.Mock;
			update: jest.Mock;
			addLabels: jest.Mock;
			removeLabel: jest.Mock;
			createComment: jest.Mock;
			listComments: jest.Mock;
		};
		pulls: {
			get: jest.Mock;
			merge: jest.Mock;
		};
		repos: {
			getContent: jest.Mock;
			createOrUpdateFileContents: jest.Mock;
			updateBranch: jest.Mock;
			getBranch: jest.Mock;
			updateBranchProtection: jest.Mock;
			deleteBranchProtection: jest.Mock;
		};
	};

	const mockConfig: GitHubConfig = {
		token: "test-token",
		owner: "test-owner",
		repo: "test-repo",
		baseBranch: "main",
	};

	beforeEach(() => {
		jest.clearAllMocks();
		githubService = new GitHubService(mockConfig);
		mockOctokit = (githubService as unknown as { octokit: typeof mockOctokit })
			.octokit;
	});

	describe("constructor", () => {
		it("should initialize with correct configuration", () => {
			expect(githubService).toBeInstanceOf(GitHubService);
		});
	});

	describe("getIssue", () => {
		it("should fetch an issue successfully", async () => {
			const mockIssue: GitHubIssue = {
				number: 123,
				title: "Test Issue",
				body: "Test body",
				state: "open",
				user: { login: "testuser", id: 1, type: "User" },
				created_at: "2023-01-01T00:00:00Z",
				updated_at: "2023-01-01T00:00:00Z",
				closed_at: null,
				labels: [],
			};

			mockOctokit.issues.get.mockResolvedValue({ data: mockIssue });

			const result = await githubService.getIssue(123);

			expect(mockOctokit.issues.get).toHaveBeenCalledWith({
				owner: "test-owner",
				repo: "test-repo",
				issue_number: 123,
			});
			expect(result).toEqual(mockIssue);
		});

		it("should handle API errors", async () => {
			mockOctokit.issues.get.mockRejectedValue(new Error("API Error"));

			await expect(githubService.getIssue(123)).rejects.toThrow("API Error");
		});
	});

	describe("getIssueComments", () => {
		it("should fetch issue comments successfully", async () => {
			const mockComments: GitHubComment[] = [
				{
					id: 1,
					body: "Test comment",
					user: { login: "testuser", id: 1, type: "User" },
					created_at: "2023-01-01T00:00:00Z",
					updated_at: "2023-01-01T00:00:00Z",
				},
			];

			mockOctokit.issues.listComments.mockResolvedValue({ data: mockComments });

			const result = await githubService.getIssueComments(123);

			expect(mockOctokit.issues.listComments).toHaveBeenCalledWith({
				owner: "test-owner",
				repo: "test-repo",
				issue_number: 123,
			});
			expect(result).toEqual(mockComments);
		});
	});

	describe("addComment", () => {
		it("should add a comment successfully", async () => {
			mockOctokit.issues.createComment.mockResolvedValue({});

			await githubService.addComment(123, "Test comment");

			expect(mockOctokit.issues.createComment).toHaveBeenCalledWith({
				owner: "test-owner",
				repo: "test-repo",
				issue_number: 123,
				body: "Test comment",
			});
		});
	});

	describe("updateIssue", () => {
		it("should update an issue successfully", async () => {
			mockOctokit.issues.update.mockResolvedValue({});

			const updates = {
				title: "Updated Title",
				state: "closed" as const,
			};

			await githubService.updateIssue(123, updates);

			expect(mockOctokit.issues.update).toHaveBeenCalledWith({
				owner: "test-owner",
				repo: "test-repo",
				issue_number: 123,
				...updates,
			});
		});
	});

	describe("addLabels", () => {
		it("should add labels successfully", async () => {
			mockOctokit.issues.addLabels.mockResolvedValue({});

			await githubService.addLabels(123, ["label1", "label2"]);

			expect(mockOctokit.issues.addLabels).toHaveBeenCalledWith({
				owner: "test-owner",
				repo: "test-repo",
				issue_number: 123,
				labels: ["label1", "label2"],
			});
		});
	});

	describe("removeLabel", () => {
		it("should remove a label successfully", async () => {
			mockOctokit.issues.removeLabel.mockResolvedValue({});

			await githubService.removeLabel(123, "label1");

			expect(mockOctokit.issues.removeLabel).toHaveBeenCalledWith({
				owner: "test-owner",
				repo: "test-repo",
				issue_number: 123,
				name: "label1",
			});
		});
	});

	describe("mergePullRequest", () => {
		it("should merge a PR successfully", async () => {
			mockOctokit.pulls.merge.mockResolvedValue({});

			await githubService.mergePullRequest(123, "squash");

			expect(mockOctokit.pulls.merge).toHaveBeenCalledWith({
				owner: "test-owner",
				repo: "test-repo",
				pull_number: 123,
				merge_method: "squash",
			});
		});

		it("should use default merge method", async () => {
			mockOctokit.pulls.merge.mockResolvedValue({});

			await githubService.mergePullRequest(123);

			expect(mockOctokit.pulls.merge).toHaveBeenCalledWith({
				owner: "test-owner",
				repo: "test-repo",
				pull_number: 123,
				merge_method: "merge",
			});
		});
	});

	describe("getFile", () => {
		it("should get file content successfully", async () => {
			const mockResponse = {
				data: {
					type: "file",
					content: Buffer.from("test content").toString("base64"),
					sha: "abc123",
				},
			};

			mockOctokit.repos.getContent.mockResolvedValue(mockResponse);

			const result = await githubService.getFile("test.md");

			expect(mockOctokit.repos.getContent).toHaveBeenCalledWith({
				owner: "test-owner",
				repo: "test-repo",
				path: "test.md",
				ref: "main",
			});
			expect(result).toEqual({
				content: "test content",
				sha: "abc123",
			});
		});

		it("should return null for 404 errors", async () => {
			const error = new Error("Not Found") as Error & { status: number };
			error.status = 404;
			mockOctokit.repos.getContent.mockRejectedValue(error);

			const result = await githubService.getFile("nonexistent.md");

			expect(result).toBeNull();
		});

		it("should throw for other errors", async () => {
			mockOctokit.repos.getContent.mockRejectedValue(new Error("API Error"));

			await expect(githubService.getFile("test.md")).rejects.toThrow(
				"API Error",
			);
		});

		it("should return null for directory responses", async () => {
			const mockResponse = {
				data: [{ type: "file", name: "file1.md" }],
			};

			mockOctokit.repos.getContent.mockResolvedValue(mockResponse);

			const result = await githubService.getFile("test/");

			expect(result).toBeNull();
		});
	});

	describe("createFile", () => {
		it("should create a file successfully", async () => {
			mockOctokit.repos.createOrUpdateFileContents.mockResolvedValue({});

			await githubService.createFile(
				"test.md",
				"Create test file",
				"test content",
			);

			expect(mockOctokit.repos.createOrUpdateFileContents).toHaveBeenCalledWith(
				{
					owner: "test-owner",
					repo: "test-repo",
					path: "test.md",
					message: "Create test file",
					content: Buffer.from("test content").toString("base64"),
					branch: "main",
				},
			);
		});

		it("should use custom branch", async () => {
			mockOctokit.repos.createOrUpdateFileContents.mockResolvedValue({});

			await githubService.createFile(
				"test.md",
				"Create test file",
				"test content",
				"develop",
			);

			expect(mockOctokit.repos.createOrUpdateFileContents).toHaveBeenCalledWith(
				{
					owner: "test-owner",
					repo: "test-repo",
					path: "test.md",
					message: "Create test file",
					content: Buffer.from("test content").toString("base64"),
					branch: "develop",
				},
			);
		});
	});

	describe("updateFile", () => {
		it("should update a file successfully", async () => {
			mockOctokit.repos.createOrUpdateFileContents.mockResolvedValue({});

			await githubService.updateFile(
				"test.md",
				"Update test file",
				"new content",
				"abc123",
			);

			expect(mockOctokit.repos.createOrUpdateFileContents).toHaveBeenCalledWith(
				{
					owner: "test-owner",
					repo: "test-repo",
					path: "test.md",
					message: "Update test file",
					content: Buffer.from("new content").toString("base64"),
					sha: "abc123",
					branch: "main",
				},
			);
		});
	});

	describe("parseEvent", () => {
		it("should parse GitHub event successfully", () => {
			const mockEvent: GitHubEvent = {
				action: "created",
				issue: {
					number: 123,
					title: "Test Issue",
					body: "Test body",
					state: "open",
					user: { login: "testuser", id: 1, type: "User" },
					created_at: "2023-01-01T00:00:00Z",
					updated_at: "2023-01-01T00:00:00Z",
					closed_at: null,
					labels: [],
				},
				repository: {
					owner: { login: "test-owner", id: 1, type: "Organization" },
					name: "test-repo",
					full_name: "test-owner/test-repo",
				},
			};

			// Mock fs.readFileSync
			const fs = require("node:fs");
			jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(mockEvent));

			const result = githubService.parseEvent("/tmp/test-event.json");

			expect(result).toEqual(mockEvent);
		});
	});

	describe("enableBranchProtection", () => {
		it("should enable branch protection successfully", async () => {
			mockOctokit.repos.updateBranchProtection.mockResolvedValue({});

			await githubService.enableBranchProtection("main", 2);

			expect(mockOctokit.repos.updateBranchProtection).toHaveBeenCalledWith({
				owner: "test-owner",
				repo: "test-repo",
				branch: "main",
				required_status_checks: null,
				enforce_admins: false,
				required_pull_request_reviews: {
					required_approving_review_count: 2,
					dismiss_stale_reviews: true,
					require_code_owner_reviews: false,
				},
				restrictions: null,
			});
		});

		it("should use default required reviews", async () => {
			mockOctokit.repos.updateBranchProtection.mockResolvedValue({});

			await githubService.enableBranchProtection("main");

			expect(mockOctokit.repos.updateBranchProtection).toHaveBeenCalledWith({
				owner: "test-owner",
				repo: "test-repo",
				branch: "main",
				required_status_checks: null,
				enforce_admins: false,
				required_pull_request_reviews: {
					required_approving_review_count: 1,
					dismiss_stale_reviews: true,
					require_code_owner_reviews: false,
				},
				restrictions: null,
			});
		});
	});

	describe("disableBranchProtection", () => {
		it("should disable branch protection successfully", async () => {
			mockOctokit.repos.deleteBranchProtection.mockResolvedValue({});

			await githubService.disableBranchProtection("main");

			expect(mockOctokit.repos.deleteBranchProtection).toHaveBeenCalledWith({
				owner: "test-owner",
				repo: "test-repo",
				branch: "main",
			});
		});
	});
});
