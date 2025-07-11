import * as fs from "node:fs";
import * as yaml from "js-yaml";
import { GameStateService } from "../services/GameStateService";
import type {
	GameConfig,
	GameState,
	PlayerScore,
	ProposalVotes,
} from "../types";

// Mock fs and yaml modules
jest.mock("fs");
jest.mock("js-yaml");

const mockFs = fs as jest.Mocked<typeof fs>;
const mockYaml = yaml as jest.Mocked<typeof yaml>;

describe("GameStateService", () => {
	let gameStateService: GameStateService;
	let mockConfig: GameConfig;

	beforeEach(() => {
		jest.clearAllMocks();

		mockConfig = {
			requiredVotes: 3,
			requiredMajority: 0.5,
			pointsForSuccessfulProposal: 3,
			pointsForVotingWithMajority: 2,
			pointsForParticipation: 1,
			autoMergeEnabled: true,
			branchProtectionEnabled: true,
		};

		gameStateService = new GameStateService("test-game-state.yaml", mockConfig);
	});

	describe("loadGameState", () => {
		it("should load existing game state successfully", async () => {
			const mockState: GameState = {
				players: {},
				proposals: {},
				gameRules: [],
				currentTurn: 1,
				lastUpdated: "2023-01-01T00:00:00Z",
			};

			mockFs.existsSync.mockReturnValue(true);
			mockFs.readFileSync.mockReturnValue("mock yaml content");
			mockYaml.load.mockReturnValue(mockState);

			const result = await gameStateService.loadGameState();

			expect(mockFs.existsSync).toHaveBeenCalledWith("test-game-state.yaml");
			expect(mockFs.readFileSync).toHaveBeenCalledWith(
				"test-game-state.yaml",
				"utf-8",
			);
			expect(mockYaml.load).toHaveBeenCalledWith("mock yaml content");
			expect(result).toEqual(mockState);
		});

		it("should create initial game state when file does not exist", async () => {
			mockFs.existsSync.mockReturnValue(false);

			const result = await gameStateService.loadGameState();

			expect(mockFs.existsSync).toHaveBeenCalledWith("test-game-state.yaml");
			expect(result).toEqual({
				players: {},
				proposals: {},
				gameRules: [],
				currentTurn: 1,
				lastUpdated: expect.any(String),
			});
		});

		it("should handle parsing errors gracefully", async () => {
			mockFs.existsSync.mockReturnValue(true);
			mockFs.readFileSync.mockReturnValue("invalid yaml");
			mockYaml.load.mockImplementation(() => {
				throw new Error("YAML parsing error");
			});

			const result = await gameStateService.loadGameState();

			expect(result).toEqual({
				players: {},
				proposals: {},
				gameRules: [],
				currentTurn: 1,
				lastUpdated: expect.any(String),
			});
		});
	});

	describe("saveGameState", () => {
		it("should save game state successfully", async () => {
			const mockState: GameState = {
				players: {},
				proposals: {},
				gameRules: [],
				currentTurn: 1,
				lastUpdated: "2023-01-01T00:00:00Z",
			};

			mockYaml.dump.mockReturnValue("serialized yaml");
			mockFs.writeFileSync.mockReset(); // Ensure no error is thrown

			await gameStateService.saveGameState(mockState);

			expect(mockYaml.dump).toHaveBeenCalledWith(mockState);
			expect(mockFs.writeFileSync).toHaveBeenCalledWith(
				"test-game-state.yaml",
				"serialized yaml",
				"utf-8",
			);
		});

		it("should handle save errors", async () => {
			const mockState: GameState = {
				players: {},
				proposals: {},
				gameRules: [],
				currentTurn: 1,
				lastUpdated: "2023-01-01T00:00:00Z",
			};

			mockYaml.dump.mockReturnValue("serialized yaml");
			mockFs.writeFileSync.mockImplementation(() => {
				throw new Error("Write error");
			});

			await expect(gameStateService.saveGameState(mockState)).rejects.toThrow(
				"Write error",
			);
			mockFs.writeFileSync.mockReset(); // Reset after this test
		});
	});

	describe("processVote", () => {
		it("should process a new vote and create proposal", async () => {
			const _mockState: GameState = {
				players: {},
				proposals: {},
				gameRules: [],
				currentTurn: 1,
				lastUpdated: "2023-01-01T00:00:00Z",
			};

			mockFs.existsSync.mockReturnValue(false);
			mockYaml.dump.mockReturnValue("serialized yaml");

			const result = await gameStateService.processVote(
				123,
				"testuser",
				"FOR",
				"Test Proposal",
				"proposer",
			);

			expect(result.proposalUpdated).toBe(true);
			expect(result.statusChanged).toBe(false);
			expect(result.state.proposals["123"]).toEqual({
				issueNumber: 123,
				title: "Test Proposal",
				proposer: "proposer",
				votes: { testuser: "FOR" },
				status: "open",
				createdAt: expect.any(String),
				updatedAt: expect.any(String),
				requiredVotes: 3,
				requiredMajority: 0.5,
			});
		});

		it("should update existing proposal with new vote", async () => {
			const existingProposal: ProposalVotes = {
				issueNumber: 123,
				title: "Test Proposal",
				proposer: "proposer",
				votes: { user1: "FOR" },
				status: "open",
				createdAt: "2023-01-01T00:00:00Z",
				updatedAt: "2023-01-01T00:00:00Z",
				requiredVotes: 3,
				requiredMajority: 0.5,
			};

			const mockState: GameState = {
				players: {},
				proposals: { "123": existingProposal },
				gameRules: [],
				currentTurn: 1,
				lastUpdated: "2023-01-01T00:00:00Z",
			};

			mockFs.existsSync.mockReturnValue(true);
			mockFs.readFileSync.mockReturnValue("mock yaml content");
			mockYaml.load.mockReturnValue(mockState);
			mockYaml.dump.mockReturnValue("serialized yaml");

			const result = await gameStateService.processVote(
				123,
				"user2",
				"AGAINST",
				"Test Proposal",
				"proposer",
			);

			expect(result.proposalUpdated).toBe(true);
			expect(result.statusChanged).toBe(false);
			expect(result.state.proposals["123"].votes).toEqual({
				user1: "FOR",
				user2: "AGAINST",
			});
		});

		it("should change status when proposal passes", async () => {
			const existingProposal: ProposalVotes = {
				issueNumber: 123,
				title: "Test Proposal",
				proposer: "proposer",
				votes: { user1: "FOR", user2: "FOR" },
				status: "open",
				createdAt: "2023-01-01T00:00:00Z",
				updatedAt: "2023-01-01T00:00:00Z",
				requiredVotes: 3,
				requiredMajority: 0.5,
			};

			const mockState: GameState = {
				players: {},
				proposals: { "123": existingProposal },
				gameRules: [],
				currentTurn: 1,
				lastUpdated: "2023-01-01T00:00:00Z",
			};

			mockFs.existsSync.mockReturnValue(true);
			mockFs.readFileSync.mockReturnValue("mock yaml content");
			mockYaml.load.mockReturnValue(mockState);
			mockYaml.dump.mockReturnValue("serialized yaml");

			const result = await gameStateService.processVote(
				123,
				"user3",
				"FOR",
				"Test Proposal",
				"proposer",
			);

			expect(result.proposalUpdated).toBe(true);
			expect(result.statusChanged).toBe(true);
			expect(result.state.proposals["123"].status).toBe("passed");
			expect(result.state.currentTurn).toBe(2);
		});

		it("should change status when proposal fails", async () => {
			const existingProposal: ProposalVotes = {
				issueNumber: 123,
				title: "Test Proposal",
				proposer: "proposer",
				votes: { user1: "AGAINST", user2: "AGAINST" },
				status: "open",
				createdAt: "2023-01-01T00:00:00Z",
				updatedAt: "2023-01-01T00:00:00Z",
				requiredVotes: 3,
				requiredMajority: 0.5,
			};

			const mockState: GameState = {
				players: {},
				proposals: { "123": existingProposal },
				gameRules: [],
				currentTurn: 1,
				lastUpdated: "2023-01-01T00:00:00Z",
			};

			mockFs.existsSync.mockReturnValue(true);
			mockFs.readFileSync.mockReturnValue("mock yaml content");
			mockYaml.load.mockReturnValue(mockState);
			mockYaml.dump.mockReturnValue("serialized yaml");

			const result = await gameStateService.processVote(
				123,
				"user3",
				"AGAINST",
				"Test Proposal",
				"proposer",
			);

			expect(result.proposalUpdated).toBe(true);
			expect(result.statusChanged).toBe(true);
			expect(result.state.proposals["123"].status).toBe("failed");
			expect(result.state.currentTurn).toBe(2);
		});
	});

	describe("closeProposal", () => {
		it("should close an existing proposal", async () => {
			const existingProposal: ProposalVotes = {
				issueNumber: 123,
				title: "Test Proposal",
				proposer: "proposer",
				votes: { user1: "FOR" },
				status: "open",
				createdAt: "2023-01-01T00:00:00Z",
				updatedAt: "2023-01-01T00:00:00Z",
				requiredVotes: 3,
				requiredMajority: 0.5,
			};

			const mockState: GameState = {
				players: {},
				proposals: { "123": existingProposal },
				gameRules: [],
				currentTurn: 1,
				lastUpdated: "2023-01-01T00:00:00Z",
			};

			mockFs.existsSync.mockReturnValue(true);
			mockFs.readFileSync.mockReturnValue("mock yaml content");
			mockYaml.load.mockReturnValue(mockState);
			mockYaml.dump.mockReturnValue("serialized yaml");

			const result = await gameStateService.closeProposal(123);

			expect(result.proposals["123"].status).toBe("closed");
			expect(result.proposals["123"].closedAt).toBeDefined();
		});

		it("should handle non-existent proposal gracefully", async () => {
			const mockState: GameState = {
				players: {},
				proposals: {},
				gameRules: [],
				currentTurn: 1,
				lastUpdated: expect.any(String),
			};

			mockFs.existsSync.mockReturnValue(false);

			const result = await gameStateService.closeProposal(999);

			expect(result).toEqual(mockState);
		});
	});

	describe("getProposal", () => {
		it("should return existing proposal", async () => {
			const existingProposal: ProposalVotes = {
				issueNumber: 123,
				title: "Test Proposal",
				proposer: "proposer",
				votes: { user1: "FOR" },
				status: "open",
				createdAt: "2023-01-01T00:00:00Z",
				updatedAt: "2023-01-01T00:00:00Z",
				requiredVotes: 3,
				requiredMajority: 0.5,
			};

			const mockState: GameState = {
				players: {},
				proposals: { "123": existingProposal },
				gameRules: [],
				currentTurn: 1,
				lastUpdated: "2023-01-01T00:00:00Z",
			};

			mockFs.existsSync.mockReturnValue(true);
			mockFs.readFileSync.mockReturnValue("mock yaml content");
			mockYaml.load.mockReturnValue(mockState);

			const result = await gameStateService.getProposal(123);

			expect(result).toEqual(existingProposal);
		});

		it("should return null for non-existent proposal", async () => {
			mockFs.existsSync.mockReturnValue(false);

			const result = await gameStateService.getProposal(999);

			expect(result).toBeNull();
		});
	});

	describe("getAllProposals", () => {
		it("should return all proposals", async () => {
			const proposal1: ProposalVotes = {
				issueNumber: 123,
				title: "Test Proposal 1",
				proposer: "proposer1",
				votes: { user1: "FOR" },
				status: "open",
				createdAt: "2023-01-01T00:00:00Z",
				updatedAt: "2023-01-01T00:00:00Z",
				requiredVotes: 3,
				requiredMajority: 0.5,
			};

			const proposal2: ProposalVotes = {
				issueNumber: 124,
				title: "Test Proposal 2",
				proposer: "proposer2",
				votes: { user2: "AGAINST" },
				status: "passed",
				createdAt: "2023-01-01T00:00:00Z",
				updatedAt: "2023-01-01T00:00:00Z",
				requiredVotes: 3,
				requiredMajority: 0.5,
			};

			const mockState: GameState = {
				players: {},
				proposals: { "123": proposal1, "124": proposal2 },
				gameRules: [],
				currentTurn: 1,
				lastUpdated: "2023-01-01T00:00:00Z",
			};

			mockFs.existsSync.mockReturnValue(true);
			mockFs.readFileSync.mockReturnValue("mock yaml content");
			mockYaml.load.mockReturnValue(mockState);

			const result = await gameStateService.getAllProposals();

			expect(result).toHaveLength(2);
			expect(result).toContainEqual(proposal1);
			expect(result).toContainEqual(proposal2);
		});
	});

	describe("getPlayerScore", () => {
		it("should return existing player score", async () => {
			const playerScore: PlayerScore = {
				username: "testuser",
				points: 10,
				proposalsSubmitted: 2,
				proposalsPassed: 1,
				votesCast: 5,
				lastActive: "2023-01-01T00:00:00Z",
			};

			const mockState: GameState = {
				players: { testuser: playerScore },
				proposals: {},
				gameRules: [],
				currentTurn: 1,
				lastUpdated: "2023-01-01T00:00:00Z",
			};

			mockFs.existsSync.mockReturnValue(true);
			mockFs.readFileSync.mockReturnValue("mock yaml content");
			mockYaml.load.mockReturnValue(mockState);

			const result = await gameStateService.getPlayerScore("testuser");

			expect(result).toEqual(playerScore);
		});

		it("should return null for non-existent player", async () => {
			mockFs.existsSync.mockReturnValue(false);

			const result = await gameStateService.getPlayerScore("nonexistent");

			expect(result).toBeNull();
		});
	});

	describe("getAllPlayerScores", () => {
		it("should return all player scores sorted by points", async () => {
			const player1: PlayerScore = {
				username: "user1",
				points: 10,
				proposalsSubmitted: 2,
				proposalsPassed: 1,
				votesCast: 5,
				lastActive: "2023-01-01T00:00:00Z",
			};

			const player2: PlayerScore = {
				username: "user2",
				points: 15,
				proposalsSubmitted: 3,
				proposalsPassed: 2,
				votesCast: 8,
				lastActive: "2023-01-01T00:00:00Z",
			};

			const mockState: GameState = {
				players: { user1: player1, user2: player2 },
				proposals: {},
				gameRules: [],
				currentTurn: 1,
				lastUpdated: "2023-01-01T00:00:00Z",
			};

			mockFs.existsSync.mockReturnValue(true);
			mockFs.readFileSync.mockReturnValue("mock yaml content");
			mockYaml.load.mockReturnValue(mockState);

			const result = await gameStateService.getAllPlayerScores();

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual(player2); // Higher points first
			expect(result[1]).toEqual(player1);
		});
	});

	describe("updateScoreboard", () => {
		it("should generate scoreboard markdown", async () => {
			const player1: PlayerScore = {
				username: "user1",
				points: 10,
				proposalsSubmitted: 2,
				proposalsPassed: 1,
				votesCast: 5,
				lastActive: "2023-01-01T00:00:00Z",
			};

			const player2: PlayerScore = {
				username: "user2",
				points: 15,
				proposalsSubmitted: 3,
				proposalsPassed: 2,
				votesCast: 8,
				lastActive: "2023-01-01T00:00:00Z",
			};

			const mockState: GameState = {
				players: { user1: player1, user2: player2 },
				proposals: {},
				gameRules: [],
				currentTurn: 1,
				lastUpdated: "2023-01-01T00:00:00Z",
			};

			mockFs.existsSync.mockReturnValue(true);
			mockFs.readFileSync.mockReturnValue("mock yaml content");
			mockYaml.load.mockReturnValue(mockState);

			const result = await gameStateService.updateScoreboard();

			expect(result).toContain("# Scoreboard");
			expect(result).toContain("@user2");
			expect(result).toContain("@user1");
			expect(result).toContain("15");
			expect(result).toContain("10");
		});
	});

	describe("canMergeProposal", () => {
		it("should return true for mergeable proposal", async () => {
			const proposal: ProposalVotes = {
				issueNumber: 123,
				title: "Test Proposal",
				proposer: "proposer",
				votes: { user1: "FOR", user2: "FOR", user3: "FOR" },
				status: "open",
				createdAt: "2023-01-01T00:00:00Z",
				updatedAt: "2023-01-01T00:00:00Z",
				requiredVotes: 3,
				requiredMajority: 0.5,
			};

			const mockState: GameState = {
				players: {},
				proposals: { "123": proposal },
				gameRules: [],
				currentTurn: 1,
				lastUpdated: "2023-01-01T00:00:00Z",
			};

			mockFs.existsSync.mockReturnValue(true);
			mockFs.readFileSync.mockReturnValue("mock yaml content");
			mockYaml.load.mockReturnValue(mockState);

			const result = await gameStateService.canMergeProposal(123);

			expect(result.canMerge).toBe(true);
			expect(result.requiredVotes).toBe(3);
			expect(result.currentVotes).toBe(3);
			expect(result.requiredMajority).toBe(0.5);
			expect(result.currentMajority).toBe(1.0);
		});

		it("should return false for non-mergeable proposal", async () => {
			const proposal: ProposalVotes = {
				issueNumber: 123,
				title: "Test Proposal",
				proposer: "proposer",
				votes: { user1: "FOR", user2: "AGAINST" },
				status: "open",
				createdAt: "2023-01-01T00:00:00Z",
				updatedAt: "2023-01-01T00:00:00Z",
				requiredVotes: 3,
				requiredMajority: 0.5,
			};

			const mockState: GameState = {
				players: {},
				proposals: { "123": proposal },
				gameRules: [],
				currentTurn: 1,
				lastUpdated: "2023-01-01T00:00:00Z",
			};

			mockFs.existsSync.mockReturnValue(true);
			mockFs.readFileSync.mockReturnValue("mock yaml content");
			mockYaml.load.mockReturnValue(mockState);

			const result = await gameStateService.canMergeProposal(123);

			expect(result.canMerge).toBe(false);
			expect(result.reason).toBe("Insufficient votes or majority");
			expect(result.currentVotes).toBe(2);
			expect(result.currentMajority).toBe(0.5);
		});

		it("should return false for non-existent proposal", async () => {
			mockFs.existsSync.mockReturnValue(false);

			const result = await gameStateService.canMergeProposal(999);

			expect(result.canMerge).toBe(false);
			expect(result.reason).toBe("Proposal not found");
		});
	});
});
