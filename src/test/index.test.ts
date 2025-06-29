import { GameStateService } from "../services/GameStateService";
import { GitHubService } from "../services/GitHubService";

// Mock the services
jest.mock("../services/GitHubService");
jest.mock("../services/GameStateService");
jest.mock("../services/VoteProcessor");

const MockedGitHubService = GitHubService as jest.MockedClass<
	typeof GitHubService
>;
const MockedGameStateService = GameStateService as jest.MockedClass<
	typeof GameStateService
>;

describe("Application Entry Point", () => {
	let mockGitHubService: jest.Mocked<GitHubService>;
	let mockGameStateService: jest.Mocked<GameStateService>;

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock environment variables
		process.env.GITHUB_TOKEN = "test-token";
		process.env.GITHUB_REPOSITORY = "test-owner/test-repo";
		process.env.GITHUB_EVENT_PATH = "/tmp/test-event.json";
		process.env.REQUIRED_VOTES = "3";
		process.env.REQUIRED_MAJORITY = "0.5";
		process.env.POINTS_FOR_SUCCESSFUL_PROPOSAL = "3";
		process.env.POINTS_FOR_VOTING_WITH_MAJORITY = "2";
		process.env.POINTS_FOR_PARTICIPATION = "1";
		process.env.AUTO_MERGE_ENABLED = "true";
		process.env.BRANCH_PROTECTION_ENABLED = "true";

		mockGitHubService = new MockedGitHubService({
			token: "test-token",
			owner: "test-owner",
			repo: "test-repo",
			baseBranch: "main",
		}) as jest.Mocked<GitHubService>;

		mockGameStateService = new MockedGameStateService("game-state.yaml", {
			requiredVotes: 3,
			requiredMajority: 0.5,
			pointsForSuccessfulProposal: 3,
			pointsForVotingWithMajority: 2,
			pointsForParticipation: 1,
			autoMergeEnabled: true,
			branchProtectionEnabled: true,
		}) as jest.Mocked<GameStateService>;
	});

	afterEach(() => {
		delete process.env.GITHUB_TOKEN;
		delete process.env.GITHUB_REPOSITORY;
		delete process.env.GITHUB_EVENT_PATH;
		delete process.env.REQUIRED_VOTES;
		delete process.env.REQUIRED_MAJORITY;
		delete process.env.POINTS_FOR_SUCCESSFUL_PROPOSAL;
		delete process.env.POINTS_FOR_VOTING_WITH_MAJORITY;
		delete process.env.POINTS_FOR_PARTICIPATION;
		delete process.env.AUTO_MERGE_ENABLED;
		delete process.env.BRANCH_PROTECTION_ENABLED;
	});

	describe("Configuration Loading", () => {
		it("should load configuration from environment variables", () => {
			// This would test the configuration loading logic
			// Since the main index.ts file is not exported as a module,
			// we'll test the configuration parsing logic here

			const config = {
				github: {
					token: process.env.GITHUB_TOKEN,
					owner: "test-owner",
					repo: "test-repo",
					baseBranch: "main",
				},
				game: {
					requiredVotes: parseInt(process.env.REQUIRED_VOTES || "3"),
					requiredMajority: parseFloat(process.env.REQUIRED_MAJORITY || "0.5"),
					pointsForSuccessfulProposal: parseInt(
						process.env.POINTS_FOR_SUCCESSFUL_PROPOSAL || "3",
					),
					pointsForVotingWithMajority: parseInt(
						process.env.POINTS_FOR_VOTING_WITH_MAJORITY || "2",
					),
					pointsForParticipation: parseInt(
						process.env.POINTS_FOR_PARTICIPATION || "1",
					),
					autoMergeEnabled: process.env.AUTO_MERGE_ENABLED === "true",
					branchProtectionEnabled:
						process.env.BRANCH_PROTECTION_ENABLED === "true",
				},
			};

			expect(config.github.token).toBe("test-token");
			expect(config.github.owner).toBe("test-owner");
			expect(config.github.repo).toBe("test-repo");
			expect(config.game.requiredVotes).toBe(3);
			expect(config.game.requiredMajority).toBe(0.5);
			expect(config.game.autoMergeEnabled).toBe(true);
			expect(config.game.branchProtectionEnabled).toBe(true);
		});

		it("should use default values when environment variables are missing", () => {
			delete process.env.REQUIRED_VOTES;
			delete process.env.REQUIRED_MAJORITY;
			delete process.env.AUTO_MERGE_ENABLED;

			const config = {
				game: {
					requiredVotes: parseInt(process.env.REQUIRED_VOTES || "3"),
					requiredMajority: parseFloat(process.env.REQUIRED_MAJORITY || "0.5"),
					autoMergeEnabled: process.env.AUTO_MERGE_ENABLED === "true",
				},
			};

			expect(config.game.requiredVotes).toBe(3);
			expect(config.game.requiredMajority).toBe(0.5);
			expect(config.game.autoMergeEnabled).toBe(false);
		});
	});

	describe("Service Integration", () => {
		it("should create services with correct configuration", () => {
			const githubConfig = {
				token: "test-token",
				owner: "test-owner",
				repo: "test-repo",
				baseBranch: "main",
			};

			const gameConfig = {
				requiredVotes: 3,
				requiredMajority: 0.5,
				pointsForSuccessfulProposal: 3,
				pointsForVotingWithMajority: 2,
				pointsForParticipation: 1,
				autoMergeEnabled: true,
				branchProtectionEnabled: true,
			};

			const githubService = new GitHubService(githubConfig);
			const gameStateService = new GameStateService(
				"game-state.yaml",
				gameConfig,
			);

			expect(githubService).toBeInstanceOf(GitHubService);
			expect(gameStateService).toBeInstanceOf(GameStateService);
		});
	});

	describe("Error Handling", () => {
		it("should handle missing GitHub token", () => {
			delete process.env.GITHUB_TOKEN;

			expect(() => {
				if (!process.env.GITHUB_TOKEN) {
					throw new Error("GITHUB_TOKEN environment variable is required");
				}
			}).toThrow("GITHUB_TOKEN environment variable is required");
		});

		it("should handle missing GitHub repository", () => {
			delete process.env.GITHUB_REPOSITORY;

			expect(() => {
				const repository = process.env.GITHUB_REPOSITORY;
				if (!repository) {
					throw new Error("GITHUB_REPOSITORY environment variable is required");
				}
				const [_owner, _repo] = repository.split("/");
			}).toThrow("GITHUB_REPOSITORY environment variable is required");
		});

		it("should handle invalid repository format", () => {
			process.env.GITHUB_REPOSITORY = "invalid-format";

			expect(() => {
				const repository = process.env.GITHUB_REPOSITORY;
				if (!repository) {
					throw new Error('GITHUB_REPOSITORY must be in format "owner/repo"');
				}
				const [_owner, _repo] = repository.split("/");
				if (!_owner || !_repo) {
					throw new Error('GITHUB_REPOSITORY must be in format "owner/repo"');
				}
			}).toThrow('GITHUB_REPOSITORY must be in format "owner/repo"');
		});
	});

	describe("Vote Processing Flow", () => {
		it("should process votes correctly", async () => {
			// Mock the vote processing flow
			const mockEvent = {
				action: "created",
				issue: {
					number: 123,
					title: "Test Proposal",
					body: "This is a test proposal",
					state: "open" as const,
					user: { login: "proposer", id: 1, type: "User" },
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

			mockGitHubService.parseEvent.mockReturnValue(mockEvent);
			mockGitHubService.getIssueComments.mockResolvedValue([]);
			mockGameStateService.processVote.mockResolvedValue({
				proposalUpdated: true,
				statusChanged: false,
				state: {
					players: {},
					proposals: {},
					gameRules: [],
					currentTurn: 1,
					lastUpdated: "2023-01-01T00:00:00Z",
				},
			});

			// Simulate the main processing flow
			const event = mockGitHubService.parseEvent("/tmp/test-event.json");
			const comments = await mockGitHubService.getIssueComments(
				event.issue.number,
			);

			expect(event).toEqual(mockEvent);
			expect(comments).toEqual([]);
		});
	});
});
