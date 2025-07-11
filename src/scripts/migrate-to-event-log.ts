import * as fs from "node:fs";
import * as yaml from "js-yaml";
import { EventLogService } from "../services/EventLogService";
import { StateProcessor } from "../services/StateProcessor";
import { GameState, GameStateSchema, type GameConfig } from "../types";

interface MigrationOptions {
	yamlStatePath: string;
	eventLogPath: string;
	gameConfig: GameConfig;
	dryRun: boolean;
	backupExisting: boolean;
}

export class StateToEventLogMigrator {
	private options: MigrationOptions;
	private eventLogService: EventLogService;
	private stateProcessor: StateProcessor;

	constructor(options: MigrationOptions) {
		this.options = options;
		this.eventLogService = new EventLogService(options.eventLogPath, options.gameConfig);
		this.stateProcessor = new StateProcessor(this.eventLogService);
	}

	async migrate(): Promise<{
		success: boolean;
		eventsCreated: number;
		errors: string[];
		warnings: string[];
	}> {
		const errors: string[] = [];
		const warnings: string[] = [];
		let eventsCreated = 0;

		try {
			console.log("Starting migration from YAML state to event log...");

			// Check if source file exists
			if (!fs.existsSync(this.options.yamlStatePath)) {
				return {
					success: false,
					eventsCreated: 0,
					errors: [`Source YAML file not found: ${this.options.yamlStatePath}`],
					warnings: [],
				};
			}

			// Backup existing event log if requested
			if (this.options.backupExisting) {
				try {
					await this.eventLogService.createBackup();
				} catch (error) {
					warnings.push(`Failed to create backup: ${error}`);
				}
			}

			// Load and validate YAML state
			const yamlContent = fs.readFileSync(this.options.yamlStatePath, "utf-8");
			const rawState = yaml.load(yamlContent) as unknown;
			const gameState = GameStateSchema.parse(rawState);

			console.log(`Loaded game state with ${Object.keys(gameState.players).length} players and ${Object.keys(gameState.proposals).length} proposals`);

			// Create game_started event
			if (!this.options.dryRun) {
				const initialRules = gameState.gameRules.length > 0 ? gameState.gameRules : [
					"101", "102", "103", "104", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116",
					"202", "204", "205", "206", "208", "209", "210", "211", "212", "213"
				];

				const gameStartedEvent = {
					type: "game_started" as const,
					initial_rules: initialRules,
					config: {
						required_votes: this.options.gameConfig.requiredVotes,
						required_majority: this.options.gameConfig.requiredMajority,
						points_for_successful_proposal: this.options.gameConfig.pointsForSuccessfulProposal,
						points_for_voting_with_majority: this.options.gameConfig.pointsForVotingWithMajority,
						points_for_participation: this.options.gameConfig.pointsForParticipation,
					},
				};

				await this.eventLogService.appendEvent(gameStartedEvent);
				eventsCreated++;
			}

			// Create player_joined events for all players
			for (const [username, player] of Object.entries(gameState.players)) {
				if (!this.options.dryRun) {
					const playerJoinedEvent = {
						type: "player_joined" as const,
						username,
						joined_via: "proposal" as const, // Assume they joined via proposal
					};
					await this.eventLogService.appendEvent(playerJoinedEvent);
					eventsCreated++;
				}
			}

			// Process proposals in chronological order
			const proposalEntries = Object.entries(gameState.proposals).sort(([, a], [, b]) => 
				new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
			);

			for (const [issueNumberStr, proposal] of proposalEntries) {
				const issueNumber = parseInt(issueNumberStr, 10);

				// Create proposal_created event
				if (!this.options.dryRun) {
					const proposalCreatedEvent = {
						type: "proposal_created" as const,
						issue_number: issueNumber,
						title: proposal.title,
						proposer: proposal.proposer,
					};
					await this.eventLogService.appendEvent(proposalCreatedEvent);
					eventsCreated++;
				}

				// Create vote_cast events
				for (const [voter, vote] of Object.entries(proposal.votes)) {
					if (!this.options.dryRun) {
						const voteCastEvent = {
							type: "vote_cast" as const,
							issue_number: issueNumber,
							voter,
							vote: vote as "FOR" | "AGAINST",
						};
						await this.eventLogService.appendEvent(voteCastEvent);
						eventsCreated++;
					}
				}

				// Create proposal_resolved event if not open
				if (proposal.status !== "open") {
					const votes = Object.values(proposal.votes);
					const forVotes = votes.filter(v => v === "FOR").length;
					const againstVotes = votes.filter(v => v === "AGAINST").length;

					if (!this.options.dryRun) {
						const proposalResolvedEvent = {
							type: "proposal_resolved" as const,
							issue_number: issueNumber,
							status: proposal.status as "passed" | "failed" | "closed",
							final_votes: {
								for: forVotes,
								against: againstVotes,
								total: forVotes + againstVotes,
							},
						};
						await this.eventLogService.appendEvent(proposalResolvedEvent);
						eventsCreated++;
					}
				}
			}

			// Create points_awarded events based on player points
			for (const [username, player] of Object.entries(gameState.players)) {
				if (player.points > 0) {
					if (!this.options.dryRun) {
						const pointsAwardedEvent = {
							type: "points_awarded" as const,
							player: username,
							points: player.points,
							reason: "Migrated from existing game state",
						};
						await this.eventLogService.appendEvent(pointsAwardedEvent);
						eventsCreated++;
					}
				}
			}

			// Create turn_advanced event if not at turn 1
			if (gameState.currentTurn > 1) {
				if (!this.options.dryRun) {
					const turnAdvancedEvent = {
						type: "turn_advanced" as const,
						new_turn: gameState.currentTurn,
						triggered_by_issue: 0, // Unknown which issue triggered it
					};
					await this.eventLogService.appendEvent(turnAdvancedEvent);
					eventsCreated++;
				}
			}

			// Validate the migrated state
			if (!this.options.dryRun) {
				const validation = await this.validateMigration(gameState);
				errors.push(...validation.errors);
				warnings.push(...validation.warnings);
			}

			console.log(`Migration completed. Created ${eventsCreated} events.`);

			return {
				success: errors.length === 0,
				eventsCreated,
				errors,
				warnings,
			};

		} catch (error) {
			console.error("Migration failed:", error);
			return {
				success: false,
				eventsCreated,
				errors: [`Migration failed: ${error}`],
				warnings,
			};
		}
	}

	private async validateMigration(originalState: GameState): Promise<{
		errors: string[];
		warnings: string[];
	}> {
		const errors: string[] = [];
		const warnings: string[] = [];

		try {
			// Compute state from events
			const computedState = await this.stateProcessor.computeCurrentState();

			// Compare player counts
			const originalPlayerCount = Object.keys(originalState.players).length;
			const computedPlayerCount = Object.keys(computedState.players).length;
			if (originalPlayerCount !== computedPlayerCount) {
				errors.push(`Player count mismatch: original ${originalPlayerCount}, computed ${computedPlayerCount}`);
			}

			// Compare proposal counts
			const originalProposalCount = Object.keys(originalState.proposals).length;
			const computedProposalCount = Object.keys(computedState.proposals).length;
			if (originalProposalCount !== computedProposalCount) {
				errors.push(`Proposal count mismatch: original ${originalProposalCount}, computed ${computedProposalCount}`);
			}

			// Compare player points (within tolerance due to rounding)
			for (const [username, originalPlayer] of Object.entries(originalState.players)) {
				const computedPlayer = computedState.players[username];
				if (!computedPlayer) {
					errors.push(`Player ${username} missing from computed state`);
					continue;
				}

				const pointsDiff = Math.abs(originalPlayer.points - computedPlayer.points);
				if (pointsDiff > 0.01) { // Allow small floating point differences
					warnings.push(`Player ${username} points differ: original ${originalPlayer.points}, computed ${computedPlayer.points}`);
				}
			}

			// Compare proposal statuses
			for (const [issueNumberStr, originalProposal] of Object.entries(originalState.proposals)) {
				const computedProposal = computedState.proposals[issueNumberStr];
				if (!computedProposal) {
					errors.push(`Proposal ${issueNumberStr} missing from computed state`);
					continue;
				}

				if (originalProposal.status !== computedProposal.status) {
					errors.push(`Proposal ${issueNumberStr} status differs: original ${originalProposal.status}, computed ${computedProposal.status}`);
				}
			}

			// Compare current turn
			if (originalState.currentTurn !== computedState.current_turn) {
				warnings.push(`Current turn differs: original ${originalState.currentTurn}, computed ${computedState.current_turn}`);
			}

		} catch (error) {
			errors.push(`Validation failed: ${error}`);
		}

		return { errors, warnings };
	}
}

// CLI interface
export async function runMigration(options: Partial<MigrationOptions> = {}): Promise<void> {
	const defaultConfig: GameConfig = {
		requiredVotes: 3,
		requiredMajority: 0.5,
		pointsForSuccessfulProposal: 3,
		pointsForVotingWithMajority: 2,
		pointsForParticipation: 1,
		autoMergeEnabled: true,
		branchProtectionEnabled: true,
	};

	const migrationOptions: MigrationOptions = {
		yamlStatePath: options.yamlStatePath || "game-state.yaml",
		eventLogPath: options.eventLogPath || "events/game-events.jsonl",
		gameConfig: options.gameConfig || defaultConfig,
		dryRun: options.dryRun || false,
		backupExisting: options.backupExisting !== false, // Default to true
	};

	const migrator = new StateToEventLogMigrator(migrationOptions);
	const result = await migrator.migrate();

	if (result.success) {
		console.log("✅ Migration completed successfully!");
		console.log(`   Events created: ${result.eventsCreated}`);
		if (result.warnings.length > 0) {
			console.log("⚠️  Warnings:");
			for (const warning of result.warnings) {
				console.log(`   - ${warning}`);
			}
		}
	} else {
		console.error("❌ Migration failed!");
		for (const error of result.errors) {
			console.error(`   - ${error}`);
		}
		if (result.warnings.length > 0) {
			console.log("⚠️  Warnings:");
			for (const warning of result.warnings) {
				console.log(`   - ${warning}`);
			}
		}
		process.exit(1);
	}
}

// Run migration if called directly
if (require.main === module) {
	const args = process.argv.slice(2);
	const dryRun = args.includes("--dry-run");
	const noBackup = args.includes("--no-backup");
	
	runMigration({
		dryRun,
		backupExisting: !noBackup,
	}).catch(console.error);
} 